import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Coupon from '@/models/Coupon';
import { verifyToken } from '@/lib/auth';
import { generateOrderId } from '@/lib/order-utils';
import { createCashfreeOrder, getCashfreeSiteUrl } from '@/lib/cashfree';

function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  return authHeader.replace('Bearer ', '');
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      items,
      customer,
      couponCode,
      paymentMethod = 'cashfree',
      source = 'web',
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 });
    }

    if (!customer?.name || !customer?.email || !customer?.phone || !customer?.address) {
      return NextResponse.json({ error: 'Customer details are required' }, { status: 400 });
    }

    const token = getAuthToken(request);
    const decoded = token ? verifyToken(token) : null;

    const productIds = items.map((it: { productId?: string; product?: { id?: string } }) =>
      it.productId || it.product?.id
    );

    const products = await Product.find({ _id: { $in: productIds }, isActive: true }).lean();
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const productId = item.productId || item.product?.id;
      const quantity = Number(item.quantity || 1);
      const product = productMap.get(String(productId));

      if (!product) {
        return NextResponse.json({ error: 'Product not found in catalog' }, { status: 400 });
      }

      if (product.stock < quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 409 }
        );
      }

      const lineTotal = product.price * quantity;
      subtotal += lineTotal;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        productImage: product.images?.[0]?.url,
        quantity,
        price: product.price,
        discount: 0,
        total: lineTotal,
      });
    }

    let discount = 0;
    let couponData: { code: string; discount: number; discountType: string } | undefined;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: String(couponCode).toUpperCase(),
        isActive: true,
      });

      if (coupon) {
        const now = new Date();
        const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < now;
        const isStarted = !coupon.startDate || new Date(coupon.startDate) <= now;
        const withinLimit =
          typeof coupon.maxUses !== 'number' || coupon.usageCount < coupon.maxUses;

        let isAudienceEligible = true;
        if (coupon.audience === 'new_users') {
          const existingOrderQuery: any = {
            status: { $nin: ['failed', 'cancelled'] },
          };

          if (decoded?.userId) {
            existingOrderQuery.userId = decoded.userId;
          } else {
            existingOrderQuery['customer.email'] = String(customer.email || '').toLowerCase();
          }

          const existingOrder = await Order.findOne(existingOrderQuery).select('_id').lean();
          isAudienceEligible = !existingOrder;
        }

        if (!isExpired && isStarted && withinLimit && isAudienceEligible && subtotal >= (coupon.minOrderValue || 0)) {
          const rawDiscount =
            coupon.discountType === 'percentage'
              ? (subtotal * coupon.discount) / 100
              : coupon.discount;

          discount = coupon.maxDiscount ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;

          couponData = {
            code: coupon.code,
            discount: Math.round(discount),
            discountType: coupon.discountType,
          };
        }
      }
    }

    const tax = Math.round(subtotal * 0.1);
    const shipping = 0;
    const total = Math.max(0, subtotal + tax + shipping - Math.round(discount));
    const appOrderId = generateOrderId();

    const cashfreeOrder = await createCashfreeOrder({
      orderId: appOrderId,
      amount: total,
      customerName: customer.name,
      customerEmail: String(customer.email).toLowerCase(),
      customerPhone: customer.phone,
      returnUrl: `${getCashfreeSiteUrl()}/checkout/cashfree/return?orderId={order_id}`,
    });

    const order = await Order.create({
      orderId: appOrderId,
      userId: decoded?.userId || undefined,
      customer: {
        name: customer.name,
        email: String(customer.email).toLowerCase(),
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        country: 'India',
      },
      items: orderItems,
      summary: {
        subtotal,
        tax,
        taxPercentage: 10,
        shipping,
        discount: Math.round(discount),
        total,
      },
      coupon: couponData,
      payment: {
        method: paymentMethod,
        status: 'pending',
        cashfree: {
          orderId: cashfreeOrder.order_id,
          paymentSessionId: cashfreeOrder.payment_session_id,
          orderStatus: cashfreeOrder.order_status,
        },
      },
      status: 'pending',
      timeline: [
        {
          status: 'Order Placed',
          timestamp: new Date(),
          notes: 'Order created and awaiting payment confirmation',
        },
      ],
      source,
    });

    return NextResponse.json(
      {
        order,
        appOrderId: order.orderId,
        total,
        paymentSessionId: cashfreeOrder.payment_session_id,
        cashfreeOrderId: cashfreeOrder.order_id,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create order';
    console.error('Cashfree order creation error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}