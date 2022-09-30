require('dotenv').config({path: __dirname});
const systemsJs = require('./systems.js');
const sqlite3 = require('sqlite3').verbose();
const { Client, GatewayIntentBits } = require('discord.js');
const { getCommands } = require('./utils')
const intents = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.DirectMessages,
	GatewayIntentBits.GuildMembers,
]

// Create a new client instance
const client = new Client({ intents: intents });
// Use the system singleton in systemsJs so other files can use the same system without forming circular dependencies
const system = systemsJs.system.attachClient(client);
getCommands(client);

// When the client is ready, run this code (only once)
client.once('ready', async () => {
	console.log('Ready!');
	await system.bank.open();
	await system.bank.loadNewUsers();
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);
	if (!command) return;
	
	try {
		let userAccount = await system.bank.getUserAccount(interaction.member.id)
		await command.execute(interaction, userAccount);
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