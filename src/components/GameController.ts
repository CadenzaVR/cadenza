import { MathUtils } from "three";
import Beatmap from "../beatmap/models/Beatmap";
import ClassicGameState from "../game/ClassicGameState";
import GameController from "../game/GameController";
import TaikoGameState from "../game/TaikoGameState";
import CadenzaGraphicsManager from "../graphics/three/CadenzaGraphicsManager";
import ClassicNotesManager from "../graphics/three/classic/ClassicNotesManager";
import TaikoNotesManager from "../graphics/three/taiko/TaikoNotesManager";
import LocalStorageScoreRepository from "../scoring/repositories/LocalStorageScoreRepository";
import ScoreManager from "../scoring/ScoreManager";
import Timer from "../timing/Timer";

AFRAME.registerComponent("game", {
  init: function () {
    const settingsManager = this.el.sceneEl.systems["setting"].settingsManager;
    const audioManager = this.el.sceneEl.systems["audio"].audioManager;
    audioManager.init(settingsManager);

    const railAngle = MathUtils.degToRad(10);
    const railLength = 8;
    this.classicNotesManager = new ClassicNotesManager(
      railAngle,
      railLength,
      3000
    );
    this.taikoNotesManager = new TaikoNotesManager(railAngle, railLength, 3000);

    this.classicGameState = new ClassicGameState();
    this.taikoGameState = new TaikoGameState();

    const graphicsManager = new CadenzaGraphicsManager(
      [this.classicNotesManager, this.taikoNotesManager],
      audioManager
    );
    graphicsManager.init(
      this.el,
      document.querySelector("#skysphere"),
      settingsManager
    );
    this.controller = new GameController(
      this.classicGameState,
      audioManager,
      new Timer(audioManager.audioContext),
      graphicsManager,
      this.el.sceneEl.systems.input.inputManager,
      new ScoreManager(new LocalStorageScoreRepository()),
      settingsManager
    );
  },

  setTaikoGameMode: function () {
    const prevStateListeners = this.controller.state.listeners;
    this.controller.state = this.taikoGameState;
    this.taikoGameState.listeners = prevStateListeners;
    this.controller.graphicsManager.notesManager = this.taikoNotesManager;
    this.classicNotesManager.reset();
  },

  setClassicGameMode: function () {
    const prevStateListeners = this.controller.state.listeners;
    this.controller.state = this.classicGameState;
    this.classicGameState.listeners = prevStateListeners;
    this.controller.graphicsManager.notesManager = this.classicNotesManager;
    this.taikoNotesManager.reset();
  },

  getScore: function () {
    return this.controller.state.score;
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
