'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserPlus, CheckCircle, Clock, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, MatchBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GAMES, PLAY_STYLES } from '@/lib/games';
import { formatActiveHours, isUserOnline, truncate } from '@/lib/utils';
import type { MatchResult } from '@/lib/matching/algorithm';
import { createClient } from '@/lib/supabase/client';

interface GamerCardProps {
  profile: any;
  ranks: any[];
  matchResult: MatchResult | null;
  requestStatus?: string;
  isConnected: boolean;
  myProfileId?: string;
  onRequestSent?: (toId: string, status: string) => void;
}

export function GamerCard({
  profile,
  ranks,
  matchResult,
  requestStatus,
  isConnected,
  myProfileId,
  onRequestSent,
}: GamerCardProps) {
  const supabase = createClient();
  const [sending, setSending] = useState(false);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [message, setMessage] = useState('');

  const isOnline = isUserOnline(profile.presence?.last_heartbeat);

  const sendRequest = async () => {
    if (!myProfileId) {
      toast.error('Please log in first');
      return;
    }
    setSending(true);
    const { error } = await supabase.from('squad_requests').insert({
      from_profile_id: myProfileId,
      to_profile_id: profile.id,
      message: message || null,
      status: 'pending',
    });

    if (!error) {
      // Create notification
      await supabase.from('notifications').insert({
        profile_id: profile.id,
        type: 'squad_request',
        from_profile_id: myProfileId,
      });
      toast.success('Squad request sent!');
      onRequestSent?.(profile.id, 'pending');
      setShowMessageInput(false);
    } else {
      toast.error('Failed to send request');
    }
    setSending(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5 flex flex-col gap-3.5"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar
          discordId={profile.discord_id}
          avatarHash={profile.avatar_url}
          username={profile.username}
          size={48}
          isOnline={isOnline}
          showStatus
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-orbitron font-bold text-sm text-[var(--text)] truncate">{profile.username}</span>
            {isOnline && (
              <span className="text-[10px] font-orbitron font-semibold text-[var(--green)]">● ONLINE</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {profile.languages?.includes('ko') || profile.languages?.includes('both') ? (
              <span className="text-[10px]">🇰🇷</span>
            ) : null}
            {profile.languages?.includes('en') || profile.languages?.includes('both') ? (
              <span className="text-[10px]">🇺🇸</span>
            ) : null}
            {profile.region && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono">{profile.region}</span>
            )}
          </div>
        </div>
        {matchResult && (
          <MatchBadge score={matchResult.score} label={matchResult.label} />
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-xs text-[var(--text-muted)] font-mono leading-relaxed border-l-2 border-[var(--border)] pl-2">
          {truncate(profile.bio, 80)}
        </p>
      )}

      {/* Games */}
      {profile.games?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(profile.games as string[]).slice(0, 4).map(gameKey => {
            const game = GAMES[gameKey as keyof typeof GAMES];
            if (!game) return null;
            const rank = ranks.find(r => r.game_key === gameKey);
            return (
              <span
                key={gameKey}
                className="tag"
                style={{ color: game.color, borderColor: `${game.color}40`, background: `${game.color}12` }}
              >
                {game.emoji} {game.name.split(':')[0].split(' ').slice(0, 2).join(' ')}
                {rank?.rank_label && <span className="opacity-70 ml-1">· {rank.rank_label}</span>}
              </span>
            );
          })}
          {profile.games.length > 4 && (
            <span className="tag">+{profile.games.length - 4}</span>
          )}
        </div>
      )}

      {/* Play styles */}
      {profile.play_styles?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(profile.play_styles as string[]).slice(0, 4).map(key => {
            const style = PLAY_STYLES.find(s => s.key === key);
            if (!style) return null;
            return (
              <span key={key} className="tag text-[var(--purple)]" style={{ borderColor: 'rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.08)' }}>
                {style.emoji} {style.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Active hours */}
      <p className="text-[10px] text-[var(--text-muted)] font-mono">
        🕐 Usually online {formatActiveHours(profile.active_hours_start, profile.active_hours_end)}
        {profile.presence?.current_game && (
          <span className="ml-2 text-[var(--cyan)]">
            · {GAMES[profile.presence.current_game as keyof typeof GAMES]?.emoji} Playing now
          </span>
        )}
      </p>

      {/* Message input */}
      {showMessageInput && (
        <div className="space-y-2">
          <textarea
            className="input resize-none text-xs"
            rows={2}
            maxLength={200}
            placeholder="Optional message... (최대 200자)"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="primary" loading={sending} onClick={sendRequest} className="flex-1">
              Send Request
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowMessageInput(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      {!showMessageInput && (
        <div className="flex gap-2 pt-0.5">
          <Link href={`/profile/${profile.id}`} className="flex-1">
            <Button variant="secondary" size="sm" className="w-full">
              <Eye size={12} /> View
            </Button>
          </Link>

          {isConnected ? (
            <Button variant="success" size="sm" className="flex-1" disabled>
              <CheckCircle size={12} /> In Squad
            </Button>
          ) : requestStatus === 'pending' ? (
            <Button variant="ghost" size="sm" className="flex-1" disabled>
              <Clock size={12} /> Sent
            </Button>
          ) : requestStatus === 'accepted' ? (
            <Button variant="success" size="sm" className="flex-1" disabled>
              <CheckCircle size={12} /> Connected
            </Button>
          ) : myProfileId ? (
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={() => setShowMessageInput(true)}
            >
              <UserPlus size={12} /> Squad Up
            </Button>
          ) : (
            <Link href="/login" className="flex-1">
              <Button variant="primary" size="sm" className="w-full">
                <UserPlus size={12} /> Squad Up
              </Button>
            </Link>
          )}
        </div>
      )}
    </motion.div>
  );
}
