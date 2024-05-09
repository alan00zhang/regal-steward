import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";
import { UserAccount } from "../types.js";
import { KeyValuePair } from "../utils.js";
import { System } from "./systems.js";

// The Bank represents the SQLite database responsible for storing persistent user data
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