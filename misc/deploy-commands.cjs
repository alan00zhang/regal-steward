require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const Commands = require('./deploy.cjs');

function main() {
	const commands = [];
	const commandsPath = path.join('src', 'commands');
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
	
	for (const file of commandFiles) {
		// const filePath = path.join(commandsPath, file);
		const name = file.slice(0, -3);
		const command = Commands[name]
		if (command) commands.push(command.data);
	}
	
	const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
	
	rest.put(Routes.applicationGuildCommands(process.env.APP_ID, process.env.TEST_GUILD_ID), { body: commands })
		.then((data) => console.log(`Successfully registered ${data.length} application commands.`))
		.catch(console.error);
}

main();