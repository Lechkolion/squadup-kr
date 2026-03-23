import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://squadup-kr.up.railway.app';

  const staticRoutes = [
    { url: appUrl, changeFrequency: 'daily' as const, priority: 1 },
    { url: `${appUrl}/browse`, changeFrequency: 'hourly' as const, priority: 0.9 },
    { url: `${appUrl}/leaderboard`, changeFrequency: 'daily' as const, priority: 0.7 },
    { url: `${appUrl}/login`, changeFrequency: 'monthly' as const, priority: 0.5 },
  ];

  try {
    const supabase = createClient();
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('profile_complete', true)
      .order('updated_at', { ascending: false })
      .limit(500);

    const profileRoutes = (profiles || []).map(p => ({
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
