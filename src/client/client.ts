import mongoose from 'mongoose';
import { Client } from 'oceanic.js';
import config from '../config/config.js';
import { GoodbyeModel } from '../database/schemas/goodbye.js';
import { CodeJamModel } from '../database/schemas/jam.js';
import { TagModel } from '../database/schemas/tag.js';
import { WelcomeModel } from '../database/schemas/welcome.js';

/**
 * The Client Object for the bot by Oceanic.js
 *
 * This will not be mutated by us, and will only contain all native methods and properties from Oceanic.js
 *
 * The main manager class for the bot is found in Main.js and is called MainInstance.
 */
export const client = new Client({
	auth: `Bot ${config.BotToken}`,
	collectionLimits: {
		members: 500,
		messages: 0,
		users: 5_000
	},
	allowedMentions: {
		everyone: false,
		repliedUser: true,
		roles: true,
		users: true
	},
	defaultImageFormat: 'png',
	defaultImageSize: 4096,
	gateway: {
		autoReconnect: true,
		concurrency: 1,
		connectionProperties: {
			browser: 'Oceanic',
			device: 'Oceanic',
			os: 'Android'
		},
		connectionTimeout: 30000,
		firstShardID: 0,
		getAllUsers: false,
		guildCreateTimeout: 5000,
		intents: ['GUILDS', 'GUILD_MEMBERS'],
		largeThreshold: 1000,
		maxReconnectAttempts: Infinity,
		maxResumeAttempts: 10,
		maxShards: 1,
		presence: {
			activities: [{ type: config.BotActivityType , name: config.BotActivityMessage }],
			status: 'online'
		},
		seedVoiceConnections: false
	}
});

/** The data for the MainInstance DB object. */
export const db_obj = {
	network_status: () => fetchDBStatus(),
	managers: {
		tag: TagModel,
		welcome: WelcomeModel,
		goodbye: GoodbyeModel,
		jam: CodeJamModel
	}
};

export function fetchDBStatus(): boolean {
	return mongoose.connection.readyState === 1;
}
