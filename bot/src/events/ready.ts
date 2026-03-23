import { Client } from 'discord.js';

export function readyHandler(client: Client<true>) {
  console.log(`✅ SquadBot ready! Logged in as ${client.user.tag}`);
  client.user.setActivity('팀 찾는 중... 🎮', { type: 0 });
}
