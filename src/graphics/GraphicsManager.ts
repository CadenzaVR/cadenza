import Beatmap from "../beatmap/models/Beatmap";
import GameState from "../game/GameState";

export default interface GraphicsManager {
  loadBeatmap(beatmap: Beatmap): Promise<void>;
  update(gamestate: GameState, deltaTime: number): void;
  onGameStart(): void;
  onGameRestart(): void;
  onReturnToMenu(): void;
}
