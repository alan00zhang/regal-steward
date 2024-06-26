import { TIME } from '../constants.js';
import { Utils } from '../utils.js';
import { SystemService } from './service.js';

export class SalaryService extends SystemService {
  service(): void {
    this.paySalaries();
    setInterval(() => {
      this.paySalaries();
    }, TIME.MINUTE30);
  }

  async paySalaries() {
    let currentHour = new Date().getHours();
    let responseTable = await this.bank.db.get(`SELECT * FROM salary_log WHERE date_paid=date() AND hour_paid=${currentHour} LIMIT 1`);
    if (responseTable !== undefined) {
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
    await this.logSalariesPaid(userAccounts, currentHour);
  }

  async logSalariesPaid(userAccounts: any[], hour: number) {
    let stmts = ``
    for (let userAccount of userAccounts) {
      stmts += `INSERT INTO salary_log(id, amount_paid, hour_paid) VALUES (${userAccount.id}, ${userAccount.userData.salary}, ${hour});`
    }
    return this.bank.db.exec(
      `BEGIN TRANSACTION;
        ${stmts}
      COMMIT;`
      )
  }
}