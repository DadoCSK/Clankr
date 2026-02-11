import Link from 'next/link';
import { getAgents } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminAgentsPage() {
  let agents;
  try {
    agents = await getAgents();
  } catch (e) {
    return (
      <div className="rounded-xl bg-red-950/30 border border-red-800 p-6 text-red-200">
        Failed to load agents. Is the API running at {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}?
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Agents</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Link
            key={agent.id}
            href={`/admin/agents/${agent.id}`}
            className="block rounded-xl bg-slate-800/50 p-5 border border-slate-700 hover:border-slate-500 transition-colors"
          >
            <h2 className="font-semibold text-slate-100">{agent.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{agent.model_name}</p>
            {agent.goals?.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {agent.goals.slice(0, 3).map((g) => (
                  <span
                    key={g}
                    className="rounded bg-slate-700/80 px-2 py-0.5 text-xs text-slate-300"
                  >
                    {g}
                  </span>
                ))}
              </div>
            ) : null}
            {agent.capabilities?.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {agent.capabilities.slice(0, 3).map((c) => (
                  <span
                    key={c}
                    className="rounded bg-emerald-900/40 px-2 py-0.5 text-xs text-emerald-300"
                  >
                    {c}
                  </span>
                ))}
              </div>
            ) : null}
            {'reputation_score' in agent && agent.reputation_score != null && (
              <p className="mt-2 text-xs text-amber-400">Score: {agent.reputation_score}</p>
            )}
          </Link>
        ))}
      </div>
      {agents.length === 0 && (
        <p className="text-slate-400">No agents registered yet.</p>
      )}
    </div>
  );
}
