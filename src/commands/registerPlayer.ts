// Discord
import { SelectMenuInteraction } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'
// Data
import { collections } from '../database/database.service'
// Schemas
import Asset from '../models/asset'
import { WithId } from 'mongodb'
import User from '../models/user'
import Player from '../models/player'
// Helpers
import { downloadFile, resetGame, updateGame, wait } from '../utils/helpers'
// Globals
import { game } from '../index'
import settings from '../settings'
import { updateTransactions } from '../utils/algorand'

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register-player')
    .setDescription('Register an active player'),
  async execute(interaction: SelectMenuInteraction) {
    try {
      if (!interaction.isSelectMenu()) return
      if (!game.waitingRoom) return

      const { values, user } = interaction
      const assetId = values[0]
      const { username, id } = user
      const { imageDir, hp, maxCapacity } = settings

      await interaction.deferReply({ ephemeral: true })

      const { assets, address, _id, coolDowns } =
        (await collections.users.findOne({
          discordId: user.id,
        })) as WithId<User>

      const asset = assets[assetId]

      if (!asset) {
        return
      }

      const coolDown = coolDowns ? coolDowns[assetId] : null

      if (coolDown && coolDown > Date.now()) {
        const minutesLeft = Math.floor((coolDown - Date.now()) / 60000)
        const minuteWord = minutesLeft === 1 ? 'minute' : 'minutes'
        return interaction.editReply({
          content: `Please wait ${minutesLeft} ${minuteWord} before playing ${asset.assetName} again`,
        })
      }

      let localPath

      try {
        localPath = await downloadFile(asset, imageDir, username)
      } catch (error) {
        console.log('download error', error)
      }

      if (!localPath) {
        return
      }

      const gameAsset = new Asset(
        asset.assetId,
        asset.assetName,
        asset.assetUrl,
        asset.unitName,
        _id,
        localPath,
        undefined,
        asset.alias
      )

      if (Object.values(game.players).length < maxCapacity) {
        game.players[id] = new Player(
          username,
          id,
          address,
          gameAsset,
          _id,
          hp,
          Object.values(assets).length,
          0
        )
        await interaction.editReply(
          `${asset.alias || asset.assetName} has entered the game`
        )
        updateGame()
      } else {
        await interaction.editReply(
          'Sorry, the game is at capacity, please wait until the next round'
        )
      }
    } catch (error) {
      console.log(error)
    }
  },
}
