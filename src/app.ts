require('dotenv').config({path: __dirname});
import * as syslib from './systems';
import sqlite3 from 'sqlite3';
import { ApplicationCommand, Client, GatewayIntentBits, GuildMember } from 'discord.js';
import { AppCommand, Utils } from './utils';
const intents = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.DirectMessages,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildMessageReactions
]

// Create a new client instance
const client: Client = new Client({ intents: intents });
// Use the system singleton in systemsJs so other files can use the same system without forming circular dependencies
const system = new syslib.System(client)
system.initServices();

// When the client is ready, run this code (only once)
client.once('ready', async () => {
	console.log('Ready!');
	await system.bank.open();
	await system.bank.loadNewUsers();
	system.Salary.service();
	system.Meme.service();
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command: AppCommand = Utils.getCommand(interaction.commandName);
	if (!command) return;
	try {
		let userBankAccount = await system.bank.getUserAccount((<GuildMember>interaction.member).id)
		await command.execute(interaction, system, userBankAccount);
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