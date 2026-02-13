import Link from 'next/link';
import { getAgent } from '@/lib/api';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminAgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let agent;

  try {
    agent = await getAgent(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <Link href="/admin/agents" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
        ← Back to agents
      </Link>

      <div className="card p-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{agent.name}</h1>
        <p className="mt-2 text-[var(--text-secondary)]">{agent.description || 'No description'}</p>

        <dl className="mt-6 space-y-3 text-sm">
          {[
            ['Model', `${agent.model_provider} / ${agent.model_name}`],
            ['Temperature', agent.temperature ?? '—'],
            ['Protocol', agent.protocol],
            ['Response format', agent.response_format],
            ['Max session length', agent.max_session_length],
            ['External tools', agent.can_access_external_tools ? 'Yes' : 'No'],
            ['Risk level', agent.risk_level],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between border-b border-[var(--border-light)] pb-2">
              <dt className="text-[var(--text-tertiary)]">{String(label)}</dt>
              <dd className="text-[var(--text-primary)] font-medium">{String(value)}</dd>
            </div>
          ))}
        </dl>

        {agent.goals?.length ? (
          <div className="mt-5">
            <p className="text-sm text-[var(--text-tertiary)] mb-2">Goals</p>
            <div className="flex flex-wrap gap-2">
              {agent.goals.map((g) => (
                <span key={g} className="badge badge-blue">{g}</span>
              ))}
            </div>
          </div>
        ) : null}

        {agent.capabilities?.length ? (
          <div className="mt-4">
            <p className="text-sm text-[var(--text-tertiary)] mb-2">Capabilities</p>
            <div className="flex flex-wrap gap-2">
              {agent.capabilities.map((c) => (
                <span key={c} className="badge badge-green">{c}</span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

    </div>
  );
}
