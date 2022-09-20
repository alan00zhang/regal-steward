require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const utils = require('./utils.js');

module.exports = {
  awaitCustomEventById: (client, eventName, customId, eventFn, duration = 30000) => {
    const interactionFn = async function(interaction) {
      if (interaction.customId === `${eventName}-${customId}`) { // must match a syntax such as approval-request-submit-288455203840196608
        try {
          eventFn(interaction); // TODO: add optional args and change {eventFn, args} into an object param
          console.log("it worked!")
        } catch (error) {
          throw new Error(`Custom interaction event failed to fire.
          EventFn: ${eventFn}`);
        } finally {
          customEE.removeListener("interactionCreate", interactionFn)
        }
      } else {
        return;
      }
    }
    const customEE = client.on("interactionCreate", interactionFn);
    // const customEE = client.on("interactionCreate", async function(interaction) {
    //   if (interaction.customId.endsWith(customId)) {
    //     try {
    //       eventFn(); // TODO: add optional args and change {eventFn, args} into an object param
    //       console.log("it worked!")
    //     } catch (error) {
    //       throw new Error(`Custom interaction event failed to fire.
    //       EventFn: ${eventFn}`);
    //     } finally {
    //       customEE.removeListener("interactionCreate", interactionFn)
    //     }
    //   }
    // });
    // setInterval(() => {
      
    // }, duration);
  }
}