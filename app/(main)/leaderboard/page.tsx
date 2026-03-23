import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Avatar } from '@/components/ui/Avatar';
import LeaderboardClient from './LeaderboardClient';

export const revalidate = 300; // revalidate every 5 minutes

interface ProfileRow {
  id: string;
  discord_id: string;
  username: string;
  avatar_url: string | null;
}

interface LeaderboardEntry extends ProfileRow {
  score: number;
}

async function fetchLeaderboards() {
  const supabase = createClient();

  // Fetch profiles ordered by a proxy (we compute connections from the connections table)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, discord_id, username, avatar_url')
    .eq('profile_complete', true)
    .limit(50);

  // Fetch all connections to compute counts client-side if RPC not available
  const { data: connections } = await supabase
    .from('connections')
    .select('profile_a_id, profile_b_id');

  const connectionCountMap = new Map<string, number>();
  (connections ?? []).forEach((c: { profile_a_id: string; profile_b_id: string }) => {
    connectionCountMap.set(c.profile_a_id, (connectionCountMap.get(c.profile_a_id) ?? 0) + 1);
    connectionCountMap.set(c.profile_b_id, (connectionCountMap.get(c.profile_b_id) ?? 0) + 1);
  });

  // Most Active: based on last_seen recency within last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: activeProfiles } = await supabase
    .from('profiles')
    .select('id, discord_id, username, avatar_url, last_seen')
    .eq('profile_complete', true)
    .gte('last_seen', thirtyDaysAgo)
    .order('last_seen', { ascending: false })
    .limit(20);

  // Most Helpful: based on number of accepted outgoing squad requests
  const { data: acceptedRequests } = await supabase
    .from('squad_requests')
    .select('from_profile_id')
    .eq('status', 'accepted');

  const helpfulCountMap = new Map<string, number>();
  (acceptedRequests ?? []).forEach((r: { from_profile_id: string }) => {
    helpfulCountMap.set(r.from_profile_id, (helpfulCountMap.get(r.from_profile_id) ?? 0) + 1);
  });

  const allProfiles: ProfileRow[] = (profiles ?? []) as ProfileRow[];

  // Build leaderboard arrays
  const mostConnections: LeaderboardEntry[] = allProfiles
    .map((p: ProfileRow) => ({ ...p, score: connectionCountMap.get(p.id) ?? 0 }))
    .filter((p: LeaderboardEntry) => p.score > 0)
    .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score)
    .slice(0, 20);

  const mostActive: LeaderboardEntry[] = ((activeProfiles ?? []) as ProfileRow[]).map((p: ProfileRow, i: number) => ({
    ...p,
    score: 20 - i,
  }));

  const mostHelpful: LeaderboardEntry[] = allProfiles
    .map((p: ProfileRow) => ({ ...p, score: helpfulCountMap.get(p.id) ?? 0 }))
    .filter((p: LeaderboardEntry) => p.score > 0)
    .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score)
    .slice(0, 20);

  return { mostConnections, mostActive, mostHelpful };
}

export default async function LeaderboardPage() {
  const data = await fetchLeaderboards();

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="font-orbitron text-2xl font-bold" style={{ color: 'var(--cyan)' }}>
          Leaderboard
        </h1>
        <p className="text-sm font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
          SquadUp KR 탑 게이머
        </p>
      </div>

      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardClient {...data} />
      </Suspense>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="card p-3 flex gap-4 items-center">
          <div className="skeleton w-8 h-5 rounded" />
          <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-3 w-28 rounded" />
          </div>
          <div className="skeleton h-3 w-12 rounded" />
        </div>
      ))}
    </div>
  );
}
