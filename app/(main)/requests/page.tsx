'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Users, Inbox, Send, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, MatchBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GAMES, type GameKey } from '@/lib/games';
import {
  calculateMatchScore,
  type ProfileForMatching,
  type GameRankForMatching,
} from '@/lib/matching/algorithm';

interface ProfileSnippet {
  id: string;
  discord_id: string;
  username: string;
  avatar_url: string | null;
  games: string[];
  play_styles: string[];
  languages: string[];
  active_hours_start: number;
  active_hours_end: number;
  game_ranks: Array<{ game_key: string; rank_label: string | null }>;
}

interface SquadRequest {
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  from_profile: ProfileSnippet | null;
  to_profile: ProfileSnippet | null;
}

type TabKey = 'incoming' | 'outgoing';

export default function RequestsPage() {
  const [tab, setTab] = useState<TabKey>('incoming');
  const [incoming, setIncoming] = useState<SquadRequest[]>([]);
  const [outgoing, setOutgoing] = useState<SquadRequest[]>([]);
  const [myProfile, setMyProfile] = useState<ProfileSnippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  const supabase = createClient();

  const loadRequests = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: me } = await supabase
      .from('profiles')
      .select('id, discord_id, username, avatar_url, games, play_styles, languages, active_hours_start, active_hours_end, game_ranks(game_key, rank_label)')
      .eq('discord_id', user.id)
      .single();

    if (me) setMyProfile(me as unknown as ProfileSnippet);

    const myId = (me as { id: string } | null)?.id;
    if (!myId) { setLoading(false); return; }

    const profileSelect = `
      id, discord_id, username, avatar_url, games, play_styles, languages,
      active_hours_start, active_hours_end,
      game_ranks(game_key, rank_label)
    `;

    const [inRes, outRes] = await Promise.all([
      supabase
        .from('squad_requests')
        .select(`id, from_profile_id, to_profile_id, message, status, created_at, from_profile:profiles!squad_requests_from_profile_id_fkey(${profileSelect})`)
        .eq('to_profile_id', myId)
        .order('created_at', { ascending: false }),
      supabase
        .from('squad_requests')
        .select(`id, from_profile_id, to_profile_id, message, status, created_at, to_profile:profiles!squad_requests_to_profile_id_fkey(${profileSelect})`)
        .eq('from_profile_id', myId)
        .order('created_at', { ascending: false }),
    ]);

    setIncoming((inRes.data ?? []) as unknown as SquadRequest[]);
    setOutgoing((outRes.data ?? []) as unknown as SquadRequest[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('squad-requests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'squad_requests' },
        () => { loadRequests(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, loadRequests]);

  const handleAccept = useCallback(async (request: SquadRequest) => {
    if (!myProfile) return;
    setProcessing((p) => ({ ...p, [request.id]: true }));
    try {
      // Update status
      const { error: updateError } = await supabase
        .from('squad_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', request.id);
      if (updateError) throw updateError;

      // Insert connection (sorted ids to avoid duplicates)
      const [aId, bId] = [request.from_profile_id, request.to_profile_id].sort();
      await supabase.from('connections').upsert(
        { profile_a_id: aId, profile_b_id: bId },
        { onConflict: 'profile_a_id,profile_b_id' }
      );

      // Notifications for both users
      await supabase.from('notifications').insert([
        { profile_id: request.from_profile_id, type: 'squad_accepted', from_profile_id: myProfile.id },
        { profile_id: myProfile.id, type: 'squad_accepted', from_profile_id: request.from_profile_id },
      ]);

      // Bot webhook (non-blocking)
      fetch('/api/bot-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'squad_accepted',
          fromProfileId: request.from_profile_id,
          toProfileId: request.to_profile_id,
        }),
      }).catch(() => {});

      toast.success('Squad request accepted!', {
        style: {
          background: 'var(--surface)',
          color: 'var(--green)',
          border: '1px solid rgba(57,255,20,0.3)',
          fontFamily: 'Space Mono, monospace',
          fontSize: '0.8rem',
        },
      });
      loadRequests();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept request.');
    } finally {
      setProcessing((p) => ({ ...p, [request.id]: false }));
    }
  }, [myProfile, supabase, loadRequests]);

  const handleDecline = useCallback(async (request: SquadRequest) => {
    setProcessing((p) => ({ ...p, [request.id]: true }));
    try {
      const { error } = await supabase
        .from('squad_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', request.id);
      if (error) throw error;
      toast.success('Request declined.');
      loadRequests();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed.');
    } finally {
      setProcessing((p) => ({ ...p, [request.id]: false }));
    }
  }, [supabase, loadRequests]);

  const getMatchForProfile = useCallback(
    (other: ProfileSnippet | null) => {
      if (!myProfile || !other) return null;
      const a: ProfileForMatching = {
        id: myProfile.id,
        games: myProfile.games,
        play_styles: myProfile.play_styles,
        languages: myProfile.languages,
        active_hours_start: myProfile.active_hours_start,
        active_hours_end: myProfile.active_hours_end,
      };
      const b: ProfileForMatching = {
        id: other.id,
        games: other.games,
        play_styles: other.play_styles,
        languages: other.languages,
        active_hours_start: other.active_hours_start,
        active_hours_end: other.active_hours_end,
      };
      const ranksA: GameRankForMatching[] = (myProfile.game_ranks ?? []).map((r) => ({
        game_key: r.game_key,
        rank_label: r.rank_label,
      }));
      const ranksB: GameRankForMatching[] = (other.game_ranks ?? []).map((r) => ({
        game_key: r.game_key,
        rank_label: r.rank_label,
      }));
      return calculateMatchScore(a, b, ranksA, ranksB);
    },
    [myProfile]
  );

  const pendingIncoming = incoming.filter((r) => r.status === 'pending');

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-orbitron text-2xl font-bold" style={{ color: 'var(--cyan)' }}>
          Squad Requests
        </h1>
        <p className="text-sm font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
          팀원 요청 관리
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        {([
          { key: 'incoming', label: '받은 요청', icon: Inbox, count: pendingIncoming.length },
          { key: 'outgoing', label: '보낸 요청', icon: Send, count: outgoing.length },
        ] as const).map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-orbitron font-bold tracking-wider transition-all duration-200"
            style={
              tab === key
                ? { background: 'var(--surface-3)', color: 'var(--cyan)', boxShadow: '0 0 10px rgba(0,245,255,0.15)' }
                : { color: 'var(--text-muted)' }
            }
          >
            <Icon size={13} />
            {label}
            {count > 0 && (
              <span
                className="w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold"
                style={{ background: tab === key ? 'var(--cyan)' : 'var(--surface-3)', color: tab === key ? 'var(--bg)' : 'var(--text-muted)' }}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-4 flex gap-4 items-start">
                <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-48 rounded" />
                </div>
              </div>
            ))
          ) : tab === 'incoming' ? (
            incoming.length === 0 ? (
              <EmptyState icon={Inbox} message="받은 Squad Request가 없습니다." sub="프로필을 완성하면 더 많은 팀원이 요청을 보낼 거예요!" />
            ) : (
              incoming.map((req) => (
                <IncomingRequestCard
                  key={req.id}
                  request={req}
                  matchResult={getMatchForProfile(req.from_profile)}
                  processing={processing[req.id] ?? false}
                  onAccept={() => handleAccept(req)}
                  onDecline={() => handleDecline(req)}
                />
              ))
            )
          ) : (
            outgoing.length === 0 ? (
              <EmptyState icon={Send} message="보낸 Squad Request가 없습니다." sub="Browse 페이지에서 마음에 드는 팀원에게 요청을 보내보세요!" />
            ) : (
              outgoing.map((req) => (
                <OutgoingRequestCard
                  key={req.id}
                  request={req}
                  matchResult={getMatchForProfile(req.to_profile)}
                />
              ))
            )
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── Incoming Card ─── */
function IncomingRequestCard({
  request,
  matchResult,
  processing,
  onAccept,
  onDecline,
}: {
  request: SquadRequest;
  matchResult: ReturnType<typeof calculateMatchScore> | null;
  processing: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const profile = request.from_profile;
  if (!profile) return null;

  const avatarHash = profile.avatar_url
    ? profile.avatar_url.replace(/.*avatars\/[^/]+\//, '').replace(/\..*$/, '')
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="card p-4"
    >
      <div className="flex gap-4 items-start">
        <Avatar
          discordId={profile.discord_id}
          avatarHash={avatarHash}
          username={profile.username}
          size={48}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-orbitron text-sm font-bold" style={{ color: 'var(--text)' }}>
              {profile.username}
            </span>
            {matchResult && (
              <MatchBadge score={matchResult.score} label={matchResult.label} />
            )}
            <StatusBadge status={request.status} />
          </div>

          {/* Games */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {profile.games.slice(0, 4).map((gKey) => {
              const g = GAMES[gKey as GameKey];
              if (!g) return null;
              return (
                <Badge key={gKey} color={g.color}>
                  {g.emoji} {g.nameKo}
                </Badge>
              );
            })}
          </div>

          {/* Message */}
          {request.message && (
            <p
              className="text-xs font-mono p-2 rounded mb-3"
              style={{
                background: 'var(--surface-2)',
                color: 'var(--text-dim)',
                border: '1px solid var(--border)',
              }}
            >
              "{request.message}"
            </p>
          )}

          {/* Actions */}
          {request.status === 'pending' && (
            <div className="flex gap-2">
              <Button variant="success" size="sm" loading={processing} onClick={onAccept}>
                수락
              </Button>
              <Button variant="danger" size="sm" disabled={processing} onClick={onDecline}>
                거절
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Outgoing Card ─── */
function OutgoingRequestCard({
  request,
  matchResult,
}: {
  request: SquadRequest;
  matchResult: ReturnType<typeof calculateMatchScore> | null;
}) {
  const profile = request.to_profile;
  if (!profile) return null;

  const avatarHash = profile.avatar_url
    ? profile.avatar_url.replace(/.*avatars\/[^/]+\//, '').replace(/\..*$/, '')
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="card p-4"
    >
      <div className="flex gap-4 items-start">
        <Avatar
          discordId={profile.discord_id}
          avatarHash={avatarHash}
          username={profile.username}
          size={48}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-orbitron text-sm font-bold" style={{ color: 'var(--text)' }}>
              {profile.username}
            </span>
            {matchResult && (
              <MatchBadge score={matchResult.score} label={matchResult.label} />
            )}
            <StatusBadge status={request.status} />
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {profile.games.slice(0, 4).map((gKey) => {
              const g = GAMES[gKey as GameKey];
              if (!g) return null;
              return (
                <Badge key={gKey} color={g.color}>
                  {g.emoji} {g.nameKo}
                </Badge>
              );
            })}
          </div>

          {request.message && (
            <p
              className="text-xs font-mono p-2 rounded"
              style={{
                background: 'var(--surface-2)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              "{request.message}"
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-2" style={{ color: 'var(--text-muted)' }}>
            <Clock size={10} />
            <span className="text-[10px] font-mono">
              {new Date(request.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Empty State ─── */
function EmptyState({
  icon: Icon,
  message,
  sub,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  message: string;
  sub: string;
}) {
  return (
    <div className="card p-10 flex flex-col items-center gap-4 text-center">
      <Icon size={36} style={{ color: 'var(--text-muted)' }} />
      <div>
        <p className="font-orbitron text-sm font-bold" style={{ color: 'var(--text-dim)' }}>
          {message}
        </p>
        <p className="text-xs font-mono mt-1.5" style={{ color: 'var(--text-muted)' }}>
          {sub}
        </p>
      </div>
    </div>
  );
}
