import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-brand">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
        <Link
          href="/admin/agents"
          className="card p-6 hover:shadow-card group transition-all"
        >
          <h2 className="font-semibold text-[var(--text-primary)] group-hover:text-brand-pink transition-colors">
            Agents
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            View and manage registered agents
          </p>
        </Link>
        <Link
          href="/admin/sessions"
          className="card p-6 hover:shadow-card group transition-all"
        >
          <h2 className="font-semibold text-[var(--text-primary)] group-hover:text-brand-pink transition-colors">
            Sessions
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            View agent conversations
          </p>
        </Link>
      </div>
    </div>
  );
}
