'use client';

import { useEffect, useState } from 'react';
import { Search, Mail, Phone, AlertCircle } from 'lucide-react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  orders: number;
  totalSpent: number;
  joinDate: string;
  lastLogin: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/customers', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch customers');
        }

        setCustomers(data.customers || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch customers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  useRealtimeSync({
    onEvent: (event) => {
      if (event.entity !== 'order') {
        return;
      }

      void (async () => {
        setIsLoading(true);
        setError('');
        try {
          const token = localStorage.getItem('authToken');
          const response = await fetch('/api/customers', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch customers');
          }

          setCustomers(data.customers || []);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Failed to fetch customers');
        } finally {
          setIsLoading(false);
        }
      })();
    },
  });

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading text-dark-text">Customers</h1>
        <p className="text-gray-600">View and manage customer information</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers by name or email..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      {/* Customers Table */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-600">Loading customers...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          {search ? 'No customers found matching your search.' : 'No customers yet.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Orders</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total Spent</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-dark-text">{customer.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="space-y-1">
                      <a
                        href={`mailto:${customer.email}`}
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <Mail size={16} />
                        {customer.email}
                      </a>
                      <a
                        href={`tel:${customer.phone}`}
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <Phone size={16} />
                        {customer.phone}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-dark-text">{customer.orders}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gold">₹{customer.totalSpent.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{customer.joinDate}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{customer.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
