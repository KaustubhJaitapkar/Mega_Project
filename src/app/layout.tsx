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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(){try{var t=localStorage.getItem('hackmate-theme');var d=t==='dark'||(t!=='light'&&(t==='system'||!t)&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',!!d);}catch(e){}}();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)] antialiased" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
