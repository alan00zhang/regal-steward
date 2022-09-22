require('dotenv').config({path: __dirname});
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
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		// throw new Error(error.message)
	}
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);