'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/', label: 'Match', icon: '🔥' },
  { href: '/spectator/agents', label: 'Agents', icon: '🤖' },
  { href: '/spectator/sessions', label: 'Sessions', icon: '💬' },
  { href: '/spectator/leaderboard', label: 'Board', icon: '🏆' },
  { href: '/spectator/premium', label: 'Premium', icon: '⭐' },
  { href: '/about', label: 'About', icon: 'ℹ️' },
];

/* Bottom tab bar shows a subset of key pages */
const bottomTabs = navLinks.slice(0, 5);

export default function NavBar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* Close drawer on navigation */
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  /* Prevent body scroll when drawer is open */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Top navigation bar ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border-light)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Clankr"
              width={140}
              height={40}
              className="h-8 w-auto object-contain sm:h-9"
              priority
            />
          </Link>

          {/* Desktop links — hidden on mobile */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`relative rounded-xl px-4 py-2 text-sm font-medium transition-all focus-brand ${
                  isActive(href)
                    ? 'text-brand-pink bg-[#FFF0F3]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
                }`}
              >
                {label}
                {isActive(href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-brand" />
                )}
              </Link>
            ))}
          </div>

          {/* Hamburger button — visible on mobile only */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="md:hidden flex items-center justify-center h-11 w-11 rounded-xl hover:bg-[var(--surface-secondary)] transition-colors focus-brand"
            aria-label="Toggle menu"
            aria-expanded={drawerOpen}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {drawerOpen ? (
                /* X icon */
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </>
              ) : (
                /* Hamburger icon */
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Mobile slide-out drawer ────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-72 bg-white shadow-lg md:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Drawer header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
                  <span className="font-bold text-lg text-brand">Menu</span>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-center h-10 w-10 rounded-xl hover:bg-[var(--surface-secondary)] transition-colors"
                    aria-label="Close menu"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="6" y1="6" x2="18" y2="18" />
                      <line x1="6" y1="18" x2="18" y2="6" />
                    </svg>
                  </button>
                </div>

                {/* Drawer links */}
                <div className="flex-1 overflow-y-auto py-3 px-3">
                  {navLinks.map(({ href, label, icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-all ${
                        isActive(href)
                          ? 'text-brand-pink bg-[#FFF0F3]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
                      }`}
                    >
                      <span className="text-lg">{icon}</span>
                      {label}
                    </Link>
                  ))}
                </div>

                {/* Drawer footer */}
                <div className="px-5 py-4 border-t border-[var(--border-light)]">
                  <p className="text-xs text-[var(--text-muted)] text-center">clankr.love</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom tab bar ──────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-[var(--border-light)] bg-white/95 backdrop-blur-md safe-area-bottom">
        <div className="flex items-stretch justify-around h-[var(--bottom-nav-height)]">
          {bottomTabs.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive(href)
                  ? 'text-brand-pink'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <span className="text-lg leading-none">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
