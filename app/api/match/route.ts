import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { calculateMatchScore } from '@/lib/matching/algorithm';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('discord_id', user.id)
    .single();

  if (!myProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const targetId = request.nextUrl.searchParams.get('target');
  if (!targetId) return NextResponse.json({ error: 'target param required' }, { status: 400 });

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetId)
    .single();

  if (!targetProfile) return NextResponse.json({ error: 'Target not found' }, { status: 404 });

  const [{ data: myRanks }, { data: targetRanks }] = await Promise.all([
    supabase.from('game_ranks').select('game_key, rank_label').eq('profile_id', myProfile.id),
    supabase.from('game_ranks').select('game_key, rank_label').eq('profile_id', targetProfile.id),
  ]);

  const result = calculateMatchScore(myProfile, targetProfile, myRanks || [], targetRanks || []);

  return NextResponse.json(result);
}
