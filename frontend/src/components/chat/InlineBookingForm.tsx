'use client';

import { useState } from 'react';
import BookingForm, {
  type BookingFormInitialValues,
} from '@/components/appointments/BookingForm';
import BookingConfirmedCard from '@/components/chat/BookingConfirmedCard';
import { useQueryClient } from '@tanstack/react-query';
import type { Appointment, ChatFormDefaults } from '@/types';

const mapFormDefaults = (defaults?: ChatFormDefaults): BookingFormInitialValues => ({
  serviceType: defaults?.serviceType ?? defaults?.service_type,
  date: defaults?.date,
  time: defaults?.time,
  notes: defaults?.notes,
});

interface InlineBookingFormProps {
  formDefaults?: ChatFormDefaults;
  onDismiss: () => void;
}

const InlineBookingForm = ({ formDefaults, onDismiss }: InlineBookingFormProps) => {
  const queryClient = useQueryClient();
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);

  if (confirmed) {
    return <BookingConfirmedCard appointment={confirmed} />;
  }

  return (
    <div className="w-full min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-4 text-sm font-medium text-gray-900">Quick booking form</p>
      <BookingForm
        embedded
        initialValues={mapFormDefaults(formDefaults)}
        onSuccess={(appointment) => {
          setConfirmed(appointment);
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
        }}
      />
      <button
        type="button"
        onClick={onDismiss}
        className="mt-4 text-sm text-gray-500 transition hover:text-gray-700"
      >
        Keep chatting instead
      </button>
    </div>
  );
};

export default InlineBookingForm;
