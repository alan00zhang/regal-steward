const fs = require('node:fs');
const path = require('node:path');
const { Routes, Collection, Embed } = require('discord.js');

module.exports = {
  getCommands: function(client) {
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      client.commands.set(command.data.name, command);
    }
  },

  guardReply: async function(interaction, matchId) {
    // if matchId is not specified, the guard will reject interactions that are not related to the interacting user
    // ie. the customId does not match the interacting user id.
    let userId = matchId ? matchId : interaction.user.id;
    let customId = interaction.customId;
    if (customId.endsWith(userId)) {
      return true;
    } else {
      await interaction.reply({
        content: "You are not worthy.",
        ephemeral: true
      })
      return false;
    }
  },

  initSingletonCommand: function(interaction, system) {
    const eventId = `${interaction.commandName}-${interaction.user.id}`;
		if (system.dbActiveEvents.getById(eventId)) {
			interaction.reply({
				content: `You can only have one !${interaction.commandName} command open at once.`,
				ephemeral: true
			});
			return false;
		} else {
			system.dbActiveEvents.store(eventId);
      return eventId;
		}
  },

  Time: {
    MINUTE15: 1000 * 60 * 15,
    MINUTE30: 1000 * 60 * 30,
    HOUR1: 1000 * 60 * 60,
    HOUR2: 1000 * 60 * 60 * 2,
    HOUR4: 1000 * 60 * 60 * 4,
    HOUR8: 1000 * 60 * 60 * 8,
    DAY1: 1000 * 60 * 60 * 24,
    DAY3: 1000 * 60 * 60 * 24 * 3,
    WEEK1: 1000 * 60 * 60 * 24 * 7,
  }
}