import { Raycaster, Vector2 } from "three";
import convertBeatmap from "../beatmap/converters/BeatmapConverter";
import Beatmap from "../beatmap/models/Beatmap";
import { deserializeBeatmap } from "../beatmap/serialization/BeatmapDeserializer";
import {
  GAMEMODE_CLASSIC,
  GAMEMODE_TAIKO,
  GAMEMODE_TONO,
} from "../game/GameModes";
import { GameStatus } from "../game/GameState";
import { getColor } from "../graphics/JudgementColors";
import { computeAccuracyStats } from "../scoring/models/Score";
import { Entity } from "aframe";

const TOUCH_COLLISION_START_EVENT = new CustomEvent("collision-enter", {
  detail: {
    id: -1,
    collisionShapes: [[null, { center: { x: 0, y: 0, z: 0 } }]],
  },
});
const TOUCH_COLLISION_END_EVENT = new CustomEvent("collision-exit", {
  detail: { id: -1 },
});

AFRAME.registerSystem("scene-controller", {
  init: function () {
    this.menu = document.querySelector("#menu");
    this.menu.addEventListener("song-change", () => {
      this.schedulePreload();
    });
    this.inputDevices = [
      [document.querySelector("#keyboard")],
      [document.querySelector("#drum")],
      [
        document.querySelector("#tone-display"),
        document.querySelector("#microphone"),
        document.querySelector("#trombone"),
      ],
    ];
    this.mallets = [
      document.querySelector("#mallet1"),
      document.querySelector("#mallet2"),
    ];

    this.el.addEventListener("loaded", () => {
      this.microphone =
        document.querySelector("#microphone").components["microphone"];
      this.keyboard =
        document.querySelector("#keyboard").components["keyboard"];

      this.drum = document.querySelector("#drum").components["drum"];

      this.adjustFov();
      window.addEventListener("orientationchange", () => {
        this.adjustFov();
      });
      window.addEventListener("resize", () => {
        this.adjustFov();
      });

      this.game = document.querySelector("#game").components["game"];
      this.gameMode = 0;
      const noteEmitters = this.keyboard.noteEmitters;
      this.game.addGameStateListener("score", () => {
        if (this.gameMode === 1) {
          const colorArr = [];
          for (const event of this.game.controller.state.events) {
            if (event.judgement !== 2 && event.note.timeDelta <= 180) {
              //TODO clean up
              colorArr.push(getColor(event.judgement));
            }
          }
          this.drum.setPrevRippleColors(colorArr);
        } else {
          for (const event of this.game.controller.state.events) {
            for (let i = 0; i < event.note.width; i++) {
              noteEmitters[event.note.key + i].components[
                "note-emitter"
              ].activate(event.judgement);
            }
          }
        }
        this.updateInfoText();
      });

      this.game.addGameStateListener("status", (status: number) => {
        if (status === GameStatus.PLAYING) {
          this.el.systems["detachable"].isEnabled = false;
          this.disablePointers();
          this.infoText.setAttribute("width", 1);
          this.setMalletsLocked(true);
        } else {
          this.el.systems["detachable"].isEnabled = true;
          this.enablePointers();
          this.setMalletsLocked(false);
          this.infoText.setAttribute("width", 2);
        }
        this.updateInfoText();
        this.updatePauseGameoverPanel();
        if (status === GameStatus.GAME_OVER) {
          const score = this.game.getScore();
          const beatmapHash = score.beatmap.hash;
          const gameMode = this.gameMode;
          this.updateHighscoreText();
          gtag("event", "songend", {
            mode: gameMode,
            map: beatmapHash,
          });
        }
      });

      this.loadSongTimeout = null;

      this.menu.addEventListener("difficulty-change", () => {
        this.schedulePreload();
      });

      this.menu.addEventListener("game-mode-change", (e: CustomEvent) => {
        this.gameMode = e.detail;
        this.microphone.disableMic();
        for (const inputDeviceList of this.inputDevices) {
          for (const inputDevice of inputDeviceList) {
            inputDevice.setAttribute("visible", false);
            this.el.systems["collision-detection"].disableColliderGroup(
              inputDevice.id
            );
          }
        }
        for (const inputDevice of this.inputDevices[this.gameMode]) {
          inputDevice.setAttribute("visible", true);
          this.el.systems["collision-detection"].enableColliderGroup(
            inputDevice.id
          );
        }
        switch (this.gameMode) {
          case GAMEMODE_CLASSIC:
            this.game.setClassicGameMode();
            break;
          case GAMEMODE_TAIKO:
            this.game.setTaikoGameMode();
            break;
          case GAMEMODE_TONO:
            this.game.setTonoGameMode();
            this.microphone.enableMic();
            break;
        }
        this.schedulePreload();
      });
    });

    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (document.activeElement != document.getElementById("url-input")) {
        if (e.key === "p") {
          this.pauseResume();
        }
      }
    });

    // Vive and WMR pause
    document.addEventListener("trackpaddown", () => {
      this.pauseResume();
    });

    // Oculus pause
    document.addEventListener("abuttondown", () => {
      this.pauseResume();
    });
    document.addEventListener("xbuttondown", () => {
      this.pauseResume();
    });

    // Hand tracking pause
    const leftHand = document.querySelector("#leftHand");
    const rightHand = document.querySelector("#rightHand");
    const LEFT_TRIGGER = 1; // 01 in binary
    const RIGHT_TRIGGER = 2; // 10 in binary
    const BOTH_TRIGGERS = LEFT_TRIGGER | RIGHT_TRIGGER; // 11 in binary

    let triggerState = 0;

    function updateTriggerState(triggerBit: number, isDown: boolean) {
      if (isDown) {
        triggerState |= triggerBit; // Set the bit
      } else {
        triggerState &= ~triggerBit; // Clear the bit
      }

      if (triggerState === BOTH_TRIGGERS) {
        this.pauseResume(false);
      }
    }

    leftHand.addEventListener("triggerdown", () => {
      if (
        leftHand.components["generic-tracked-controller-controls"]
          .controllerEventsActive
      ) {
        updateTriggerState(LEFT_TRIGGER, true);
      }
    });

    leftHand.addEventListener("triggerup", () => {
      updateTriggerState(LEFT_TRIGGER, false);
    });

    rightHand.addEventListener("triggerdown", () => {
      if (
        rightHand.components["generic-tracked-controller-controls"]
          .controllerEventsActive
      ) {
        updateTriggerState(RIGHT_TRIGGER, true);
      }
    });

    rightHand.addEventListener("triggerup", () => {
      updateTriggerState(RIGHT_TRIGGER, false);
    });

    // Retry Button
    document.querySelector("#retry-button").addEventListener("click", () => {
      this.game.restart();
    });

    // Resume Button
    document.querySelector("#resume-button").addEventListener("click", () => {
      this.pauseResume();
    });

    // Return to Menu Button
    document
      .querySelector("#back-to-menu-button")
      .addEventListener("click", () => {
        this.returnToMenu();
      });

    this.infoText = document.querySelector("#info-text");

    // Initialize loading text
    this.loadingText = document.querySelector("#loading-text");

    // Hide keyboard specific instructions for VR
    this.el.addEventListener("exit-vr", () => {
      this.updateInfoText();
    });
    this.el.addEventListener("enter-vr", () => {
      if (this.gameMode !== 0) {
        this.el.systems["collision-detection"].disableColliderGroup("keyboard");
      }
      if (this.gameMode !== 1) {
        this.el.systems["collision-detection"].disableColliderGroup("drum");
      }
      if (this.gameMode !== 2) {
        this.el.systems["collision-detection"].disableColliderGroup("trombone");
      }
      this.el.systems.audio.audioManager.startContext();
      this.updateInfoText();

      if (this.el.xrSession) {
        this.el.xrSession.addEventListener(
          "visibilitychange",
          async (eventData: any) => {
            switch (eventData.session.visibilityState) {
              case "visible":
                //...
                break;
              case "visible-blurred":
                //...
                break;
              case "hidden":
                this.pauseResume(false);
                this.menu.components["menu"].audio.pause();
                await this.el.xrSession.end();
                break;
            }
          }
        );
      }
    });

    this.menu.addEventListener("downloadStart", () => {
      this.loadingText.setAttribute("value", "Loading...");
    });

    this.menu.addEventListener("progress", (event: any) => {
      const { loaded, total } = event;
      let downloadUnits;
      let downloadAmount;
      if (total == 0) {
        downloadAmount = Math.round(loaded / 1000);
        downloadUnits = "kB";
      } else {
        downloadAmount = Math.round((loaded / total) * 100);
        downloadUnits = "%";
      }
      this.loadingText.setAttribute(
        "value",
        "Downloaded " + downloadAmount + downloadUnits
      );
      if (loaded == total) {
        this.loadingText.setAttribute("value", "");
      }
    });

    this.menu.addEventListener("downloadComplete", () => {
      this.loadingText.setAttribute("value", "");
    });

    this.el.systems["collision-detection"].disableColliderGroup("pauseMenu");

    // Touch input
    const raycaster = new Raycaster();
    document.addEventListener("touchstart", (e) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      let keyTouched = false;
      for (const touch of e.changedTouches) {
        const touchCoordinates = new Vector2();
        touchCoordinates.x = (touch.clientX / width) * 2 - 1;
        touchCoordinates.y = -(touch.clientY / height) * 2 + 1;
        raycaster.setFromCamera(touchCoordinates, this.el.camera);
        const keys = this.keyboard.keys;
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const intersections = raycaster.intersectObject(
            key.getObject3D("mesh")
          );
          if (intersections.length > 0) {
            TOUCH_COLLISION_START_EVENT.detail.collisionShapes[0][1].center.x =
              intersections[0].point.x;
            TOUCH_COLLISION_START_EVENT.detail.collisionShapes[0][1].center.z =
              intersections[0].point.z;
            key.dispatchEvent(TOUCH_COLLISION_START_EVENT);
            setTimeout(() => key.dispatchEvent(TOUCH_COLLISION_END_EVENT), 10);
            keyTouched = true;
            break;
          }
        }
      }
      if (!keyTouched) {
        this.pauseResume();
      }
    });

    const playButton = document.getElementById("play-button");
    this.beatmapSet = {
      info: {},
      beatmaps: null,
    };
    this.beatmap = {
      id: null,
      info: {
        name: null,
        creator: null,
        type: null,
      },
      notes: [],
      set: this.beatmapSet,
    };
    playButton.addEventListener("click", async () => {
      const menu = this.menu.components["menu"];
      menu.audio.pause();
      this.menu.object3D.visible = false;
      this.el.systems["collision-detection"].disableColliderGroup("menu");
      this.menu.object3D.position.y = -100;
      const selectedMap = menu.getSelectedMap() as Beatmap;

      if (this.loadSongTimeout) {
        clearTimeout(this.loadSongTimeout);
        this.loadSongTimeout = null;
      }
      await this.preloadBeatmap(selectedMap);

      let temp = null;

      if (typeof selectedMap.set.info.audioSrc === "number") {
        const audio = await this.el.systems["db"].beatmapSetRepository.getSong(
          selectedMap.set.info.audioSrc
        );
        temp = selectedMap.set.info.audioSrc;
        selectedMap.set.info.audioSrc = URL.createObjectURL(audio.data);
      }

      if (selectedMap.set.info.audioSrc.startsWith("https://")) {
        //cross origin
        temp = selectedMap.set.info.audioSrc;
        selectedMap.set.info.audioSrc = await fetch(
          selectedMap.set.info.audioSrc
        )
          .then((response) => response.blob())
          .then((blob) => URL.createObjectURL(blob));
      }

      if (temp) {
        await this.loadBeatmap(selectedMap);
        selectedMap.set.info.audioSrc = temp;
      } else {
        this.loadBeatmap(selectedMap);
      }

      gtag("event", "play", {
        mode: this.gameMode,
        creator: selectedMap.info.creator
          ? selectedMap.info.creator
          : selectedMap.set.info.creator,
        name: selectedMap.set.info.song + "_" + selectedMap.info.name,
        map: selectedMap.hash,
      });
    });
  },

  updateHighscoreText: async function () {
    const selectedMap = this.menu.components[
      "menu"
    ].getSelectedMap() as Beatmap;
    if (selectedMap) {
      const localHighscore =
        await this.el.systems.scores.scoreManager.scoreRepository.getHighscore(
          selectedMap,
          this.gameMode
        );
      const accuracyRankStr = localHighscore.highScoreAccuracy
        ? ` (${localHighscore.highScoreAccuracy.toFixed(2)}% - ${
            localHighscore.highScoreRank
          })`
        : "";
      document
        .querySelector("#highscore-text")
        .setAttribute(
          "value",
          `Highscore: ${localHighscore.highScore + accuracyRankStr}`
        );
    }
  },

  schedulePreload: function (ms = 2000) {
    if (this.loadSongTimeout) {
      clearTimeout(this.loadSongTimeout);
    }
    document.querySelector("#high-scores-text").setAttribute("value", "");
    this.updateHighscoreText();

    this.loadSongTimeout = setTimeout(async () => {
      const selectedMap = this.menu.components[
        "menu"
      ].getSelectedMap() as Beatmap;
      await this.preloadBeatmap(selectedMap);
      this.updateHighscoreText();
      this.loadSongTimeout = null;
    }, ms);
  },

  preloadBeatmap: async function (beatmap: Beatmap) {
    if (!isNaN(beatmap.info.src as number)) {
      const map = await this.el.systems["db"].beatmapSetRepository.getBeatmap(
        beatmap.info.src
      );
      beatmap.info.src = URL.createObjectURL(map.data);
    }
    const beatmapRaw = await fetch(beatmap.info.src as string).then(
      (response) => {
        return response.blob();
      }
    );
    await deserializeBeatmap(beatmapRaw, beatmap);
    await convertBeatmap(beatmap, this.gameMode);
  },

  enablePointers: function () {
    if (this.el.sceneEl.is("vr-mode")) {
      const leftHand = document.querySelector("#leftHand");
      const rightHand = document.querySelector("#rightHand");
      leftHand.setAttribute("raycaster", "enabled", true);
      leftHand.setAttribute("raycaster", "showLine", true);
      rightHand.setAttribute("raycaster", "enabled", true);
      rightHand.setAttribute("raycaster", "showLine", true);
    }
  },

  disablePointers: function () {
    const leftHand = document.querySelector("#leftHand");
    const rightHand = document.querySelector("#rightHand");
    leftHand.setAttribute("raycaster", "enabled", false);
    leftHand.setAttribute("raycaster", "showLine", false);
    rightHand.setAttribute("raycaster", "enabled", false);
    rightHand.setAttribute("raycaster", "showLine", false);
  },

  setMalletsLocked(locked: boolean) {
    for (const mallet of this.mallets) {
      mallet.components["detachable"].locked = locked;
    }
  },

  returnToMenu: function () {
    if (
      this.game.controller.state.status === GameStatus.PAUSED ||
      this.game.controller.state.status === GameStatus.GAME_OVER
    ) {
      this.game.returnToMenu();
      this.menu.components.menu.el.object3D.visible = true;
      this.el.systems["collision-detection"].enableColliderGroup("menu");
      this.menu.object3D.position.y = 1.5;
    }
  },

  loadBeatmap: async function (beatmap: Beatmap) {
    //duration of each beat in milliseconds
    // this.beatDuration = 60000 / beatmap.sections[0].bpm;
    // this.beatDurationMultiplier = (2 * Math.PI) / this.beatDuration;
    await this.game.loadBeatmap(beatmap);
    this.game.startGame();
  },

  adjustFov: function () {
    const camera = this.el.camera;
    if (camera.fov != 80) {
      camera.fov = 80;
      camera.position.z = 0;
      camera.updateProjectionMatrix();
    }

    const currentHFOV =
      (2 *
        Math.atan(Math.tan((camera.fov * Math.PI) / 180 / 2) * camera.aspect) *
        180) /
      Math.PI;
    if (currentHFOV < 80) {
      camera.position.z = 1 - currentHFOV / 80;
    }
  },

  pauseResume: function (resumeEnabled = true) {
    if (
      this.game.controller.state.status === GameStatus.PAUSED &&
      resumeEnabled
    ) {
      this.game.resume();
    } else if (this.game.controller.state.status === GameStatus.PLAYING) {
      this.game.pauseGame();
    }
  },

  updatePauseGameoverPanel: function () {
    const pauseGameoverPanel = document.getElementById(
      "pause-gameover-panel"
    ) as Entity;
    const pauseGameOverText = document.getElementById("pause-gameover-text");
    const scoreText = document.getElementById("score-text");
    const accuracyText = document.getElementById("accuracy-text");
    const rankText = document.getElementById("rank-text");
    const statsText = document.getElementById("stats-text");
    const resumeButton = document.getElementById("resume-button");
    if (
      this.game.getStatus() === GameStatus.PAUSED ||
      this.game.getStatus() === GameStatus.GAME_OVER
    ) {
      this.el.systems["collision-detection"].enableColliderGroup("pauseMenu");
      if (this.game.getStatus() === GameStatus.GAME_OVER) {
        pauseGameOverText.setAttribute("value", "Game Over");
        resumeButton.setAttribute("visible", "false");
      } else {
        pauseGameOverText.setAttribute("value", "Paused");
        resumeButton.setAttribute("visible", "true");
      }
      const score = this.game.getScore();
      computeAccuracyStats(score);
      const pbString =
        score.score === score.highScore ? " (Personal Best!)" : "";
      scoreText.setAttribute("value", "Score: " + score.score + pbString);
      accuracyText.setAttribute(
        "value",
        "Accuracy: " + score.accuracy.toFixed(2) + "%"
      );
      rankText.setAttribute("value", "Rank: " + score.rank);
      statsText.setAttribute(
        "value",
        Object.entries(score.judgementCounts)
          .map((judgementCount) => {
            return judgementCount[0] + " " + judgementCount[1];
          })
          .join("  ")
      );
      pauseGameoverPanel.object3D.visible = true;
    } else {
      this.el.systems["collision-detection"].disableColliderGroup("pauseMenu");
      pauseGameoverPanel.object3D.visible = false;
    }
  },

  updateInfoText: function () {
    if (this.game.getStatus() === GameStatus.PLAYING) {
      this.infoText.setAttribute(
        "value",
        "Combo: " +
          this.game.getScore().combo +
          " (" +
          this.game.getScore().maxCombo +
          ")\nScore: " +
          this.game.getScore().score +
          " (" +
          this.game.getScore().highScore +
          ")"
      );
    } else if (this.game.getStatus() === GameStatus.LOADING) {
      this.infoText.setAttribute("value", "Loading...");
    } else {
      this.infoText.setAttribute("value", "");
    }
  },
});
