import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'BookWise',
  description: 'Booking platform with forms and AI chat',
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <body>
      <QueryProvider>{children}</QueryProvider>
    </body>
  </html>
);

export default RootLayout;
