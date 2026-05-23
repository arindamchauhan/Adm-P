import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Coupon from "@/models/Coupon";
import { verifyToken } from "@/lib/auth";
import { recordRealtimeEvent } from "@/lib/realtime";

function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  return authHeader.replace("Bearer ", "");
}

async function requireAdmin(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ coupons });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch coupons";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const payload = await request.json();

    if (!payload.code || !payload.discountType || !payload.discount || !payload.expiryDate) {
      return NextResponse.json(
        { error: "code, discountType, discount and expiryDate are required" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.create({
      ...payload,
      code: String(payload.code).toUpperCase().trim(),
      couponType: payload.couponType === "public_auto" ? "public_auto" : "manual",
      audience: payload.audience === "new_users" ? "new_users" : "all_users",
      createdBy: decoded.userId,
      isActive: payload.isActive ?? true,
    });

    await recordRealtimeEvent({
      entity: "coupon",
      action: "created",
      resourceId: String(coupon._id),
      details: { code: coupon.code, couponType: coupon.couponType },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create coupon";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
