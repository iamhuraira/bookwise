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
