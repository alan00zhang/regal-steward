const { SlashCommandBuilder } = require('discord.js');

const utils = {
  Units: {
    bank: "Emporeum",
    bankPrefix: "**𝔼**",
    slum: "SlumCoin"
  }
}

module.exports = {
  'magic-8-ball': {
    data: new SlashCommandBuilder()
    .setName('magic-8-ball')
    .setDescription('Ask the all-knowing and receive truth unbound')
    .addStringOption(option => 
      option.setName("question")
        .setDescription("What do you seek?")
        .setRequired(true))
  },
  'check-balance': {
    data: new SlashCommandBuilder()
		.setName('check-balance')
		.setDescription('Check your bank account balance.')
  },
  'casino-leaderboards': {
    data: new SlashCommandBuilder()
    .setName('casino-leaderboards')
    .setDescription('Check out the casino leaderboard Top 5'),
  },
  'jackpot': {
    data: new SlashCommandBuilder()
		.setName('jackpot')
		.setDescription('Check the current jackpot value OR make a bet to take the whole damn thing.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('check')
				.setDescription(`Check the current jackpot value and the price of a chance at scoring the big one.`))
		.addSubcommand(subcommand =>
			subcommand
				.setName('bet')
				.setDescription(`Pay 1/100 of the jackpot, roll a number from 1-100 and hit 100 to win the ⭐JACKPOT⭐`))
  },
  'tip': {
    data: new SlashCommandBuilder()
		.setName('tip')
		.setDescription(`Tip someone in ${utils.Units.bank}`)
    .addUserOption(option => 
      option.setName("recipient")
        .setDescription("Who will you tip? (Don't tip a bot)")
        .setRequired(true))
    .addNumberOption(option => 
      option.setName("amount")
        .setDescription(`How much ${utils.Units.bank} will you tip?`)
        .setRequired(true))
  },
  'crown-and-anchor': {
    data: new SlashCommandBuilder()
		.setName('crown-and-anchor')
		.setDescription('Play a game of Crown and Anchor!')
    .addNumberOption(option => 
      option.setName("bet")
        .setDescription(`How much ${utils.Units.bank} will you wager?`)
        .setRequired(true))
  },
  'blackjack': {
    data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Try your "hand" in god\'s fairest game!')
    .addNumberOption(option => 
      option.setName("bet")
        .setDescription(`How much ${utils.Units.bank} will you wager?`)
        .setRequired(true))
  }
}