import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order';
import { verifyToken } from '@/lib/auth';

function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  return authHeader.replace('Bearer ', '');
}

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    
    // Verify admin access
    if (token) {
      const decoded = verifyToken(token);
      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized. Admin access required.' },
          { status: 403 }
        );
      }
    }

    await dbConnect();

    // Fetch all customers (users with role 'customer')
    const customers = await User.find({ role: 'customer' })
      .select('_id email firstName lastName phone isActive createdAt lastLogin')
      .sort({ createdAt: -1 })
      .lean();

    // For each customer, get their order count and total spent
    const customersWithOrders = await Promise.all(
      customers.map(async (customer) => {
        const customerId = String(customer._id);
        const orders = await Order.find({ 'customer._id': customer._id })
          .select('summary')
          .lean();

        const totalSpent = orders.reduce((sum, order) => sum + (order.summary?.total || 0), 0);

        return {
          id: customerId,
          _id: customer._id,
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phone,
          isActive: customer.isActive,
          orders: orders.length,
          totalSpent: Math.round(totalSpent),
          joinDate: customer.createdAt ? new Date(customer.createdAt).toISOString().split('T')[0] : '',
          lastLogin: customer.lastLogin ? new Date(customer.lastLogin).toISOString().split('T')[0] : 'Never',
        };
      })
    );

    return NextResponse.json({
      customers: customersWithOrders,
      total: customersWithOrders.length,
    });
  } catch (error: unknown) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
