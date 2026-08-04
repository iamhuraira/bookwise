'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost, type ApiError } from '@/lib/api';
import type {
  Appointment,
  AppointmentsResponse,
  CreateAppointmentInput,
  ServicesResponse,
} from '@/types';

export const useServices = () =>
  useQuery<ServicesResponse>({
    queryKey: ['services'],
    queryFn: () => apiGet<ServicesResponse>('/services'),
    staleTime: Infinity,
  });

export const useAppointments = () =>
  useQuery<AppointmentsResponse>({
    queryKey: ['appointments'],
    queryFn: () => apiGet<AppointmentsResponse>('/appointments'),
  });

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation<{ appointment: Appointment }, ApiError, CreateAppointmentInput>({
    mutationFn: (input) => apiPost<{ appointment: Appointment }>('/appointments', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation<{ appointment: Appointment }, ApiError, string>({
    mutationFn: (id) => apiPatch<{ appointment: Appointment }>(`/appointments/${id}/cancel`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
};
