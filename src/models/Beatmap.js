export default class Beatmap {
  constructor(params) {
    /**
     * @type {BeatmapInfo}
     */
    this.beatmapInfo = params.beatmapInfo;

    /**
     * @type {number}
     */
    this.difficulty = params.difficulty;

    /**
     * @type {string}
     */
    this.difficultyName = params.difficultyName;

    /**
     * @type {string}
     */
    this.mapSrc = params.mapSrc;
  }
}
