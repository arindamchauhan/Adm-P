'use client';

import { useAuth } from '@/context/AuthContext';
import { Bell, Settings, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import { getAdminBasePath } from '@/lib/admin-path';

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const adminBasePath = getAdminBasePath(pathname);

  const handleLogout = () => {
    logout();
    router.push(`${adminBasePath}/login`);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 md:ml-64">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Title Space */}
        <div className="hidden md:block">
          <h1 className="text-xl font-heading text-dark-text">Admin Dashboard</h1>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-auto">
          <ThemeToggleButton className="p-2 border border-gray-200 rounded-lg transition-colors" />

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings */}
          <button
            onClick={() => router.push(`${adminBasePath}/settings`)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>

          {/* User Info */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-semibold text-dark-text">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-white font-bold">
              {user?.firstName?.charAt(0)}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
