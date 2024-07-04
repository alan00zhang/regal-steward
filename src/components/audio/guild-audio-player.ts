import { AudioPlayer, AudioPlayerStatus, AudioResource, VoiceConnection } from "@discordjs/voice";
import { Subject } from "rxjs";

export class GuildAudioPlayer {
  guildId: string;
  player: AudioPlayer;
  connection: VoiceConnection;
  queue: AudioResource[] = [];
  detectSong$: Subject<void> = new Subject();
  constructor(guildId: string, player: AudioPlayer, connection: VoiceConnection) {
    this.guildId = guildId;
    this.player = player;
    this.connection = connection;
    this.player.on(AudioPlayerStatus.Idle, () => this.detectSong$.next());
    this.detectSong$.subscribe(() => {
      if (this.player.state.status === AudioPlayerStatus.Idle && this.queue[0] !== undefined) {
        const song = this.queue.shift();
        this.player.play(song);
        // now playing song.name
      }
    });
  }
  public enqueue(song: AudioResource) {
    this.queue.push(song);
  }
  public play(song?: AudioResource) {
    song && this.enqueue(song);
    this.player.unpause();
    this.detectSong$.next();
  }
  public pause() {
    this.player.pause();
  }
  public stop() {
    this.player.stop();
  }
  public skip() {
    this.player.stop(true);
    this.detectSong$.next();
  }
}
