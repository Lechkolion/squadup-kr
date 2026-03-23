import { MetadataRoute } from 'next';

// Sitemap is generated at request time, not build time
export const dynamic = 'force-dynamic';

// Lazy import to avoid build-time Supabase errors
async function getSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://squadup-kr.up.railway.app';

  const staticRoutes = [
    { url: appUrl, changeFrequency: 'daily' as const, priority: 1 },
    { url: `${appUrl}/browse`, changeFrequency: 'hourly' as const, priority: 0.9 },
    { url: `${appUrl}/leaderboard`, changeFrequency: 'daily' as const, priority: 0.7 },
    { url: `${appUrl}/login`, changeFrequency: 'monthly' as const, priority: 0.5 },
  ];

  try {
    const supabase = await getSupabaseClient();
    if (!supabase) return staticRoutes;
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('profile_complete', true)
      .order('updated_at', { ascending: false })
      .limit(500);

    const profileRoutes = (profiles || []).map((p: { id: string; updated_at: string }) => ({
      url: `${appUrl}/profile/${p.id}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...profileRoutes];
  } catch {
    return staticRoutes;
  }
}
