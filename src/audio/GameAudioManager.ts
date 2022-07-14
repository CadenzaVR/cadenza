import Beatmap from "../beatmap/models/Beatmap";
import GameState from "../game/GameState";

export default interface GameAudioManager {
  audioContext: AudioContext;
  addEventListener(event: string, handler: () => void): void;
  loadBeatmap(beatmap: Beatmap): Promise<void>;
  /**
   * Start playing audio for the currently loaded beatmap
   * @returns the scheduled start time based on the audioContext clock
   */
  onGameStart(): Promise<number>;
  onGamePause(): void;
  /**
   * Resume playing audio for the currently loaded beatmap
   * @returns the scheduled resume time based on the audioContext clock
   */
  onGameResume(): Promise<number>;
  /**
   * Restart playing audio for the currently loaded beatmap
   * @returns the scheduled start time based on the audioContext clock
   */
  onGameRestart(): Promise<number>;
  update(gamestate: GameState): void;
}
