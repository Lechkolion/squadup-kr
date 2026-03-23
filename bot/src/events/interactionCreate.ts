import { Collection, Interaction } from 'discord.js';
import { squadEmbed } from '../utils/embeds';

export async function interactionCreateHandler(
  interaction: Interaction,
  commands: Collection<string, any>
) {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({
      embeds: [squadEmbed('Unknown Command', 'This command does not exist.')],
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Command error [${interaction.commandName}]:`, err);
    const reply = {
      embeds: [squadEmbed('Error', '명령어 실행 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')],
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}
