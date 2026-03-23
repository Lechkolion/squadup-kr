import { createClient } from '@supabase/supabase-js';

let supabase: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

export async function getProfileByDiscordId(discordId: string) {
  const sb = getSupabase();
  const { data } = await sb
    .from('profiles')
    .select('*, game_ranks(*)')
    .eq('discord_id', discordId)
    .single();
  return data;
}

export async function getOnlinePlayers(gameKey?: string) {
  const sb = getSupabase();
  const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

  let query = sb
    .from('profiles')
    .select('id, username, discord_id, avatar_url, games, bio, active_hours_start, active_hours_end')
    .eq('is_online', true);

  if (gameKey) {
    query = query.contains('games', [gameKey]);
  }

  const { data } = await query.limit(20);
  return data || [];
}

export async function getLeaderboard(type: 'connections' | 'active' | 'helpful' = 'connections') {
  const sb = getSupabase();

  if (type === 'connections') {
    const { data } = await sb
      .from('profiles')
      .select('id, username')
      .limit(10);

    // Count connections per profile
    const results = await Promise.all((data || []).map(async (p) => {
      const { count } = await sb
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .or(`profile_a_id.eq.${p.id},profile_b_id.eq.${p.id}`);
      return { username: p.username, score: count || 0 };
    }));
    return results.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  if (type === 'active') {
    const { data } = await sb
      .from('profiles')
      .select('username, last_seen')
      .order('last_seen', { ascending: false })
      .limit(10);
    return (data || []).map(p => ({ username: p.username, score: 0 }));
  }

  if (type === 'helpful') {
    const { data } = await sb
      .from('squad_requests')
      .select('to_profile:to_profile_id(username)')
      .eq('status', 'accepted')
      .limit(100);
    const counts: Record<string, number> = {};
    (data || []).forEach((r: any) => {
      const name = r.to_profile?.username;
      if (name) counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([username, score]) => ({ username, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  return [];
}

export async function setPresence(discordId: string, currentGame?: string) {
  const sb = getSupabase();
  const { data: profile } = await sb
    .from('profiles')
    .select('id')
    .eq('discord_id', discordId)
    .single();
  if (!profile) return;

  await sb.from('presence').upsert({
    profile_id: profile.id,
    last_heartbeat: new Date().toISOString(),
    current_game: currentGame || null,
  });
  await sb.from('profiles').update({ is_online: true, last_seen: new Date().toISOString() })
    .eq('id', profile.id);
}

export async function assignGameRoles(
  guildId: string,
  discordId: string,
  games: string[],
  client: any
) {
  const GAME_ROLES: Record<string, string> = {
    lol: 'LoL-Player',
    valorant: 'Valorant-Player',
    pubg: 'PUBG-Player',
    overwatch2: 'OW2-Player',
    starcraft2: 'SC2-Player',
    lostark: 'LostArk-Player',
    fifaonline4: 'FIFA-Player',
    slaythespire2: 'StS2-Community',
  };

  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(discordId);

    for (const gameKey of games) {
      const roleName = GAME_ROLES[gameKey];
      if (!roleName) continue;
      const role = guild.roles.cache.find((r: any) => r.name === roleName);
      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
      }
    }
  } catch (err) {
    console.error('Role assignment error:', err);
  }
}
