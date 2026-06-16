'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import { getAdminBasePath } from '@/lib/admin-path';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

interface AdminProduct {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  discount?: number;
  stock: number;
  category: string;
  isPublished: boolean;
  launchSoon?: boolean;
}

export default function ProductsPage() {
  const pathname = usePathname();
  const adminBasePath = getAdminBasePath(pathname);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ q: search, limit: '100' });
      const response = await fetch(`/api/products?${query.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }
      setProducts(data.products || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  useRealtimeSync({
    onEvent: (event) => {
      if (event.entity === 'product') {
        fetchProducts();
      }
    },
  });

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Admin session expired. Please log in again.');
      return;
    }

    const confirmDelete = window.confirm('Delete this product?');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Delete failed');
      }
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const filteredProducts = useMemo(() => products, [products]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading text-dark-text">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Link
          href={`${adminBasePath}/products/new`}
          className="flex items-center gap-2 bg-gold text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors font-semibold"
        >
          <Plus size={20} />
          Add Product
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Filter size={20} />
          Filters
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {isLoading ? <p className="text-sm text-gray-500">Loading products...</p> : null}

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Discount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Stock</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-dark-text">{product.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{product.sku}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gold">₹{product.price.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm">
                  {product.discount && product.discount > 0 ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      {product.discount}% OFF
                    </span>
                  ) : (
                    <span className="text-gray-500">No discount</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      product.stock > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.stock} left
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 w-fit">
                      {product.isPublished ? 'Published' : 'Draft'}
                    </span>
                    {product.launchSoon ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 w-fit">
                        Launch Soon
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <Link href={`/product/${product.slug}`} className="text-blue-600 hover:text-blue-800" title="View">
                      <Eye size={18} />
                    </Link>
                    <Link href={`${adminBasePath}/products/${product._id}/edit`} className="text-gold hover:text-opacity-80" title="Edit">
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Showing {filteredProducts.length} products</p>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gold bg-gold text-white rounded-lg">1</button>
        </div>
      </div>
    </div>
  );
}
