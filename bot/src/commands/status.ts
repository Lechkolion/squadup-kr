import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { setPresence } from '../utils/api';

const GAMES: Record<string, string> = {
  lol: 'League of Legends ⚔️',
  valorant: 'Valorant 🔫',
  overwatch2: 'Overwatch 2 🦸',
  pubg: 'PUBG 🐔',
  starcraft2: 'StarCraft II 🚀',
  lostark: 'Lost Ark ⚓',
  fifaonline4: 'FIFA Online 4 ⚽',
  slaythespire2: 'Slay the Spire 2 🃏',
};

export const statusCommand = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Set your current game status | 현재 플레이 중인 게임 설정')
    .addStringOption(opt =>
      opt.setName('game')
        .setDescription('Game you are currently playing')
        .setRequired(true)
        .addChoices(
          ...Object.entries(GAMES).map(([k, v]) => ({ name: v, value: k }))
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const gameKey = interaction.options.getString('game', true);
    const gameName = GAMES[gameKey];

    try {
      await setPresence(interaction.user.id, gameKey);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x39ff14)
            .setTitle('✅ Status Updated!')
            .setDescription(`You are now showing as playing **${gameName}** on SquadUp KR.\n프로필에서 현재 플레이 중인 게임이 업데이트되었습니다. 🎮`)
            .setFooter({ text: 'SquadUp KR' }),
        ],
      });
    } catch (err) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff2d78)
            .setTitle('❌ Error')
            .setDescription('Could not update status. Make sure you have a SquadUp KR profile.'),
        ],
      });
    }
  },
};
