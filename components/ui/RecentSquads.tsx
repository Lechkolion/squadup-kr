import { createClient } from '@/lib/supabase/server';
import { GAMES } from '@/lib/games';

export async function RecentSquads() {
  const supabase = createClient();

  const { data: connections } = await supabase
    .from('connections')
    .select(`
      id,
      created_at,
      profile_a:profile_a_id(username, games),
      profile_b:profile_b_id(username, games)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!connections || connections.length === 0) {
    return (
      <p className="text-center text-[var(--text-muted)] font-mono text-sm">
        Be the first to form a squad! 🎮
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {connections.map((conn: any) => {
        const sharedGames = (conn.profile_a?.games || []).filter((g: string) =>
          (conn.profile_b?.games || []).includes(g)
        ).slice(0, 3);

        return (
          <div
            key={conn.id}
            className="card p-4 flex items-center gap-3"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          >
            <span className="text-2xl">🎮</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono text-[var(--text)]">
                <span className="text-[var(--cyan)]">{conn.profile_a?.username}</span>
                {' '}<span className="text-[var(--text-muted)]">+</span>{' '}
                <span className="text-[var(--cyan)]">{conn.profile_b?.username}</span>
                {' '}just formed a squad
              </p>
              {sharedGames.length > 0 && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  for {sharedGames.map((g: string) => {
                    const game = GAMES[g as keyof typeof GAMES];
                    return game ? `${game.emoji} ${game.name}` : g;
                  }).join(', ')}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
