import { EmbedBuilder } from 'discord.js';

const BRAND_COLOR = 0x00f5ff;

export function squadEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle(`🎮 ${title}`)
    .setDescription(description)
    .setFooter({ text: 'SquadUp KR · 한국 게이머를 위한 팀 찾기' });
}

export function profileEmbed(profile: any, appUrl: string) {
  const gamesList = (profile.games || []).slice(0, 5).join(', ') || 'None set';
  const stylesList = (profile.play_styles || []).join(' · ') || 'None set';

  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle(`🎮 ${profile.username}'s Profile`)
    .setURL(`${appUrl}/profile/${profile.id}`)
    .setThumbnail(profile.avatar_url
      ? `https://cdn.discordapp.com/avatars/${profile.discord_id}/${profile.avatar_url}.png`
      : null
    )
    .addFields(
      { name: '🎮 Games', value: gamesList, inline: true },
      { name: '🏷️ Style', value: stylesList || '—', inline: true },
      { name: '🕐 Active', value: `${profile.active_hours_start}:00–${profile.active_hours_end}:00 KST`, inline: true },
    )
    .setDescription(profile.bio || '*No bio yet.*')
    .setFooter({ text: 'SquadUp KR · Find your squad' });
}

export function leaderboardEmbed(title: string, entries: Array<{ username: string; score: number }>) {
  const medals = ['🥇', '🥈', '🥉'];
  const lines = entries.slice(0, 10).map((e, i) => {
    const prefix = medals[i] ?? `**${i + 1}.**`;
    return `${prefix} **${e.username}** — ${e.score}`;
  });

  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle(`🏆 ${title}`)
    .setDescription(lines.join('\n') || 'No entries yet.')
    .setFooter({ text: 'SquadUp KR Leaderboard' });
}

export function squadFormedEmbed(userA: string, userB: string, games: string[]) {
  return new EmbedBuilder()
    .setColor(0x39ff14)
    .setTitle('🔥 New Squad Alert!')
    .setDescription(
      `**${userA}** and **${userB}** just formed a squad!\n${games.length > 0 ? `Games: ${games.join(' · ')}` : ''}\n화이팅! 🎮`
    )
    .setFooter({ text: 'SquadUp KR' });
}
