'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { getAdminBasePath } from '@/lib/admin-path';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

interface AdminOrder {
  _id: string;
  orderId: string;
  customer: { name: string };
  items: { quantity: number }[];
  summary: { total: number };
  status: string;
  createdAt: string;
  source?: string;
  isQuickOrder?: boolean;
}

export default function OrdersPage() {
  const pathname = usePathname();
  const adminBasePath = getAdminBasePath(pathname);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/orders', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }
      setOrders(data.orders || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    }
  };

  useEffect(() => {
    fetchOrders();

    const pollId = window.setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => window.clearInterval(pollId);
  }, []);

  useRealtimeSync({
    onEvent: (event) => {
      if (event.entity === 'order') {
        fetchOrders();
      }
    },
  });

  const updateStatus = async (orderId: string, status: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Admin session expired. Please log in again.');
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, notes: 'Updated from admin dashboard' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId ? { ...order, status: data.order.status } : order
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    }
  };

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending').length;
    const confirmed = orders.filter((o) => o.status === 'confirmed').length;
    const shipped = orders.filter((o) => ['shipped', 'out_for_delivery'].includes(o.status)).length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    return { pending, confirmed, shipped, delivered };
  }, [orders]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading text-dark-text">Orders</h1>
        <p className="text-gray-600">View and manage all orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Pending Orders</p>
          <p className="text-2xl font-heading mt-2">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Confirmed</p>
          <p className="text-2xl font-heading mt-2">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Shipped</p>
          <p className="text-2xl font-heading mt-2">{stats.shipped}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Delivered</p>
          <p className="text-2xl font-heading mt-2">{stats.delivered}</p>
        </div>
      </div>

      {/* Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
        <div>
          <p className="text-sm font-semibold text-blue-900">{stats.pending} pending orders</p>
          <p className="text-sm text-blue-800">Orders waiting for confirmation and processing</p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Items</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-dark-text">{order.orderId}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{order.customer?.name || 'Guest'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gold">₹{order.summary?.total?.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    {order.isQuickOrder ? (
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">Quick order</span>
                    ) : (
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.orderId, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="processing">processing</option>
                        <option value="shipped">shipped</option>
                        <option value="out_for_delivery">out_for_delivery</option>
                        <option value="delivered">delivered</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="px-6 py-4 text-center">
                  <Link
                    href={`${adminBasePath}/orders/${order.orderId}`}
                    className="text-gold hover:text-opacity-80 font-semibold"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
