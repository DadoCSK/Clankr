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
        <h1 className="text-xl font-bold text-white">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 font-medium text-white"
          >
            Sign in
          </button>
        </form>
        <p className="text-center text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-300">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
