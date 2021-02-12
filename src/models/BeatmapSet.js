export default class BeatmapSet {
  constructor(params) {
    /**
     * @type {BeatmapInfo}
     */
    this.beatmapInfo = params.beatmapInfo;

    /**
     * @type {Array<Beatmap>}
     */
    this.beatmaps = params.beatmaps;
  }
}
