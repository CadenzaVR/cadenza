import Score from "./models/Score";
import ScoreRepository from "./repositories/ScoreRepository";

export default class ScoreManager {
  scoreRepository: ScoreRepository;

  constructor(scoreRepository: ScoreRepository) {
    this.scoreRepository = scoreRepository;
  }

  processScore(score: Score) {
    if (score.score === score.highScore || score.combo === score.maxCombo) {
      this.scoreRepository.saveHighscore(score);
    }
  }

  getHighscore(beatmapId: string): Score {
    return this.scoreRepository.getHighscore(beatmapId);
  }
}
