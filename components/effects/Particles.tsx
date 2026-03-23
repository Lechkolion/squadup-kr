'use client';

import { useEffect, useRef } from 'react';

const GAME_EMOJIS = ['⚔️', '🔫', '🦸', '🐔', '🚀', '⚓', '⚽', '🃏', '🎮', '🏆', '💎', '⚡'];

interface Particle {
  x: number;
  vx: number;
  y: number;
  vy: number;
  emoji: string;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

export function Particles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const particles = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const count = 18;
    const els: HTMLSpanElement[] = [];

    for (let i = 0; i < count; i++) {
      const p: Particle = {
        x: Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.02,
        y: 100 + Math.random() * 20,
        vy: -(0.04 + Math.random() * 0.06),
        emoji: GAME_EMOJIS[Math.floor(Math.random() * GAME_EMOJIS.length)],
        size: 18 + Math.random() * 18,
        opacity: 0,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 1,
      };
      particles.current.push(p);

      const el = document.createElement('span');
      el.textContent = p.emoji;
      el.style.cssText = `
        position: absolute;
        font-size: ${p.size}px;
        pointer-events: none;
        user-select: none;
        will-change: transform, opacity;
        left: ${p.x}%;
        top: ${p.y}%;
        opacity: 0;
      `;
      container.appendChild(el);
      els.push(el);
    }

    // Stagger start times
    particles.current.forEach((p, i) => {
      p.y = 100 + Math.random() * 40;
      setTimeout(() => {
        p.opacity = 0.6 + Math.random() * 0.3;
      }, i * 400);
    });

    let last = performance.now();
    const animate = (now: number) => {
      const dt = Math.min((now - last) / 16, 3);
      last = now;

      particles.current.forEach((p, i) => {
        const el = els[i];
        if (!el) return;

        p.y += p.vy * dt;
        p.x += p.vx * dt;
        p.rotation += p.rotationSpeed * dt;

        if (p.y < -10) {
          p.y = 105 + Math.random() * 10;
          p.x = Math.random() * 100;
          p.opacity = 0;
          setTimeout(() => {
            p.opacity = 0.5 + Math.random() * 0.4;
          }, 500);
        }

        // Fade in near bottom, fade out near top
        let opacity = p.opacity;
        if (p.y > 85) opacity *= (100 - p.y) / 15;
        if (p.y < 20) opacity *= p.y / 20;

        el.style.transform = `translate(0,0) rotate(${p.rotation}deg)`;
        el.style.left = `${p.x}%`;
        el.style.top = `${p.y}%`;
        el.style.opacity = String(opacity);
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      els.forEach(el => el.remove());
      particles.current = [];
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    />
  );
}
