const utils = require('../utils.js');

class MemeService {
  constructor(client) {
    this.client = client;
    this.system = client.system;
    this.bank = client.system.bank;
  }

  service() {
    this.receiveMeme();
  }

  async receiveMeme() {
    this.client.on("messageCreate", async (msg) => {
      if (msg.channel.name === "test" && !msg.member.user.bot && (msg.embeds.length || msg.attachments.size)) {
        const userAccount = await this.bank.getUserAccount(msg.member.id);
        const catJAM = msg.guild.emojis.cache.find(emoji => emoji.name === 'catJAM');
        const katy = msg.guild.emojis.cache.find(emoji => emoji.name === 'katy');
        const eggboy = msg.guild.emojis.cache.find(emoji => emoji.name === 'eggboy');
        const sham = msg.guild.emojis.cache.find(emoji => emoji.name === 'sham');
        await msg.react(sham);
        await msg.react(eggboy);
        await msg.react(katy);
        await msg.react(catJAM);
        
        const reactions = [];
        const filter = (reaction, user) => {
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

        await msg.awaitReactions({filter, time: utils.Time.HOUR4 * 3});
        let pay = 0;
        let badMemeCount = 0;

        for (let reaction of reactions) {
          switch (reaction.emoji) {
            case catJAM:
              pay += 50000;
              break;
            case katy:
              pay += 20000;
              break;
            case eggboy:
              pay -= 10000;
              break;
            case sham:
              badMemeCount++;
              pay -= 20000;
              break;
          }
        }
        if (pay > 0) {
          msg.channel.send({
            content: `<@${msg.member.id}>, thank you for your contribution to the economy.\nYou have earned ${utils.Units.bankPrefix} ${(pay / 100).toLocaleString(undefined, {minimumFractionDigits: 2})} for your GOOD meme.`
          });
        } else if (pay < 0) {
          msg.channel.send({
            content: `<@${msg.member.id}>, thank you for your contribution to the economy.\nYou have been fined ${utils.Units.bankPrefix} ${(pay / -100).toLocaleString(undefined, {minimumFractionDigits: 2})} for your BAD meme.`
          });
        } else if (pay === 0) {
          msg.channel.send({
            content: `<@${msg.member.id}>, thank you for your contribution to the economy. Unfortunately no one was engaged with your meme.\nYou have been paid ${utils.Units.bankPrefix} 50.00 out of pity.`
          });
          await userAccount.addMemeEarnings(5000);
        }
        await userAccount.addMemeEarnings(pay);
      }
    });
  }
}

module.exports = {
  MemeService: MemeService
}