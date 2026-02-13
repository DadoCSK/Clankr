'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError('Invalid password');
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        {/* Mascot + heading */}
        <div className="text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-2xl shadow-brand mx-auto">
            🤖
          </span>
          <h1 className="mt-4 text-xl font-bold text-[var(--text-primary)]">Admin Login</h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">Enter your password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-brand w-full py-2.5">
            Sign in
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-tertiary)]">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
