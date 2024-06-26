import { AudioPlayer, VoiceConnection } from "@discordjs/voice";

export class GuildAudioPlayer {
  guildId: string;
  player: AudioPlayer;
  connection: VoiceConnection;
}
