import {
  ClientUser,
  Interaction,
  MessageAttachment,
  User as DiscordUser,
} from 'discord.js'
import Game from '../models/game'
import User from '../models/user'
import { EmbedData } from '../types/game'
import doEmbed from '../embeds'
import doAttackCanvas from '../canvas/attackCanvas'
import {
  wait,
  handleRolledRecently,
  mapPlayersForEmbed,
  handleWin,
  randomNumber,
  determineWin,
} from '../utils/helpers'
import { removeAllPlayers } from '../database/operations'
import { Canvas } from 'canvas'
import { collections } from '../database/database.service'
import { WithId } from 'mongodb'

// Settings
const coolDownInterval = 5000
const messageDeleteInterval = 7000

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

  if (victimId === attackerId) {
    return interaction.reply({
      content: `Owls are supposed to be wise, but you’re clearly not. You can’t attack yourself!`,
      ephemeral: true,
    })
  }

  const victim = game.players[victimId] ? game.players[victimId] : null
  const attacker = game.players[attackerId] ? game.players[attackerId] : null

  if (attacker?.timedOut) {
    return interaction.reply({
      content: `Unfortunately, you've timed out due to inactivty.`,
      ephemeral: true,
    })
  }

  if (victim?.timedOut) {
    return interaction.reply({
      content: 'Unfortunately, this player has timed out due to inactivity',
      ephemeral: true,
    })
  }

  if (!attacker) {
    return interaction.reply({
      content: 'Please register by using the /register slash command to attack',
      ephemeral: true,
    })
  }

  if (!victim) {
    return interaction.reply({
      content:
        'Intended victim is currently not registered, please try attacking another player',
      ephemeral: true,
    })
  }

  if (attacker.coolDownTimeLeft && attacker.coolDownTimeLeft > 0) {
    return interaction.reply({
      content: `HOO do you think you are? It’s not your turn! Wait ${
        attacker.coolDownTimeLeft / 1000
      } seconds`,
      ephemeral: true,
    })
  }

  const damage = Math.floor(Math.random() * (hp / 2))
  // const damage = 1000
  victim.hp -= damage

  let victimDead = false
  if (victim.hp <= 0) {
    // if victim is dead, delete from game
    delete game.players[victimId]
    victimDead = true
  }

  const playerArr = Object.values(game.players)

  const isWin = determineWin(playerArr)

  // if there is only one player left, the game has been won
  if (isWin && game.active) {
    handleWin(playerArr, interaction)
  }

  const { username: victimName } = victim
  const { username: attackerName, asset } = attacker

  // do canvas with attacker, hp drained and victim
  const canvas: Canvas = await doAttackCanvas(
    damage,
    asset,
    victimName,
    attackerName
  )

  const attachment = victimDead
    ? new MessageAttachment('src/images/death.gif', 'death.gif')
    : new MessageAttachment(canvas.toBuffer('image/png'), 'attacker.png')

  await interaction.reply({
    files: [attachment],
    content: victimDead
      ? `${attacker.asset.assetName} took ${victim.username} in one fell swoop. Owls be swoopin'`
      : getAttackString(attacker.asset.assetName, victim.username, damage),
  })

  handleRolledRecently(attacker, coolDownInterval)

  const embedData: EmbedData = {
    color: 'RED',
    fields: mapPlayersForEmbed(playerArr),
    image: undefined,
  }
  // if lose, remove loser from players and play game again
  await game.embed.edit(doEmbed(embedData))
  await wait(messageDeleteInterval)
  await interaction.deleteReply()
}

const attackStrings = [
  'HOOT, HOOT! {assetName} slashes at {victimName} for {damage} damage',
  'HI-YAH!. {assetName} karate chops at {victimName} for {damage} damage',
  'SCREEEECH!. {assetName} chucks ninja stars at {victimName} for {damage} damage',
  'HMPH!. {assetName} throws a spear at {victimName} for {damage} damage',
  'SL-SL-SL-IIICE!. {assetName} slices and dices you {victimName} for {damange} damage',
]

const getAttackString = (
  assetName: string,
  victimName: string,
  damage: number
) => {
  return attackStrings[randomNumber(0, attackStrings.length)]
    .replace('{assetName}', assetName)
    .replace('{victimName}', victimName)
    .replace('{damage}', damage.toString())
}
