'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Use placeholder values at build time — actual requests will fail gracefully
  // until real Supabase env vars are configured
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  return createBrowserClient(url, key);
}
