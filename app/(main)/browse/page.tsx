import { Suspense } from 'react';
import { BrowseClient } from '@/components/browse/BrowseClient';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function BrowsePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let myProfile = null;
  let myRanks: any[] = [];

  if (user) {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('discord_id', user.id)
      .single();
    myProfile = p;

    if (p) {
      const { data: r } = await supabase
        .from('game_ranks')
        .select('game_key, rank_label')
        .eq('profile_id', p.id);
      myRanks = r || [];
    }
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="font-orbitron text-[var(--cyan)] text-sm animate-pulse">Loading gamers...</div>
        </div>
      }
    >
      <BrowseClient myProfile={myProfile} myRanks={myRanks} />
    </Suspense>
  );
}
