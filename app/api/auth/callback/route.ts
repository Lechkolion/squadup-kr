import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/browse';

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Upsert profile from Discord data
      const discordUser = data.user;
      const metadata = discordUser.user_metadata;

      await supabase.from('profiles').upsert({
        discord_id: discordUser.id,
        username: metadata?.full_name || metadata?.name || metadata?.custom_claims?.global_name || 'Gamer',
        discriminator: metadata?.custom_claims?.discriminator || null,
        avatar_url: metadata?.avatar_hash || null,
        updated_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      }, { onConflict: 'discord_id', ignoreDuplicates: false });

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=true', requestUrl.origin));
}
