import GameAudioManager from "../audio/GameAudioManager";
import Beatmap from "../beatmap/models/Beatmap";
import GraphicsManager from "../graphics/GraphicsManager";
import InputManager from "../input/InputManager";
import InputState from "../input/InputState";
import { computeAccuracyStats } from "../scoring/models/Score";
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
    this.audioManager.addEventListener("songEnd", async () => {
      await this.endMap();
    });
  }

  async loadBeatmap(beatmap: Beatmap) {
    this.state.setStatus(GameStatus.LOADING);
    this.state.loadBeatmap(beatmap);
    const highScore = await this.scoreManager.getHighscore(
      beatmap,
      this.state.getGameMode()
    );
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
    computeAccuracyStats(this.state.score);
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
    if (
      this.state.status === GameStatus.PAUSED ||
      this.state.status === GameStatus.GAME_OVER
    ) {
      this.state.reset();
      this.state.loadBeatmap(this.state.beatmap);
      this.graphicsManager.onGameRestart();
      this.timer.reset();
      const startTime = await this.audioManager.onGameRestart();
      this.timer.start(startTime);
      this.state.setStatus(GameStatus.PLAYING);
      //this.state.setStatus(GameStatus.STARTING);
    }
  }

  async endMap() {
    computeAccuracyStats(this.state.score);
    this.state.score.beatmap = this.state.beatmap;
    await this.scoreManager.processScore(this.state.score);
    this.state.setStatus(GameStatus.GAME_OVER);
  }

  async returnToMainMenu() {
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
