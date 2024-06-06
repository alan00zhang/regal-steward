import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, GuildMember, GuildTextBasedChannel, InteractionResponse } from "discord.js";
import { AppCommand } from "../types.js";
import { System } from "../systems/systems.js";
import { Utils } from "../utils.js";
import { BlackjackDealer, BlackjackGame } from './../components/blackjack-game.js';
import { Dealer } from "../services/casino-service.js";

export const CommandBlackjack: AppCommand = {
  async execute(interaction: ChatInputCommandInteraction, system: System) {
    const bet = Math.round(interaction.options.getNumber("bet") * 1e2) / 1e2; // round to .00 decimals
    let member = <GuildMember>interaction.member;
    let userAccount = await system.bank.getUserAccount(member.id);
    const Casino = system.Casino;
    if (userAccount.bankBalance < bet || bet < 0) {
      await interaction.reply({
        content: "You can't afford that.",
        ephemeral: true
      });
      return;
    }
    const command = system.createSingletonCommand(interaction);
		if (command === false) return;
    
    let dealer = Casino.requestDealer("blackjack");
    if (!dealer) {
      interaction.reply({
        content: `There's already a game of blackjack started in this channel.`,
        ephemeral: true
      });
      return;
    }

    const joinButton = new ButtonBuilder()
      .setCustomId("blackjack-join")
      .setLabel("Join")
      .setStyle(ButtonStyle.Success);

    let lobby = await interaction.reply({
      content: `Let's play a game of blackjack! Click below to join the table!`,
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton)]
    });
    try {
      const lobbyCollector = lobby.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15_000 });
      let players: Record<string, InteractionResponse> = {}
      lobbyCollector.on("collect", async joinInteraction => {
        let player = <GuildMember>joinInteraction.member;
        if (players[player.id]) {
          joinInteraction.update({});
          return;
        }
        let game = await joinInteraction.reply({
          content: `Welcome to the table. \nThe game will start soon...`,
          ephemeral: true
        })
        players[player.id] = game;
      });
      lobbyCollector.on("ignore", () => {
        lobby.edit({
          content: `No gamblers?`
        });
        throw new Error("No one joined this blackjack table");
      })
      await Utils.delay(5_000);

      dealer.shuffle();
      let dealerGame = new BlackjackDealer(Casino, dealer, lobby);
      dealerGame.dealerStart();
      let games: BlackjackGame[] = [];
      for (let player in players) {
        games.push(new BlackjackGame(Casino, dealer, players[player]));
      }
      for (let game of games) {
        game.dealIn();
        game.finished.subscribe(() => {
          // if every game is finished
          if (games.every(instance => instance.finished.value)) {
            dealerGame.dealerEnd();
          }
        });
      }
    } catch (error) {
      interaction.channel.send({
        content: `No one joined game, dealer is closing this table down...`
      })
    } finally {
      command.close();
      dealer.closeTable();
    }
  }
}