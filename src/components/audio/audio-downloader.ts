import YTDL, { downloadOptions, videoFormat } from "ytdl-core";
import Prism from "prism-media";
import { PassThrough, pipeline } from "stream";

export class AudioDownloader {
  static filter(format: videoFormat) {
    return format.codecs === 'opus' &&
      format.container === 'webm' &&
      format.bitrate === 128;
  }
  static nextBestFormat(formats: videoFormat[], isLive: boolean = false) {
    let filter = (format: videoFormat): boolean | number => format.audioBitrate;
    if (isLive) filter = (format: videoFormat) => format.audioBitrate && format.isHLS;
    formats = formats
      .filter(filter)
      .sort((a, b) => b.audioBitrate - a.audioBitrate);
    return formats.find(format => !format.bitrate) || formats[0];
  }
  static async download(url: string, options: downloadOptions = {}) {
    const info = await YTDL.getInfo(url);
    // Prefer opus
    const format = info.formats.find(this.filter);
    const canDemux = format && info.videoDetails.lengthSeconds !== "0";
    options = {
      ...options,
      dlChunkSize: 0,
      liveBuffer: 1 << 62,
      highWaterMark: 1 << 62
    }
    if (canDemux) options = { ...options, filter: this.filter };
    else if (info.videoDetails.lengthSeconds !== "0") options = { ...options, filter: 'audioonly' };
    if (canDemux) {
      const demuxer = new Prism.opus.WebmDemuxer();
      return pipeline(
        YTDL.downloadFromInfo(info, options),
        demuxer,
        () => {});
    } else {
      const bestFormat = this.nextBestFormat(info.formats, info.videoDetails.isLiveContent);
      if (!bestFormat) throw new Error('No suitable format found');
      const transcoder = new Prism.FFmpeg({
        args: [
          '-reconnect', '1',
          '-reconnect_streamed', '1',
          '-reconnect_delay_max', '5',
          '-i', bestFormat.url,
          '-analyzeduration', '0',
          '-loglevel', '0',
          '-f', 's16le',
          '-ar', '48000',
          '-ac', '2',
        ],
        shell: false,
      });
      const opus = new Prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 960 });
      return pipeline(transcoder, opus, () => {});
    }
  }
}