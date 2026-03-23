import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getOnlinePlayers } from '../utils/api';

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

export const findCommand = {
  data: new SlashCommandBuilder()
    .setName('find')
    .setDescription('Find players for a specific game | 특정 게임 플레이어 찾기')
    .addStringOption(opt =>
      opt.setName('game')
        .setDescription('Select a game')
        .setRequired(true)
        .addChoices(
          ...Object.entries(GAMES).map(([k, v]) => ({ name: v, value: k }))
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const gameKey = interaction.options.getString('game', true);
    const gameName = GAMES[gameKey] || gameKey;
    const appUrl = process.env.SQUADUP_API_URL || 'https://squadup-kr.up.railway.app';

    const players = await getOnlinePlayers(gameKey);
    const sample = players.sort(() => Math.random() - 0.5).slice(0, 3);

    if (sample.length === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00f5ff)
            .setTitle(`🔍 Finding ${gameName} players...`)
            .setDescription(`No one is online right now for ${gameName}.\n더 많은 플레이어를 보려면: ${appUrl}/browse`)
            .setFooter({ text: 'SquadUp KR' }),
        ],
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x00f5ff)
      .setTitle(`🎮 ${gameName} Players Online`)
      .setDescription(`Here are ${sample.length} players looking for squad:\n팀 찾는 플레이어:`)
      .setFooter({ text: `SquadUp KR · Browse more: ${appUrl}/browse` });

    sample.forEach((p, i) => {
      embed.addFields({
        name: `${i + 1}. ${p.username}`,
        value: [
          p.bio ? `*"${p.bio.slice(0, 60)}..."*` : '',
          `[View Profile](${appUrl}/profile/${p.id})`,
        ].filter(Boolean).join('\n'),
        inline: false,
      });
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
