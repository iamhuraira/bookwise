'use client';

import Link from 'next/link';
import { CheckCircleOutlined } from '@ant-design/icons';
import { formatAppointmentRange, getServiceName } from '@/lib/appointments';
import { useServices } from '@/hooks/useAppointments';
import type { Appointment } from '@/types';

interface BookingConfirmedCardProps {
  appointment: Appointment;
}

const BookingConfirmedCard = ({ appointment }: BookingConfirmedCardProps) => {
  const { data: servicesData } = useServices();
  const serviceName = getServiceName(servicesData?.services, appointment.serviceType);

  return (
    <div className="w-full min-w-0 rounded-2xl border border-green-200 bg-green-50 p-4">
      <div className="flex items-start gap-3">
        <CheckCircleOutlined className="mt-0.5 text-lg text-green-600" />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="font-semibold text-green-900">Appointment confirmed</p>

          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-green-800/70">Service</dt>
              <dd className="font-medium text-green-900">{serviceName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-green-800/70">When</dt>
              <dd className="break-words text-right font-medium text-green-900">
                {formatAppointmentRange(appointment.startsAt, appointment.endsAt)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-green-800/70">Status</dt>
              <dd>
                <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium capitalize text-green-800 ring-1 ring-green-600/20 ring-inset">
                  {appointment.status}
                </span>
              </dd>
            </div>
          </dl>

          <Link
            href="/"
            className="inline-flex text-sm font-medium text-green-700 hover:text-green-800"
          >
            View my appointments →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmedCard;
