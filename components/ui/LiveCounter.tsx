'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function LiveCounter({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const supabase = createClient();

  useEffect(() => {
    const twoMinsAgo = () => new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const refresh = async () => {
      const { count: c } = await supabase
        .from('presence')
        .select('*', { count: 'exact', head: true })
        .gte('last_heartbeat', twoMinsAgo());
      if (c !== null) setCount(c);
    };

    const channel = supabase
      .channel('presence-counter')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, refresh)
      .subscribe();

    const interval = setInterval(refresh, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return <span>{count} GAMERS ONLINE</span>;
}
