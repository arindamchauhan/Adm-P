import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Coupon from "@/models/Coupon";

export async function GET() {
  try {
    await dbConnect();

    const now = new Date();
    const coupons = await Coupon.find({
      couponType: "public_auto",
      isActive: true,
      startDate: { $lte: now },
      expiryDate: { $gte: now },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      coupons: coupons.map((coupon: any) => ({
        _id: String(coupon._id),
        code: coupon.code,
        title: coupon.bannerText || "Limited Offer",
        description: coupon.description || "Apply this coupon to unlock instant savings.",
        audience: coupon.audience || "all_users",
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch public coupons";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
