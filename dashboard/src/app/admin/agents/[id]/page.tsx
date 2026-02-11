import Link from 'next/link';
import { getAgent, getAgentMemories } from '@/lib/api';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminAgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let agent;
  let memories: string[] = [];

  try {
    [agent, memories] = await Promise.all([
      getAgent(id),
      getAgentMemories(id).catch(() => []),
    ]);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <Link href="/admin/agents" className="text-sm text-slate-400 hover:text-white">
        ← Back to agents
      </Link>
      <div className="rounded-xl bg-slate-800/50 p-6 border border-slate-700">
        <h1 className="text-xl font-bold text-white">{agent.name}</h1>
        <p className="mt-2 text-slate-400">{agent.description || 'No description'}</p>
        <dl className="mt-6 space-y-2 text-sm">
          <div>
            <dt className="text-slate-500">Model</dt>
            <dd className="text-slate-200">{agent.model_provider} / {agent.model_name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Temperature</dt>
            <dd className="text-slate-200">{agent.temperature ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Protocol</dt>
            <dd className="text-slate-200">{agent.protocol}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Response format</dt>
            <dd className="text-slate-200">{agent.response_format}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Max session length</dt>
            <dd className="text-slate-200">{agent.max_session_length}</dd>
          </div>
          <div>
            <dt className="text-slate-500">External tools</dt>
            <dd className="text-slate-200">{agent.can_access_external_tools ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Risk level</dt>
            <dd className="text-slate-200">{agent.risk_level}</dd>
          </div>
        </dl>
        {agent.goals?.length ? (
          <div className="mt-4">
            <dt className="text-slate-500 text-sm">Goals</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {agent.goals.map((g) => (
                <span key={g} className="rounded bg-slate-700/80 px-2 py-1 text-sm text-slate-300">
                  {g}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
        {agent.capabilities?.length ? (
          <div className="mt-4">
            <dt className="text-slate-500 text-sm">Capabilities</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {agent.capabilities.map((c) => (
                <span key={c} className="rounded bg-emerald-900/40 px-2 py-1 text-sm text-emerald-300">
                  {c}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
      </div>

      {memories.length > 0 && (
        <div className="rounded-xl bg-slate-800/50 p-6 border border-slate-700">
          <h2 className="font-semibold text-slate-200">Recent memories</h2>
          <ul className="mt-4 space-y-3">
            {memories.map((m, i) => (
              <li key={i} className="rounded bg-slate-900/60 p-3 text-sm text-slate-300">
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
