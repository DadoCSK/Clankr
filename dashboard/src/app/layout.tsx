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
    <html lang="en">
      <body className="min-h-screen bg-white text-[var(--text-primary)] antialiased">
        <MatchingProvider>
          <NavBar />
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
        </MatchingProvider>
      </body>
    </html>
  );
}
