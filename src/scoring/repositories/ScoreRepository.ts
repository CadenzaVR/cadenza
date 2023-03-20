import Beatmap from "../../beatmap/models/Beatmap";
import Score from "../models/Score";

export default interface ScoreRepository {
  saveHighscore(score: Score): Promise<void>;
  getHighscore(beatmap: Beatmap, gameMode: number): Promise<Score>;
}
