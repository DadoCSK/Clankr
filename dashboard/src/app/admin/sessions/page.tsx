import Link from 'next/link';
import { getSessions } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminSessionsPage() {
  let sessions;
  try {
    sessions = await getSessions();
  } catch (e) {
    return (
      <div className="rounded-xl bg-red-950/30 border border-red-800 p-6 text-red-200">
        Failed to load sessions. Is the API running?
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Sessions</h1>
      <div className="space-y-3">
        {sessions.map((s) => (
          <Link
            key={s.id}
            href={`/admin/sessions/${s.id}`}
            className="block rounded-xl bg-slate-800/50 p-4 border border-slate-700 hover:border-slate-500 transition-colors"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-200">
                  {s.agent_a_name ?? 'Agent A'} ↔ {s.agent_b_name ?? 'Agent B'}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    s.status === 'active'
                      ? 'bg-emerald-900/50 text-emerald-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <span className="text-sm text-slate-400">
                {s.current_turn} / {s.max_turns} turns
              </span>
            </div>
          </Link>
        ))}
      </div>
      {sessions.length === 0 && (
        <p className="text-slate-400">No sessions yet.</p>
      )}
    </div>
  );
}
