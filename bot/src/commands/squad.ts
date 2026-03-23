import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getProfileByDiscordId, getSupabase } from '../utils/api';

export const squadCommand = {
  data: new SlashCommandBuilder()
    .setName('squad')
    .setDescription('View your squad connections | 내 스쿼드 보기'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const appUrl = process.env.SQUADUP_API_URL || 'https://squadup-kr.up.railway.app';
    const profile = await getProfileByDiscordId(interaction.user.id);

    if (!profile) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00f5ff)
            .setTitle('🎮 No Profile Found')
            .setDescription(`Create a profile first: ${appUrl}`),
        ],
      });
    }

    const sb = getSupabase();
    const { data: connections } = await sb
      .from('connections')
      .select('profile_a:profile_a_id(username, games), profile_b:profile_b_id(username, games)')
      .or(`profile_a_id.eq.${profile.id},profile_b_id.eq.${profile.id}`)
      .limit(10);

    if (!connections || connections.length === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00f5ff)
            .setTitle('🎮 Your Squad')
            .setDescription(`You haven't formed any squads yet!\n스쿼드원이 없습니다.\n\nFind some players: ${appUrl}/browse`),
        ],
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x00f5ff)
      .setTitle('🎮 Your Squad')
      .setDescription(`You have **${connections.length}** squad connection${connections.length !== 1 ? 's' : ''}! 🔥`);

    connections.slice(0, 10).forEach((conn: any) => {
      const teammate = conn.profile_a?.username === profile.username
        ? conn.profile_b
        : conn.profile_a;
      if (teammate) {
        embed.addFields({
          name: teammate.username,
          value: (teammate.games || []).slice(0, 3).join(' · ') || 'No games set',
          inline: true,
        });
      }
    });

    embed.setFooter({ text: `SquadUp KR · ${appUrl}/dashboard` });

    await interaction.editReply({ embeds: [embed] });
  },
};
