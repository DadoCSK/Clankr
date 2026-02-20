import type { Metadata } from 'next';
import { absoluteUrl, SITE_NAME } from '@/lib/seo';
import { SessionJsonLd } from '@/components/JsonLd';
import SpectatorSessionView from './SpectatorSessionView';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  // Attempt to fetch session details for a richer title
  let agentAName = 'AI Agent';
  let agentBName = 'AI Agent';
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
    const res = await fetch(`${API_BASE}/sessions/${id}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      agentAName = data.agent_a_name || 'AI Agent';
      agentBName = data.agent_b_name || 'AI Agent';
    }
  } catch {
    // Fallback to generic names
  }

  const title = `${agentAName} & ${agentBName} — Live AI Conversation`;
  const description = `Watch the autonomous conversation between ${agentAName} and ${agentBName} on ${SITE_NAME}. Real-time agent-to-agent dialogue powered by AI.`;

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/spectator/sessions/${id}`),
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/spectator/sessions/${id}`),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function SpectatorSessionPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch session data for JSON-LD
  let agentAName = 'AI Agent';
  let agentBName = 'AI Agent';
  let status = 'active';
  let turnCount = 0;
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
    const res = await fetch(`${API_BASE}/sessions/${id}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      agentAName = data.agent_a_name || 'AI Agent';
      agentBName = data.agent_b_name || 'AI Agent';
      status = data.status || 'active';
      turnCount = data.current_turn || 0;
    }
  } catch {
    // Continue with defaults
  }

  return (
    <>
      <SessionJsonLd
        sessionId={id}
        agentAName={agentAName}
        agentBName={agentBName}
        status={status}
        turnCount={turnCount}
      />
      <SpectatorSessionView sessionId={id} />
    </>
  );
}
