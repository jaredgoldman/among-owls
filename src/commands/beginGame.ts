import { SlashCommandBuilder } from '@discordjs/builders'
import { ButtonInteraction } from 'discord.js'
import { game } from '..'
import settings from '../settings'

module.exports = {
  data: new SlashCommandBuilder()
    .setName('begin-game')
    .setDescription('begin the game'),
  async execute(interaction: ButtonInteraction) {
    const { user } = interaction
    const { minCapacity } = settings
    const playerArr = Object.values(game.players)

    if (playerArr.length < minCapacity) {
      game.waitingRoom = false
      interaction.reply({
        content: `${user.username} has started the game`,
      })
      setTimeout(() => {
        interaction.deleteReply()
      }, 5000)
    } else {
      interaction.reply({
        content: `You can't start with less than two players`,
        ephemeral: true,
      })
    }
  },
}
