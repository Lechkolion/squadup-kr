import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = request.nextUrl;

  const page = parseInt(searchParams.get('page') || '0');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const onlineOnly = searchParams.get('online') === 'true';
  const games = searchParams.get('games')?.split(',').filter(Boolean) || [];
  const languages = searchParams.get('languages')?.split(',').filter(Boolean) || [];
  const search = searchParams.get('search') || '';

  let query = supabase
    .from('profiles')
    .select('*, presence(last_heartbeat, current_game)', { count: 'exact' })
    .range(page * limit, (page + 1) * limit - 1)
    .order('last_seen', { ascending: false });

  if (onlineOnly) query = query.eq('is_online', true);
  if (games.length) query = query.overlaps('games', games);
  if (languages.length) query = query.overlaps('languages', [...languages, 'both']);
  if (search) query = query.ilike('username', `%${search}%`);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profiles: data, total: count, page, limit });
}
