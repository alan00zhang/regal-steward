import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import * as dotenv from "dotenv";
dotenv.config({path: __dirname + '/.env'});
import { ChatInputCommandInteraction, Client, Interaction, InteractionType, MessageComponentInteraction } from 'discord.js';
import { SalaryService } from '../services/salary-service.js';
import { MemeService } from '../services/meme-service.js';
import { Bank } from './bank.js';
import { CommandCrystalBall } from '../commands/magic-8-ball.js';
import { CommandCheckBalance } from '../commands/check-balance.js';
import { KeyValuePair, AppCommand, EventOptions, SingletonCommand } from '../types.js';
import { CommandJackpot } from '../commands/jackpot.js';
import { CommandCasinoLeaderboards } from '../commands/casino-leaderboards.js';
import { CommandTip } from '../commands/tip.js';
import { CommandCrownAndAnchor } from '../commands/crown-and-anchor.js';
import { UniqueSystemDatabase, BasicSystemDatabase } from './database.js';
import { CommandBlackjack } from '../commands/blackjack.js';
import { CasinoService } from '../services/casino-service.js';

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
  Casino: CasinoService;
  
  // Add your command to this list in order to activate your command
  private commandMapping: KeyValuePair<string, AppCommand> = {
    'magic-8-ball': CommandCrystalBall,
    'check-balance': CommandCheckBalance,
    'jackpot': CommandJackpot,
    'casino-leaderboards': CommandCasinoLeaderboards,
    'tip': CommandTip,
    'crown-and-anchor': CommandCrownAndAnchor,
    'blackjack': CommandBlackjack
  }

  constructor(client: Client) {
    this.dbActiveEvents = new UniqueSystemDatabase<string>("activeEvents");
    this.bank = new Bank(this);
    this.client = client;
    this.Salary = new SalaryService(this);
    this.Meme = new MemeService(this);
    this.Casino = new CasinoService(this);
  }

  getCommand(commandName: string) {
    return this.commandMapping[commandName];
  }

  createSingletonCommand(interaction: ChatInputCommandInteraction) {
    const commandId = `${interaction.commandName}-${interaction.user.id}`;
    if (this.dbActiveEvents.has(commandId)) {
      interaction.reply({
        content: `You can only have one /${interaction.commandName} command open at once.`,
        ephemeral: true
      });
      return false;
    } else {
      this.dbActiveEvents.store(commandId);
      return new SingletonCommand(this, commandId);
    }
  }

  removeSingletonCommand(commandId: string) {
    try {
      this.dbActiveEvents.delete(commandId);
    } catch (error) {
      console.error(error);
    }
  }

  async guardReply(interaction: MessageComponentInteraction, matchId: string) {
    if (interaction.user.id === matchId) {
      return true;
    } else {
      interaction.reply({
        content: "You are not worthy.",
        ephemeral: true
      })
      return false;      
    }
  }
}