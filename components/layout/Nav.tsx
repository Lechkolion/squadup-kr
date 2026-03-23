'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronDown, Menu, X, LogOut, User, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { getAvatarUrl } from '@/lib/utils';

interface NavProfile {
  id: string;
  discord_id: string;
  username: string;
  avatar_url: string | null;
}

interface Notification {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  from_profile?: { username: string; avatar_url: string | null; discord_id: string };
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<NavProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('id, discord_id, username, avatar_url')
        .eq('discord_id', user.id)
        .single();

      if (data) setProfile(data);
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!profile) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id, type, read, created_at, from_profile:from_profile_id(username, avatar_url, discord_id)')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setNotifications(data as unknown as Notification[]);
    };

    fetchNotifications();

    const channel = supabase
      .channel('nav-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `profile_id=eq.${profile.id}`,
      }, (payload: { new: Notification }) => {
        setNotifications(prev => [payload.new, ...prev.slice(0, 9)]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const markAllRead = async () => {
    if (!profile) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('profile_id', profile.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const navLinks = [
    { href: '/browse', label: 'Browse' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/requests', label: 'Requests', badge: unreadCount },
    { href: '/leaderboard', label: 'Leaderboard' },
  ];

  return (
    <nav
      className="sticky top-0 z-50 border-b border-[var(--border)]"
      style={{ background: 'rgba(5,8,16,0.95)', backdropFilter: 'blur(20px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span
            className="font-orbitron font-black text-lg tracking-wider text-[var(--cyan)] neon-text"
            style={{ letterSpacing: '0.1em' }}
          >
            SQUADUP<span className="text-[var(--pink)]">KR</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-3 py-1.5 font-orbitron text-xs font-semibold tracking-wider uppercase transition-colors"
              style={{
                color: pathname.startsWith(link.href) ? 'var(--cyan)' : 'var(--text-muted)',
              }}
            >
              {link.label}
              {link.badge ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--pink)] text-white text-[10px] flex items-center justify-center font-orbitron">
                  {link.badge > 9 ? '9+' : link.badge}
                </span>
              ) : null}
              {pathname.startsWith(link.href) && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--cyan)]"
                  style={{ boxShadow: 'var(--glow-cyan)' }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          {profile && (
            <div className="relative" ref={notifsRef}>
              <button
                onClick={() => { setShowNotifs(v => !v); setShowUserMenu(false); }}
                className="relative p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[var(--pink)] text-white text-[9px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 mt-2 w-80 card p-0 overflow-hidden"
                    style={{ zIndex: 100 }}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                      <span className="font-orbitron text-xs font-semibold text-[var(--text)]">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-[var(--cyan)] hover:opacity-80"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-[var(--text-muted)] p-4 text-center">No notifications</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className="px-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors"
                            style={{ background: n.read ? 'transparent' : 'rgba(0,245,255,0.04)' }}
                          >
                            <div className="flex items-start gap-2">
                              {!n.read && (
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--cyan)] shrink-0" />
                              )}
                              <div>
                                <p className="text-xs text-[var(--text)]">
                                  {n.type === 'squad_request' && `${n.from_profile?.username} sent you a squad request`}
                                  {n.type === 'request_accepted' && `${n.from_profile?.username} accepted your request!`}
                                  {n.type === 'new_connection' && `You and ${n.from_profile?.username} are now connected`}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* User menu */}
          {profile ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => { setShowUserMenu(v => !v); setShowNotifs(false); }}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--border)]">
                  <Image
                    src={getAvatarUrl(profile.discord_id, profile.avatar_url)}
                    alt={profile.username}
                    width={32}
                    height={32}
                    unoptimized
                  />
                </div>
                <span className="hidden sm:block font-mono text-xs text-[var(--text-dim)]">{profile.username}</span>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 mt-2 w-48 card p-1"
                    style={{ zIndex: 100 }}
                  >
                    <Link
                      href={`/profile/${profile.id}`}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded text-sm text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <User size={14} /> Profile
                    </Link>
                    <Link
                      href="/me"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded text-sm text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <Edit size={14} /> Edit Profile
                    </Link>
                    <hr className="my-1 border-[var(--border)]" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 rounded text-sm text-[var(--pink)] hover:bg-[var(--surface-2)] transition-colors w-full text-left"
                    >
                      <LogOut size={14} /> Log Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary text-xs px-4 py-2">
              Login
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-[var(--border)] overflow-hidden"
            style={{ background: 'rgba(5,8,16,0.98)' }}
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded font-orbitron text-xs font-semibold tracking-wider uppercase"
                  style={{
                    color: pathname.startsWith(link.href) ? 'var(--cyan)' : 'var(--text-muted)',
                    background: pathname.startsWith(link.href) ? 'var(--cyan-dim)' : 'transparent',
                  }}
                >
                  {link.label}
                  {link.badge ? (
                    <span className="w-5 h-5 rounded-full bg-[var(--pink)] text-white text-[10px] flex items-center justify-center">
                      {link.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
