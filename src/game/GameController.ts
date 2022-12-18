import GameAudioManager from "../audio/GameAudioManager";
import Beatmap from "../beatmap/models/Beatmap";
import GraphicsManager from "../graphics/GraphicsManager";
import InputManager from "../input/InputManager";
import InputState from "../input/InputState";
import ScoreManager from "../scoring/ScoreManager";
import SettingsManager from "../settings/SettingsManager";
import Timer from "../timing/Timer";
import GameState, { GameStatus } from "./GameState";

const TIME_OFFSET_SETTING = "timingOffset";

export default class GameController {
  state: GameState;
  inputState: InputState;
  timer: Timer;
  audioManager: GameAudioManager;
  graphicsManager: GraphicsManager;
  inputManger: InputManager;
  scoreManager: ScoreManager;
  settingsManager: SettingsManager;

  constructor(
    state: GameState,
    audioManager: GameAudioManager,
    timer: Timer,
    graphicsManager: GraphicsManager,
    inputManger: InputManager,
    scoreManager: ScoreManager,
    settingsManager: SettingsManager
  ) {
    this.state = state;
    this.audioManager = audioManager;
    this.timer = timer;
    this.graphicsManager = graphicsManager;
    this.inputManger = inputManger;
    this.scoreManager = scoreManager;
    this.settingsManager = settingsManager;

    this.inputState = inputManger.getInputState();
    this.settingsManager.addObserver(
      TIME_OFFSET_SETTING,
      (newOffset: number) => {
        this.state.timingOffset = newOffset;
      }
    );
    this.audioManager.addEventListener("songEnd", () => {
      this.endMap();
    });
  }

  loadBeatmap(beatmap: Beatmap) {
    this.state.setStatus(GameStatus.LOADING);
    this.state.loadBeatmap(beatmap);
    const highScore = this.scoreManager.getHighscore(beatmap.id);
    this.state.score.beatmapId = beatmap.id;
    this.state.score.highScore = highScore.highScore;
    this.state.score.maxCombo = highScore.maxCombo;
    return Promise.all([
      this.audioManager.loadBeatmap(beatmap),
      this.graphicsManager.loadBeatmap(beatmap),
    ]);
  }

  pause() {
    this.audioManager.onGamePause();
    this.timer.pause();
    this.state.setStatus(GameStatus.PAUSED);
    this.state.score.computeAccuracyStats();
  }

  async start() {
    this.timer.reset();
    const startTime = await this.audioManager.onGameStart();
    this.timer.start(startTime);
    this.graphicsManager.onGameStart();
    this.state.setStatus(GameStatus.PLAYING);
    //this.state.setStatus(GameStatus.STARTING);
  }

  async resume() {
    const resumeTime = await this.audioManager.onGameResume();
    this.timer.resume(resumeTime);
    this.state.setStatus(GameStatus.PLAYING);
    //this.state.setStatus(GameStatus.RESUMING);
  }

  async restart() {
    this.scoreManager.processScore(this.state.score);
    this.state.reset();
    this.state.loadBeatmap(this.state.beatmap);
    this.graphicsManager.onGameRestart();
    this.timer.reset();
    const startTime = await this.audioManager.onGameRestart();
    this.timer.start(startTime);
    this.state.setStatus(GameStatus.PLAYING);
    //this.state.setStatus(GameStatus.STARTING);
  }

  endMap() {
    this.state.score.computeAccuracyStats();
    this.scoreManager.processScore(this.state.score);
    this.state.setStatus(GameStatus.GAME_OVER);
  }

  returnToMainMenu() {
    if (this.state.status === GameStatus.PAUSED) {
      this.scoreManager.processScore(this.state.score);
    }
    this.state.reset();
    this.graphicsManager.onReturnToMenu();
    this.state.setStatus(GameStatus.MENU);
  }

  update(deltaTime: number) {
    // update input state
    this.inputManger.update();
    // update game state
    this.state.update(this.timer.getCurrentTime(), this.inputState);
    this.state.updateScore();
    // play audio based on current state
    this.audioManager.update(this.state);
    // render current state
    this.graphicsManager.update(this.state, deltaTime);
  }
}
