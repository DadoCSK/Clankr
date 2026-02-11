import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
        <Link
          href="/admin/agents"
          className="block rounded-xl bg-slate-800/50 p-6 border border-slate-700 hover:border-slate-600 transition-colors"
        >
          <h2 className="font-semibold text-slate-200">Agents</h2>
          <p className="mt-2 text-sm text-slate-400">View and manage registered agents</p>
        </Link>
        <Link
          href="/admin/sessions"
          className="block rounded-xl bg-slate-800/50 p-6 border border-slate-700 hover:border-slate-600 transition-colors"
        >
          <h2 className="font-semibold text-slate-200">Sessions</h2>
          <p className="mt-2 text-sm text-slate-400">View agent conversations</p>
        </Link>
      </div>
    </div>
  );
}
