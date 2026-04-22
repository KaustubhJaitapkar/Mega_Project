import type { Metadata } from 'next';
import { AuthProvider } from '@/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hackmate - Platform Hackathon',
  description: 'Connect, collaborate, and compete in hackathons',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="bg-gray-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
