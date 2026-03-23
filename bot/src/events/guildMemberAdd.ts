import { GuildMember, TextChannel } from 'discord.js';
import { squadEmbed } from '../utils/embeds';

export async function guildMemberAddHandler(member: GuildMember) {
  const appUrl = process.env.SQUADUP_API_URL || 'https://squadup-kr.up.railway.app';
  const arrivalsChannelId = process.env.DISCORD_BOT_CHANNEL_ARRIVALS;

  // DM the new member
  try {
    await member.send(
      `안녕하세요! 👾 **${member.guild.name}** 서버에 오신 것을 환영합니다!\n\n` +
      `SquadUp KR에서 프로필을 만들고 함께 플레이할 팀원을 찾아보세요!\n` +
      `Create your profile at **${appUrl}** to start finding your squad.\n\n` +
      `화이팅! 🎮`
    );
  } catch {
    // DMs may be disabled
  }

  // Assign @Newcomer role
  try {
    const newcomerRole = member.guild.roles.cache.find(r => r.name === 'Newcomer');
    if (newcomerRole) await member.roles.add(newcomerRole);
  } catch {}

  // Post in #arrivals
  if (arrivalsChannelId) {
    try {
      const channel = member.guild.channels.cache.get(arrivalsChannelId) as TextChannel;
      if (channel) {
        const embed = squadEmbed(
          'New Member!',
          `👋 Welcome **${member.user.username}** to the server!\n` +
          `Create your profile and find your squad: ${appUrl}/browse`
        );
        await channel.send({ embeds: [embed] });
      }
    } catch (err) {
      console.error('Arrivals channel error:', err);
    }
  }
}
