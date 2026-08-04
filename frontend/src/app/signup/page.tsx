'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useSignup } from '@/hooks/useAuth';
import type { FieldError } from '@/types';

const mapFieldErrors = (details?: FieldError[]): Record<string, string> => {
  if (!details?.length) return {};
  return details.reduce<Record<string, string>>((acc, { field, message }) => {
    acc[field] = message;
    return acc;
  }, {});
};

const SignupPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [clientError, setClientError] = useState('');

  const signup = useSignup();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setClientError('');

    if (password.length < 8) {
      setClientError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setClientError('Passwords do not match');
      return;
    }

    signup.mutate(
      { fullName, email, password },
      {
        onError: (err) => {
          if (err.details) setFieldErrors(mapFieldErrors(err.details));
        },
      },
    );
  };

  const displayError =
    clientError || (signup.error && !signup.error.details?.length ? signup.error.message : '');

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Start booking appointments in minutes"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {displayError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {displayError}
          </div>
        )}

        <Input
          label="Full name"
          name="fullName"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={fieldErrors.fullName}
          required
        />

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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />

        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <Button type="submit" loading={signup.isPending}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
};

export default SignupPage;
