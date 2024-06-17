import { SystemService } from "./service.js";
import { AudioPlayer, StreamType, VoiceConnectionStatus, createAudioPlayer, createAudioResource, entersState, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import YTSR from "@distube/ytsr";
import { Message } from "discord.js";
import { UniqueKeySystemDatabase } from "../systems/database.js";

export class AudioService extends SystemService {
  // private player: AudioPlayer;
  players: UniqueKeySystemDatabase<"guildId">;
  service(): void {
    this.players = new UniqueKeySystemDatabase("players", "guildId");
    this.listenToPlay();
    this.listenToStop();
    this.listenToLeave();
  }
  listenToPlay() {
    this.system.client.on("messageCreate", message => {
      if (message.content.startsWith("!play") && message.member.voice.channel?.id) {
        this.join(message);
      }
    });
  }
  listenToPause() {
    this.system.client.on("messageCreate", message => {
      if (message.content.startsWith("!pause")) {
        const player = this.players.getByID(message.guildId);
        player?.pause();
      }
    });
  }
  listenToStop() {
    this.system.client.on("messageCreate", message => {
      if (message.content.startsWith("!stop")) {
        const player = this.players.getByID(message.guildId);
        player?.stop();
      }
    });
  }
  listenToLeave() {
    this.system.client.on("messageCreate", message => {
      if (message.content.startsWith("!leave")) {
        let connection = getVoiceConnection(message.guildId);
        connection?.disconnect();
        this.players.deleteByID(message.guildId);
      }
    });
  }
  join(message: Message) {
    const connection = joinVoiceChannel({
      guildId: message.guildId,
      channelId: message.member.voice.channel.id,
      adapterCreator: message.guild.voiceAdapterCreator,
      selfDeaf: false
    });
    const player = this.players.getByID(message.guildId)?.player ?? createAudioPlayer();
    if (!this.players.has(message.guildId)) {
      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await entersState(connection, VoiceConnectionStatus.Connecting, 5000)
        } catch {
          console.log("REAL DISCONNECT")
          connection.destroy();
          player.stop();
          this.players.deleteByID(message.guildId);
        }
      });
    }
    this.players.store({
      guildId: message.guildId,
      player: player,
      connection: connection
    }, true);
  }
  teardown() {
    // iterate through connections and destroy all
  }
}