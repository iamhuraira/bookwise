import type { Service } from '@/types';

export const TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
] as const;

export const todayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toISOWithOffset = (date: string, time: string): string => {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const local = new Date(year, month - 1, day, hours, minutes);
  const offsetMinutes = -local.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(abs / 60)).padStart(2, '0');
  const offsetMins = String(abs % 60).padStart(2, '0');
  return `${date}T${time}:00${sign}${offsetHours}:${offsetMins}`;
};

export const formatAppointmentRange = (startsAt: string, endsAt: string): string => {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const datePart = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(start);
  const timeFmt = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${datePart} · ${timeFmt.format(start)} – ${timeFmt.format(end)}`;
};

export const getServiceName = (services: Service[] | undefined, serviceType: string): string =>
  services?.find((s) => s.id === serviceType)?.name ?? serviceType;

export const formatBookingSummary = (
  services: Service[] | undefined,
  serviceType: string,
  date: string,
  time: string,
): string => {
  const name = getServiceName(services, serviceType);
  const [year, month, day] = date.split('-').map(Number);
  const local = new Date(year, month - 1, day);
  const datePart = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(local);
  return `${name} on ${datePart} at ${time}`;
};
