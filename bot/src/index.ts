import 'dotenv/config';
import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import * as cron from 'node-cron';
import { readyHandler } from './events/ready';
import { guildMemberAddHandler } from './events/guildMemberAdd';
import { interactionCreateHandler } from './events/interactionCreate';
import { findCommand } from './commands/find';
import { profileCommand } from './commands/profile';
import { statusCommand } from './commands/status';
import { leaderboardCommand } from './commands/leaderboard';
import { squadCommand } from './commands/squad';
import { startWebhookServer, setBotClient } from './webhook';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});

// Register commands
const commands = [findCommand, profileCommand, statusCommand, leaderboardCommand, squadCommand];
(client as any).commands = new Collection(commands.map(c => [c.data.name, c]));

// Events
client.once('ready', (c) => { setBotClient(client); readyHandler(c); });
client.on('guildMemberAdd', (member) => guildMemberAddHandler(member));
client.on('interactionCreate', (interaction) => interactionCreateHandler(interaction, (client as any).commands));

// Daily 8PM KST cron (11:00 UTC)
cron.schedule('0 11 * * *', async () => {
  const guildId = process.env.DISCORD_GUILD_ID!;
  const channelId = process.env.DISCORD_BOT_CHANNEL_GENERAL!;
  if (!channelId) return;

  try {
    const guild = await client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(channelId) as any;
    if (!channel?.isTextBased()) return;

    const appUrl = process.env.SQUADUP_API_URL || 'https://squadup-kr.up.railway.app';
    const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE || '';

    // Get online count from API
    let onlineCount = '?';
    try {
      const res = await fetch(`${appUrl}/api/health`);
      if (res.ok) onlineCount = '🎮';
    } catch {}

    await channel.send(
      `🌙 **Evening grind starting!** ${onlineCount} players online right now looking for squads.\n지금 팀 찾기: ${appUrl}/browse\n화이팅! 💪`
    );
  } catch (err) {
    console.error('Daily message error:', err);
  }
});

// Start webhook HTTP server
startWebhookServer();

client.login(process.env.DISCORD_BOT_TOKEN!);

// Register slash commands with Discord
async function registerCommands() {
  const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID!,
        process.env.DISCORD_GUILD_ID!
      ),
      { body: commands.map(c => c.data.toJSON()) }
    );
    console.log('Slash commands registered.');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
}

client.once('ready', registerCommands);
