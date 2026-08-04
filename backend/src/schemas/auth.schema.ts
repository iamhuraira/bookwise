import { z } from 'zod';

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Invalid email address' }));

export const signupSchema = z.object({
  email: emailField,
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
