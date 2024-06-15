import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import * as dotenv from "dotenv";
dotenv.config({path: __dirname + '/.env'});
import { System } from './systems/systems.js';
import { Client, GatewayIntentBits } from 'discord.js';
import { AppCommand } from './types.js';

const intents = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.DirectMessages,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildMessageReactions,
	GatewayIntentBits.GuildVoiceStates
]

// Create a new client instance
const client: Client = new Client({ intents: intents });
const system = new System(client);

// When the client is ready, run this code (only once)
client.once('ready', async () => {
	console.log('Ready!');
	await system.bank.open();
	await system.bank.loadNewUsers();
	system.Salary.service();
	system.Casino.service();
	system.Audio.service();
	// system.Meme.service();
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command: AppCommand = system.getCommand(interaction.commandName);
	if (!command) return;
	try {
		// await command.execute(interaction, system);
	} catch (error) {
		// Disconnect from the database
		await system.bank.close();

		await interaction.channel.send(
			{ content: `There was an error while executing /${interaction.commandName} from <@${interaction.user.id}>!
			Bot is rebooting...` 
		});
		throw new Error(error.message)
	}
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);