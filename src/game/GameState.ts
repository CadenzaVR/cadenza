import Beatmap from "../beatmap/models/Beatmap";
import InputState from "../input/InputState";
import Score from "../scoring/models/Score";
import HitEvent from "./HitEvent";

export const GameStatus = Object.freeze({
  MENU: 0,
  LOADING: 1,
  STARTING: 2,
  PLAYING: 3,
  PAUSED: 4,
  RESUMING: 5,
  GAME_OVER: 6,
});

export default interface GameState {
  status: number;
  beatmap: Beatmap;
  currentSongTime: number;
  timingOffset: number;
  score: Score;
  events: Array<HitEvent>;
  listeners: Map<string, Array<(newValue: any) => void>>;

  addChangeListener(property: string, handler: (newValue: any) => void): void;
  loadBeatmap(beatmap: Beatmap): void;
  update(newSongTime: number, inputs: InputState): void;
  updateScore(): void;
  setStatus(status: number): void;
  reset(): void;
}
