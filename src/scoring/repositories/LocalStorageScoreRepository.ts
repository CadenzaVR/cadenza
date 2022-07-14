import Score from "../models/Score";
import ScoreRepository from "./ScoreRepository";

export default class LocalStorageScoreRepository implements ScoreRepository {
  saveHighscore(score: Score): void {
    localStorage.setItem("score" + score.beatmapId, score.highScore + "");
    localStorage.setItem("combo" + score.beatmapId, score.maxCombo + "");
  }

  getHighscore(beatmapId: string): Score {
    const score = localStorage.getItem("score" + beatmapId);
    let highScore = 0;
    if (score) {
      highScore = parseInt(score);
    }

    const combo = localStorage.getItem("combo" + beatmapId);
    let maxCombo = 0;
    if (combo) {
      maxCombo = parseInt(combo);
    }
    return new Score(beatmapId, 0, highScore, 0, maxCombo, null, null);
  }
}
