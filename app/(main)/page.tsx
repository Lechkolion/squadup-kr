import { Suspense } from 'react';
import Link from 'next/link';
import { Gamepad2, Search, Users } from 'lucide-react';
import { Particles } from '@/components/effects/Particles';
import { GAMES } from '@/lib/games';
import { createClient } from '@/lib/supabase/server';
import { LiveCounter } from '@/components/ui/LiveCounter';
import { RecentSquads } from '@/components/ui/RecentSquads';

export const revalidate = 60;

async function getOnlineCount() {
  const supabase = createClient();
  const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('presence')
    .select('*', { count: 'exact', head: true })
    .gte('last_heartbeat', twoMinsAgo);
  return count || 0;
}

const HOW_IT_WORKS = [
  { icon: Gamepad2, title: 'Create Your Profile', titleKo: '프로필 만들기', desc: 'Set up your games, rank, and play style', color: 'var(--cyan)' },
  { icon: Search, title: 'Browse & Match', titleKo: '찾아보기 & 매칭', desc: 'Find compatible players with our smart algorithm', color: 'var(--purple)' },
  { icon: Users, title: 'Connect & Play', titleKo: '연결 & 플레이', desc: 'Connect on Discord and start playing together', color: 'var(--pink)' },
];

export default async function LandingPage() {
  const onlineCount = await getOnlineCount();

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 overflow-hidden">
        <Particles />

        {/* Glow orbs */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,245,255,0.06) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-bright)] bg-[var(--cyan-dim)] mb-8 text-xs font-orbitron font-semibold tracking-widest text-[var(--cyan)]">
            <span className="online-dot w-2 h-2" />
            <Suspense fallback={<span>LIVE</span>}>
              <LiveCounter initialCount={onlineCount} />
            </Suspense>
          </div>

          {/* Headline */}
          <h1
            className="font-orbitron font-black mb-4 neon-text"
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 5.5rem)',
              lineHeight: 1.05,
              letterSpacing: '0.06em',
              color: 'var(--cyan)',
            }}
          >
            FIND YOUR SQUAD
          </h1>

          {/* Korean subtitle */}
          <p
            className="font-orbitron font-semibold text-xl sm:text-2xl text-[var(--text-dim)] mb-2"
            style={{ letterSpacing: '0.05em' }}
          >
            한국 게이머를 위한 팀 찾기
          </p>
          <p className="font-mono text-base sm:text-lg text-[var(--text-muted)] mb-10">
            The squad finder built for Korean gamers
          </p>

          {/* CTA */}
          <a
            href="/api/auth/discord"
            className="btn btn-discord text-base px-10 py-4 inline-flex items-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            LOGIN WITH DISCORD
          </a>

          <p className="mt-4 text-xs text-[var(--text-muted)] font-mono">
            Discord 계정으로 바로 로그인 · No email required
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-orbitron font-bold text-2xl text-center text-[var(--text)] mb-2">
            How It Works
          </h2>
          <p className="text-center text-[var(--text-muted)] font-mono mb-12">이용 방법</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.title}
                className="card p-6 text-center"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${step.color}20`, border: `1px solid ${step.color}40` }}
                >
                  <step.icon size={24} style={{ color: step.color }} />
                </div>
                <div className="font-orbitron font-bold text-sm text-[var(--text)] mb-1">
                  {step.title}
                </div>
                <div className="text-xs text-[var(--text-muted)] mb-2 font-mono">{step.titleKo}</div>
                <p className="text-xs text-[var(--text-dim)] font-mono">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Games */}
      <section className="py-20 px-4 border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-orbitron font-bold text-2xl text-center text-[var(--text)] mb-2">
            Supported Games
          </h2>
          <p className="text-center text-[var(--text-muted)] font-mono mb-12">지원 게임</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.values(GAMES).map(game => (
              <div
                key={game.key}
                className="card p-4 text-center group cursor-default"
                style={{ borderColor: `${game.color}30` }}
              >
                <div
                  className="text-3xl mb-2"
                  style={{ filter: `drop-shadow(0 0 8px ${game.color})` }}
                >
                  {game.emoji}
                </div>
                <div className="font-orbitron font-bold text-xs text-[var(--text)] group-hover:text-[var(--cyan)] transition-colors" style={{ color: game.color }}>
                  {game.name}
                </div>
                <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">{game.nameKo}</div>
                {game.communityOnly && (
                  <div className="mt-2">
                    <span className="tag text-[10px]">Community</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 px-4 border-t border-[var(--border)]">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-orbitron font-bold text-lg text-center text-[var(--text)] mb-8">
            Recent Squads Formed
          </h2>
          <Suspense fallback={<div className="text-center text-[var(--text-muted)] font-mono text-sm">Loading...</div>}>
            <RecentSquads />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
