'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useCurrentUser, useAuthHydration } from '@/hooks/useAuth';
import Spinner from './ui/Spinner';

interface RequireAuthProps {
  children: ReactNode;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const hydrated = useAuthHydration();
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const { isLoading } = useCurrentUser();

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace('/login');
  }, [hydrated, token, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner className="text-3xl text-indigo-600" />
      </div>
    );
  }

  if (!token) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner className="text-3xl text-indigo-600" />
      </div>
    );
  }

  return children;
};

export default RequireAuth;
