'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, BarChart3, Package, ShoppingCart, Tag, Boxes, Users, Settings, LogOut, Menu, X, Video } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAdminBasePath } from '@/lib/admin-path';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: 'dashboard', icon: <BarChart3 size={20} /> },
  { label: 'Products', href: 'products', icon: <Package size={20} /> },
  { label: 'Orders', href: 'orders', icon: <ShoppingCart size={20} /> },
  { label: 'Collabs', href: 'collabs', icon: <Video size={20} /> },
  { label: 'Coupons', href: 'coupons', icon: <Tag size={20} /> },
  { label: 'Inventory', href: 'inventory', icon: <Boxes size={20} /> },
  { label: 'Customers', href: 'customers', icon: <Users size={20} /> },
  { label: 'Settings', href: 'settings', icon: <Settings size={20} /> },
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const adminBasePath = getAdminBasePath(pathname);

  const handleLogout = () => {
    logout();
    router.push(`${adminBasePath}/login`);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white p-2 rounded-lg border border-gray-200 shadow-sm"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-dark-text text-white shadow-lg overflow-y-auto transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <Link href={`${adminBasePath}/dashboard`} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center font-bold text-dark-text">
              BN
            </div>
            <div>
              <p className="font-heading text-lg text-gold">BijNoor</p>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const href = `${adminBasePath}/${item.href}`;
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gold text-dark-text font-semibold'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-black/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}
    </>
  );
}
