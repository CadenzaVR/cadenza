export default class Score {
  beatmapId: string;
  score: number;
  highScore: number;
  combo: number;
  maxCombo: number;
  accuracy: number;
  data: Array<number>;
  constructor(
    beatmapId: string,
    score: number,
    highScore: number,
    combo: number,
    maxCombo: number,
    accuracy: number,
    data: Array<number>
  ) {
    this.beatmapId = beatmapId;
    this.score = score;
    this.highScore = highScore;
    this.combo = combo;
    this.maxCombo = maxCombo;
    this.accuracy = accuracy;
    this.data = data;
  }
}
