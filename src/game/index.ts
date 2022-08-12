// Discord
import {
  AttachmentBuilder,
  SelectMenuBuilder,
  MessageOptions,
  ActionRowBuilder,
} from 'discord.js'
// Helpers
import { resetGame, wait } from '../utils/helpers'
import doEmbed from '../embeds'
import runGame from './runGame'
// Globals
import settings from '../settings'
import { game, channel } from '..'
// Schemas
import embeds from '../constants/embeds'
import Player from '../models/player'

export const startWaitingRoom = async (): Promise<void> => {
  const { maxCapacity } = settings
  let capacity = maxCapacity

  resetGame()

  game.megatron = await channel.send(
    doEmbed(embeds.waitingRoom) as MessageOptions
  )
  // Do waiting room
  game.waitingRoom = true
  let playerCount = 0
  const getPlayerCount = () => Object.values(game.players).length

  while (playerCount < capacity && game.waitingRoom) {
    if (game.update) {
      await game.megatron.edit(doEmbed(embeds.waitingRoom))
      playerCount = getPlayerCount()
    }
    await wait(1000)
  }

  if (game.waitingRoom) game.waitingRoom = false

  await wait(2000)

  // Do countdown
  // let countDown = 5
  // while (countDown >= 1) {
  //   await sendCountdown(countDown, channel)
  //   countDown--
  //   await wait(1500)
  // }

  const file = new AttachmentBuilder('src/images/main.gif')

  if (game.megatron) {
    await game.megatron.edit({
      files: [file],
      embeds: [],
      components: [],
      fetchReply: true,
    })
  }

  // start game
  game.active = true
  game.arena = await channel.send(doEmbed(embeds.activeGame) as MessageOptions)

  await sendVictimSelectMenu()

  runGame()
}

// const sendCountdown = async (countDown: number, channel: any) => {
//   try {
//     const imagePath = `src/images/${countDown}.png`
//     const countDownImage = new AttachmentBuilder(imagePath)
//     if (!game.megatron) {
//       game.megatron = await channel.send({
//         files: [countDownImage],
//         fetchReply: true,
//       })
//     } else {
//       await game.megatron.edit({ files: [countDownImage] })
//     }
//   } catch (error) {
//     console.log('ERROR WITH COUNTDOWN')
//     console.log(error)
//   }
// }

const sendVictimSelectMenu = async () => {
  const playerArr = Object.values(game.players)

  const victims = playerArr
    .filter((player: Player) => !player.timedOut && !player.dead)
    .map((player: Player) => ({
      label: `Attack ${player.username}`,
      description: ' ',
      value: player.discordId,
    }))

  const victimSelectMenu = new ActionRowBuilder().addComponents(
    new SelectMenuBuilder()
      .setCustomId('select-victim')
      .setPlaceholder('Attack a random victim')
      .addOptions([
        {
          label: `Attack a random victim`,
          description: ' ',
          value: 'random',
        },
        ...victims,
      ])
  )

  await channel.send({
    //@ts-ignore
    components: [victimSelectMenu],
  })
}
