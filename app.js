require('dotenv').config({path: __dirname});
const systemsJs = require('./systems.js');
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
client.once('ready', () => {
	console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);
	if (!command) return;
	
	try {
		await command.execute(interaction, system);
	} catch (error) {
		await interaction.channel.send(
			{ content: `There was an error while executing !${interaction.commandName} from <@${interaction.user.id}>!
			Bot is rebooting...` 
		});
		throw new Error(error.message)
	}
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);