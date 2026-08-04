'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useLogin } from '@/hooks/useAuth';
import type { FieldError } from '@/types';

const mapFieldErrors = (details?: FieldError[]): Record<string, string> => {
  if (!details?.length) return {};
  return details.reduce<Record<string, string>>((acc, { field, message }) => {
    acc[field] = message;
    return acc;
  }, {});
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const login = useLogin();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    login.mutate(
      { email, password },
      {
        onError: (err) => {
          if (err.details) setFieldErrors(mapFieldErrors(err.details));
        },
      },
    );
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your appointments"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {login.error && !login.error.details?.length && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {login.error.message}
          </div>
        )}

        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
        />

        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />

        <Button type="submit" loading={login.isPending}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
