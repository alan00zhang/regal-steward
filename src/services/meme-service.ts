import { Client, TextChannel } from "discord.js";
import { Utils } from "../utils.js";
import { System } from "../systems/systems.js";
import { Bank } from "../systems/bank.js";

export class MemeService {
  client: Client;
  system: System;
  bank: Bank;
  
  constructor(system: System) {
    this.client = system.client;
    this.system = system;
    this.bank = system.bank;
  }

  service() {
    this.receiveMeme();
  }

  async receiveMeme() {
    this.client.on("messageCreate", async (msg) => {
      if ((<TextChannel>msg.channel).name === "memes" 
      && !msg.member.user.bot 
      && (msg.embeds.length || msg.attachments.size || msg.content.includes("https://") || msg.content.includes("http://"))) {
        const memberId = msg.member.id;
        const userAccount = await this.bank.getUserAccount(memberId);
        const catJAM = msg.guild.emojis.cache.find(emoji => emoji.name === 'catJAM');
        const katy = msg.guild.emojis.cache.find(emoji => emoji.name === 'katy');
        const eggboy = msg.guild.emojis.cache.find(emoji => emoji.name === 'eggboy');
        const sham = msg.guild.emojis.cache.find(emoji => emoji.name === 'sham');
        await msg.react(sham);
        await msg.react(eggboy);
        await msg.react(katy);
        await msg.react(catJAM);
        
        const reactions: any[] = [];
        const filter = (reaction: any, user: any) => {
          let isMemeReaction = [catJAM, katy, eggboy, sham].indexOf(reaction.emoji) !== -1;
          let isNotOP = user.id !== msg.author.id;
          if (isMemeReaction && isNotOP) {
            let foundReaction = reactions.find(reaction => reaction.userId === user.id)
            if (!foundReaction) {
              reactions.push({userId: user.id, emoji: reaction.emoji});
            } else {
              foundReaction.emoji = reaction.emoji;
            }
            return true;
          } else {
            return false;
          }
        }

        await msg.awaitReactions({filter, time: Utils.Time.HOUR8});
        let pay = 0;
        let badMemeCount = 0;

        for (let reaction of reactions) {
          switch (reaction.emoji) {
            case catJAM:
              pay += 500000;
              break;
            case katy:
              pay += 200000;
              break;
            case eggboy:
              pay -= 100000;
              break;
            case sham:
              badMemeCount++;
              pay -= 200000;
              break;
          }
        }
        if (pay > 0) {
          msg.channel.send({
            content: `<@${memberId}>, thank you for your contribution to the economy.\nYou have earned ${Utils.Units.bankPrefix} ${(pay / 100).toLocaleString(undefined, {minimumFractionDigits: 2})} for your GOOD meme.`
          });
        } else if (pay < 0) {
          msg.channel.send({
            content: `<@${memberId}>, thank you for your contribution to the economy.\nYou have been fined ${Utils.Units.bankPrefix} ${(pay / -100).toLocaleString(undefined, {minimumFractionDigits: 2})} for your BAD meme.`
          });
        } else if (reactions.length === 0) {
          msg.channel.send({
            content: `<@${memberId}>, thank you for your contribution to the economy. Unfortunately no one was engaged with your meme.\nYou have been paid ${Utils.Units.bankPrefix} 50.00 out of pity.`
          });
          await userAccount.addMemeEarnings(5000);
        } else if (pay === 0) {
          msg.channel.send({
            content: `<@${memberId}>, thank you for your contribution to the economy. You will receive nothing for your NEUTRAL meme.`
          });
        }
        await userAccount.addMemeEarnings(pay);
      }
    });
  }
}