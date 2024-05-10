import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import * as dotenv from "dotenv";
dotenv.config({path: __dirname + '/.env'});
import { ButtonInteraction, ChatInputCommandInteraction, Client, GatewayIntentBits } from 'discord.js';
import { SalaryService } from '../services/salary-service.js';
import { MemeService } from '../services/meme-service.js';
import { Bank, BankAccount } from './bank.js';
import { CommandCrystalBall } from '../commands/magic-8-ball.js';
import { CommandCheckBalance } from '../commands/check-balance.js';
import { KeyValuePair, AppCommand } from '../types.js';
import { CommandJackpot } from '../commands/jackpot.js';
import { CommandCasinoLeaderboards } from '../commands/casino-leaderboards.js';
import { CommandTip } from '../commands/tip.js';

export type UniqueItem<T>= {
  id: string,
  value: T
}
export class System {
  bank: Bank;
  client: Client;
  dbActiveEvents: UniqueSystemDatabase<string>;
  Salary: SalaryService;
  Meme: MemeService;
  
  // Add your command to this list in order to activate your command
  private commandMapping: KeyValuePair<AppCommand> = {
    'magic-8-ball': CommandCrystalBall,
    'check-balance': CommandCheckBalance,
    'jackpot': CommandJackpot,
    'casino-leaderboards': CommandCasinoLeaderboards,
    'tip': CommandTip
  }

  constructor(client: Client) {
    this.dbActiveEvents = <UniqueSystemDatabase<string>>this.createDB<any>("activeEvents", "unique"); // type activeEvents?
    this.bank = new Bank(this);
    this.client = client;
  }

  getCommand(commandName: string) {
    return this.commandMapping[commandName];
  }
  
  initServices() {
    this.Salary = new SalaryService(this);
    this.Meme = new MemeService(this);
    return;
  }

  createDB<T>(name: string, type: string) {
    let db;
    if (!type) db = new BasicSystemDatabase<T>(name);
    else if (type === "unique") db = new UniqueSystemDatabase<T>(name);
    return db;
  }

  async createSingletonCommand(interaction: ChatInputCommandInteraction) {
    const commandId = `${interaction.commandName}-${interaction.user.id}`;
    if (this.dbActiveEvents.has(commandId)) {
      try {
        await interaction.reply({
          content: `You can only have one /${interaction.commandName} command open at once.`,
          ephemeral: true
        });
      } catch (error) {
        console.error(error);
      } finally {
        return false;
      }
    } else {
      this.dbActiveEvents.store(commandId);
      return commandId;
    }
  }

  async guardReply(interaction: ButtonInteraction, matchId?: string) {
    // guard against anyone other than the caller from using a form
    let userId = matchId ? matchId : interaction.user.id;
    if (interaction.customId.endsWith(userId)) {
      return true;
    } else {
      await interaction.reply({
        content: "You are not worthy.",
        ephemeral: true
      })
      return false;
    }
  }
}

// Database class with basic CRUD operations
export abstract class AbstractSystemDatabase<T> {
  public name: string;
  protected abstract _db: any;

  constructor(name: string) {
    this.name = name;
  }

  abstract get(value: T): T;
  abstract store(item: T): void;
  abstract delete(item: T): void;
  abstract deleteByIndex(index: number): void;
}

export class BasicSystemDatabase<T> extends AbstractSystemDatabase<T> {
  protected _db: T[];

  constructor(name: string) {
    super(name);
    this._db = [];
  }

  public get(value: T): T {
    return this._db.find(item => item === value);
  }

  public store(item: T): void {
    this._db.push(item);
  }

  public delete(item: T): void {
    let index = this._db.indexOf(item);
    if (index !== -1) this._db.splice(index, 1);
    else console.error(`Could not find item ${item} in ${this.name} database!`);
  }

  public deleteByIndex(index: number): void {
    try {
      this._db.splice(index, 1);
    } catch(error) {
      console.error(`Could not delete index ${index} in ${this.name} database!`);
    }
  }
}

export class UniqueSystemDatabase<T> extends BasicSystemDatabase<T> {
  constructor(name: string) {
    super(name);
  }

  has(item: T) {
    return this.get(item) !== undefined;
  }

  store(item: T, overwrite?: boolean) {
    let existingItem = this.get(item);
    if (!existingItem) {
      super.store(item);
    } else {
      if (overwrite) existingItem = item;
    }
  }
}

// const system = new System();
// export default {
//   /**
//    * Awaits for a custom event to fire, then removes itself as listener.
//    * @param {Object} client The Client object initialized in app.js
//    * @param {Object} eventOptions Object for configuring the custom event
//    * 
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
//   awaitCustomEventById: (client, eventOptions, commandOptions) => {
//     const interactionFn = async function(interaction) {
//       if (Array.isArray(eventOptions.eventName)) {
//         if (!eventOptions.eventName.some(name => `${name}-${eventOptions.customId}` === interaction.customId)) {
//           return;
//         };
//       }
//       else if (interaction.customId !== `${eventOptions.eventName}-${eventOptions.customId}`) return; // must match a syntax such as approval-request-submit-288455203840196608
//       if (eventOptions.matchUserId) {
//         if (interaction.user.id !== eventOptions.matchUserId) {
//           if (!interaction.deferred && !interaction.replied) {
//             await interaction.reply({
//               content: "You are not worthy.",
//               ephemeral: true
//             });
//           }
//           return;
//         };
//       }
//       try {
//         eventOptions.eventFn(interaction); // TODO: add optional args and change {eventFn, args} into an object param
//       } catch (error) {
//         throw new Error(`Custom interaction event failed to fire.
//         EventFn: ${eventOptions.eventFn}`);
//       } finally {
//         if (commandOptions?.removeAfterSuccess) {
//           system.dbActiveEvents.removeById(commandOptions.id);
//         }
//         customEE.removeListener("interactionCreate", interactionFn);
//       }
//     }
//     const customEE = client.on("interactionCreate", interactionFn);
//     const customEvent = {
//       close: () => customEE.removeListener("interactionCreate", interactionFn)
//     }
//     setTimeout(() => {
//       if (commandOptions) {
//         system.dbActiveEvents.removeById(commandOptions.id);
//       }
//       customEE.removeListener("interactionCreate", interactionFn);
//     }, eventOptions.duration ? eventOptions.duration : 30000);
//     return customEvent;
//   },

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
//   },
//   System,
//   system,
//   AbstractSystemDatabase,
//   UniqueSystemDatabase
// }