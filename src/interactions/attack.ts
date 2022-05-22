import {
  ClientUser,
  Interaction,
  MessageAttachment,
  User as DiscordUser,
} from 'discord.js'
import Game from '../models/game'
import { EmbedData } from '../types/game'
import doEmbed from '../embeds'
import doAttackCanvas from '../canvas/attackCanvas'
import { wait, handleRolledRecently } from '../utils/helpers'

const coolDownInterval = 1000

export default async function attack(
  interaction: Interaction,
  game: Game,
  user: DiscordUser,
  hp: number
) {
  if (!interaction.isCommand()) return
  const { options } = interaction

  const { id: victimId } = options.getUser('victim') as ClientUser
  const { id: attackerId } = user
  const victim = game.players[victimId] ? null : game.players[victimId]
  const attacker = game.players[attackerId] ? null : game.players[attackerId]

  if (!attacker) {
    return interaction.reply({
      content: 'Please register by using the /register slash command to attack',
      ephemeral: true,
    })
  }

  if (!victim) {
    return interaction.reply({
      content:
        'Intended victim is currently not registered for WOA, please try attacking another player',
      ephemeral: true,
    })
  }

  if (game.rolledRecently.has(attacker.discordId)) {
    return interaction.reply({
      content: 'Ah ah, still cooling down - wait your turn!',
      ephemeral: true,
    })
  }

  const playerArr = Object.values(game.players)
  const damage = Math.floor(Math.random() * (hp / 4))
  victim.hp -= damage

  // if victim is dead, delete from game
  if (victim.hp <= 0) {
    delete game.players[victimId]
  }

  // if there is only one player left, the game has been won
  if (playerArr.length === 1) {
    const winner = playerArr[0]
    // handle win
    game.active = false

    const embedData: EmbedData = {
      title: 'WINNER!!!',
      description: `${winner.username}'s ${winner.asset.unitName} destroyed the competition`,
      color: 'DARK_AQUA',
    }

    game.embed.edit(doEmbed(embedData))
  }

  const { asset, username: victimName } = victim
  const { username: attackerName } = attacker

  // do canvas with attacker, hp drained and victim
  const canvas = await doAttackCanvas(damage, asset, victimName, attackerName)

  const attachment = new MessageAttachment(
    canvas.toBuffer('image/png'),
    'attacker.png'
  )

  await interaction.reply({
    files: [attachment],
    content: 'Test content for attack',
  })

  handleRolledRecently(attacker, game, coolDownInterval)

  const embedData: EmbedData = {
    title: '🔥🦉🔥 When AOWLS Attack 🔥🦉🔥',
    description: '💀 Who will survive? 💀',
    color: 'RED',
    thumbNail: 'https://www.randgallery.com/wp-content/uploads/2021/11/owl.jpg',
    image:
      'https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fweirdlystrange.com%2Fwp-content%2Fuploads%2F2015%2F12%2Fowl004.jpg&f=1&nofb=1',
    fields: playerArr.map((player) => ({
      name: player.username,
      value: `${player.asset.unitName} - HP: ${player.hp}`,
    })),
  }
  // if lose, remove loser from players and play game again
  await game.embed.edit(doEmbed(embedData))
  await wait(5000)
  await interaction.deleteReply()
}
