import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import QuickOrder from "@/models/QuickOrder";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");

    if (!orderId || (!email && !phone)) {
      return NextResponse.json(
        { error: "orderId and either email or phone are required" },
        { status: 400 }
      );
    }

    const customerFilter = email
      ? { "customer.email": email.toLowerCase() }
      : { "customer.phone": phone };

    const order = await Order.findOne({ orderId, ...customerFilter }).lean();
    if (order) {
      return NextResponse.json({ order });
    }

    const quickOrderFilter = email
      ? { "customer.emailAddress": email.toLowerCase() }
      : { "customer.phoneNumber": phone };

    const quickOrderDoc = await QuickOrder.findOne({ orderId, ...quickOrderFilter });
    if (!quickOrderDoc) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const quickOrder = quickOrderDoc.toObject();

    const normalized = {
      orderId: quickOrder.orderId,
      status: quickOrder.payment?.status === "completed" ? "confirmed" : "pending",
      customer: {
        name: quickOrder.customer?.fullName,
        email: quickOrder.customer?.emailAddress,
        phone: quickOrder.customer?.phoneNumber,
      },
      summary: {
        total: quickOrder.orderSummary?.total,
      },
      items: [
        {
          productName: quickOrder.product?.name,
          quantity: quickOrder.product?.quantity,
          total: (quickOrder.product?.unitPrice || 0) * (quickOrder.product?.quantity || 1),
        },
      ],
      timeline: [
        {
          status: "Order Placed",
          timestamp: quickOrder.createdAt,
          notes: "Order received and awaiting confirmation",
        },
      ],
    };

    return NextResponse.json({ order: normalized });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to track order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
