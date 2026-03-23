import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getLeaderboard } from '../utils/api';
import { leaderboardEmbed } from '../utils/embeds';

export const leaderboardCommand = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the SquadUp KR leaderboard | 리더보드 보기')
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Leaderboard type')
        .setRequired(false)
        .addChoices(
          { name: 'Most Connections 🤝', value: 'connections' },
          { name: 'Most Active ⚡', value: 'active' },
          { name: 'Most Helpful 💪', value: 'helpful' },
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const type = (interaction.options.getString('type') || 'connections') as 'connections' | 'active' | 'helpful';

    const titles: Record<string, string> = {
      connections: 'Most Connections This Week',
      active: 'Most Active Players',
      helpful: 'Most Helpful Players',
    };

    const entries = await getLeaderboard(type);
    await interaction.editReply({
      embeds: [leaderboardEmbed(titles[type], entries)],
    });
  },
};
