"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../utils/helpers");
const embeds_1 = __importDefault(require("../embeds"));
const helpers_2 = require("../utils/helpers");
const builders_1 = require("@discordjs/builders");
const helpers_3 = require("../utils/helpers");
const __1 = require("..");
const settings_1 = __importDefault(require("../settings"));
const { minimumPlayers } = settings_1.default;
const roleId = process.env.ADMIN_ID;
module.exports = {
    data: new builders_1.SlashCommandBuilder()
        .setName('start')
        .setDescription('start When AOWLS Attack'),
    async execute(interaction) {
        if (!interaction.isCommand())
            return;
        const { user } = interaction;
        const hasRole = await (0, helpers_3.confirmRole)(roleId, interaction, user.id);
        if (!hasRole) {
            return await interaction.reply({
                content: 'Only administrators can use this command',
                ephemeral: true,
            });
        }
        if (__1.game === null || __1.game === void 0 ? void 0 : __1.game.active) {
            return await interaction.reply({
                content: 'A game is already running',
                ephemeral: true,
            });
        }
        // const players = (await collections.yaoPlayers
        //   .find({})
        //   .toArray()) as WithId<Player>[]
        // implement waiting room here
        await interaction.deferReply();
        let playerCount = 0;
        while (playerCount < minimumPlayers) {
            try {
                await (0, helpers_1.wait)(3000);
                console.log(Object.values(__1.game.players));
                playerCount = Object.values(__1.game.players).length;
                const waitingRoomEmbedData = {
                    image: undefined,
                    title: 'Waiting Room',
                    description: `${playerCount} ${playerCount === 1 ? 'player' : 'players'} have joined the game`,
                    isWaitingRoom: true,
                };
                // player clicks join, which sends them a list of the AOWLS they own and can select from
                // they are then sent a select menu, which
                await interaction.editReply((0, embeds_1.default)(waitingRoomEmbedData));
            }
            catch (error) {
                // @ts-ignore
                console.log('ERROR', error);
            }
            // implement countdown here
        }
        // if (players.length < 2) {
        //   return await interaction.reply({
        //     content: 'There are not enough players to start the game',
        //     ephemeral: true,
        //   })
        // }
        const gamePlayers = {};
        // empty image directory
        // emptyDir(imageDir)
        // if (players) {
        //   await asyncForEach(players, async (player: Player) => {
        //     const { username, discordId, address, asset, userId } = player
        //     // save each image locally for use later
        //     const localPath = await downloadFile(asset, imageDir, username)
        //     if (localPath) {
        //       const assetWithLocalPath: Asset = { ...asset, localPath }
        //       gamePlayers[discordId] = new Player(
        //         username,
        //         discordId,
        //         address,
        //         assetWithLocalPath,
        //         userId,
        //         hp,
        //         0
        //       )
        //     } else {
        //       // error downloading
        //       return await interaction.reply({
        //         content:
        //           'Error downloading assets from the blockchain, please try again',
        //         ephemeral: true,
        //       })
        //     }
        //   })
        // }
        const playerArr = Object.values(gamePlayers);
        // send back game embed
        const embedData = {
            image: undefined,
            fields: (0, helpers_2.mapPlayersForEmbed)(playerArr),
            description: 'Leaderboard',
            isMain: true,
        };
        console.log((0, embeds_1.default)(embedData));
        // const file = new MessageAttachment('src/images/main.gif')
        // // send embed here
        // await interaction.editReply({ files: [file] })
        // start game
        __1.game.players = gamePlayers;
        __1.game.active = true;
        __1.game.embed = await interaction.followUp((0, embeds_1.default)(embedData));
    },
};