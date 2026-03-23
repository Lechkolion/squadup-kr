import { Nav } from '@/components/layout/Nav';
import { Heartbeat } from '@/components/ui/Heartbeat';
import { Toaster } from 'react-hot-toast';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <Heartbeat />
      <main className="relative z-10 min-h-[calc(100vh-4rem)]">
        {children}
      </main>
      <footer className="relative z-10 border-t border-[var(--border)] py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)] font-mono">
          <span className="font-orbitron font-bold tracking-wider text-[var(--cyan)]">SQUADUP<span className="text-[var(--pink)]">KR</span></span>
          <div className="flex items-center gap-4">
            <a
              href={process.env.NEXT_PUBLIC_DISCORD_INVITE || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--cyan)] transition-colors"
            >
              Discord
            </a>
            <a href="/sitemap.xml" className="hover:text-[var(--cyan)] transition-colors">Sitemap</a>
          </div>
          <span>Made with ❤️ for Korean gamers</span>
        </div>
      </footer>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border-bright)',
            fontFamily: '"Space Mono", monospace',
            fontSize: '0.8rem',
          },
        }}
      />
    </>
  );
}
