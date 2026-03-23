'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Zap, Users, Shield } from 'lucide-react';

function ErrorToast() {
  const searchParams = useSearchParams();
  const hasError = searchParams.get('error') === 'true';
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (hasError) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [hasError]);

  return (
    <AnimatePresence>
      {showError && (
        <motion.div
          initial={{ opacity: 0, y: -60, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -60, x: '-50%' }}
          className="fixed top-6 left-1/2 z-50 card px-5 py-3 flex items-center gap-3"
          style={{ borderColor: 'rgba(255,45,120,0.4)', minWidth: 260 }}
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: 'var(--pink)', boxShadow: 'var(--glow-pink)' }}
          />
          <p className="text-sm font-mono" style={{ color: 'var(--pink)' }}>
            로그인에 실패했습니다. 다시 시도해 주세요.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Animated background blobs */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <motion.div
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,245,255,0.06) 0%, transparent 70%)' }}
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)' }}
          animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Error toast — wrapped in Suspense because it uses useSearchParams */}
      <Suspense fallback={null}>
        <ErrorToast />
      </Suspense>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="card relative z-10 w-full max-w-md p-10 flex flex-col items-center gap-8"
        style={{ background: 'rgba(13,20,36,0.95)', backdropFilter: 'blur(20px)' }}
      >
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: 'backOut' }}
          className="flex flex-col items-center gap-3"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(168,85,247,0.15))',
              border: '1px solid var(--border-bright)',
              boxShadow: 'var(--glow-cyan)',
            }}
          >
            <Zap size={28} style={{ color: 'var(--cyan)' }} />
          </div>
          <div className="text-center">
            <h1 className="font-orbitron text-3xl font-bold neon-text" style={{ color: 'var(--cyan)' }}>
              SquadUp KR
            </h1>
            <p className="mt-2 text-sm font-mono tracking-wide" style={{ color: 'var(--text-muted)' }}>
              한국 게이머를 위한 팀 찾기
            </p>
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="flex flex-wrap gap-2 justify-center"
        >
          {[
            { icon: Users, label: '팀원 찾기' },
            { icon: Shield, label: '랭크 매칭' },
            { icon: MessageSquare, label: '스쿼드 채팅' },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="tag flex items-center gap-1.5"
              style={{ color: 'var(--text-dim)', borderColor: 'var(--border)' }}
            >
              <Icon size={10} />
              {label}
            </span>
          ))}
        </motion.div>

        <div className="w-full h-px" style={{ background: 'var(--border)' }} />

        {/* Login button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="w-full flex flex-col items-center gap-4"
        >
          <a
            href="/api/auth/discord"
            className="btn btn-discord w-full justify-center text-base gap-3"
            style={{ borderRadius: 8 }}
          >
            <svg width="22" height="22" viewBox="0 0 71 55" fill="currentColor" aria-hidden="true">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.44077 45.4204 0.52529C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.52529C25.5141 0.44344 25.4218 0.40118 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" />
            </svg>
            Discord로 로그인
          </a>
          <p className="text-xs font-mono text-center" style={{ color: 'var(--text-muted)' }}>
            Discord 계정으로 바로 로그인 · No email required
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-xs font-mono text-center"
          style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}
        >
          로그인하면{' '}
          <span style={{ color: 'var(--cyan)' }}>서비스 이용약관</span>
          {' '}및{' '}
          <span style={{ color: 'var(--cyan)' }}>개인정보처리방침</span>
          에 동의하는 것으로 간주됩니다.
        </motion.p>
      </motion.div>
    </div>
  );
}
