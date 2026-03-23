import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SquadUp KR — Find Your Gaming Squad in Korea | 한국 게이머 팀 찾기',
  description: 'Find your perfect gaming squad in Korea. Connect with Korean gamers for League of Legends, Valorant, Overwatch 2, PUBG, StarCraft II, Lost Ark, and more. | 한국 게이머를 위한 최고의 팀 찾기 플랫폼',
  openGraph: {
    title: 'SquadUp KR — Find Your Gaming Squad',
    description: '한국 게이머를 위한 팀 찾기 | The squad finder built for Korean gamers',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'SquadUp KR',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'SquadUp KR' }],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SquadUp KR',
    description: '한국 게이머를 위한 팀 찾기',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://squadup-kr.up.railway.app'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap"
          as="style"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="scanline" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
