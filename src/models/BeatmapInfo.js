export default class BeatmapInfo {
  constructor(params = {}) {
    /**
     * @type {string}
     */
    this.name = params.name;

    /**
     * @type {string}
     */
    this.artist = params.artist;

    /**
     * @type {string}
     */
    this.creator = params.creator;

    /**
     * @type {string}
     */
    this.imageSrc = params.imageSrc;

    /**
     * @type {string}
     */
    this.audioSrc = params.audioSrc;

    /**
     * @type {number}
     */
    this.mode = params.mode;

    /**
     * @type {number}
     */
    this.language = params.language;

    /**
     * @type {number}
     */
    this.genre = params.genre;

    /**
     * @type {Array<string>}
     */
    this.tags = params.tags;
  }
}
