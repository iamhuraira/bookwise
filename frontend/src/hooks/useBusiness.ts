'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { BusinessResponse } from '@/types';

export const useBusiness = () =>
  useQuery<BusinessResponse>({
    queryKey: ['business'],
    queryFn: () => apiGet<BusinessResponse>('/business'),
    staleTime: Infinity,
  });
