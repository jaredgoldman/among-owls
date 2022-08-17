// Discord
import { ButtonInteraction } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'

import { games } from '../index'
import { updateGame } from '../utils/helpers'

module.exports = {
  data: new SlashCommandBuilder()
    .setName('withdraw-player')
    .setDescription('Withdraw an active player'),
  async execute(interaction: ButtonInteraction) {
    try {
      if (!interaction.isButton()) return
      const { channelId } = interaction
      const game = games[channelId]
      if (!game.waitingRoom) return

      const { user } = interaction
      const { id } = user

      const player = game?.players[id]

      if (player) {
        delete game.players[id]

        interaction.reply({
          ephemeral: true,
          content: `${player.asset.alias || player.asset.assetName} removed`,
        })
        updateGame(channelId)
      } else {
        interaction.reply({
          ephemeral: true,
          content: 'You have no AOWLs to withdraw',
        })
      }
    } catch (error) {
      console.log('****** WITHDRAW ERROR ******')
      console.log(error)
    }
  },
}
