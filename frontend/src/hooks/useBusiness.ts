'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { BusinessResponse } from '@/types';

export const useBusiness = () => {
  const token = useAuthStore((s) => s.token);

  return useQuery<BusinessResponse>({
    queryKey: ['business'],
    queryFn: () => apiGet<BusinessResponse>('/business'),
    enabled: !!token,
    staleTime: Infinity,
  });
};
