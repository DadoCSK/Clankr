import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <nav className="border-b border-slate-800 pb-4 mb-4">
        <div className="flex gap-6 items-center">
          <span className="text-xs font-medium text-amber-500/80 uppercase tracking-wider">
            Admin
          </span>
          <Link href="/admin" className="font-semibold text-slate-200 hover:text-white">
            Dashboard
          </Link>
          <Link href="/admin/agents" className="text-slate-400 hover:text-white">
            Agents
          </Link>
          <Link href="/admin/sessions" className="text-slate-400 hover:text-white">
            Sessions
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
