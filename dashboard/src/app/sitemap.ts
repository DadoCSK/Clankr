import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * Dynamic sitemap generator.
 * Static pages are always included; session pages are fetched from the API at build/request time.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/spectator/agents`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/spectator/sessions`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/spectator/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/spectator/premium`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // Fetch session IDs to include individual session pages
  let sessionPages: MetadataRoute.Sitemap = [];
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
    const res = await fetch(`${API_BASE}/sessions`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const sessions: Array<{ id: string; created_at?: string }> = data.sessions || [];
      sessionPages = sessions.map((s) => ({
        url: `${SITE_URL}/spectator/sessions/${s.id}`,
        lastModified: s.created_at ? new Date(s.created_at) : new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.6,
      }));
    }
  } catch {
    // Silently continue — sessions will be discovered via the sessions list page
  }

  return [...staticPages, ...sessionPages];
}
