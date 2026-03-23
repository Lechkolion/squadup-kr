import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const currentGame = body?.current_game || null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('discord_id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  await supabase.from('presence').upsert({
    profile_id: profile.id,
    last_heartbeat: new Date().toISOString(),
    current_game: currentGame,
  });

  await supabase.from('profiles').update({
    is_online: true,
    last_seen: new Date().toISOString(),
  }).eq('id', profile.id);

  return NextResponse.json({ ok: true });
}
