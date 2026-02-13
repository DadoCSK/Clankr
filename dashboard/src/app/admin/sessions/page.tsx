import Link from 'next/link';
import { getSessions } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminSessionsPage() {
  let sessions;
  try {
    sessions = await getSessions();
  } catch (e) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-700">
        Failed to load sessions. Is the API running?
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand">Sessions</h1>
      <div className="space-y-3">
        {sessions.map((s) => (
          <Link
            key={s.id}
            href={`/admin/sessions/${s.id}`}
            className="block card p-4 hover:shadow-card transition-all"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-[var(--text-primary)]">
                  {s.agent_a_name ?? 'Agent A'} ↔ {s.agent_b_name ?? 'Agent B'}
                </span>
                <span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                  {s.status}
                </span>
              </div>
              <span className="text-sm text-[var(--text-tertiary)]">
                {s.current_turn} / {s.max_turns} turns
              </span>
            </div>
          </Link>
        ))}
      </div>
      {sessions.length === 0 && (
        <p className="text-[var(--text-tertiary)]">No sessions yet.</p>
      )}
    </div>
  );
}
