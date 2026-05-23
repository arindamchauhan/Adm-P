import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import QuickOrder from '@/models/QuickOrder';
import Product from '@/models/Product';

function toNumber(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function orderTotal(order: { summary?: { total?: number } }) {
  return toNumber(order.summary?.total);
}

function quickOrderTotal(order: { orderSummary?: { total?: number } }) {
  return toNumber(order.orderSummary?.total);
}

export async function GET() {
  try {
    await dbConnect();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [orders, quickOrders, products, recentOrders, previousOrders] = (await Promise.all([
      Order.find({}).sort({ createdAt: -1 }).lean(),
      QuickOrder.find({}).sort({ createdAt: -1 }).lean(),
      Product.find({}).sort({ sales: -1, updatedAt: -1 }).lean(),
      Promise.all([
        Order.find({ createdAt: { $gte: sevenDaysAgo } }).lean(),
        QuickOrder.find({ createdAt: { $gte: sevenDaysAgo } }).lean(),
      ]),
      Promise.all([
        Order.find({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }).lean(),
        QuickOrder.find({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }).lean(),
      ]),
    ])) as [any[], any[], any[], [any[], any[]], [any[], any[]]];

    const allOrders = [...orders, ...quickOrders];
    const revenue = orders.reduce((total, order) => total + orderTotal(order), 0) + quickOrders.reduce((total, order) => total + quickOrderTotal(order), 0);
    const currentRevenue = recentOrders[0].reduce((total, order) => total + orderTotal(order), 0) + recentOrders[1].reduce((total, order) => total + quickOrderTotal(order), 0);
    const previousRevenue = previousOrders[0].reduce((total, order) => total + orderTotal(order), 0) + previousOrders[1].reduce((total, order) => total + quickOrderTotal(order), 0);
    const revenueGrowth = previousRevenue > 0 ? Number((((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)) : currentRevenue > 0 ? 100 : 0;

    const customerKeys = new Set<string>();
    for (const order of orders) {
      const email = String(order.customer?.email || '').trim().toLowerCase();
      if (email) customerKeys.add(email);
    }
    for (const order of quickOrders) {
      const email = String(order.customer?.emailAddress || '').trim().toLowerCase();
      if (email) customerKeys.add(email);
    }

    const recentActivity = [
      ...orders.slice(0, 5).map((order) => ({
        orderId: order.orderId,
        customerName: order.customer?.name || 'Guest',
        total: orderTotal(order),
        status: order.status,
        createdAt: order.createdAt,
        source: order.source || 'web',
      })),
      ...quickOrders.slice(0, 5).map((order) => ({
        orderId: order.orderId,
        customerName: order.customer?.fullName || 'Guest',
        total: quickOrderTotal(order),
        status: order.payment?.status === 'completed' ? 'confirmed' : order.payment?.status === 'failed' ? 'cancelled' : 'pending',
        createdAt: order.createdAt,
        source: 'quick-order',
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const topProducts = products.slice(0, 5).map((product) => ({
      id: String(product._id),
      name: product.name,
      sku: product.sku,
      stock: product.stock,
      sales: product.sales || 0,
      views: product.views || 0,
      isLowStock: product.stock <= (product.minStockLevel || 5),
    }));

    const lowStockCount = products.filter((product) => product.stock <= (product.minStockLevel || 5)).length;

    return NextResponse.json({
      stats: {
        totalRevenue: revenue,
        totalOrders: allOrders.length,
        totalProducts: products.length,
        totalCustomers: customerKeys.size,
        revenueGrowth,
        lowStockCount,
      },
      recentOrders: recentActivity,
      topProducts,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load dashboard';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}