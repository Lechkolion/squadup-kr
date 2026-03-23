'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Bell, ExternalLink, Gamepad2, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { GAMES, type GameKey } from '@/lib/games';
import { isUserOnline, formatTimeAgo } from '@/lib/utils';

interface ConnectedProfile {
  id: string;
  discord_id: string;
  username: string;
  avatar_url: string | null;
  games: string[];
  is_online: boolean;
  show_online_status: boolean;
  last_seen: string | null;
  presence?: { last_heartbeat: string | null; current_game: string | null } | null;
}

interface NotificationRow {
  id: string;
  type: string;
  created_at: string;
  read: boolean;
  from_profile: { username: string; discord_id: string; avatar_url: string | null } | null;
}

export default function DashboardPage() {
  const [connections, setConnections] = useState<ConnectedProfile[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: me } = await supabase
      .from('profiles')
      .select('id')
      .eq('discord_id', user.id)
      .single();

    if (!me) { setLoading(false); return; }
    setMyId(me.id);

    // Load connections with profile data
    const { data: connRows } = await supabase
      .from('connections')
      .select(`
        profile_a_id,
        profile_b_id,
        profile_a:profiles!connections_profile_a_id_fkey(
          id, discord_id, username, avatar_url, games, is_online, show_online_status, last_seen,
          presence(last_heartbeat, current_game)
        ),
        profile_b:profiles!connections_profile_b_id_fkey(
          id, discord_id, username, avatar_url, games, is_online, show_online_status, last_seen,
          presence(last_heartbeat, current_game)
        )
      `)
      .or(`profile_a_id.eq.${me.id},profile_b_id.eq.${me.id}`);

    const connected: ConnectedProfile[] = (connRows ?? []).map((row: unknown) => {
      const r = row as {
        profile_a_id: string;
        profile_a: ConnectedProfile;
        profile_b: ConnectedProfile;
      };
      return r.profile_a_id === me.id ? r.profile_b : r.profile_a;
    }).filter(Boolean);
    setConnections(connected);

    // Load recent notifications
    const { data: notifs } = await supabase
      .from('notifications')
      .select(`
        id, type, created_at, read,
        from_profile:profiles!notifications_from_profile_id_fkey(username, discord_id, avatar_url)
      `)
      .eq('profile_id', me.id)
      .order('created_at', { ascending: false })
      .limit(10);

    setNotifications((notifs ?? []) as unknown as NotificationRow[]);
    setUnreadCount((notifs ?? []).filter((n: { read: boolean }) => !n.read).length);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: presence + notifications
  useEffect(() => {
    if (!myId) return;

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `profile_id=eq.${myId}` }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, myId, load]);

  const markAllRead = useCallback(async () => {
    if (!myId) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('profile_id', myId)
      .eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [supabase, myId]);

  const getOnlineStatus = (profile: ConnectedProfile): boolean => {
    if (!profile.show_online_status) return false;
    if (profile.presence?.last_heartbeat) {
      return isUserOnline(profile.presence.last_heartbeat);
    }
    return profile.is_online;
  };

  const notifLabel = (type: string): string => {
    switch (type) {
      case 'squad_accepted': return '팀원 요청이 수락되었습니다';
      case 'squad_request': return '새 팀원 요청을 받았습니다';
      case 'new_connection': return '새 연결이 생성되었습니다';
      default: return type;
    }
  };

  const onlineCount = connections.filter(getOnlineStatus).length;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-orbitron text-2xl font-bold" style={{ color: 'var(--cyan)' }}>
            Dashboard
          </h1>
          <p className="text-sm font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
            나의 Squad 현황
          </p>
        </div>
        {/* Stats */}
        <div className="flex gap-3">
          <StatPill icon={Users} value={connections.length} label="Connections" color="var(--cyan)" />
          <StatPill icon={Zap} value={onlineCount} label="Online" color="var(--green)" />
          {unreadCount > 0 && (
            <StatPill icon={Bell} value={unreadCount} label="Unread" color="var(--amber)" />
          )}
        </div>
      </div>

      {/* My Squad grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-orbitron text-sm font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>
            MY SQUAD ({connections.length})
          </h2>
          {connections.length === 0 && (
            <Link href="/browse" className="btn btn-ghost text-xs">
              팀원 찾기
              <ExternalLink size={11} />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-4 flex gap-3 items-start">
                <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-24 rounded" />
                  <div className="skeleton h-2.5 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : connections.length === 0 ? (
          <div className="card p-10 text-center">
            <Gamepad2 size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="font-orbitron text-sm font-bold" style={{ color: 'var(--text-dim)' }}>
              아직 연결된 Squad가 없습니다
            </p>
            <p className="text-xs font-mono mt-2 mb-5" style={{ color: 'var(--text-muted)' }}>
              Browse 페이지에서 마음에 드는 게이머에게 팀원 요청을 보내보세요!
            </p>
            <Link href="/browse" className="btn btn-primary">
              팀원 찾기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {connections.map((profile, i) => {
              const online = getOnlineStatus(profile);
              const avatarHash = profile.avatar_url
                ? profile.avatar_url.replace(/.*avatars\/[^/]+\//, '').replace(/\..*$/, '')
                : null;
              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="card p-4"
                >
                  <div className="flex gap-3 items-start mb-3">
                    <Avatar
                      discordId={profile.discord_id}
                      avatarHash={avatarHash}
                      username={profile.username}
                      size={40}
                      isOnline={online}
                      showStatus={profile.show_online_status}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p
                          className="font-orbitron text-xs font-bold truncate"
                          style={{ color: 'var(--text)' }}
                        >
                          {profile.username}
                        </p>
                        {online && <span className="online-dot flex-shrink-0" style={{ width: 6, height: 6 }} />}
                      </div>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {online
                          ? profile.presence?.current_game
                            ? `Playing ${profile.presence.current_game}`
                            : 'Online'
                          : profile.last_seen
                          ? formatTimeAgo(profile.last_seen)
                          : 'Offline'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {profile.games.slice(0, 3).map((gKey) => {
                      const g = GAMES[gKey as GameKey];
                      if (!g) return null;
                      return (
                        <Badge key={gKey} color={g.color}>
                          {g.emoji}
                        </Badge>
                      );
                    })}
                  </div>

                  <Link
                    href={`/profile/${profile.id}`}
                    className="btn btn-ghost w-full justify-center text-xs"
                    style={{ fontSize: '0.65rem' }}
                  >
                    View Profile
                    <ExternalLink size={10} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Activity feed */}
      {notifications.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-orbitron text-sm font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>
              ACTIVITY FEED
            </h2>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-mono"
                style={{ color: 'var(--cyan)' }}
              >
                모두 읽음 표시
              </button>
            )}
          </div>

          <div className="card divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
            {notifications.map((notif, i) => {
              const avatarHash = notif.from_profile?.avatar_url
                ? notif.from_profile.avatar_url.replace(/.*avatars\/[^/]+\//, '').replace(/\..*$/, '')
                : null;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    background: notif.read ? 'transparent' : 'rgba(0,245,255,0.03)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {notif.from_profile && (
                    <Avatar
                      discordId={notif.from_profile.discord_id}
                      avatarHash={avatarHash}
                      username={notif.from_profile.username}
                      size={32}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono truncate" style={{ color: 'var(--text)' }}>
                      {notif.from_profile && (
                        <span className="font-bold" style={{ color: 'var(--cyan)' }}>
                          {notif.from_profile.username}{' '}
                        </span>
                      )}
                      {notifLabel(notif.type)}
                    </p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {formatTimeAgo(notif.created_at)}
                    </p>
                  </div>
                  {!notif.read && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: 'var(--cyan)', boxShadow: 'var(--glow-cyan)' }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function StatPill({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentType<{ size?: number }>;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
      style={{
        background: 'var(--surface-2)',
        border: `1px solid ${color}30`,
      }}
    >
      <Icon size={13} />
      <span className="font-orbitron text-sm font-bold" style={{ color }}>
        {value}
      </span>
      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  );
}
