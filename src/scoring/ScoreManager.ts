import Beatmap from "../beatmap/models/Beatmap";
import Score from "./models/Score";
import ScoreRepository from "./repositories/ScoreRepository";

export default class ScoreManager {
  scoreRepository: ScoreRepository;

  constructor(scoreRepository: ScoreRepository) {
    this.scoreRepository = scoreRepository;
  }

  async processScore(score: Score) {
    if (score.score === score.highScore || score.combo === score.maxCombo) {
      await this.scoreRepository.saveHighscore(score);
    }
  }

  getHighscore(beatmap: Beatmap, gameMode: number): Promise<Score> {
    return this.scoreRepository.getHighscore(beatmap, gameMode);
  }
}
