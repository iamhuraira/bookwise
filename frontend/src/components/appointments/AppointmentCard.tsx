'use client';

import { useState } from 'react';
import { useCancelAppointment } from '@/hooks/useAppointments';
import { formatAppointmentRange, getServiceName } from '@/lib/appointments';
import type { Appointment, Service } from '@/types';

interface AppointmentCardProps {
  appointment: Appointment;
  services?: Service[];
  showCancel?: boolean;
  muted?: boolean;
}

const statusLabels: Record<Appointment['status'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

const statusStyles: Record<Appointment['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  confirmed: 'bg-green-50 text-green-700 ring-green-600/20',
  cancelled: 'bg-gray-100 text-gray-500 ring-gray-400/20',
  completed: 'bg-blue-50 text-blue-700 ring-blue-600/20',
};

const AppointmentCard = ({
  appointment,
  services,
  showCancel = false,
  muted = false,
}: AppointmentCardProps) => {
  const cancelAppointment = useCancelAppointment();
  const [confirming, setConfirming] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const serviceName = getServiceName(services, appointment.serviceType);
  const canCancel =
    showCancel &&
    (appointment.status === 'pending' || appointment.status === 'confirmed');

  const handleCancel = () => {
    setCancelError(null);
    cancelAppointment.mutate(appointment.id, {
      onSuccess: () => setConfirming(false),
      onError: (err) => {
        setCancelError(err.message || 'Could not cancel appointment.');
      },
    });
  };

  const isCancelled = appointment.status === 'cancelled';

  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        muted
          ? 'border-gray-200 bg-white/60'
          : 'border-gray-200 bg-white shadow-sm hover:border-gray-300'
      } ${isCancelled && muted ? 'opacity-80' : ''}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`font-medium ${muted ? 'text-gray-600' : 'text-gray-900'} ${
                isCancelled ? 'line-through decoration-gray-400' : ''
              }`}
            >
              {serviceName}
            </h3>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[appointment.status]}`}
            >
              {statusLabels[appointment.status]}
            </span>
          </div>
          <p
            className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-600'} ${
              isCancelled ? 'line-through decoration-gray-300' : ''
            }`}
          >
            {formatAppointmentRange(appointment.startsAt, appointment.endsAt)}
          </p>
          {appointment.notes && (
            <p className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="font-medium text-gray-500">Notes: </span>
              {appointment.notes}
            </p>
          )}
        </div>

        {canCancel && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={cancelAppointment.isPending}
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60"
          >
            Cancel
          </button>
        )}
      </div>

      {canCancel && confirming && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          <span className="text-sm text-gray-700">Cancel this appointment?</span>
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelAppointment.isPending}
            className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {cancelAppointment.isPending ? 'Cancelling…' : 'Yes'}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              setCancelError(null);
            }}
            disabled={cancelAppointment.isPending}
            className="rounded-md border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            No
          </button>
        </div>
      )}

      {cancelError && <p className="mt-2 text-sm text-red-600">{cancelError}</p>}
    </div>
  );
};

export default AppointmentCard;
