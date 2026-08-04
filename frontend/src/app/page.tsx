'use client';

import Link from 'next/link';
import { LogoutOutlined } from '@ant-design/icons';
import RequireAuth from '@/components/RequireAuth';
import AppointmentCard from '@/components/appointments/AppointmentCard';
import BrandLogo from '@/components/ui/BrandLogo';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useAuth';
import { useAppointments, useServices } from '@/hooks/useAppointments';
import { useBusiness } from '@/hooks/useBusiness';

const SkeletonCard = () => (
  <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4">
    <div className="h-4 w-1/3 rounded bg-gray-200" />
    <div className="mt-3 h-3 w-1/2 rounded bg-gray-100" />
  </div>
);

const Dashboard = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data: servicesData } = useServices();
  const { data: businessData, isLoading: businessLoading } = useBusiness();
  const { data, isLoading, isError, refetch } = useAppointments();

  const businessName = businessData?.business?.name;

  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const upcoming = data?.upcoming ?? [];
  const past = (data?.past ?? []).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo size="sm" />
            <div className="min-w-0">
              <p className="font-semibold leading-tight text-gray-900">BookWise</p>
              {businessName ? (
                <p className="truncate text-xs text-gray-500">{businessName}</p>
              ) : businessLoading ? (
                <p className="h-3.5 w-24 animate-pulse rounded bg-gray-100" aria-hidden />
              ) : null}
            </div>
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
        <div className="mb-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
              B
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                Book with our AI assistant — just tell it what you need
              </h2>
              <p className="mt-1 text-sm text-indigo-900/70">
                Natural conversation booking, with a form fallback when you prefer.
              </p>
            </div>
          </div>
          <Link
            href="/chat"
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 sm:mt-0 sm:w-auto"
          >
            Start chatting
          </Link>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName} 👋</h1>
            <p className="mt-1 text-gray-500">Manage your upcoming and past appointments.</p>
          </div>
          <Link
            href="/appointments/new"
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Book appointment
          </Link>
        </div>

        {isError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700">Could not load appointments.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming</h2>

          {isLoading && (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {!isLoading && !isError && upcoming.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <p className="text-3xl">📅</p>
              <p className="mt-3 font-medium text-gray-900">No upcoming appointments</p>
              <p className="mt-1 text-sm text-gray-500">
                Book a visit to see it listed here.
              </p>
              <Link
                href="/appointments/new"
                className="mt-5 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                Book your first appointment
              </Link>
            </div>
          )}

          {!isLoading && upcoming.length > 0 && (
            <div className="space-y-3">
              {upcoming.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  services={servicesData?.services}
                  showCancel
                />
              ))}
            </div>
          )}
        </section>

        {!isLoading && past.length > 0 && (
          <section className="mt-10 space-y-4">
            <h2 className="text-lg font-semibold text-gray-500">Past</h2>
            <div className="space-y-3">
              {past.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  services={servicesData?.services}
                  muted
                />
              ))}
            </div>
          </section>
        )}
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
