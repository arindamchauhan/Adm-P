import { AuthProvider } from '@/context/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export const metadata = {
  title: 'Admin Dashboard - BijNoor',
  description: 'Admin panel for managing products, orders, and more',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <AdminHeader />
        <main className="md:ml-64 mt-16 md:mt-0">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
