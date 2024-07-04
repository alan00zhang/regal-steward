import { SystemService } from "./service.js";
import {
  AudioPlayer,
  AudioResource,
  StreamType,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
} from "@discordjs/voice";
import YTSR from "@distube/ytsr";
import { Message } from "discord.js";
import { UniqueKeySystemDatabase } from "../systems/database.js";
import { AudioDownloader } from "../components/audio/audio-downloader.js";
import { GuildAudioPlayer } from "../components/audio/guild-audio-player.js";

export class AudioService extends SystemService {
  players: UniqueKeySystemDatabase<GuildAudioPlayer>;
  service(): void {
    this.players = new UniqueKeySystemDatabase("players", "guildId");
    this.listenToPlay();
    this.listenToPause();
    this.listenToStop();
    this.listenToLeave();
    this.listenToSkip();
  }
  listenToPlay() {
    this.system.client.on("messageCreate", (message) => {
      if (message.content.startsWith("!play") && message.member.voice.channel?.id) {
        this.join(message);
        this.play(message);
      }
    });
  }
  listenToPause() {
    this.system.client.on("messageCreate", (message) => {
      if (message.content.startsWith("!pause")) {
        const player = this.players.getByID(message.guildId);
        player?.pause();
      }
    });
  }
  listenToStop() {
    this.system.client.on("messageCreate", (message) => {
      if (message.content.startsWith("!stop")) {
        const player = this.players.getByID(message.guildId);
        player?.stop();
      }
    });
  }
  listenToLeave() {
    this.system.client.on("messageCreate", (message) => {
      if (message.content.startsWith("!leave")) {
        let connection = getVoiceConnection(message.guildId);
        connection?.disconnect();
        this.players.deleteByID(message.guildId);
      }
    });
  }
  listenToSkip() {
    this.system.client.on("messageCreate", (message) => {
      if (message.content.startsWith("!skip")) {
        const player = this.players.getByID(message.guildId);
        player?.skip();
      }
    });
  }
  join(message: Message) {
    const connection = joinVoiceChannel({
      guildId: message.guildId,
      channelId: message.member.voice.channel.id,
      adapterCreator: message.guild.voiceAdapterCreator,
      selfDeaf: false,
    });
    const player = this.players.getByID(message.guildId)?.player ?? createAudioPlayer();
    if (!this.players.has(message.guildId)) {
      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await entersState(connection, VoiceConnectionStatus.Connecting, 5000);
        } catch {
          connection.destroy();
          player.stop();
          this.players.deleteByID(message.guildId);
        }
      });
    }
    this.players.store(new GuildAudioPlayer(message.guildId, player, connection), true);
  }
  async play(message: Message) {
    const player: GuildAudioPlayer = this.players.getByID(message.guildId);
    const connection = getVoiceConnection(message.guildId);
    let songName = message.content.match(/^!play (.+)/)?.[1]; // matches !play (some song name)
    let song = await this.searchSong(songName);
    player.play(song);
    connection.subscribe(player.player);
  }
  async searchSong(songName?: string) {
    if (songName) {
      const videoResult = (await YTSR(songName + "official audio", { limit: 1 })).items[0];
      const song = await AudioDownloader.download(videoResult.url);
      const audio = createAudioResource(song, { inlineVolume: false, inputType: StreamType.Opus });
      return audio;
    } else {
      return undefined;
    }
  }
  teardown() {
    // iterate through connections and destroy all
  }
}
