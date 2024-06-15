import { SystemService } from "./service.js";
import { AudioPlayer, StreamType, VoiceConnectionStatus, createAudioPlayer, createAudioResource, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";

export class AudioService extends SystemService {
  private player: AudioPlayer;
  service(): void {
    this.player = createAudioPlayer();
    this.listenToPlay();
    this.listenToStop();
    this.listenToLeave();
  }
  listenToPlay() {
    this.system.client.on("messageCreate", message => {
      if (message.content.startsWith("!play") && message.member.voice.channel?.id) {
        const connection = joinVoiceChannel({
          guildId: message.guildId,
          channelId: message.member.voice.channel.id,
          adapterCreator: message.guild.voiceAdapterCreator,
          selfDeaf: false
        });
        let audio = createAudioResource("src/assets/notlikeus.mp3", {inputType: StreamType.Arbitrary});
        this.player.play(audio);
        connection.on(VoiceConnectionStatus.Ready, () => {
          connection.subscribe(this.player);
        })
        connection.on(VoiceConnectionStatus.Disconnected, () => {
          connection.destroy();
          this.player.stop();
        });
      }
    });
  }
  listenToPause() {
    this.system.client.on("messageCreate", message => {
      if (message.content.startsWith("!pause")) {
        this.player.pause();
      }
    });
  }
  listenToStop() {
    this.system.client.on("messageCreate", message => {
      if (message.content.startsWith("!stop")) {
        this.player.stop();
      }
    });
  }
  listenToLeave() {
    this.system.client.on("messageCreate", message => {
      if (message.content.startsWith("!leave")) {
        let connection = getVoiceConnection(message.guildId);
        connection?.destroy();
      }
    });
  }

}