const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  'magic-8-ball': {
    data: new SlashCommandBuilder()
    .setName('magic-8-ball')
    .setDescription('Ask the all-knowing and receive truth unbound')
    .addStringOption(option => 
      option.setName("question")
        .setDescription("What do you seek?")
        .setRequired(false))
  },
  'check-balance': {
    data: new SlashCommandBuilder()
		.setName('check-balance')
		.setDescription('Check your bank account balance.')
  }
}