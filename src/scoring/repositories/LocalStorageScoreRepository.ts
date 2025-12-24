import Beatmap from "../../beatmap/models/Beatmap";
import Score from "../models/Score";
import ScoreRepository from "./ScoreRepository";

export default class LocalStorageScoreRepository implements ScoreRepository {
  async saveHighscore(score: Score): Promise<void> {
    const beatmapKey = score.gameMode === 2 ? score.beatmap.hash : (score.beatmap.id ? score.beatmap.id : score.beatmap.hash);
    localStorage.setItem(
      score.gameMode + "score" + beatmapKey,
      score.highScore + ""
    );
    localStorage.setItem(
      score.gameMode + "combo" + beatmapKey,
      score.maxCombo + ""
    );
  }

  async getHighscore(beatmap: Beatmap, gameMode: number): Promise<Score> {
    const beatmapKey = gameMode === 2 ? beatmap.hash : (beatmap.id ? beatmap.id : beatmap.hash);
    const score = localStorage.getItem(
      gameMode + "score" + beatmapKey
    );
    let highScore = 0;
    if (score) {
      highScore = parseInt(score);
    }

    const combo = localStorage.getItem(
      gameMode + "combo" + beatmapKey
    );
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
