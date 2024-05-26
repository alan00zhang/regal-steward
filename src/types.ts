import { ChatInputCommandInteraction, Interaction } from "discord.js";
import { System } from "./systems/systems.js";

export type UserAccount = {
  id: string;
  bank_amount: number;
  casino_winnings: number;
  casino_losses: number;
  username: string;
  salary: number;
  meme_earnings: number;
  [key: string]: any;
}

export type AppCommand = {
  execute: (interaction: ChatInputCommandInteraction, system: System) => any
}

export type KeyValuePair<T> = {
  [key: string]: T
}

export class EventOptions {
  name: string;
  id: string;
  eventFn: (interaction: Interaction) => void;
  duration: number = 30000;
  userId?: string;
}
//    * EventOptions is structured like so = {
//    * 
//    *  eventName: string,
//    * 
//    *  customId: string,
//    * 
//    *  eventFn: (interaction) => void,
//    * 
//    *  duration: number = 30000,
//    * 
//    *  matchUserId?: string
//    * 
//    * }
//    * @param {Object} commandOptions Object for shutting down a unique command instance
//    * 
//    * CommandOptions is structured like so = {
//    * 
//    *  id: string,
//    * 
//    *  removeAfterSuccess: boolean
//    * 
//    * }
//    * 
//    * @returns {Object} Returns an object with close() function to remove the listener manually
//    */

//     /**
//    * Creats the eventOptions config object for the awaitCustomEventById() function
//    * @param {string} eventName The name of the event
//    * @param {string} customId The member associated with the event's ID
//    * @param {(interaction) => void} eventFn The function to execute once the custom event is detected/fired
//    * @param {number} duration The timeout value of the event listener in milliseconds
//    * @param {string} matchUserId The user ID of whoever should be the interactor
//    * 
//    * @returns {Object} Returns an object with close() function to remove the listener manually
//    */
//   createEventOptions: (eventName, customId, eventFn, duration, matchUserId) => {
//     return {
//       eventName: eventName,
//       customId: customId.toString(),
//       eventFn: eventFn,
//       duration: duration,
//       matchUserId: matchUserId?.toString()
//     }
//   }