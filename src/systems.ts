import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import * as dotenv from "dotenv";
dotenv.config({path: __dirname + '/.env'});
import { ButtonInteraction, ChatInputCommandInteraction, Client, GatewayIntentBits } from 'discord.js';
import sqlite3 from 'sqlite3';
import { Database, IMigrate, ISqlite, open } from 'sqlite';
import { SalaryService } from './services/salary-service.js';
import { MemeService } from './services/meme-service.js';
import { UserAccount } from './types.js';
import { KeyValuePair } from './utils.js';

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

  constructor(client: Client) {
    this.dbActiveEvents = <UniqueSystemDatabase<string>>this.createDB<any>("activeEvents", "unique"); // type activeEvents?
    this.bank = new Bank(this);
    this.client = client;
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

// The Bank class represents the SQLite database responsible for storing persistent user data
export class Bank {
  system: System;
  db: Database;

  constructor(system: System) {
    this.system = system;
  }

  async open() {
    this.db = await open({
      filename: './regal-steward.db',
      driver: sqlite3.Database
    });
  }

  async close() {
    await this.db.close();
  }

  async getUserAccount(id: string) {
    try {
      return new BankAccount(id, await this.db.get("SELECT * FROM users WHERE id = ?", id), this);
    } catch (error) {
      console.error(error);
      return;
    }
  }

  async getAllUserIds() {
    let temp = await this.db.all("SELECT CAST(id as text) FROM users");
    return temp.map(user => user["CAST(id as text)"]) as string[];
  }

  async getCasinoLeaderboards() {
    return await this.db.all(`SELECT CAST(id as text), casino_winnings, casino_losses FROM users ORDER BY casino_winnings DESC, bank_amount DESC`);
  }

  async loadNewUsers() { // TODO split each guild into its own table or schema in db
    let existingUsers = await this.getAllUserIds();
    let newUsers: KeyValuePair<string>[] = [];
    const guilds = await this.system.client.guilds.fetch();
    for (let [guildSnowflake, oauthGuild] of guilds) {
      let guild = await oauthGuild.fetch();
      let members = await guild.members.fetch();
      for (let [memberSnowflake, member] of members) {
        if (
          existingUsers.indexOf(member.id) === -1
          && !newUsers.find(user => user.id == member.id)
          && !member.user.bot
        ) {
          newUsers.push({ id: member.id, username: member.user.username })
        }
      }
    }
    let stmt = "INSERT INTO users(id, username) VALUES ";
    for (let i = 0; i < newUsers.length; i++) {

      // check for SQL injection
      let injectionAttempt = false;
      if (newUsers[i].username.includes("DROP TABLE")) {
        injectionAttempt = true;
        continue;
      }

      if (i === 0 || injectionAttempt) {
        injectionAttempt = false;
        stmt += `('${newUsers[i].id}', '${newUsers[i].username}')`
      } else {
        stmt += `, ('${newUsers[i].id}', '${newUsers[i].username}')`;
      }
    }
    if (newUsers.length) await this.db.run(stmt);
    return;
  }

  async getBalance(id: string) {
    let account = await this.getUserAccount(id);
    return {
      bankAmount: account.bankBalance
    };
  }

  async addBankBalance(id: string, value: number) {
    await this.addUserBalance(id, value, 'bank_amount')
  }

  async addCasinoWinnings(id: string, value: number) {
    await this.addUserBalance(id, value, 'casino_winnings')
  }

  async addCasinoLosses(id: string, balance: number) {
    await this.addUserBalance(id, balance, 'casino_losses');
  }

  async addMemeEarnings(id: string, value: number) {
    await this.addUserBalance(id, value, 'meme_earnings');
  }
  
  async addUserBalance(id: string, value: number, column: string) {
    try {
      return await this.db.run(`UPDATE users SET ${column} = ${column} + ? WHERE id = ?`, value, id);
    } catch (error) {
      console.error(error)
    }
  }
}

// The BankAccount class represents a single user's entry in the bank database
export class BankAccount {
  bank: Bank;
  id: string;
  userData: UserAccount

  constructor(id: string, data: any, bank: Bank) {
    this.bank = bank;
    this.id = id;
    this.userData = data;
  }

  get bankBalance(): string {
    return (this.userData.bank_amount / 100).toLocaleString(undefined, {minimumFractionDigits: 2});
  }

  set bankBalance(val: number) {
    this.userData.bank_amount = val;
  }

  get memeEarnings(): string {
    return this.userData.meme_earnings.toLocaleString(undefined, {minimumFractionDigits: 2});
  }

  set memeEarnings(val: number) {
    this.userData.meme_earnings = val;
  }
  
  get casinoWinnings(): string {
    return (this.userData.casino_winnings / 100).toLocaleString(undefined, {minimumFractionDigits: 2});
  }

  set casinoWinnings(val: number) {
    this.userData.casino_winnings = val;
  }
  
  get casinoLosses(): string {
    return (this.userData.casino_losses / 100).toLocaleString(undefined, {minimumFractionDigits: 2});
  }

  set casinoLosses(val: number) {
    this.userData.casino_losses = val;
  }

  get salary(): string {
    return (this.userData.salary / 100).toLocaleString(undefined, {minimumFractionDigits: 2});
  }

  async addBank(val: number) {
    let newBalance = this.userData.bank_amount + val;
    this.bankBalance = newBalance;
    await this.bank.addBankBalance(this.id, val);
    return;
  }

  async subtractBank(val: number) {
    let newBalance = this.userData.bank_amount - val;
    this.bankBalance = newBalance;
    await this.bank.addBankBalance(this.id, val * -1);
    return;
  }

  async addCasinoWinnings(val: number) {
    let newBalance = this.userData.casino_winnings + val;
    this.casinoWinnings = newBalance;
    await this.bank.addCasinoWinnings(this.id, val);
    return;
  }

  async addCasinoLosses(val: number) {
    let newBalance = this.userData.casino_losses + val;
    this.casinoLosses = newBalance;
    await this.bank.addCasinoLosses(this.id, val);
    return;
  }

  async addMemeEarnings(val: number) {
    let newBalance = this.userData.slum_amount + val;
    this.memeEarnings = newBalance;
    await this.bank.addMemeEarnings(this.id, val);
    return;
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