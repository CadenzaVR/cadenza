import { Raycaster, Vector2 } from "three";
import convertBeatmap from "../beatmap/converters/BeatmapConverter";
import Beatmap from "../beatmap/models/Beatmap";
import { deserializeBeatmap } from "../beatmap/serialization/BeatmapDeserializer";
import { SUPPORTED_BEATMAP_TYPES } from "../game/GameModes";
import { GameStatus } from "../game/GameState";
import { getColor } from "../graphics/JudgementColors";
import { computeAccuracyStats, getRank } from "../scoring/models/Score";

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
    this.inputDevices = [
      document.querySelector("#keyboard"),
      document.querySelector("#drum"),
    ];
    this.mallets = [
      document.querySelector("#mallet1"),
      document.querySelector("#mallet2"),
    ];

    this.el.addEventListener("loaded", () => {
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
      });

      this.menu.addEventListener("game-mode-change", (e: CustomEvent) => {
        this.gameMode = e.detail;
        for (const inputDevice of this.inputDevices) {
          inputDevice.setAttribute("visible", false);
          this.el.systems["collision-detection"].disableColliderGroup(
            inputDevice.id
          );
        }
        this.inputDevices[this.gameMode].setAttribute("visible", true);
        this.el.systems["collision-detection"].enableColliderGroup(
          this.inputDevices[this.gameMode].id
        );
        switch (this.gameMode) {
          case 0:
            this.game.setClassicGameMode();
            break;
          case 1:
            this.game.setTaikoGameMode();
            break;
        }
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

    // Retry Button
    document.querySelector("#retry-button").addEventListener("click", () => {
      this.game.restart();
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
      if (this.gameMode !== 1) {
        this.el.systems["collision-detection"].disableColliderGroup("drum");
      }
      this.el.systems.audio.audioManager.startContext();
      this.updateInfoText();
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
      const selectedMap = menu.getSelectedMap();

      if (!isNaN(selectedMap.info.src)) {
        const beatmap = await this.el.systems[
          "db"
        ].beatmapSetRepository.getBeatmap(selectedMap.info.src);
        selectedMap.info.src = URL.createObjectURL(beatmap.data);
      }
      const beatmapRaw = await fetch(selectedMap.info.src).then((response) => {
        return response.blob();
      });
      await deserializeBeatmap(beatmapRaw, selectedMap);

      const mapType = selectedMap.info.type
        ? parseInt(selectedMap.info.type)
        : parseInt(selectedMap.set.info.type);
      if (!SUPPORTED_BEATMAP_TYPES[this.gameMode].primary.includes(mapType)) {
        convertBeatmap(selectedMap, this.gameMode);
      }

      if (typeof selectedMap.set.info.audioSrc === "number") {
        const audio = await this.el.systems["db"].beatmapSetRepository.getSong(
          selectedMap.set.info.audioSrc
        );
        const temp = selectedMap.set.info.audioSrc;
        selectedMap.set.info.audioSrc = URL.createObjectURL(audio.data);
        await this.loadBeatmap(selectedMap);
        selectedMap.set.info.audioSrc = temp;
      } else {
        this.loadBeatmap(selectedMap);
      }
    });
  },

  enablePointers: function () {
    const leftHand = document.querySelector("#leftHand");
    const rightHand = document.querySelector("#rightHand");
    leftHand.setAttribute("raycaster", "enabled", true);
    leftHand.setAttribute("raycaster", "showLine", true);
    rightHand.setAttribute("raycaster", "enabled", true);
    rightHand.setAttribute("raycaster", "showLine", true);
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
    this.game.returnToMenu();
    this.menu.components.menu.el.object3D.visible = true;
    this.menu.components.menu.audio.play();
    this.el.systems["collision-detection"].enableColliderGroup("menu");
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

  pauseResume: function () {
    if (this.game.controller.state.status === GameStatus.PAUSED) {
      this.game.resume();
    } else if (this.game.controller.state.status === GameStatus.PLAYING) {
      this.game.pauseGame();
    }
  },

  updatePauseGameoverPanel: function () {
    const pauseGameoverPanel = document.getElementById("pause-gameover-panel");
    const pauseGameOverText = document.getElementById("pause-gameover-text");
    const scoreText = document.getElementById("score-text");
    const accuracyText = document.getElementById("accuracy-text");
    const rankText = document.getElementById("rank-text");
    const statsText = document.getElementById("stats-text");
    if (
      this.game.getStatus() === GameStatus.PAUSED ||
      this.game.getStatus() === GameStatus.GAME_OVER
    ) {
      this.el.systems["collision-detection"].enableColliderGroup("pauseMenu");
      if (this.game.getStatus() === GameStatus.GAME_OVER) {
        pauseGameOverText.setAttribute("value", "Game Over");
      } else {
        pauseGameOverText.setAttribute("value", "Paused");
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
      rankText.setAttribute("value", "Rank: " + getRank(score));
      statsText.setAttribute(
        "value",
        Object.entries(score.judgementCounts)
          .map((judgementCount) => {
            return judgementCount[0] + " " + judgementCount[1];
          })
          .join("  ")
      );
      pauseGameoverPanel.setAttribute("visible", "true");
    } else {
      this.el.systems["collision-detection"].disableColliderGroup("pauseMenu");
      pauseGameoverPanel.setAttribute("visible", "false");
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
