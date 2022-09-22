require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const utils = require('./utils.js');

module.exports = {
  /**
   * Awaits for a custom event to fire, then removes itself as listener.
   * @param {Object} client The Client object initialized in app.js
   * @param {Object} eventOptions Object for configuring the custom event
   * 
   * EventOptions is structured like so = {
   * 
   *  eventName: string,
   * 
   *  customId: string,
   * 
   *  eventFn: (interaction) => void,
   * 
   *  duration: number = 30000,
   * 
   *  matchUserId?: string
   * 
   * }
   * @returns {Object} Returns an object with close() function to remove the listener manually
   */
  awaitCustomEventById: (client, eventOptions) => {
    const interactionFn = async function(interaction) {
      if (Array.isArray(eventOptions.eventName)) {
        if (!eventOptions.eventName.some(name => `${name}-${eventOptions.customId}` === interaction.customId)) {
          interaction.deferReply();
          return;
        };
      }
      else if (interaction.customId !== `${eventOptions.eventName}-${eventOptions.customId}`) return; // must match a syntax such as approval-request-submit-288455203840196608
      if (eventOptions.matchUserId) {
        if (interaction.user.id !== eventOptions.matchUserId) {
          await interaction.reply({
            content: "You are not worthy.",
            ephemeral: true
          });
          return;
        };
      }
      try {
        eventOptions.eventFn(interaction); // TODO: add optional args and change {eventFn, args} into an object param
      } catch (error) {
        throw new Error(`Custom interaction event failed to fire.
        EventFn: ${eventOptions.eventFn}`);
      } finally {
        customEE.removeListener("interactionCreate", interactionFn);
      }

      setInterval(() => {
        customEE.removeListener("interactionCreate", interactionFn);
      }, eventOptions.duration ? eventOptions.duration : 30000);
    }
    
    const customEE = client.on("interactionCreate", interactionFn);
    const customEvent = {
      close: () => customEE.removeListener("interactionCreate", interactionFn)
    }
    return customEvent;
  },

  createEventOptions: (eventName, customId, eventFn, duration, matchUserId) => {
    return {
      eventName: eventName,
      customId: customId.toString(),
      eventFn: eventFn,
      duration: duration,
      matchUserId: matchUserId?.toString()
    }
  }
}