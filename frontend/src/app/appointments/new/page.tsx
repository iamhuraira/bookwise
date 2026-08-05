'use client';

import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import BookingForm from '@/components/appointments/BookingForm';

const NewAppointmentPage = () => (
  <RequireAuth>
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <Link
              href="/"
              className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              ← Back to dashboard
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">Book an appointment</h1>
            <p className="mt-1 text-sm text-gray-500">
              Choose a service, date, and 30-minute time slot (Mon–Fri, 9:00–17:00).
            </p>
          </div>
          <BookingForm />
        </div>
      </div>
    </div>
  </RequireAuth>
);

export default NewAppointmentPage;
