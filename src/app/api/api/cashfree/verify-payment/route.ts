import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Coupon from '@/models/Coupon';
import { getCashfreeOrderStatus } from '@/lib/cashfree';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    await dbConnect();

    const order = await Order.findOne({ orderId });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.payment?.status === 'completed') {
      return NextResponse.json(
        {
          verified: true,
          message: 'Payment already verified',
          orderId,
          paymentStatus: order.payment?.cashfree?.orderStatus || 'PAID',
        },
        { status: 200 }
      );
    }

    const cashfreeOrder = await getCashfreeOrderStatus(orderId);
    const paymentStatus = String(cashfreeOrder.order_status || '').toUpperCase();

    if (paymentStatus !== 'PAID') {
      return NextResponse.json(
        {
          verified: false,
          message: 'Payment is not completed yet',
          orderId,
          paymentStatus,
        },
        { status: 202 }
      );
    }

    for (const item of order.items) {
      const result = await Product.updateOne(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity, sales: item.quantity } }
      );

      if (result.modifiedCount === 0) {
        return NextResponse.json(
          { error: `Stock update failed for ${item.productName}` },
          { status: 409 }
        );
      }
    }

    if (order.coupon?.code) {
      await Coupon.updateOne({ code: order.coupon.code }, { $inc: { usageCount: 1 } });
    }

    order.payment.status = 'completed';
    order.payment.paidAt = new Date();
    order.payment.transactionId = cashfreeOrder.order_id;
    order.payment.cashfree = {
      ...order.payment.cashfree,
      orderId: cashfreeOrder.order_id,
      paymentSessionId: order.payment.cashfree?.paymentSessionId,
      orderStatus: paymentStatus,
    };
    order.status = 'confirmed';
    order.timeline.push(
      {
        status: 'Payment Confirmed',
        timestamp: new Date(),
        notes: 'Cashfree payment verified successfully',
      },
      {
        status: 'Processing',
        timestamp: new Date(),
        notes: 'Order moved to processing queue',
      }
    );

    await order.save();

    return NextResponse.json(
      {
        verified: true,
        message: 'Payment verified successfully',
        orderId,
        paymentStatus,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to verify payment';
    console.error('Cashfree payment verification error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}