import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getProfileByDiscordId } from '../utils/api';
import { profileEmbed } from '../utils/embeds';

export const profileCommand = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your SquadUp KR profile | 내 프로필 보기'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const appUrl = process.env.SQUADUP_API_URL || 'https://squadup-kr.up.railway.app';
    const profile = await getProfileByDiscordId(interaction.user.id);

    if (!profile) {
      const embed = new EmbedBuilder()
        .setColor(0x00f5ff)
        .setTitle('🎮 No Profile Found')
        .setDescription(
          `You haven't created a SquadUp KR profile yet!\n아직 프로필이 없습니다!\n\n**Create yours here:** ${appUrl}\n\n화이팅! 🎮`
        )
        .setFooter({ text: 'SquadUp KR' });
      return interaction.editReply({ embeds: [embed] });
    }

    await interaction.editReply({ embeds: [profileEmbed(profile, appUrl)] });
  },
};
