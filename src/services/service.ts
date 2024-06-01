import { Client } from "discord.js";
import { System } from "../systems/systems.js";
import { Bank } from "../systems/bank.js";

export abstract class SystemService {
  client: Client;
  system: System;
  bank: Bank;
  constructor(system: System) {
    this.client = system.client;
    this.system = system;
    this.bank = system.bank;
  }
  abstract service(): void;
}