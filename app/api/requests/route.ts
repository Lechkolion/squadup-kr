import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('discord_id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const type = request.nextUrl.searchParams.get('type') || 'incoming';

  const { data, error } = await supabase
    .from('squad_requests')
    .select(`
      *,
      from_profile:from_profile_id(id, username, discord_id, avatar_url, games, play_styles, languages, active_hours_start, active_hours_end),
      to_profile:to_profile_id(id, username, discord_id, avatar_url, games)
    `)
    .eq(type === 'incoming' ? 'to_profile_id' : 'from_profile_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ requests: data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { to_profile_id, message } = body;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('discord_id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { error } = await supabase.from('squad_requests').insert({
    from_profile_id: profile.id,
    to_profile_id,
    message: message?.slice(0, 200) || null,
    status: 'pending',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create notification
  await supabase.from('notifications').insert({
    profile_id: to_profile_id,
    type: 'squad_request',
    from_profile_id: profile.id,
  });

  return NextResponse.json({ ok: true });
}
