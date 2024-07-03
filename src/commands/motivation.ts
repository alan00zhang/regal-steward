import { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { System } from '../systems/systems.js';
import { AppCommand } from '../types.js';
import { TIME } from '../constants.js';


const RATELIMIT_N = 1  // max number calls before you need to wait for one to cool down
const RATELIMIT_T = TIME.MINUTE15  // how long before you get another command

let standard_wisdoms = [
  "With every loss, a man is born; with every win, a god",
  "'Everything in life is a gamble. Nothing in life I can't handle.' - Kendrick Lamar",
  "God gives his greatest gamblers his toughest losses",
  "True gamblers don't believe in the sunk cost fallacy. For though their money is gone, in it's place lies an infinitely more valuable commodity: experience",
  "You won the day you called yourself a gambler, everything else is a bonus",
  "The day you get a dollar and don't risk it is the day you can no longer call yourself a gambler",
  "The gambler's way in hell is paved with sharp stones",
  "Better to have gambled and lost than to never have gambled at all",
  "A gamblers legacy is measured only in wins",
  "Nothing is more important than gambling",
  "A truly brave gambler is ever serene; he is never taken by surprise; nothing ruffles the equanimity of his spirit",
  "There is nothing outside of yourself that can ever enable you to get better, stronger, richer, quicker, or smarter. Everything is within. Everything exists. Seek nothing outside of gambling.",
  "Gambling is not a means to money. Money is a means to gambling",
  "It makes no difference what men think of gambling. Gambling endures. As well ask men what they think of stone. Gambling was always here. Before man was, gambling waited for him. The ultimate trade awaiting its ultimate practitioner",
  "If you quit while you're ahead, you'll never win the race",
  "Gamble at any cost",
  "For a skilled gambler, a bird in the hand becomes two at the table",
  "Know thyself, know thy game. A thousand gambles, a thousand victories",
  "Courage is going from gambling loss to gambling loss without losing enthusiasm",
  "Courage is the foundation of gambling",
  "The number one cause of gambling losses is the fear of gambling losses",
];

let cooldown_wisdoms = [
  "What is wisdom without experience? Go forth and gamble, child",
];

class CooldownCount {
  private static data: Map<string, number> = new Map<string, number>(); // all instances share the same underlying mapping

  check(userid: string): number {
    if (!CooldownCount.data.has(userid)) {
      CooldownCount.data.set(userid, 0);
    }
    return CooldownCount.data.get(userid);
  }
  
  schedule_increment(userid: string, timeout: number = RATELIMIT_T) {
    setTimeout(() => {
      this.increment(userid);
    }, timeout);
  }

  schedule_decrement(userid: string, timeout: number = RATELIMIT_T) {
    setTimeout(() => {
      this.decrement(userid);
    }, timeout);
  }

  increment(userid: string) {
    let prev = this.check(userid);
    CooldownCount.data.set(userid, prev + 1);
  }

  decrement(userid: string) {
    let prev = this.check(userid);
    let next = Math.max(prev - 1, 0);
    CooldownCount.data.set(userid, next);
  }
}

export const CommandMotivation: AppCommand = {
	async execute(interaction: ChatInputCommandInteraction, system: System) {
    let userid = (<GuildMember>interaction.member).id;
    let counter = new CooldownCount();

    if (counter.check(userid) < RATELIMIT_N) {
      counter.increment(userid);
      counter.schedule_decrement(userid);
      send_wisdom(interaction);
    } else {
      send_cooldown(interaction);
    }
	},
};

async function send_wisdom(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    content: get_msg(standard_wisdoms),
  });
}

async function send_cooldown(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    content: get_msg(cooldown_wisdoms),
    ephemeral: true,
  });
}

function get_msg(msgs: Array<string>) {
  let index = Math.floor(Math.random() * msgs.length);
  return msgs[index];
}
