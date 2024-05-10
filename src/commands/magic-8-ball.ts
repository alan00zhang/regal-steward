import { ChatInputCommandInteraction } from "discord.js";
import { AppCommand } from "../types.js";
import { SlashCommandBuilder } from 'discord.js';

const negativeResponses = [
	"Don’t count on it.", "My reply is no.", "My sources say no.",
	"Outlook not so good.",	"Very doubtful."
];

const positiveResponses = [
	"It is certain.", "It is decidedly so.", "Without a doubt.",	"Yes definitely.",	
	"You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.", 
	"Yes.", "Signs point to yes."
];

const unsureResponses = [
	"Better not tell you now.",	"Cannot predict now.",	"Reply hazy, try again.", 
	"Concentrate and ask again.",	"Ask again later."
];

const allResponses = [
	...negativeResponses, ...positiveResponses, ...unsureResponses
]

export const CommandCrystalBall: AppCommand = {
	async execute(interaction: ChatInputCommandInteraction) {
    let randomIndex = Math.floor(Math.random() * allResponses.length);
		let response = "";
		let question = interaction.options.getString("question");
		if (question) response = `<@${interaction.user.id}> asked: ${question}\n`;
		response += allResponses[randomIndex]
		await interaction.reply(response);
	},
};