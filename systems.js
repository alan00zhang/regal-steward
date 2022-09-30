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
    return new BankAccount(await this.db.get("SELECT * FROM users WHERE id = ?", id), this);
  }

  async getAllUserIds() {
    return await this.db.all("SELECT id FROM users");
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
      if (i === 0) {
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
    return await this.db.run(`UPDATE users SET bank_amount = ? WHERE id = ?`, newBalance, id);
  }

  async setSlumBalance(id, newBalance) {
    return await this.db.run(`UPDATE users SET slum_amount = ? WHERE id = ?`, newBalance, id);
  }
}

// The BankAccount class represents a single user's entry in the bank database
class BankAccount {
  constructor(data, bank) {
    this.bank = bank;
    this.id = data.id
    this.userData = data;
  }

  get bankBalance() {
    return this.userData.bank_amount / 100;
  }

  set bankBalance(val) {
    this.bank.setBankBalance(this.id, val);
  }
  
  get slumBalance() {
    return this.userData.slum_amount;
  }

  set slumBalance(val) {
    this.bank.setSlumBalance(this.id, val);
  }

  async addBank(val) {
    let currentBalance = this.userData.bank_amount;
    await this.bank.setBankBalance(this.id, Number(currentBalance + val))
  }

  async subtractBank(val) {
    let currentBalance = this.userData.bank_amount;
    await this.bank.setBankBalance(this.id, Number(currentBalance - val))
  }

  async addSlum(val) {
    let currentBalance = this.userData.slum_amount;
    await this.bank.setSlumBalance(this.id, Number(currentBalance + val))
  }

  async subtractSlum(val) {
    let currentBalance = this.userData.slum_amount;
    await this.bank.setSlumBalance(this.id, Number(currentBalance - val))
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
   * @param {string} customId The member associated with the event's ID - this member's eventName
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