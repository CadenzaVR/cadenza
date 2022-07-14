import Beatmap from "../beatmap/models/Beatmap";
import ClassicGameState from "../game/ClassicGameState";
import GameController from "../game/GameController";
import { GameStatus } from "../game/GameState";
import ClassicGraphicsManager from "../graphics/ClassicGraphicsManager";
import ClassicNoteManager from "../graphics/ClassicNoteManager";
import LocalStorageScoreRepository from "../scoring/repositories/LocalStorageScoreRepository";
import ScoreManager from "../scoring/ScoreManager";
import Timer from "../timing/Timer";

AFRAME.registerComponent("game", {
  init: function () {
    const settingsManager = this.el.sceneEl.systems["setting"].settingsManager;
    const audioManager = this.el.sceneEl.systems["audio"].audioManager;
    audioManager.init(settingsManager);
    const graphicsManager = new ClassicGraphicsManager(
      new ClassicNoteManager(),
      audioManager
    );
    graphicsManager.init(
      this.el,
      document.querySelector("#skysphere"),
      settingsManager
    );
    this.controller = new GameController(
      new ClassicGameState(),
      audioManager,
      new Timer(audioManager.audioContext),
      graphicsManager,
      this.el.sceneEl.systems.input.inputManager,
      new ScoreManager(new LocalStorageScoreRepository()),
      settingsManager
    );
    this.controller.state.status = GameStatus.MENU;
  },

  loadBeatmap: function (beatmap: Beatmap) {
    return this.controller.loadBeatmap(beatmap);
  },

  startGame: function () {
    return this.controller.start();
  },

  pauseGame: function () {
    this.controller.pause();
  },

  resume: function () {
    return this.controller.resume();
  },

  restart: function () {
    return this.controller.restart();
  },

  returnToMenu: function () {
    this.controller.returnToMainMenu();
  },

  getStatus: function () {
    return this.controller.state.status;
  },

  addGameStateListener: function (
    property: string,
    handler: (newValue: any) => void
  ) {
    this.controller.state.addChangeListener(property, handler);
  },

  tick(time, timeDelta) {
    this.controller.update(timeDelta);
  },
});
