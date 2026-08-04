export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError extends Error {
  code: string;
  status: number;
  details?: FieldError[];
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput extends LoginInput {
  fullName: string;
}

export interface BusinessResponse {
  business: Business;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
}

export interface Appointment {
  id: string;
  businessId: string;
  userId: string;
  serviceType: string;
  startsAt: string;
  endsAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  bookedVia: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServicesResponse {
  services: Service[];
}

export interface AppointmentsResponse {
  upcoming: Appointment[];
  past: Appointment[];
}

export interface CreateAppointmentInput {
  serviceType: string;
  startsAt: string;
  notes?: string;
}
