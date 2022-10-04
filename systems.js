require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const utils = require('./utils.js');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

class System {
  constructor() {
    this.dbActiveEvents = this.createDB("activeEvents", "unique");
    this.bank = new Bank(this);
  }
  
  attachClient(client) {
    this.client = client;
    this.client.system = this;
    return this;
  }

  createDB(name, type) {
    let db;
    if (!type) db = new AbstractSystemDatabase(name);
    else if (type === "unique") db = new UniqueSystemDatabase(name);
    return db;
  }
}

// Database class with basic CRUD operations
class AbstractSystemDatabase {
  constructor(name) {
    this.name = name;
    this.db = [];
  }

  get(value) {
    return this.db.find(item => item === value);
  }

  getByKeyValue(key, value) {
    return this.db.find(item => item.key === key && item.key.value === value);
  }

  store(item) {
    this.db.push(item);
  }

  delete(item) {
    let index = this.db.indexOf(item);
    if (index !== -1) this.db.splice(index, 1);
  }
}

// Inherited Database class that is tailored for objects of form {id: any, value: any}
class UniqueSystemDatabase extends AbstractSystemDatabase {
  getById(id) {
    return this.db.find(item => item.id === id);
  }

  // Stores a new entry if item id does not exist in database
  store(id, value, overwrite) {
    const existingItem = this.getById(id);
    if (!existingItem) {
      this.db.push({id: id, value: value})
    } else {
      if (overwrite) existingItem.value = value
    }
  }

  removeById(id) {
    let index = this.db.findIndex(item => item.id === id);
    if (index !== -1) this.db.splice(index, 1);
  }
}

// The Bank class represents the SQLite database responsible for storing persistent user data
class Bank {
  constructor(system) {
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

  async getUserAccount(id) {
    try {
      return new BankAccount(id, await this.db.get("SELECT * FROM users WHERE id = ?", id), this);
    } catch (error) {
      console.error(error);
      return;
    }
  }

  async getAllUserIds() {
    return await this.db.all("SELECT id FROM users");
  }

  async getCasinoLeaderboards() {
    return await this.db.all(`SELECT CAST(id as text), casino_winnings FROM users ORDER BY casino_winnings DESC, bank_amount DESC`);
  }

  async loadNewUsers() {
    let existingUsers = await this.getAllUserIds();
    let newUsers = [];
    const guilds = await this.system.client.guilds.fetch();
    for (let [guildSnowflake, oauthGuild] of guilds) {
      let guild = await oauthGuild.fetch();
      let members = await guild.members.fetch();
      for (let [memberSnowflake, member] of members) {
        if (
          !existingUsers.find(user => user.id == member.id) 
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
      if (newUsers[i].include("DROP TABLE")) {
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

  async getBalance(id) {
    let account = await this.getUserAccount(id);
    return {
      bankAmount: account.bankBalance, 
      slumAmount: account.slumBalance
    };
  }

  async setBankBalance(id, newBalance) {
    try {
      return await this.db.run(`UPDATE users SET bank_amount = ? WHERE id = ?`, newBalance, id);
    } catch (error) {
      console.error(error);
    }
  }

  async setCasinoWinnings(id, newBalance) {
    try {
      return await this.db.run(`UPDATE users SET casino_winnings = ? WHERE id = ?`, newBalance, id);
    } catch (error) {
      console.error(error);
    }
  }

  async setCasinoLosses(id, newBalance) {
    try {
      return await this.db.run(`UPDATE users SET casino_losses = ? WHERE id = ?`, newBalance, id);
    } catch (error) {
      console.error(error);
    }
  }

  async setSlumBalance(id, newBalance) {
    try {
      return await this.db.run(`UPDATE users SET slum_amount = ? WHERE id = ?`, newBalance, id);
    } catch (error) {
      console.error(error)
    }
  }
}

// The BankAccount class represents a single user's entry in the bank database
class BankAccount {
  constructor(id, data, bank) {
    this.bank = bank;
    this.id = id
    this.userData = data;
  }

  get bankBalance() {
    return (this.userData.bank_amount / 100).toLocaleString(undefined, {minimumFractionDigits: 2});
  }

  set bankBalance(val) {
    this.userData.bank_amount = val;
  }
  
  get slumBalance() {
    return this.userData.slum_amount.toLocaleString();
  }

  set slumBalance(val) {
    this.userData.slum_amount = val;
  }
  
  get casinoWinnings() {
    return (this.userData.casino_winnings / 100).toLocaleString(undefined, {minimumFractionDigits: 2});
  }

  set casinoWinnings(val) {
    this.userData.casino_winnings = val;
  }
  
  get casinoLosses() {
    return (this.userData.casino_losses / 100).toLocaleString(undefined, {minimumFractionDigits: 2});
  }

  set casinoLosses(val) {
    this.userData.casino_losses = val;
  }

  async addBank(val) {
    let newBalance = this.userData.bank_amount + val;
    await this.bank.setBankBalance(this.id, newBalance);
    this.bankBalance = newBalance;
    return;
  }

  async subtractBank(val) {
    let newBalance = this.userData.bank_amount - val;
    await this.bank.setBankBalance(this.id, newBalance);
    this.bankBalance = newBalance;
    return;
  }

  async addCasinoWinnings(val) {
    let newBalance = this.userData.casino_winnings + val;
    await this.bank.setCasinoWinnings(this.id, newBalance);
    this.casinoWinnings = newBalance;
    return;
  }

  async addCasinoLosses(val) {
    let newBalance = this.userData.casino_losses + val;
    await this.bank.setCasinoLosses(this.id, newBalance);
    this.casinoLosses = newBalance;
    return;
  }

  async addSlum(val) {
    let newBalance = this.userData.slum_amount + val;
    await this.bank.setSlumBalance(this.id, newBalance);
    this.slumBalance = newBalance;
    return;
  }

  async subtractSlum(val) {
    let newBalance = this.userData.slum_amount - val;
    await this.bank.setSlumBalance(this.id, newBalance);
    this.slumBalance = newBalance;
    return;
  }
}

const system = new System();
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
   * @param {Object} commandOptions Object for shutting down a unique command instance
   * 
   * CommandOptions is structured like so = {
   * 
   *  id: string,
   * 
   *  removeAfterSuccess: boolean
   * 
   * }
   * 
   * @returns {Object} Returns an object with close() function to remove the listener manually
   */
  awaitCustomEventById: (client, eventOptions, commandOptions) => {
    const interactionFn = async function(interaction) {
      if (Array.isArray(eventOptions.eventName)) {
        if (!eventOptions.eventName.some(name => `${name}-${eventOptions.customId}` === interaction.customId)) {
          return;
        };
      }
      else if (interaction.customId !== `${eventOptions.eventName}-${eventOptions.customId}`) return; // must match a syntax such as approval-request-submit-288455203840196608
      if (eventOptions.matchUserId) {
        if (interaction.user.id !== eventOptions.matchUserId) {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.reply({
              content: "You are not worthy.",
              ephemeral: true
            });
          }
          return;
        };
      }
      try {
        eventOptions.eventFn(interaction); // TODO: add optional args and change {eventFn, args} into an object param
      } catch (error) {
        throw new Error(`Custom interaction event failed to fire.
        EventFn: ${eventOptions.eventFn}`);
      } finally {
        if (commandOptions?.removeAfterSuccess) {
          system.dbActiveEvents.removeById(commandOptions.id);
        }
        customEE.removeListener("interactionCreate", interactionFn);
      }
    }
    const customEE = client.on("interactionCreate", interactionFn);
    const customEvent = {
      close: () => customEE.removeListener("interactionCreate", interactionFn)
    }
    setTimeout(() => {
      if (commandOptions) {
        system.dbActiveEvents.removeById(commandOptions.id);
      }
      customEE.removeListener("interactionCreate", interactionFn);
    }, eventOptions.duration ? eventOptions.duration : 30000);
    return customEvent;
  },

    /**
   * Creats the eventOptions config object for the awaitCustomEventById() function
   * @param {string} eventName The name of the event
   * @param {string} customId The member associated with the event's ID
   * @param {(interaction) => void} eventFn The function to execute once the custom event is detected/fired
   * @param {number} duration The timeout value of the event listener in milliseconds
   * @param {string} matchUserId The user ID of whoever should be the interactor
   * 
   * @returns {Object} Returns an object with close() function to remove the listener manually
   */
  createEventOptions: (eventName, customId, eventFn, duration, matchUserId) => {
    return {
      eventName: eventName,
      customId: customId.toString(),
      eventFn: eventFn,
      duration: duration,
      matchUserId: matchUserId?.toString()
    }
  },
  System,
  system,
  AbstractSystemDatabase,
  UniqueSystemDatabase
}