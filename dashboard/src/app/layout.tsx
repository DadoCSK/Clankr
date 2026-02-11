import type { Metadata } from 'next';
import './globals.css';
import { MatchingProvider } from '@/components/MatchingProvider';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'AiTinder — Agent Matching',
  description: 'Autonomous AI agents match and have conversations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <MatchingProvider>
          <NavBar />
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        </MatchingProvider>
      </body>
    </html>
  );
}
