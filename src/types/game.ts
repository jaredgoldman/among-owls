import { ColorResolvable, MessageEmbed } from 'discord.js'
import { Asset } from './user'
import { ClientUser } from 'discord.js'
import User from '../models/user'
export interface EmbedData {
  title?: string
  description?: string
  color?: ColorResolvable
  image?: string
  thumbNail?: string
  fields?: Field[]
}

type Field = {
  name: string
  value: string
}

export interface EmbedReply {
  embeds: [MessageEmbed]
  fetchReply: boolean
}

export interface AttackEvent {
  attacker: User
  victim: User
  damage: number
}
