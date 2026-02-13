import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <span className="text-5xl">🤖</span>
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Not found</h1>
      <p className="text-[var(--text-tertiary)]">The page you&#39;re looking for doesn&#39;t exist.</p>
      <Link
        href="/"
        className="btn-brand px-5 py-2 text-sm mt-2"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
