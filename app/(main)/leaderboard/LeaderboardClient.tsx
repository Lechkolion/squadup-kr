'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Heart } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface LeaderboardEntry {
  id: string;
  discord_id: string;
  username: string;
  avatar_url: string | null;
  score: number;
}

type TabKey = 'connections' | 'active' | 'helpful';

interface Props {
  mostConnections: LeaderboardEntry[];
  mostActive: LeaderboardEntry[];
  mostHelpful: LeaderboardEntry[];
}

const TABS: Array<{ key: TabKey; label: string; labelKo: string; icon: React.ComponentType<{ size?: number }> }> = [
  { key: 'connections', label: 'Most Connected', labelKo: '최다 연결', icon: Trophy },
  { key: 'active', label: 'Most Active', labelKo: '최다 활동', icon: Flame },
  { key: 'helpful', label: 'Most Helpful', labelKo: '최다 도움', icon: Heart },
];

const SCORE_LABELS: Record<TabKey, string> = {
  connections: 'connections',
  active: 'activity',
  helpful: 'helped',
};

const RANK_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

export default function LeaderboardClient({ mostConnections, mostActive, mostHelpful }: Props) {
  const [tab, setTab] = useState<TabKey>('connections');

  const entries: LeaderboardEntry[] =
    tab === 'connections' ? mostConnections
    : tab === 'active' ? mostActive
    : mostHelpful;

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-lg"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[10px] font-orbitron font-bold tracking-wider transition-all duration-200"
            style={
              tab === key
                ? { background: 'var(--surface-3)', color: 'var(--cyan)', boxShadow: '0 0 10px rgba(0,245,255,0.15)' }
                : { color: 'var(--text-muted)' }
            }
          >
            <Icon size={12} />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Entries */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {entries.length === 0 ? (
            <div className="card p-10 text-center">
              <Trophy size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-orbitron text-sm" style={{ color: 'var(--text-muted)' }}>
                아직 데이터가 없습니다
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => {
                const rank = index + 1;
                const rankColor = RANK_COLORS[rank] ?? 'var(--text-muted)';
                const avatarHash = entry.avatar_url
                  ? entry.avatar_url.replace(/.*avatars\/[^/]+\//, '').replace(/\..*$/, '')
                  : null;

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
                  >
                    <Link
                      href={`/profile/${entry.id}`}
                      className="card flex items-center gap-4 px-4 py-3 hover:no-underline group"
                      style={
                        rank <= 3
                          ? { borderColor: `${rankColor}40`, background: `${rankColor}06` }
                          : {}
                      }
                    >
                      {/* Rank number */}
                      <div className="w-8 flex-shrink-0 text-center">
                        {rank <= 3 ? (
                          <span
                            className="font-orbitron text-base font-black"
                            style={{
                              color: rankColor,
                              textShadow: `0 0 10px ${rankColor}80`,
                            }}
                          >
                            {rank === 1 ? '👑' : rank === 2 ? '🥈' : '🥉'}
                          </span>
                        ) : (
                          <span
                            className="font-orbitron text-sm font-bold"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            #{rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <Avatar
                        discordId={entry.discord_id}
                        avatarHash={avatarHash}
                        username={entry.username}
                        size={36}
                      />

                      {/* Username */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-orbitron text-sm font-bold truncate transition-colors group-hover:text-[var(--cyan)]"
                          style={{ color: rank <= 3 ? rankColor : 'var(--text)' }}
                        >
                          {entry.username}
                        </p>
                      </div>

                      {/* Score */}
                      {entry.score > 0 && (
                        <div className="flex-shrink-0 text-right">
                          <span
                            className="font-orbitron text-sm font-bold"
                            style={{ color: rank <= 3 ? rankColor : 'var(--text-dim)' }}
                          >
                            {entry.score}
                          </span>
                          <span
                            className="text-[10px] font-mono ml-1"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {SCORE_LABELS[tab]}
                          </span>
                        </div>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
