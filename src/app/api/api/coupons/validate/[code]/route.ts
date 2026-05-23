import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Coupon from "@/models/Coupon";
import Order from "@/models/Order";
import { verifyToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await dbConnect();
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const orderTotal = Number(searchParams.get("orderTotal") || 0);
    const email = (searchParams.get("email") || "").trim().toLowerCase();

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    const decoded = token ? verifyToken(token) : null;

    const coupon: any = await (Coupon as any).findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Coupon not found" }, { status: 404 });
    }

    const now = new Date();
    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
      return NextResponse.json({ valid: false, error: "Coupon expired" }, { status: 400 });
    }

    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return NextResponse.json({ valid: false, error: "Coupon not active yet" }, { status: 400 });
    }

    if (typeof coupon.maxUses === "number" && coupon.usageCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: "Coupon usage limit reached" }, { status: 400 });
    }

    if (coupon.audience === "new_users") {
      const identityEmail = email || undefined;
      const existingOrderQuery: any = {
        status: { $nin: ["failed", "cancelled"] },
      };

      if (decoded?.userId) {
        existingOrderQuery.userId = decoded.userId;
      } else if (identityEmail) {
        existingOrderQuery["customer.email"] = identityEmail;
      } else {
        return NextResponse.json(
          { valid: false, error: "New user coupon requires login or email for eligibility check" },
          { status: 400 }
        );
      }

      const existingOrder = await Order.findOne(existingOrderQuery).select("_id").lean();
      if (existingOrder) {
        return NextResponse.json(
          { valid: false, error: "This coupon is only for new users" },
          { status: 400 }
        );
      }
    }

    if (orderTotal < (coupon.minOrderValue || 0)) {
      return NextResponse.json(
        {
          valid: false,
          error: `Minimum order value is ₹${coupon.minOrderValue}`,
        },
        { status: 400 }
      );
    }

    const rawDiscount =
      coupon.discountType === "percentage"
        ? (orderTotal * coupon.discount) / 100
        : coupon.discount;

    const discountAmount = coupon.maxDiscount
      ? Math.min(rawDiscount, coupon.maxDiscount)
      : rawDiscount;

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        audience: coupon.audience || "all_users",
        couponType: coupon.couponType || "manual",
        discountType: coupon.discountType,
        discount: coupon.discount,
        discountAmount: Math.round(discountAmount),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to validate coupon";
    return NextResponse.json({ valid: false, error: message }, { status: 500 });
  }
}