import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import QuickOrder from "@/models/QuickOrder";
import OtpVerification from "@/models/OtpVerification";
import { verifyToken } from "@/lib/auth";
import { generateOrderId } from "@/lib/order-utils";
import { hasFirebaseAdminConfig, verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { recordRealtimeEvent } from "@/lib/realtime";

function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  return authHeader.replace("Bearer ", "");
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const token = getAuthToken(request);
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (decoded.role === "admin") {
      const [orders, quickOrders] = await Promise.all([
        Order.find({}).sort({ createdAt: -1 }).lean(),
        QuickOrder.find({}).sort({ createdAt: -1 }).lean(),
      ]);

      const normalizedQuickOrders = quickOrders.map((quickOrder: any) => ({
        _id: String(quickOrder._id),
        orderId: quickOrder.orderId,
        customer: {
          name: quickOrder.customer?.fullName,
          email: quickOrder.customer?.emailAddress,
          phone: quickOrder.customer?.phoneNumber,
        },
        items: [
          {
            productName: quickOrder.product?.name,
            quantity: quickOrder.product?.quantity || 1,
            total:
              quickOrder.orderSummary?.total ||
              (quickOrder.product?.unitPrice || 0) * (quickOrder.product?.quantity || 1),
          },
        ],
        summary: {
          total: quickOrder.orderSummary?.total || 0,
        },
        status:
          quickOrder.payment?.status === "completed"
            ? "confirmed"
            : quickOrder.payment?.status === "failed"
            ? "cancelled"
            : "pending",
        payment: quickOrder.payment,
        source: "quick-order",
        isQuickOrder: true,
        createdAt: quickOrder.createdAt,
      }));

      const combinedOrders = [...orders, ...normalizedQuickOrders].sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return NextResponse.json({ orders: combinedOrders });
    }

    const orders = await Order.find({ userId: decoded.userId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ orders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const customer = body?.customer || {};
    const orderSummary = body?.orderSummary || {};
    const payment = body?.payment || {};
    const product = body?.product || {};
    const delivery = body?.delivery || {};
    const otpVerificationToken = String(body?.otpVerificationToken || "").trim();

    const requiredCustomerFields = [
      "fullName",
      "phoneNumber",
      "emailAddress",
      "houseAddress",
      "city",
      "district",
      "state",
      "pincode",
    ];

    const missing = requiredCustomerFields.filter(
      (field) => !String(customer[field] || "").trim()
    );

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    if (!product?.name || Number(product?.quantity) < 1 || Number(product?.unitPrice) < 0) {
      return NextResponse.json({ error: "Invalid product details" }, { status: 400 });
    }

    const phoneNumber = String(customer.phoneNumber || "").replace(/\D/g, "");

    if (otpVerificationToken) {
      if (otpVerificationToken.startsWith("firebase:")) {
      const firebaseIdToken = otpVerificationToken.slice("firebase:".length).trim();

      if (!firebaseIdToken) {
        return NextResponse.json({ error: "Invalid Firebase verification token" }, { status: 401 });
      }

      if (!hasFirebaseAdminConfig()) {
        return NextResponse.json(
          { error: "Firebase Admin credentials are not configured" },
          { status: 500 }
        );
      }

      const decodedToken = await verifyFirebaseIdToken(firebaseIdToken);
      const verifiedPhone = String(decodedToken.phone_number || "").replace(/\D/g, "");

      if (!verifiedPhone) {
        return NextResponse.json(
          { error: "Firebase token does not contain a phone number" },
          { status: 401 }
        );
      }

      if (verifiedPhone.slice(-10) !== phoneNumber.slice(-10)) {
        return NextResponse.json(
          { error: "Phone number does not match verified Firebase session" },
          { status: 400 }
        );
      }
    } else {
        const otpSession = await OtpVerification.findOne({ verificationToken: otpVerificationToken });
        if (!otpSession || !otpSession.isVerified) {
          return NextResponse.json({ error: "Invalid OTP verification token" }, { status: 401 });
        }

        if (otpSession.phoneNumber !== phoneNumber) {
          return NextResponse.json(
            { error: "Phone number does not match verified OTP session" },
            { status: 400 }
          );
        }
      }
    }

    const subtotal = Number(orderSummary?.subtotal ?? product.unitPrice * product.quantity);
    const shipping = Number(orderSummary?.shipping ?? 0);
    const total = Number(orderSummary?.total ?? subtotal + shipping);

    if ([subtotal, shipping, total].some((value) => Number.isNaN(value) || value < 0)) {
      return NextResponse.json({ error: "Invalid order summary" }, { status: 400 });
    }

    const method = ["cod", "upi", "card"].includes(String(payment?.method))
      ? String(payment.method)
      : "cod";

    const orderId = generateOrderId();

    await QuickOrder.create({
      orderId,
      product: {
        name: String(product.name).trim(),
        quantity: Number(product.quantity),
        unitPrice: Number(product.unitPrice),
      },
      customer: {
        fullName: String(customer.fullName).trim(),
        phoneNumber: String(customer.phoneNumber).trim(),
        emailAddress: String(customer.emailAddress).trim(),
        houseAddress: String(customer.houseAddress).trim(),
        city: String(customer.city).trim(),
        district: String(customer.district).trim(),
        state: String(customer.state).trim(),
        pincode: String(customer.pincode).trim(),
      },
      orderSummary: {
        subtotal,
        shipping,
        total,
      },
      payment: {
        method,
        status: "pending",
      },
      delivery: {
        isServiceable: Boolean(delivery?.isServiceable ?? true),
        estimatedDeliveryDate: delivery?.estimatedDeliveryDate
          ? new Date(delivery.estimatedDeliveryDate)
          : undefined,
        estimatedDays:
          typeof delivery?.estimatedDays === "number" ? Number(delivery.estimatedDays) : undefined,
      },
    });

    await recordRealtimeEvent({
      entity: "order",
      action: "created",
      resourceId: orderId,
      details: { source: "quick-order" },
    });

    return NextResponse.json({ orderId }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to place order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
