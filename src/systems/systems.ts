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
    'tip': CommandTip,
    'crown-and-anchor': CommandCrownAndAnchor
  }

  constructor(client: Client) {
    this.dbActiveEvents = <UniqueSystemDatabase<string>>this.createDB<string>("activeEvents", "unique"); // type activeEvents?
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

  // likely deprecated
  awaitCustomEventById(eventOptions: EventOptions, commandOptions: any) {
    const interactionFn = async (interaction: Interaction) => {
      if (interaction.type !== InteractionType.MessageComponent && 
        interaction.type !== InteractionType.ModalSubmit) return;

      // example syntax = approval-request-submit-288455203840196608
      if (interaction.customId !== `${eventOptions.name}-${eventOptions.id}`) return;

      if (eventOptions.userId && interaction.user.id !== eventOptions.userId) {
        if (!interaction.deferred && !interaction.replied) {
          await interaction.reply({
            content: "You are not worthy.",
            ephemeral: true
          });
        }
        return;
      };
      
      try {
        eventOptions.eventFn(interaction); // TODO: add optional args and change {eventFn, args} into an object param
      } catch (error) {
        throw new Error(`Custom interaction event failed to fire.
        EventFn: ${eventOptions.eventFn}`);
      } finally {
        // TODO: implement whatever this was
        // if (commandOptions?.removeAfterSuccess) {
        //   system.dbActiveEvents.removeById(commandOptions.id);
        // }
        this.client.removeListener("interactionCreate", interactionFn);
      }
    }
    this.client.on("interactionCreate", interactionFn);
    const customEvent = {
      close: () => this.client.removeListener("interactionCreate", interactionFn)
    }
    setTimeout(() => {
      // if (commandOptions) {
      //   this.dbActiveEvents.delete(commandOptions.id);
      // }
      this.client.removeListener("interactionCreate", interactionFn);
    }, eventOptions.duration);
    return interactionFn;
  }
}