import Beatmap from "../../beatmap/models/Beatmap";
import Score from "../models/Score";
import ScoreRepository from "./ScoreRepository";

export default class LocalStorageScoreRepository implements ScoreRepository {
  async saveHighscore(score: Score): Promise<void> {
    localStorage.setItem(
      score.gameMode + "score" + score.beatmap.id,
      score.highScore + ""
    );
    localStorage.setItem(
      score.gameMode + "combo" + score.beatmap.id,
      score.maxCombo + ""
    );
  }

  async getHighscore(beatmap: Beatmap, gameMode: number): Promise<Score> {
    const score = localStorage.getItem(gameMode + "score" + beatmap.id);
    let highScore = 0;
    if (score) {
      highScore = parseInt(score);
    }

    const combo = localStorage.getItem(gameMode + "combo" + beatmap.id);
    let maxCombo = 0;
    if (combo) {
      maxCombo = parseInt(combo);
    }
    return {
      beatmap: beatmap,
      gameMode: gameMode,
      score: 0,
      highScore: highScore,
      combo: 0,
      maxCombo: maxCombo,
      accuracy: null,
      judgementCounts: null,
      data: null,
    };
  }
}
