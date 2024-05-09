import * as dotenv from "dotenv";
dotenv.config({path: '.env'});
import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const commandId = 1021561643097931906n;

// for guild-based commands
rest.delete(Routes.applicationGuildCommand(process.env.APP_ID, process.env.TEST_GUILD_ID, commandId))
	.then(() => console.log('Successfully deleted guild command'))
	.catch(console.error);