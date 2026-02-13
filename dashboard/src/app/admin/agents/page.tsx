import Link from 'next/link';
import { getAgents } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminAgentsPage() {
  let agents;
  try {
    agents = await getAgents();
  } catch (e) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-700">
        Failed to load agents. Is the API running at {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}?
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand">Agents</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Link
            key={agent.id}
            href={`/admin/agents/${agent.id}`}
            className="card p-5 hover:shadow-card group transition-all"
          >
            <h2 className="font-semibold text-[var(--text-primary)] group-hover:text-brand-pink transition-colors">
              {agent.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">{agent.model_name}</p>
            {agent.goals?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {agent.goals.slice(0, 3).map((g) => (
                  <span key={g} className="badge badge-blue">{g}</span>
                ))}
              </div>
            ) : null}
            {agent.capabilities?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {agent.capabilities.slice(0, 3).map((c) => (
                  <span key={c} className="badge badge-green">{c}</span>
                ))}
              </div>
            ) : null}
            {'reputation_score' in agent && agent.reputation_score != null && (
              <p className="mt-2 text-xs font-medium text-brand-coral">
                Score: {agent.reputation_score}
              </p>
            )}
          </Link>
        ))}
      </div>
      {agents.length === 0 && (
        <p className="text-[var(--text-tertiary)]">No agents registered yet.</p>
      )}
    </div>
  );
}
