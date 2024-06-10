import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, GuildMember, GuildTextBasedChannel, InteractionResponse } from "discord.js";
import { AppCommand } from "../types.js";
import { System } from "../systems/systems.js";
import { Utils } from "../utils.js";
import { BlackjackDealerGame, BlackjackGame } from '../components/casino/blackjack/blackjack-game.js';
import { Subscription } from "rxjs";
import { BankAccount } from "../systems/bank.js";

export const CommandBlackjack: AppCommand = {
  async execute(interaction: ChatInputCommandInteraction, system: System) {
    const bet = Math.round(interaction.options.getNumber("bet") * 1e2) / 1e2; // round to .00 decimals
    const Casino = system.Casino;
    const banker = await system.bank.getUserAccount("bank");
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

    let lobbyMesssage = `Let's play a game of blackjack! Click below to join the table!\nThe bet for this table is ${Utils.Units.bankPrefix} ${Utils.formatCurrency(bet)} (%d)`;
    let lobby = await interaction.reply({
      content: lobbyMesssage.replace("(%d)", ""),
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton)]
    });
    let subscriptions = new Subscription();
    try {
      const lobbyCollector = lobby.createMessageComponentCollector({ componentType: ComponentType.Button });
      let players: Record<string, {game: InteractionResponse, userAccount: BankAccount}> = {}
      lobbyCollector.on("collect", async joinInteraction => {
        let player = <GuildMember>joinInteraction.member;
        if (players[player.id]) {
          joinInteraction.update({});
          return;
        }
        let userAccount = await system.bank.getUserAccount(player.id);
        if (userAccount.bankBalance < bet || bet < 0) {
          await joinInteraction.reply({
            content: "You can't afford that.",
            ephemeral: true
          });
          return;
        }
        let game = await joinInteraction.reply({
          content: `Welcome to the table. \nThe game will start soon...`,
          ephemeral: true
        })
        lobbyMesssage += `\n<@${player.id}> joined this table.`
        players[player.id] = {game, userAccount};  
      });
      for (let i = 10; i > 0; --i) {
        lobby.edit({
          content: lobbyMesssage.replace("%d", i.toString())
        })
        await Utils.delay(1000);
      }
      lobbyCollector.stop();
      if (Object.keys(players).length === 0) throw new Error("No players!")

      dealer.shuffle();
      let dealerGame = new BlackjackDealerGame(Casino, dealer, lobby, command);
      dealerGame.dealerStart();
      let games: BlackjackGame[] = [];
      for (let player in players) {
        games.push(new BlackjackGame(Casino, dealer, players[player].game, bet, players[player].userAccount));
      }
      // await dealer blackjack
      for (let game of games) {
        game.dealIn(dealerGame);
        subscriptions.add(game.finished$.subscribe(() => {
          // if every game is finished
          if (games.every(instance => instance.finished$.value)) {
            dealerGame.reveal();
          }
        }));
        subscriptions.add(game.score$.subscribe(() => {
          if (games.every(instance => instance.score$.value !== undefined)) {
            let content = `All hands paid out, thanks for playing blackjack! This dealer is closing down.`;
            for (let game of games) {
              let outcome = game.score$.value < 0 ? "lost" : "won";
              let score = Math.abs(game.score$.value);
              if (game.score$.value < 0) {
                game.userAccount.subtractBank(score);
                game.userAccount.addCasinoLosses(score);
                banker.addBank(score);
              } else {
                game.userAccount.addBank(score);
                game.userAccount.addCasinoWinnings(score);
              }
              content += `\n<@${game.interaction.interaction.user.id}> played and ${outcome} ${Utils.Units.bankPrefix} ${Utils.formatCurrency(score)}`;
            }
            interaction.channel.send({
              content: content
            })
            dealerGame.endGame();
            subscriptions.unsubscribe();
          }
        }));
      }
    } catch (error) {
      command.close();
      interaction.channel.send({
        content: `No one joined the game, dealer is closing this table down...`
      })
    }
  }
}