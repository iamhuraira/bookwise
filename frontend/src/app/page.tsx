'use client';

import { LogoutOutlined } from '@ant-design/icons';
import RequireAuth from '@/components/RequireAuth';
import BrandLogo from '@/components/ui/BrandLogo';
import { useAuthStore } from '@/stores/authStore';
import { useBusiness } from '@/hooks/useBusiness';
import { useLogout } from '@/hooks/useAuth';

const Dashboard = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data } = useBusiness();

  const businessName = data?.business?.name || 'BookWise';
  const firstName = user?.fullName?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span className="font-semibold text-gray-900">{businessName}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-600 sm:inline">{user?.fullName}</span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <LogoutOutlined />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName} 👋</h1>
          <p className="mt-2 text-gray-500">Your appointments will appear here.</p>
        </div>
      </main>
    </div>
  );
};

const HomePage = () => (
  <RequireAuth>
    <Dashboard />
  </RequireAuth>
);

export default HomePage;
