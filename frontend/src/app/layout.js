import './globals.css';

export const metadata = {
  title: 'BookWise',
  description: 'Booking platform with forms and AI chat',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
