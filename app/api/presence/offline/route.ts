import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: true });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('discord_id', user.id)
    .single();

  if (profile) {
    await supabase.from('profiles').update({ is_online: false }).eq('id', profile.id);
  }

  return NextResponse.json({ ok: true });
}
