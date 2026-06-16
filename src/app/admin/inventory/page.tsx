'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, TrendingDown } from 'lucide-react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  stock: number;
  minStockLevel?: number;
  sales?: number;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [error, setError] = useState('');

  const fetchInventory = async () => {
    setError('');
    try {
      const res = await fetch('/api/products?limit=100&sort=latest');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch inventory');
      }
      setInventory(data.products || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useRealtimeSync({
    onEvent: (event) => {
      if (event.entity === 'product') {
        fetchInventory();
      }
    },
  });

  const getStatusColor = (stock: number, minLevel: number) => {
    if (stock === 0) return 'bg-red-100 text-red-800';
    if (stock <= minLevel) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const updateStock = async (id: string, currentStock: number, delta: number) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Admin session expired. Please log in again.');
      return;
    }

    const nextStock = Math.max(0, currentStock + delta);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stock: nextStock }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Stock update failed');
      }

      setInventory((prev) => prev.map((item) => (item._id === id ? { ...item, stock: nextStock } : item)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Stock update failed');
    }
  };

  const lowStockCount = useMemo(
    () => inventory.filter((item) => item.stock <= (item.minStockLevel || 5)).length,
    [inventory]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading text-dark-text">Inventory Management</h1>
        <p className="text-gray-600">Track and manage product stock levels</p>
      </div>

      {/* Alerts */}
      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <div>
            <p className="text-sm font-semibold text-red-900">{lowStockCount} products low on stock</p>
            <p className="text-sm text-red-800">Reorder soon to avoid stockouts</p>
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-heading mt-2">{inventory.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Low Stock (≤ min)</p>
          <p className="text-2xl font-heading text-yellow-600 mt-2">{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Out of Stock</p>
          <p className="text-2xl font-heading text-red-600 mt-2">
            {inventory.filter((i) => i.stock === 0).length}
          </p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Current Stock</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Min. Level</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Sold (30d)</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item._id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-dark-text">{item.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.sku}</td>
                <td className="px-6 py-4 text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateStock(item._id, item.stock, -1)}
                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      -
                    </button>
                    <span>{item.stock}</span>
                    <button
                      onClick={() => updateStock(item._id, item.stock, 1)}
                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.minStockLevel || 5}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <TrendingDown size={16} className="text-blue-600" />
                    {item.sales || 0}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.stock, item.minStockLevel || 5)}`}>
                    {item.stock === 0 ? 'Out of Stock' : item.stock <= (item.minStockLevel || 5) ? 'Low' : 'Good'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
