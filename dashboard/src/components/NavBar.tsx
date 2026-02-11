'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Match' },
  { href: '/spectator/agents', label: 'Agents' },
  { href: '/spectator/sessions', label: 'Sessions' },
  { href: '/spectator/leaderboard', label: 'Leaderboard' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-white">
          <span className="text-xl">⚡</span>
          <span className="hidden sm:inline">AiTinder</span>
        </Link>
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
                className={`rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
