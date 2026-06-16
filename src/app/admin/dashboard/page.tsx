'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { DollarSign, Package, ShoppingCart, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { getAdminBasePath } from '@/lib/admin-path';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueGrowth: number;
  lowStockCount?: number;
}

type RecentOrder = {
  orderId: string;
  customerName: string;
  total: number;
  status: string;
  source?: string;
};

type TopProduct = {
  id: string;
  name: string;
  stock: number;
  sales: number;
  isLowStock: boolean;
};

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const adminBasePath = getAdminBasePath(pathname);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    revenueGrowth: 0,
    lowStockCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      router.push(`${adminBasePath}/login`);
    }
  }, [user, isLoading, router, adminBasePath]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load dashboard');
        }

        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
        setTopProducts(data.topProducts || []);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchStats();
  }, []);

  useRealtimeSync({
    onEvent: () => {
      void (async () => {
        try {
          const response = await fetch('/api/admin/dashboard');
          const data = await response.json();
          if (!response.ok) {
            return;
          }

          setStats(data.stats);
          setRecentOrders(data.recentOrders || []);
          setTopProducts(data.topProducts || []);
        } finally {
          setDataLoading(false);
        }
      })();
    },
  });

  if (isLoading || dataLoading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: <DollarSign className="text-green-500" size={28} />,
      change: `+${stats.revenueGrowth}%`,
      color: 'bg-green-50',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: <ShoppingCart className="text-blue-500" size={28} />,
      change: 'Live order sync',
      color: 'bg-blue-50',
    },
    {
      title: 'Products',
      value: stats.totalProducts,
      icon: <Package className="text-purple-500" size={28} />,
      change: `${stats.lowStockCount || 0} low stock`,
      color: 'bg-purple-50',
    },
    {
      title: 'Customers',
      value: stats.totalCustomers,
      icon: <Users className="text-orange-500" size={28} />,
      change: 'Derived from orders',
      color: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading text-dark-text mb-2">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-600">Here's what's happening with your store today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`${card.color} rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                <p className="text-2xl font-heading text-dark-text mt-2">{card.value}</p>
              </div>
              {card.icon}
            </div>
            <p className="text-sm text-gray-600">{card.change}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-heading text-dark-text mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href={`${adminBasePath}/products/new`} className="p-4 border border-gold rounded-lg text-gold hover:bg-gold hover:text-white transition-colors font-semibold text-center">
            ➕ Add Product
          </Link>
          <Link href={`${adminBasePath}/orders`} className="p-4 border border-blue-500 rounded-lg text-blue-500 hover:bg-blue-500 hover:text-white transition-colors font-semibold text-center">
            📦 View Orders
          </Link>
          <Link href={`${adminBasePath}/coupons`} className="p-4 border border-purple-500 rounded-lg text-purple-500 hover:bg-purple-500 hover:text-white transition-colors font-semibold text-center">
            🏷️ Manage Coupons
          </Link>
          <Link href={`${adminBasePath}/products`} className="p-4 border border-green-500 rounded-lg text-green-500 hover:bg-green-500 hover:text-white transition-colors font-semibold text-center">
            ✏️ Edit Products
          </Link>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex gap-4">
        <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
        <div>
          <h3 className="font-semibold text-yellow-900">Low Stock Alert</h3>
          <p className="text-sm text-yellow-800 mt-1">
            {stats.lowStockCount || 0} products are running low on inventory. <a href={`${adminBasePath}/inventory`} className="underline font-semibold">Check inventory →</a>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-heading text-dark-text mb-4">
            <TrendingUp className="inline mr-2" size={24} />
            Recent Orders
          </h2>
          {recentOrders.length === 0 ? (
            <p className="text-gray-600">No recent orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.orderId} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div>
                    <p className="font-semibold text-dark-text">{order.orderId}</p>
                    <p className="text-sm text-gray-600">{order.customerName}{order.source ? ` · ${order.source}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-dark-text">₹{order.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-heading text-dark-text mb-4">Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-600">No product analytics yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div>
                    <p className="font-semibold text-dark-text">{product.name}</p>
                    <p className="text-sm text-gray-600">Stock: {product.stock}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-dark-text">{product.sales} sold</p>
                    {product.isLowStock ? <p className="text-xs text-red-600">Low stock</p> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
