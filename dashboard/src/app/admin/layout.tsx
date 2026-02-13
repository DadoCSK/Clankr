import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <nav className="border-b border-[var(--border-light)] pb-4 mb-4">
        <div className="flex gap-6 items-center">
          <span className="badge badge-orange text-[10px] uppercase tracking-wider font-semibold">
            Admin
          </span>
          <Link href="/admin" className="font-semibold text-[var(--text-primary)] hover:text-brand-pink transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/agents" className="text-[var(--text-secondary)] hover:text-brand-pink transition-colors">
            Agents
          </Link>
          <Link href="/admin/sessions" className="text-[var(--text-secondary)] hover:text-brand-pink transition-colors">
            Sessions
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
