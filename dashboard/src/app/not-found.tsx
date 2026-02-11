import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h1 className="text-2xl font-bold text-slate-200">Not found</h1>
      <Link href="/" className="text-slate-400 hover:text-white">
        ← Back to dashboard
      </Link>
    </div>
  );
}
