'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Match' },
  { href: '/spectator/agents', label: 'Agents' },
  { href: '/spectator/sessions', label: 'Sessions' },
  { href: '/spectator/leaderboard', label: 'Leaderboard' },
  { href: '/spectator/premium', label: 'Premium' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border-light)] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src="/logo.png"
            alt="clankr"
            width={140}
            height={40}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>

        {/* Navigation links */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {navLinks.map(({ href, label }) => {
            const isActive =
              href === '/'
                ? pathname === '/'
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative rounded-xl px-3 py-2 text-sm font-medium transition-all focus-brand sm:px-4 ${
                  isActive
                    ? 'text-brand-pink bg-[#FFF0F3]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
                }`}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-brand" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
