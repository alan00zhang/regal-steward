require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');

const commands = [];
const commandsPath = path.join(__dirname, '..', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

rest.put(Routes.applicationGuildCommands(process.env.APP_ID, process.env.TEST_GUILD_ID), { body: commands })
	.then((data) => console.log(`Successfully registered ${data.length} application commands.`))
	.catch(console.error);