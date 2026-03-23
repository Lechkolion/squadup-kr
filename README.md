# SquadUp KR 🎮

**The squad finder built for Korean gamers.**
한국 게이머를 위한 최고의 팀 찾기 플랫폼.

Discord OAuth로 로그인하고, 게임 프로필을 만들고, 딱 맞는 팀원을 찾으세요.

---

## Features

- 🎮 8 supported games: LoL, Valorant, OW2, PUBG, SC2, Lost Ark, FIFA Online 4, Slay the Spire 2
- 🤖 Smart matching algorithm (games, rank, play style, active hours, language)
- 💬 Discord OAuth — no email/password needed
- ⚡ Real-time online presence and notifications
- 🤖 Discord bot with slash commands (`/find`, `/profile`, `/status`, `/leaderboard`, `/squad`)
- 🌐 Korean/English bilingual interface
- 📊 Leaderboard and squad connection tracking

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend/DB**: Supabase (PostgreSQL + Realtime + Auth)
- **Auth**: Discord OAuth 2.0 via Supabase
- **Bot**: Discord.js v14, Node.js
- **Hosting**: Railway (two services: website + bot)

---

## Setup Guide

### Prerequisites

- Node.js 20+
- A Railway account (railway.app)
- A Supabase account (supabase.com)
- A Discord account and server

---

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and click **New Project**
2. Name it `squadup-kr`, choose a strong password, pick region **Northeast Asia (Seoul)** for best KR latency
3. Wait for it to spin up (~2 minutes)
4. Go to **Settings → API** and copy:
   - `Project URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → this is `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)
5. Go to **SQL Editor** and paste the entire contents of `supabase/migrations/001_initial_schema.sql`, then click **Run**

---

### Step 2 — Create a Discord Application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application**, name it `SquadUp KR`
3. Go to **OAuth2 → General**:
   - Copy `Client ID` → this is `DISCORD_CLIENT_ID`
   - Click **Reset Secret** and copy it → this is `DISCORD_CLIENT_SECRET`
   - Under **Redirects**, add: `https://YOUR-RAILWAY-URL.up.railway.app/api/auth/callback`
   - Also add `http://localhost:3000/api/auth/callback` for local dev
4. Go to **Bot**:
   - Click **Add Bot**
   - Click **Reset Token** and copy it → this is `DISCORD_BOT_TOKEN`
   - Under **Privileged Gateway Intents**, enable:
     - ✅ Server Members Intent
     - ✅ Message Content Intent
5. Invite the bot to your server with this URL (replace CLIENT_ID):
   ```
   https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
   ```

---

### Step 3 — Set Up Supabase Auth for Discord

1. In Supabase dashboard, go to **Authentication → Providers**
2. Find **Discord** and enable it
3. Enter your `Discord Client ID` and `Discord Client Secret`
4. Set **Redirect URL** to: `https://YOUR-RAILWAY-URL.up.railway.app/api/auth/callback`
5. Click **Save**

---

### Step 4 — Set Up Your Discord Server Channels

Create these channels in your Discord server:

**Text Channels:**
- `📢 announcements`
- `👋 arrivals`
- `🔥 squads-formed`
- `💬 general`
- `🎮 lol-lounge`
- `🔫 valorant-lounge`
- `🦸 overwatch-lounge`
- `🐔 pubg-lounge`
- `🚀 starcraft-lounge`
- `⚓ lostark-lounge`
- `⚽ fifa-lounge`
- `🃏 slay-the-spire-community`

**Voice Channels:**
- `🎙️ Looking for Squad`
- `🎙️ Squad Room 1` through `🎙️ Squad Room 5`

**Create these roles** (exact names):
- `Newcomer`
- `LoL-Player`
- `Valorant-Player`
- `PUBG-Player`
- `OW2-Player`
- `SC2-Player`
- `LostArk-Player`
- `FIFA-Player`
- `StS2-Community`

**Get channel IDs:** Right-click a channel → Copy Channel ID (enable Developer Mode in Discord settings first: User Settings → Advanced → Developer Mode ✅)

---

### Step 5 — Deploy to Railway

#### Website Service

```bash
cd squadup-kr

# Login to Railway
railway login

# Create a new project
railway init

# Deploy
railway up
```

After deploying, go to Railway dashboard:
1. Click your service → **Variables** tab
2. Add all these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=         # from Step 1
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # from Step 1
SUPABASE_SERVICE_ROLE_KEY=        # from Step 1

DISCORD_CLIENT_ID=                # from Step 2
DISCORD_CLIENT_SECRET=            # from Step 2
DISCORD_REDIRECT_URI=https://YOUR-URL.up.railway.app/api/auth/callback

NEXT_PUBLIC_APP_URL=https://YOUR-URL.up.railway.app
NEXT_PUBLIC_DISCORD_INVITE=https://discord.gg/YOUR-INVITE

SQUADUP_API_SECRET=make-up-a-long-random-string-here
```

3. Also go to **Settings → Deploy** and set:
   - **Dockerfile Path**: `Dockerfile`
   - **Health Check Path**: `/api/health`

#### Bot Service

```bash
cd squadup-kr/bot

# Link to the same Railway project but as a new service
railway service create squadup-kr-bot
railway up
```

Add bot environment variables:

```
DISCORD_BOT_TOKEN=                # from Step 2
DISCORD_CLIENT_ID=                # from Step 2
DISCORD_GUILD_ID=                 # Your Discord server ID (right-click server → Copy Server ID)
DISCORD_BOT_CHANNEL_SQUADS_FORMED=  # Channel ID for #squads-formed
DISCORD_BOT_CHANNEL_GENERAL=     # Channel ID for #general
DISCORD_BOT_CHANNEL_ARRIVALS=    # Channel ID for #arrivals

NEXT_PUBLIC_SUPABASE_URL=        # same as above
SUPABASE_SERVICE_ROLE_KEY=       # same as above
SQUADUP_API_URL=https://YOUR-WEBSITE-URL.up.railway.app
SQUADUP_API_SECRET=              # same secret as website
```

Set bot service Dockerfile path: `bot/Dockerfile`

---

### Step 6 — Update Supabase Redirect URL

After Railway gives you your final URL:
1. Go back to Supabase → **Authentication → Providers → Discord**
2. Update the Redirect URL to your actual Railway URL
3. Go to Discord Developer Portal → your app → OAuth2 → add the Railway URL as a redirect

---

### Step 7 — Verify Everything Works

1. Visit your Railway URL → you should see the SquadUp KR landing page
2. Click **Login with Discord** → you should be redirected to Discord and back
3. Create your profile at `/me`
4. In your Discord server, type `/profile` — the bot should respond

---

## Local Development

```bash
# Clone / open project
cd squadup-kr

# Install dependencies
npm install

# Copy env file and fill it in
cp .env.example .env.local

# Run dev server
npm run dev
```

For the bot locally:
```bash
cd bot
npm install
cp ../.env.example .env
# fill in .env
npm run dev
```

---

## Troubleshooting

**"Discord OAuth redirect URI mismatch"**
→ Make sure the exact URL (including `/api/auth/callback`) is added to both Supabase Auth → Discord provider AND Discord Developer Portal → OAuth2 Redirects.

**Bot not responding to slash commands**
→ Slash commands take up to 1 hour to propagate to Discord after registration. Try `/profile` first.

**"Service role key" errors**
→ Never expose `SUPABASE_SERVICE_ROLE_KEY` publicly. It should only be in Railway backend env vars, never in `NEXT_PUBLIC_` variables.

**Online status not updating**
→ The heartbeat runs every 30 seconds. Make sure your Supabase Realtime is enabled (it is by default).

**Bot DMs not sending**
→ Some users have DMs disabled from non-friends. This is expected — the bot gracefully ignores these errors.

---

## Architecture

```
squadup-kr/
├── app/              Next.js 14 App Router pages + API routes
├── components/       React components (UI, cards, forms, layout, effects)
├── lib/              Supabase clients, matching algorithm, game config, utils
├── messages/         i18n translations (en.json + ko.json)
├── supabase/         SQL migration files
├── bot/              Discord bot (separate Node.js process)
└── public/           Static assets
```

**Data flow:**
1. User logs in via Discord OAuth → Supabase creates auth session → profile upserted
2. User creates profile → stored in Supabase `profiles` + `game_ranks` tables
3. Browse page queries profiles with filters → match score calculated client-side
4. Squad request → stored in `squad_requests` → notification created → realtime pushes to recipient
5. Request accepted → `connections` record created → bot webhook triggered → bot DMs both users
6. Presence heartbeat → every 30s updates `presence` table → realtime broadcasts online status

---

## License

MIT — feel free to fork and adapt for your gaming community.

---

*Made with ❤️ for Korean gamers | 한국 게이머들을 위해 만든 서비스 🎮*
