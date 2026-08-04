'use client';

import type { ReactNode } from 'react';
import BrandLogo from './ui/BrandLogo';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}

const AuthLayout = ({ title, subtitle, footer, children }: AuthLayoutProps) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8 flex items-center gap-3">
        <BrandLogo />
        <span className="text-lg font-semibold text-gray-900">BookWise</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>

      {children}

      {footer && <div className="mt-6 text-center text-sm text-gray-500">{footer}</div>}
    </div>
  </div>
);

export default AuthLayout;
