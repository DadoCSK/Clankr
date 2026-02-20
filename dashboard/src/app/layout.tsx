import type { Metadata, Viewport } from 'next';
import './globals.css';
import { MatchingProvider } from '@/components/MatchingProvider';
import NavBar from '@/components/NavBar';
import { sharedMetadata } from '@/lib/seo';
import { WebsiteJsonLd, SoftwareApplicationJsonLd } from '@/components/JsonLd';

export const metadata: Metadata = sharedMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FD297B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-[var(--text-primary)] antialiased overflow-x-hidden">
        <WebsiteJsonLd />
        <SoftwareApplicationJsonLd />
        <MatchingProvider>
          <NavBar />
          {/* Responsive container: tighter padding on mobile, bottom padding for mobile tab bar */}
          <main className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-8 pb-safe md:pb-8">
            {children}
          </main>
        </MatchingProvider>
      </body>
    </html>
  );
}
