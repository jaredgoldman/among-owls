"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRegistration = void 0;
// Discord
const builders_1 = require("@discordjs/builders");
// Data
const database_service_1 = require("../database/database.service");
// Helpers
const algorand_1 = require("../utils/algorand");
const helpers_1 = require("../utils/helpers");
const user_1 = __importDefault(require("../models/user"));
// Globals
const optInAssetId = Number(process.env.OPT_IN_ASSET_ID);
const unitName = process.env.UNIT_NAME;
module.exports = {
    data: new builders_1.SlashCommandBuilder()
        .setName('register')
        .setDescription('register for When AOWLS Attack')
        .addStringOption((option) => option
        .setName('address')
        .setDescription('enter the your wallet address')
        .setRequired(true)),
    enabled: true,
    async execute(interaction) {
        if (!interaction.isChatInputCommand())
            return;
        const { user, options } = interaction;
        const maxAssets = 20;
        // TODO: add ability to register for different games here
        const address = options.getString('address');
        if (address && !/^[a-zA-Z0-9]{58}$/.test(address)) {
            return interaction.reply({
                content: 'Please enter a valid Algorand wallet address',
                ephemeral: true,
            });
        }
        const { username, id } = user;
        await interaction.deferReply({ ephemeral: true });
        await interaction.followUp({
            content: 'Thanks for registering! This might take a while! Please check back in a few minutes',
            ephemeral: true,
        });
        if (address) {
            const { status, registeredUser, asset } = await (0, exports.processRegistration)(username, id, address, maxAssets);
            // add permissions if succesful
            if (registeredUser && asset) {
                (0, helpers_1.addRole)(interaction, process.env.REGISTERED_ID, registeredUser);
            }
            await interaction.followUp({
                ephemeral: true,
                content: status,
            });
        }
    },
};
const processRegistration = async (username, discordId, address, maxAssets) => {
    var _a, _b, _c;
    try {
        // Attempt to find user in db
        let user = (await ((_a = database_service_1.collections.users) === null || _a === void 0 ? void 0 : _a.findOne({
            discordId,
        })));
        // Check to see if wallet has opt-in asset
        // Retreive assetIds from specific collections
        const { walletOwned, nftsOwned, hootOwned } = await (0, algorand_1.determineOwnership)(address, maxAssets);
        const keyedNfts = {};
        nftsOwned.forEach((nft) => {
            keyedNfts[nft.assetId] = nft;
        });
        if (!(nftsOwned === null || nftsOwned === void 0 ? void 0 : nftsOwned.length)) {
            return {
                status: `You have no ${unitName}s in this wallet. Please try again with a different address`,
            };
        }
        if (!walletOwned) {
            return {
                status: `Looks like you haven't opted in to to asset ${optInAssetId}. Please opt in on Rand Gallery by using this link: https://www.randgallery.com/algo-collection/?address=${optInAssetId}`,
            };
        }
        // If user doesn't exist, add to db and grab instance
        if (!user) {
            const userEntry = new user_1.default(username, discordId, address, keyedNfts, hootOwned);
            const { acknowledged, insertedId } = await ((_b = database_service_1.collections.users) === null || _b === void 0 ? void 0 : _b.insertOne(userEntry));
            if (acknowledged) {
                user = (await ((_c = database_service_1.collections.users) === null || _c === void 0 ? void 0 : _c.findOne({
                    _id: insertedId,
                })));
            }
            else {
                return {
                    status: 'Something went wrong during registration, please try again',
                };
            }
        }
        else {
            await database_service_1.collections.users.findOneAndUpdate({ _id: user._id }, { $set: { assets: keyedNfts, address: address } });
        }
        return {
            status: `Registration complete! Enjoy the game.`,
            registeredUser: user,
        };
    }
    catch (error) {
        console.log('ERROR::', error);
        return {
            status: 'Something went wrong during registration, please try again',
        };
    }
};
exports.processRegistration = processRegistration;
