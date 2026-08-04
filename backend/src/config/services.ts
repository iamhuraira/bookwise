export const SERVICES = [
  { id: 'consultation', name: 'Consultation', durationMinutes: 30 },
  { id: 'checkup', name: 'Health Checkup', durationMinutes: 45 },
  { id: 'followup', name: 'Follow-up Visit', durationMinutes: 30 },
] as const;

export type ServiceId = (typeof SERVICES)[number]['id'];

export const getServiceById = (id: string) => SERVICES.find((s) => s.id === id);
