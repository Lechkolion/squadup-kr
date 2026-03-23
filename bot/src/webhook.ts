import http from 'http';
import { squadFormedEmbed } from './utils/embeds';
import { getSupabase, assignGameRoles } from './utils/api';

let botClient: any = null;

export function setBotClient(client: any) {
  botClient = client;
}

export function startWebhookServer() {
  const port = parseInt(process.env.BOT_WEBHOOK_PORT || '3002');
  const secret = process.env.SQUADUP_API_SECRET;

  const server = http.createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/webhook') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const authHeader = req.headers['authorization'];
    if (!secret || authHeader !== `Bearer ${secret}`) {
      res.writeHead(401);
      res.end('Unauthorized');
      return;
    }

    let body = '';
    for await (const chunk of req) body += chunk;

    let payload: any;
    try {
      payload = JSON.parse(body);
    } catch {
      res.writeHead(400);
      res.end('Bad JSON');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));

    // Handle webhook types
    handleWebhookPayload(payload).catch(err => console.error('Webhook handler error:', err));
  });

  server.listen(port, () => {
    console.log(`🔗 Webhook server running on port ${port}`);
  });
}

async function handleWebhookPayload(payload: { type: string; data: any }) {
  const { type, data } = payload;
  const guildId = process.env.DISCORD_GUILD_ID!;
  const squadsChannelId = process.env.DISCORD_BOT_CHANNEL_SQUADS_FORMED!;
  const appUrl = process.env.SQUADUP_API_URL || 'https://squadup-kr.up.railway.app';

  if (type === 'squad_accepted') {
    const { userA, userB, games, discordIdA, discordIdB, profileIdA, profileIdB } = data;

    // DM both users
    try {
      const memberA = await botClient?.users.fetch(discordIdA);
      if (memberA) {
        await memberA.send(
          `🎉 **Squad formed!** **${userB}** accepted your request!\n` +
          `Discord: Connect via SquadUp KR 👉 ${appUrl}/profile/${profileIdB}`
        );
      }
    } catch {}

    try {
      const memberB = await botClient?.users.fetch(discordIdB);
      if (memberB) {
        await memberB.send(
          `🎉 **Squad formed!** **${userA}** wants to play with you!\n` +
          `Discord: Connect via SquadUp KR 👉 ${appUrl}/profile/${profileIdA}`
        );
      }
    } catch {}

    // Post in #squads-formed
    if (squadsChannelId && botClient) {
      try {
        const guild = await botClient.guilds.fetch(guildId);
        const channel = await guild.channels.fetch(squadsChannelId);
        if (channel?.isTextBased()) {
          const embed = squadFormedEmbed(userA, userB, games || []);
          await channel.send({ embeds: [embed] });
        }
      } catch (err) {
        console.error('Squads channel error:', err);
      }
    }

    // Assign game roles
    if (botClient && data.gamesA) {
      await assignGameRoles(guildId, discordIdA, data.gamesA, botClient);
    }
    if (botClient && data.gamesB) {
      await assignGameRoles(guildId, discordIdB, data.gamesB, botClient);
    }
  }

  if (type === 'profile_complete') {
    const { discordId, games } = data;
    if (botClient && games) {
      await assignGameRoles(guildId, discordId, games, botClient);
    }
  }
}
