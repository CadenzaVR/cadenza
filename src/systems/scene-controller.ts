import { Raycaster, Vector2 } from "three";
import Beatmap from "../beatmap/models/Beatmap";
import { GameStatus } from "../game/GameState";
import Input from "../input/Input";
import Score from "../scoring/models/Score";

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
    this.mallets = [
      document.querySelector("#mallet1"),
      document.querySelector("#mallet2"),
    ];

    this.el.addEventListener("loaded", () => {
      this.keyboard =
        document.querySelector("#keyboard").components["keyboard"];

      this.adjustFov();
      window.addEventListener("orientationchange", () => {
        this.adjustFov();
      });
      window.addEventListener("resize", () => {
        this.adjustFov();
      });

      this.game = document.querySelector("#game").components["game"];
      this.gameScore = this.game.controller.state.score;
      const noteEmitters = this.keyboard.noteEmitters;
      const gameEvents = this.game.controller.state.events;
      this.game.addGameStateListener("score", () => {
        for (const event of gameEvents) {
          for (let i = 0; i < event.note.width; i++) {
            noteEmitters[event.note.key + i].components[
              "note-emitter"
            ].activate(event.judgement);
          }
        }
        this.updateInfoText();
      });

      this.game.addGameStateListener("status", (status: number) => {
        if (status === GameStatus.PLAYING) {
          this.infoText.setAttribute("width", 1);
          this.setMalletsLocked(true);
        } else {
          this.setMalletsLocked(false);
          this.infoText.setAttribute("width", 2);
        }
        this.updateInfoText();
        this.updateKeyText();
      });

      this.el.systems.input.keyboardInputProvider.addListener(
        (input: Input) => {
          if (input.id === "key2") {
            this.handleKeyRelease(2);
          } else if (input.id === "key3") {
            this.handleKeyRelease(3);
          } else if (input.id === "key4") {
            this.handleKeyRelease(4);
          }
        }
      );
      for (let i = 2; i < 5; i++) {
        this.keyboard.keys[i].addEventListener("collision-exit", () => {
          this.handleKeyRelease(i);
        });
      }
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

    this.infoText = document.querySelector("#info-text");

    // Initialize loading text
    this.loadingText = document.querySelector("#loading-text");

    // Hide keyboard specific instructions for VR
    this.el.addEventListener("exit-vr", () => {
      this.updateInfoText();
      this.updateKeyText();
    });
    this.el.addEventListener("enter-vr", () => {
      this.el.systems.audio.audioManager.startContext();
      this.updateInfoText();
      this.updateKeyText();
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
      const beatmapSet = menu.getSelectedBeatmapSet();
      this.beatmapSet.info.song = beatmapSet.name;
      this.beatmapSet.info.artist = beatmapSet.artist;
      this.beatmapSet.info.creator = beatmapSet.creator;
      this.beatmapSet.info.imageSrc = beatmapSet.imageSrc;
      this.beatmapSet.info.audioSrc = menu.currentAudioSrc;
      this.beatmapSet.info.type = beatmapSet.mode;
      this.beatmapSet.info.language = beatmapSet.language;
      this.beatmapSet.info.genre = beatmapSet.genre;
      this.beatmapSet.info.tags = beatmapSet.tags;
      this.beatmapSet.info.sounds = ["/sounds/release.ogg"];

      this.beatmap.id = selectedMap.mapSrc;
      this.beatmap.info.name = selectedMap.beatmapInfo.name;
      this.beatmap.info.creator = selectedMap.beatmapInfo.creator;
      this.beatmap.info.type = selectedMap.beatmapInfo.mode;
      this.beatmap.notes.length = 0;

      let mapUrl;
      if (isNaN(selectedMap.mapSrc)) {
        mapUrl = selectedMap.mapSrc;
      } else {
        const beatmap = await this.el.systems["db"].db.getBeatmap(
          selectedMap.mapSrc
        );
        mapUrl = URL.createObjectURL(beatmap.data);
      }
      const beatmap = await fetch(mapUrl).then((response) => {
        return response.json();
      });
      //TODO converter refactor
      //parse json notes into objects
      for (const section of beatmap.sections) {
        for (const note of section.notes) {
          this.beatmap.notes.push({
            type: note[0],
            key: note[1],
            startTime: note[2],
            width: note[3],
            endTime: note[4] ? note[4] : null,
            sound: note[0] === 2 ? 0 : null,
          });
        }
      }
      this.loadBeatmap(this.beatmap);
    });
  },

  setMalletsLocked(locked: boolean) {
    for (const mallet of this.mallets) {
      mallet.components["detachable"].locked = locked;
    }
  },

  returnToMenu: function () {
    this.menu.components.menu.el.object3D.visible = true;
    this.menu.components.menu.audio.play();
    this.game.returnToMenu();
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

  handleKeyRelease: function (keyID: number) {
    if (this.game.getStatus() === GameStatus.PAUSED) {
      if (keyID === 2) {
        //menu
        this.returnToMenu();
      } else if (keyID === 3) {
        //restart
        this.game.restart();
      } else if (keyID === 4) {
        //resume
        this.game.resume();
      }
    } else if (this.game.getStatus() === GameStatus.GAME_OVER) {
      if (keyID === 3) {
        //menu
        this.returnToMenu();
      } else if (keyID === 4) {
        //restart
        this.game.restart();
      }
    }
  },

  updateInfoText: function () {
    if (this.game.getStatus() === GameStatus.PLAYING) {
      this.infoText.setAttribute(
        "value",
        "Combo: " +
          this.gameScore.combo +
          " (" +
          this.gameScore.maxCombo +
          ")\nScore: " +
          this.gameScore.score +
          " (" +
          this.gameScore.highScore +
          ")"
      );
    } else if (this.game.getStatus() === GameStatus.PAUSED) {
      this.infoText.setAttribute("value", "Paused");
    } else if (this.game.getStatus() === GameStatus.GAME_OVER) {
      this.infoText.setAttribute("value", "Game Over");
    } else if (this.game.getStatus() === GameStatus.LOADING) {
      this.infoText.setAttribute("value", "Loading...");
    } else if (
      this.game.getStatus() === GameStatus.MENU &&
      this.menu.components
    ) {
      this.infoText.setAttribute("value", "");
    }
  },

  updateKeyText: function () {
    for (const keyText of this.keyboard.keyTexts) {
      keyText.setAttribute("value", "");
    }
    if (this.game.getStatus() === GameStatus.PAUSED) {
      this.keyboard.keyTexts[2].setAttribute("value", "MENU");
      this.keyboard.keyTexts[3].setAttribute("value", "RESTART");
      this.keyboard.keyTexts[4].setAttribute("value", "RESUME");
    } else if (this.game.getStatus() === GameStatus.GAME_OVER) {
      this.keyboard.keyTexts[3].setAttribute("value", "MENU");
      this.keyboard.keyTexts[4].setAttribute("value", "RESTART");
    }
  },
});
