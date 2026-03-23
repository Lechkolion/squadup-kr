'use client';

import { useEffect } from 'react';

export function Heartbeat() {
  useEffect(() => {
    const beat = () => {
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch(() => {});
    };

    beat(); // Immediate
    const interval = setInterval(beat, 30_000); // Every 30s

    const handleUnload = () => {
      // Best effort offline signal
      navigator.sendBeacon('/api/presence/offline');
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return null;
}
