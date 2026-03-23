import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Globe, Users, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { GAMES, PLAY_STYLES, type GameKey } from '@/lib/games';
import { formatTimeAgo, formatActiveHours } from '@/lib/utils';

interface GameRankRow {
  game_key: string;
  rank_label: string | null;
  hours_played: number | null;
}

interface ProfileRow {
  id: string;
  discord_id: string;
  username: string;
  discriminator: string | null;
  avatar_url: string | null;
  bio: string | null;
  games: string[];
  play_styles: string[];
  languages: string[];
  active_hours_start: number;
  active_hours_end: number;
  is_online: boolean;
  show_online_status: boolean;
  region: string | null;
  created_at: string;
  game_ranks: GameRankRow[];
}

const LANGUAGE_FLAGS: Record<string, string> = {
  ko: '🇰🇷 Korean',
  en: '🇺🇸 English',
  both: '🌐 KO/EN',
};

const REGION_LABELS: Record<string, string> = {
  Korea: '🇰🇷 Korea',
  Asia: '🌏 Asia',
  Global: '🌎 Global',
};

function ActiveHoursBar({ start, end }: { start: number; end: number }) {
  // Calculate left % and width % on a 24-hr bar
  const totalHours = 24;
  let duration = end - start;
  if (duration <= 0) duration += 24;

  const leftPct = (start / totalHours) * 100;
  const widthPct = (duration / totalHours) * 100;

  return (
    <div>
      <div className="flex justify-between text-xs font-mono mb-1.5" style={{ color: 'var(--text-muted)' }}>
        <span>0시</span>
        <span>6시</span>
        <span>12시</span>
        <span>18시</span>
        <span>24시</span>
      </div>
      <div className="hours-bar">
        <div
          className="hours-bar-fill"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
      </div>
      <p className="text-xs font-mono mt-1.5" style={{ color: 'var(--text-muted)' }}>
        <Clock size={10} className="inline mr-1" />
        {formatActiveHours(start, end)}
      </p>
    </div>
  );
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      id,
      discord_id,
      username,
      discriminator,
      avatar_url,
      bio,
      games,
      play_styles,
      languages,
      active_hours_start,
      active_hours_end,
      is_online,
      show_online_status,
      region,
      created_at,
      game_ranks (
        game_key,
        rank_label,
        hours_played
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !profile) {
    notFound();
  }

  const typedProfile = profile as unknown as ProfileRow;

  // Count connections
  const { count: connectionCount } = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .or(`profile_a_id.eq.${typedProfile.id},profile_b_id.eq.${typedProfile.id}`);

  // Extract avatar hash from URL if stored as full URL
  const avatarHash = typedProfile.avatar_url
    ? typedProfile.avatar_url.replace(/.*avatars\/[^/]+\//, '').replace(/\..*$/, '')
    : null;

  const gameRankMap = new Map<string, GameRankRow>(
    typedProfile.game_ranks.map((r) => [r.game_key, r])
  );

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      {/* Header card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <Avatar
            discordId={typedProfile.discord_id}
            avatarHash={avatarHash}
            username={typedProfile.username}
            size={80}
            isOnline={typedProfile.show_online_status ? typedProfile.is_online : false}
            showStatus={typedProfile.show_online_status}
          />

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1
                className="font-orbitron text-2xl font-bold neon-text truncate"
                style={{ color: 'var(--cyan)' }}
              >
                {typedProfile.username}
              </h1>
              {typedProfile.show_online_status && typedProfile.is_online && (
                <span className="online-dot" title="Online now" />
              )}
            </div>

            {typedProfile.discriminator && typedProfile.discriminator !== '0' && (
              <p className="text-xs font-mono mb-2" style={{ color: 'var(--text-muted)' }}>
                #{typedProfile.discriminator}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {typedProfile.region && (
                <Badge>
                  {REGION_LABELS[typedProfile.region] ?? typedProfile.region}
                </Badge>
              )}
              {typedProfile.languages.map((lang) => (
                <Badge key={lang}>
                  {LANGUAGE_FLAGS[lang] ?? lang}
                </Badge>
              ))}
            </div>

            {typedProfile.bio && (
              <p
                className="text-sm font-mono leading-relaxed"
                style={{ color: 'var(--text-dim)', maxWidth: 480 }}
              >
                {typedProfile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div
          className="flex flex-wrap gap-5 mt-5 pt-5 text-xs font-mono"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <span className="flex items-center gap-1.5">
            <Calendar size={12} />
            Member since {formatTimeAgo(typedProfile.created_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={12} />
            {connectionCount ?? 0} connections
          </span>
          {typedProfile.region && (
            <span className="flex items-center gap-1.5">
              <Globe size={12} />
              {typedProfile.region}
            </span>
          )}
        </div>
      </div>

      {/* Games section */}
      {typedProfile.games.length > 0 && (
        <div className="card p-6">
          <h2 className="font-orbitron text-sm font-bold mb-4 tracking-wider" style={{ color: 'var(--text-dim)' }}>
            GAMES
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {typedProfile.games.map((gameKey) => {
              const game = GAMES[gameKey as GameKey];
              if (!game) return null;
              const rankData = gameRankMap.get(gameKey);
              return (
                <div
                  key={gameKey}
                  className="flex items-start gap-3 rounded-lg p-3"
                  style={{
                    background: 'var(--surface-2)',
                    border: `1px solid ${game.color}30`,
                  }}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{game.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-orbitron text-xs font-bold truncate"
                      style={{ color: game.color }}
                    >
                      {game.nameKo}
                    </p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {game.name}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {rankData?.rank_label && (
                        <span
                          className="tag text-[10px]"
                          style={{
                            color: game.color,
                            borderColor: `${game.color}40`,
                            background: `${game.color}15`,
                          }}
                        >
                          {rankData.rank_label}
                        </span>
                      )}
                      {'itemLevelBrackets' in game && rankData?.rank_label && (
                        <span
                          className="tag text-[10px]"
                          style={{
                            color: game.color,
                            borderColor: `${game.color}40`,
                            background: `${game.color}15`,
                          }}
                        >
                          {rankData.rank_label}
                        </span>
                      )}
                      {rankData?.hours_played != null && (
                        <span className="tag text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {rankData.hours_played}h
                        </span>
                      )}
                      {game.communityOnly && (
                        <span className="tag text-[10px]" style={{ color: 'var(--purple)' }}>
                          Community
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active hours */}
      <div className="card p-6">
        <h2 className="font-orbitron text-sm font-bold mb-4 tracking-wider" style={{ color: 'var(--text-dim)' }}>
          ACTIVE HOURS
        </h2>
        <ActiveHoursBar
          start={typedProfile.active_hours_start}
          end={typedProfile.active_hours_end}
        />
      </div>

      {/* Play styles */}
      {typedProfile.play_styles.length > 0 && (
        <div className="card p-6">
          <h2 className="font-orbitron text-sm font-bold mb-4 tracking-wider" style={{ color: 'var(--text-dim)' }}>
            PLAY STYLE
          </h2>
          <div className="flex flex-wrap gap-2">
            {typedProfile.play_styles.map((styleKey) => {
              const style = PLAY_STYLES.find((s) => s.key === styleKey);
              if (!style) return null;
              return (
                <Badge key={styleKey} color="var(--cyan)">
                  {style.emoji} {style.labelKo}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-center pt-2">
        <Link href="/browse" className="btn btn-primary gap-2">
          <Users size={14} />
          Squad Request 보내기
        </Link>
      </div>
    </div>
  );
}
