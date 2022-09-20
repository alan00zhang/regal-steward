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

  guardReply: async function(interaction) {
    let userId = interaction.user.id;
    let customId = interaction.customId;
    if (customId.endsWith(userId)) {
      return true;
    } else {
      await interaction.reply({
        content: "This button is not for you",
        ephemeral: true
      })
      return false;
    }
  }
}