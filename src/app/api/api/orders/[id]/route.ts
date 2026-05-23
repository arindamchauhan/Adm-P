import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import QuickOrder from "@/models/QuickOrder";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  return authHeader.replace("Bearer ", "");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const orderLookup = isObjectId ? { $or: [{ _id: id }, { orderId: id }] } : { orderId: id };

    const token = getAuthToken(request);
    const decoded = token ? verifyToken(token) : null;

    const order: any = await (Order as any).findOne(orderLookup);
    if (order) {
      if (decoded?.role !== "admin" && order.userId && String(order.userId) !== decoded?.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json({ order: order.toObject(), isQuickOrder: false });
    }

    // Fallback for quick-order records used in admin dashboard list.
    const quickOrder: any = await (QuickOrder as any).findOne(orderLookup);
    if (!quickOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Quick orders do not have userId and are currently admin-facing details only.
    if (decoded?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ order: quickOrder.toObject(), isQuickOrder: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
