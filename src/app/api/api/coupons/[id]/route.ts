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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await requireAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const payload = await request.json();

    if (payload.code) {
      payload.code = String(payload.code).toUpperCase().trim();
    }

    const coupon = await Coupon.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).lean();

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    await recordRealtimeEvent({
      entity: "coupon",
      action: "updated",
      resourceId: String(coupon._id),
      details: { code: coupon.code, isActive: coupon.isActive },
    });

    return NextResponse.json({ coupon });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update coupon";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await requireAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    const coupon = await Coupon.findByIdAndDelete(id).lean();
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    await recordRealtimeEvent({
      entity: "coupon",
      action: "deleted",
      resourceId: String(coupon._id),
      details: { code: coupon.code },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete coupon";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
