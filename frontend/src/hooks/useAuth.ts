'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, type ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { AuthSession, LoginInput, SignupInput, User } from '@/types';

const ME_QUERY_KEY = ['auth', 'me'] as const;

/** Wait for zustand persist to load token from storage before auth checks. */
export const useAuthHydration = () => {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    setHydrated(useAuthStore.persist.hasHydrated());
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
};

const useOnAuthSuccess = () => {
  const setSession = useAuthStore((s) => s.setSession);
  const queryClient = useQueryClient();
  const router = useRouter();

  return (session: AuthSession) => {
    setSession(session);
    queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    router.push('/');
  };
};

export const useCurrentUser = () => {
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  return useQuery<User, ApiError>({
    queryKey: ME_QUERY_KEY,
    enabled: !!token,
    queryFn: async () => {
      try {
        const user = await apiGet<User>('/auth/me');
        setSession({ token: useAuthStore.getState().token!, user });
        return user;
      } catch (err) {
        const error = err as ApiError;
        if (error.status === 401) clearSession();
        throw error;
      }
    },
  });
};

export const useLogin = () => {
  const onSuccess = useOnAuthSuccess();

  return useMutation<AuthSession, ApiError, LoginInput>({
    mutationFn: (credentials) => apiPost<AuthSession>('/auth/login', credentials),
    onSuccess,
  });
};

export const useSignup = () => {
  const onSuccess = useOnAuthSuccess();

  return useMutation<AuthSession, ApiError, SignupInput>({
    mutationFn: (payload) => apiPost<AuthSession>('/auth/signup', payload),
    onSuccess,
  });
};

export const useLogout = () => {
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();
  const router = useRouter();

  return () => {
    clearSession();
    queryClient.clear();
    router.push('/login');
  };
};
