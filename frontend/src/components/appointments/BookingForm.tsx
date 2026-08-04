'use client';

import { useState, type SubmitEvent } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCreateAppointment, useServices } from '@/hooks/useAppointments';
import {
  formatBookingSummary,
  TIME_SLOTS,
  todayDateString,
  toISOWithOffset,
} from '@/lib/appointments';
import type { Appointment } from '@/types';

export interface BookingFormInitialValues {
  serviceType?: string;
  date?: string;
  time?: string;
  notes?: string;
}

interface BookingFormProps {
  initialValues?: BookingFormInitialValues;
  // reused later by the chatbot fallback booking flow
  onSuccess?: (appointment: Appointment) => void;
  embedded?: boolean;
}

const selectClassName =
  'block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 shadow-sm transition hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-0';

const BookingForm = ({ initialValues, onSuccess, embedded = false }: BookingFormProps) => {
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const createAppointment = useCreateAppointment();

  const [serviceType, setServiceType] = useState(initialValues?.serviceType ?? '');
  const [date, setDate] = useState(initialValues?.date ?? '');
  const [time, setTime] = useState(initialValues?.time ?? '');
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [slotTaken, setSlotTaken] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);
  const [successSummary, setSuccessSummary] = useState<string | null>(null);

  const services = servicesData?.services ?? [];

  const resetForm = () => {
    setServiceType(initialValues?.serviceType ?? '');
    setDate(initialValues?.date ?? '');
    setTime(initialValues?.time ?? '');
    setNotes(initialValues?.notes ?? '');
    setSlotTaken(false);
    setErrorMessage(null);
    setBookedAppointment(null);
    setSuccessSummary(null);
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSlotTaken(false);
    setErrorMessage(null);

    const startsAt = toISOWithOffset(date, time);

    createAppointment.mutate(
      { serviceType, startsAt, notes: notes.trim() || undefined },
      {
        onSuccess: (data) => {
          onSuccess?.(data.appointment);
          if (embedded) return;
          const summary = formatBookingSummary(services, serviceType, date, time);
          setBookedAppointment(data.appointment);
          setSuccessSummary(summary);
        },
        onError: (err) => {
          if (err.code === 'SLOT_TAKEN') {
            setSlotTaken(true);
            return;
          }
          setErrorMessage(err.message || 'Something went wrong. Please try again.');
        },
      },
    );
  };

  if (bookedAppointment && successSummary) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4">
          <p className="font-medium text-green-800">Appointment booked!</p>
          <p className="mt-1 text-sm text-green-700">{successSummary}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={resetForm} className="sm:flex-1">
            Book another
          </Button>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:flex-1"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {slotTaken && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          That slot was just taken — please pick another time
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">
          Service
        </label>
        <select
          id="serviceType"
          name="serviceType"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          required
          disabled={servicesLoading || createAppointment.isPending}
          className={selectClassName}
        >
          <option value="" disabled>
            {servicesLoading ? 'Loading services…' : 'Select a service'}
          </option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ({service.durationMinutes} min)
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Date"
        name="date"
        type="date"
        min={todayDateString()}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
        disabled={createAppointment.isPending}
      />

      <div className="space-y-1.5">
        <label htmlFor="time" className="block text-sm font-medium text-gray-700">
          Time
        </label>
        <select
          id="time"
          name="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          disabled={createAppointment.isPending}
          className={selectClassName}
        >
          <option value="" disabled>
            Select a time
          </option>
          {TIME_SLOTS.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={createAppointment.isPending}
          placeholder="Anything we should know before your visit?"
          className="block w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-0"
        />
        <p className="text-right text-xs text-gray-400">{notes.length}/500</p>
      </div>

      <Button type="submit" loading={createAppointment.isPending}>
        Book appointment
      </Button>
    </form>
  );
};

export default BookingForm;
