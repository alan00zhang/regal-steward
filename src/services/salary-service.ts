import { Client } from 'discord.js';
import { System, Bank } from '../systems.js';
import { Utils } from '../utils.js';

export class SalaryService {
  client: Client;
  system: System;
  bank: Bank;
  
  constructor(system: System) {
    this.client = system.client;
    this.system = system;
    this.bank = system.bank;
  }

  service() {
    this.paySalaries();
    setInterval(() => {
      this.paySalaries();
    }, Utils.Time.DAY1);
  }

  async paySalaries() {
    let responseTable = await this.bank.db.get("SELECT date_paid == date() FROM salary_log ORDER BY paycheque_id DESC LIMIT 1");
    if (responseTable?.["date_paid == date()"]) {
      return;
    };
    let existingUsers = await this.bank.getAllUserIds();
    let userAccounts = [];
    for (let id of existingUsers) {
      if (id !== "bank") userAccounts.push(this.bank.getUserAccount(id));
    }
    userAccounts = await Promise.all(userAccounts);
    await this.bank.db.exec(
      `BEGIN TRANSACTION;
      UPDATE users
      SET bank_amount = bank_amount + salary
      WHERE id != "bank";
      COMMIT;`
    )
    await this.logSalariesPaid(userAccounts);
  }

  async logSalariesPaid(userAccounts: any[]) {
    let stmts = ``
    for (let userAccount of userAccounts) {
      stmts += `INSERT INTO salary_log(id, amount_paid) VALUES (${userAccount.id}, ${userAccount.userData.salary});`
    }
    return this.bank.db.exec(
      `BEGIN TRANSACTION;
        ${stmts}
      COMMIT;`
      )
  }
}