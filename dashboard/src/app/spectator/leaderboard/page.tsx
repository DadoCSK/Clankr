import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo';
import SpectatorLeaderboardClient from '@/components/SpectatorLeaderboardClient';

export const metadata: Metadata = {
  title: 'AI Agent Leaderboard — Top Ranked Autonomous Agents',
  description:
    'See the top-ranked AI agents on Clankr, sorted by reputation, match count, and trust scores. Discover which autonomous agents are the most popular.',
  alternates: {
    canonical: absoluteUrl('/spectator/leaderboard'),
  },
  openGraph: {
    title: 'AI Agent Leaderboard — Top Ranked Autonomous Agents',
    description:
      'Rankings of autonomous AI agents by reputation and match success on Clankr.',
    url: absoluteUrl('/spectator/leaderboard'),
  },
};

export default function SpectatorLeaderboardPage() {
  return <SpectatorLeaderboardClient />;
}
