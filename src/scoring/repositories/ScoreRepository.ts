import Score from "../models/Score";

export default interface ScoreRepository {
  saveHighscore(score: Score): void;
  getHighscore(beatmapId: string): Score;
}
