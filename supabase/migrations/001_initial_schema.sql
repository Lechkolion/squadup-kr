-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  discord_id text unique not null,
  username text not null,
  discriminator text,
  avatar_url text,
  bio text check (char_length(bio) <= 280),
  games text[] default '{}',
  play_styles text[] default '{}',
  languages text[] default '{}',
  active_hours_start int default 20,
  active_hours_end int default 2,
  is_online boolean default false,
  show_online_status boolean default true,
  discord_server_joined boolean default false,
  profile_complete boolean default false,
  region text default 'Korea',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_seen timestamptz default now()
);

-- GAME RANKS (one row per game per user)
create table game_ranks (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  game_key text not null,
  rank_label text,
  hours_played int,
  unique(profile_id, game_key)
);

-- SQUAD REQUESTS
create table squad_requests (
  id uuid primary key default uuid_generate_v4(),
  from_profile_id uuid references profiles(id) on delete cascade,
  to_profile_id uuid references profiles(id) on delete cascade,
  message text check (char_length(message) <= 200),
  status text default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(from_profile_id, to_profile_id)
);

-- CONNECTIONS (mutual accepted pairs)
create table connections (
  id uuid primary key default uuid_generate_v4(),
  profile_a_id uuid references profiles(id) on delete cascade,
  profile_b_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(profile_a_id, profile_b_id)
);

-- NOTIFICATIONS
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  type text not null,
  from_profile_id uuid references profiles(id),
  read boolean default false,
  created_at timestamptz default now()
);

-- ONLINE PRESENCE
create table presence (
  profile_id uuid primary key references profiles(id) on delete cascade,
  last_heartbeat timestamptz default now(),
  current_game text
);

-- RLS POLICIES
alter table profiles enable row level security;
alter table game_ranks enable row level security;
alter table squad_requests enable row level security;
alter table connections enable row level security;
alter table notifications enable row level security;
alter table presence enable row level security;

-- Profiles: anyone can read, only owner can write
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid()::text = discord_id);
create policy "Users can update own profile" on profiles for update using (auth.uid()::text = discord_id);

-- Game ranks: public read, owner write
create policy "Game ranks viewable by everyone" on game_ranks for select using (true);
create policy "Users can manage own game ranks" on game_ranks for all using (
  profile_id in (select id from profiles where discord_id = auth.uid()::text)
);

-- Squad requests: parties involved can read
create policy "Users can see their own requests" on squad_requests for select using (
  from_profile_id in (select id from profiles where discord_id = auth.uid()::text) or
  to_profile_id in (select id from profiles where discord_id = auth.uid()::text)
);
create policy "Users can create requests" on squad_requests for insert with check (
  from_profile_id in (select id from profiles where discord_id = auth.uid()::text)
);
create policy "Users can update received requests" on squad_requests for update using (
  to_profile_id in (select id from profiles where discord_id = auth.uid()::text)
);

-- Connections: public read
create policy "Connections are viewable by everyone" on connections for select using (true);
create policy "System can insert connections" on connections for insert with check (true);

-- Notifications: owner only
create policy "Users can see own notifications" on notifications for select using (
  profile_id in (select id from profiles where discord_id = auth.uid()::text)
);
create policy "System can insert notifications" on notifications for insert with check (true);
create policy "Users can mark own notifications read" on notifications for update using (
  profile_id in (select id from profiles where discord_id = auth.uid()::text)
);

-- Presence: public read, owner write
create policy "Presence is public" on presence for select using (true);
create policy "Users can upsert own presence" on presence for all using (
  profile_id in (select id from profiles where discord_id = auth.uid()::text)
);

-- Realtime
alter publication supabase_realtime add table presence;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table squad_requests;
alter publication supabase_realtime add table profiles;

-- Indexes for performance
create index idx_profiles_games on profiles using gin(games);
create index idx_profiles_is_online on profiles(is_online);
create index idx_profiles_languages on profiles using gin(languages);
create index idx_game_ranks_profile_id on game_ranks(profile_id);
create index idx_squad_requests_to_profile on squad_requests(to_profile_id, status);
create index idx_squad_requests_from_profile on squad_requests(from_profile_id);
create index idx_notifications_profile on notifications(profile_id, read);
create index idx_connections_a on connections(profile_a_id);
create index idx_connections_b on connections(profile_b_id);
