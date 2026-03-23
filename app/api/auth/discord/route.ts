import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const redirect = request.nextUrl.searchParams.get('redirect') || '/browse';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: `${appUrl}/api/auth/callback?next=${encodeURIComponent(redirect)}`,
      scopes: 'identify guilds',
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL('/login?error=true', request.url));
  }

  return NextResponse.redirect(data.url);
}
