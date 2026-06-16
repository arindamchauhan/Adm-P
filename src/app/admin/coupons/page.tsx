'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

interface CouponDto {
  _id: string;
  code: string;
  couponType?: 'manual' | 'public_auto';
  audience?: 'all_users' | 'new_users';
  discount: number;
  discountType: 'percentage' | 'fixed';
  description?: string;
  bannerText?: string;
  minOrderValue?: number;
  expiryDate: string;
  usageCount: number;
  maxUses?: number;
  isActive: boolean;
}

type CouponForm = {
  code: string;
  couponType: 'manual' | 'public_auto';
  audience: 'all_users' | 'new_users';
  discountType: 'percentage' | 'fixed';
  discount: number;
  minOrderValue: number;
  expiryDate: string;
  description: string;
  bannerText: string;
};

const initialForm: CouponForm = {
  code: '',
  couponType: 'manual',
  audience: 'all_users',
  discountType: 'percentage',
  discount: 10,
  minOrderValue: 0,
  expiryDate: '',
  description: '',
  bannerText: '',
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<CouponForm>(initialForm);

  const fetchCoupons = async () => {
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/coupons', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch coupons');
      }
      setCoupons(data.coupons || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch coupons');
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  useRealtimeSync({
    onEvent: (event) => {
      if (event.entity === 'coupon') {
        fetchCoupons();
      }
    },
  });

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    setError('');

    const token = localStorage.getItem('authToken');
    if (!token) {
      setFormError('Admin session expired. Please log in again.');
      return;
    }

    if (!form.code.trim() || !form.expiryDate) {
      setFormError('Coupon code and expiry date are required.');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: form.code,
          couponType: form.couponType,
          audience: form.audience,
          discountType: form.discountType,
          discount: Number(form.discount),
          minOrderValue: Number(form.minOrderValue || 0),
          startDate: new Date().toISOString(),
          expiryDate: new Date(form.expiryDate).toISOString(),
          description: form.description?.trim() || undefined,
          bannerText: form.bannerText?.trim() || undefined,
          isActive: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create coupon');
      }

      setCoupons((prev) => [data.coupon, ...prev]);
      setForm(initialForm);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create coupon');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (coupon: CouponDto) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Admin session expired. Please log in again.');
      return;
    }

    try {
      const response = await fetch(`/api/coupons/${coupon._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Status update failed');
      }

      setCoupons((prev) => prev.map((item) => (item._id === coupon._id ? data.coupon : item)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Admin session expired. Please log in again.');
      return;
    }

    if (!window.confirm('Delete this coupon?')) return;

    try {
      const response = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Delete failed');
      }
      setCoupons((prev) => prev.filter((coupon) => coupon._id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const filteredCoupons = useMemo(
    () => coupons.filter((c) => c.code.toLowerCase().includes(search.toLowerCase())),
    [coupons, search]
  );

  const manualCoupons = filteredCoupons.filter((coupon) => (coupon.couponType || 'manual') === 'manual');
  const publicCoupons = filteredCoupons.filter((coupon) => (coupon.couponType || 'manual') === 'public_auto');

  const renderTable = (rows: CouponDto[], emptyLabel: string) => {
    if (rows.length === 0) {
      return <p className="p-4 text-sm text-gray-600">{emptyLabel}</p>;
    }

    return (
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Audience</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Discount</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Usage</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Expiry</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((coupon) => (
            <tr key={coupon._id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-6 py-4">
                <p className="text-sm font-bold text-dark-text">{coupon.code}</p>
                {coupon.description ? <p className="text-xs text-gray-500 mt-1">{coupon.description}</p> : null}
              </td>
              <td className="px-6 py-4 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${coupon.audience === 'new_users' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {coupon.audience === 'new_users' ? 'New users' : 'All users'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-gold">
                {coupon.discountType === 'percentage' ? `${coupon.discount}%` : `₹${coupon.discount}`}
                {coupon.minOrderValue ? <span className="block text-xs text-gray-500">Min ₹{coupon.minOrderValue}</span> : null}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {coupon.usageCount} / {coupon.maxUses || '∞'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{new Date(coupon.expiryDate).toLocaleDateString('en-IN')}</td>
              <td className="px-6 py-4 text-sm">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                  {coupon.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleToggleStatus(coupon)}
                    className="text-sm text-gold hover:text-opacity-80 font-semibold"
                  >
                    {coupon.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(coupon._id)}
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
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading text-dark-text">Coupons & Promo Codes</h1>
          <p className="text-gray-600">Create manual-entry coupons and auto-visible website coupons.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600">
          <span className="font-semibold text-dark-text">Audience targeting:</span>
          <span>New users / All users</span>
        </div>
      </div>

      {/* Create Coupon */}
      <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus size={18} className="text-gold" />
          <h2 className="text-lg font-semibold text-dark-text">Create Coupon</h2>
        </div>

        <div className="mb-4 rounded-lg border border-beige bg-cream p-3">
          <p className="text-sm font-semibold text-dark-text">Field Functions</p>
          <p className="text-xs text-light-text mt-1">Coupon code: what user applies at checkout.</p>
          <p className="text-xs text-light-text">Coupon type: manual entry or auto-shown public website coupon.</p>
          <p className="text-xs text-light-text">Audience: restrict to new users or allow all users.</p>
          <p className="text-xs text-light-text">Discount type/value: percent or fixed amount.</p>
          <p className="text-xs text-light-text">Min order value: minimum cart value required to apply coupon.</p>
          <p className="text-xs text-light-text">Expiry date: coupon stops working after this date.</p>
          <p className="text-xs text-light-text">Banner title + description: text shown on website for public coupons.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-dark-text">Coupon Code</span>
            <input
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="Coupon code"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <span className="mt-1 block text-[11px] text-light-text">Example: WELCOME10</span>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-dark-text">Coupon Type</span>
            <select
              value={form.couponType}
              onChange={(e) => setForm((prev) => ({ ...prev, couponType: e.target.value as CouponForm['couponType'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="manual">Manual Coupon (user enters code)</option>
              <option value="public_auto">Public Coupon (shown automatically)</option>
            </select>
            <span className="mt-1 block text-[11px] text-light-text">Manual = input box. Public = auto shown card.</span>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-dark-text">Audience</span>
            <select
              value={form.audience}
              onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value as CouponForm['audience'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="all_users">All users</option>
              <option value="new_users">New users only</option>
            </select>
            <span className="mt-1 block text-[11px] text-light-text">New users are validated against past orders.</span>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-dark-text">Discount Type</span>
            <select
              value={form.discountType}
              onChange={(e) => setForm((prev) => ({ ...prev, discountType: e.target.value as CouponForm['discountType'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
            <span className="mt-1 block text-[11px] text-light-text">Percentage = %, Fixed = flat rupee discount.</span>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-dark-text">Discount Value</span>
            <input
              type="number"
              min={1}
              value={form.discount}
              onChange={(e) => setForm((prev) => ({ ...prev, discount: Number(e.target.value) }))}
              placeholder="Discount"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-dark-text">Minimum Order Value</span>
            <input
              type="number"
              min={0}
              value={form.minOrderValue}
              onChange={(e) => setForm((prev) => ({ ...prev, minOrderValue: Number(e.target.value) }))}
              placeholder="Min order value"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-dark-text">Expiry Date</span>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-dark-text">Banner Title</span>
            <input
              value={form.bannerText}
              onChange={(e) => setForm((prev) => ({ ...prev, bannerText: e.target.value }))}
              placeholder="Banner title (for public coupon)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </label>
        </div>

        <label className="block mt-3">
          <span className="mb-1 block text-xs font-semibold text-dark-text">Coupon Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Coupon description shown on website"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            rows={2}
          />
          <span className="mt-1 block text-[11px] text-light-text">Visible in public coupon card on cart/checkout.</span>
        </label>

        {formError ? <p className="text-sm text-red-600 mt-3">{formError}</p> : null}

        <div className="mt-3">
          <button
            type="submit"
            disabled={isCreating}
            className="bg-gold text-white px-5 py-2 rounded-lg hover:bg-opacity-90 transition-colors font-semibold disabled:opacity-60"
          >
            {isCreating ? 'Creating...' : 'Create Coupon'}
          </button>
        </div>
      </form>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search coupons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-dark-text">Manual Coupons (Apply by code)</h3>
            <p className="text-sm text-gray-600">User enters coupon in cart/checkout to get discount.</p>
          </div>
          {renderTable(manualCoupons, 'No manual coupons found.')}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-dark-text">Public Website Coupons (Auto shown)</h3>
            <p className="text-sm text-gray-600">These coupons are shown to all visitors on website coupon cards when active.</p>
          </div>
          {renderTable(publicCoupons, 'No public website coupons found.')}
        </div>
      </div>
    </div>
  );
}
