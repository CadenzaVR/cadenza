import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import MicroModal from "micromodal";
import ErrorThresholds from "./constants/errorThresholds";
import AudioManager from "./AudioManager";
import DBManager from "./DBManager";
import { createProgressRing } from "./objects/progressRing";
import { createRippleSurface } from "./objects/rippleSurface";
import { createTextElement } from "./utils/entityUtils";
import { NoteManager } from "./NoteManager";
import BeatmapInfo from "./models/BeatmapInfo";
import Beatmap from "./models/Beatmap";
import BeatmapSet from "./models/BeatmapSet";

const GameState = Object.freeze({
  PLAYING: 0,
  PAUSED: 1,
  LOADINGMAP: 2,
  MENU: 3,
  GAME_OVER: 4,
});

const NoteTypes = Object.freeze({
  HIT_NOTE: 0,
  SLIDE_NOTE: 1,
  HOLD_NOTE: 2,
  ROLL_NOTE: 3,
});

AFRAME.registerSystem("game-controller", {
  init: function () {
    this.scene = document.querySelector("a-scene");
    this.menu = document.querySelector("#menu");
    this.skysphere = document.querySelector("#skysphere");
    this.settings = this.scene.systems["setting"].settings;
    this.gltfLoader = new GLTFLoader();

    // DB
    this.db = new DBManager();
    this.menu.addEventListener("componentinitialized", (evt) => {
      if (evt.detail.name === "menu") {
        this.db.getBeatmapInfos().then((beatmapInfos) => {
          for (let item of beatmapInfos) {
            const image = new Image();
            image.id = "image-saved-" + item.id;
            image.src = URL.createObjectURL(item.image);
            document.querySelector("a-assets").appendChild(image);

            const beatmapInfo = new BeatmapInfo({
              name: item.name,
              artist: item.artist,
              creator: item.creator,
              imageSrc: "#" + image.id,
              audioSrc: item.songId,
              mode: item.mode,
              language: item.language,
              genre: item.genre,
              tags: item.tags,
            });

            const beatmaps = [];

            for (let i = 0; i < item.difficulties.length; i++) {
              beatmaps.push(
                new Beatmap({
                  beatmapInfo: {},
                  difficulty: item.difficulties[i],
                  difficultyName: item.difficultyNames[i],
                  mapSrc: item.beatmapIds[i],
                })
              );
            }

            this.menu.components["menu"].addNewSong(
              new BeatmapSet({
                beatmapInfo: beatmapInfo,
                beatmaps: beatmaps,
              }),
              true
            );
          }
        });
      }
    });

    // Audio
    this.audio = new AudioManager();
    this.menu.addEventListener("songSelected", async () => {
      if (this.gameState === GameState.MENU) {
        let audioSrc = this.menu.components["menu"].getSelectedBeatmapSet()
          .beatmapInfo.audioSrc;
        if (!isNaN(audioSrc)) {
          if (this.currentAudioObjectUrl) {
            URL.revokeObjectURL(this.currentAudioObjectUrl);
          }
          const song = await this.db.getSong(audioSrc);
          this.currentAudioObjectUrl = URL.createObjectURL(song.data);
          audioSrc = this.currentAudioObjectUrl;
        }
        this.audio.menuAudio.src = audioSrc;
        this.audio.menuAudio.currentTime = 3;
        this.audio.menuAudio.play();
      }
    });

    // Gameplay State
    this.currentSection = 0;
    this.currentNote = 0;
    this.songTime = 0;
    this.combo = 0;
    this.score = 0;
    this.maxCombo = 0;
    this.highscore = 0;
    this.noteManager = NoteManager();
    this.currentBeatmap = {};
    this.keyHitTimes = [0, 0, 0, 0, 0, 0, 0, 0];
    this.activeHoldNotes = [0, 0, 0, 0, 0, 0, 0, 0];
    this.activeRollNotes = [0, 0, 0, 0, 0, 0, 0, 0];
    this.keyHits = [0, 0, 0, 0, 0, 0, 0, 0]; //for touch and keyboard
    this.keyReleases = [0, 0, 0, 0, 0, 0, 0, 0]; //for touch and keyboard
    this.notes = [];
    this.animationMixers = [];
    this.loadedModels = [];
    this.customSkysphereMaterial = null;
    this.defaultSkysphereMaterial = null;

    // Settings
    this.timingThreshold = 500; // ignore hits if next note of the key is greater than this value (ms)
    this.keyHitWindow = 20; // ignore hits if time difference since last hit is less than this value (ms)
    this.keyLineWidth = 0.15;
    this.baseNoteWidth = this.keyLineWidth - 0.02;
    this.baseNoteHeight = 0.05;
    this.keyboardMapping = {
      a: 0,
      s: 1,
      d: 2,
      f: 3,
      g: 4,
      h: 5,
      j: 6,
      k: 7,
    };
    this.keyMapping = ["a", "s", "d", "f", "g", "h", "j", "k"];

    // Constants
    const numKeys = 8;
    const keyLineLength = 8;
    const keyY = 1.595;
    const keyZ = -4.29;
    const keyLineRotation = new THREE.Vector3(-80 * THREE.Math.DEG2RAD, 0, 0);

    // User configurable settings
    document
      .querySelector("#keyboardHeightSetting")
      .addEventListener("change", (e) => {
        this.keyContainer.object3D.position.y = e.detail.value / 100;
        this.keys.forEach((key) =>
          key.boundingBox.setFromObject(key.el.object3D)
        );
        this.noteManager.updateKeyboardHeight(e.detail.value);
      });
    document
      .querySelector("#hitSoundSetting")
      .addEventListener("change", (e) => {
        this.audio.hitSoundsEnabled = e.detail.value;
      });

    // Objects
    this.keyLines = {};
    this.keys = [];
    this.noteEmitters = [];
    this.rippleSurfaces = [];
    this.nextRippleSurface = 0;
    this.keyTexts = [];
    this.mallets = [];
    this.particleGroup;
    this.particleEmitters = [];
    this.activeClickable = null;
    this.clickableObjects = [];
    this.clickableProgressRing;

    // Hide keyboard specific instructions for VR
    this.scene.addEventListener("exit-vr", () => {
      this.updateInfoText();
      this.updateKeyText();
    });
    this.scene.addEventListener("enter-vr", () => {
      this.updateInfoText();
      this.updateKeyText();
      this.keys.forEach((key) =>
        key.boundingBox.setFromObject(key.el.object3D)
      ); //TODO temp hack. Figure out proper timing later
    });

    // Help button and upload button
    this.scene.addEventListener("loaded", () => {
      const uiButtons = document.querySelector(".a-enter-vr");

      const helpButton = document.createElement("button");
      helpButton.classList.add("a-enter-vr-button", "help-button");
      helpButton.setAttribute(
        "style",
        "background-image: url(/images/help_icon.svg);"
      );
      helpButton.setAttribute("data-micromodal-trigger", "help-modal");
      helpButton.setAttribute("title", "How To Play");
      uiButtons.appendChild(helpButton);

      const loadFileButton = document.createElement("button");
      loadFileButton.classList.add("a-enter-vr-button", "load-file-button");
      loadFileButton.setAttribute(
        "style",
        "background-image: url(/images/file_upload_icon.svg);"
      );
      loadFileButton.setAttribute("data-micromodal-trigger", "load-file-modal");
      loadFileButton.setAttribute("title", "Load Beatmap");
      uiButtons.appendChild(loadFileButton);
      MicroModal.init();
    });

    // Mallet haptics
    const leftHand = document.querySelector("#leftHand");
    leftHand.addEventListener("controllerconnected", () => {
      setTimeout(() => {
        const mallet = this.mallets.filter((m) => m.handEl == leftHand)[0];
        const haptics = mallet.handEl.components.haptics;
        if (
          haptics.gamepad.hapticActuators &&
          haptics.gamepad.hapticActuators.length > 0
        ) {
          mallet.haptics = haptics;
        }
      }, 1000);
    });

    const rightHand = document.querySelector("#rightHand");
    rightHand.addEventListener("controllerconnected", () => {
      setTimeout(() => {
        const mallet = this.mallets.filter((m) => m.handEl == rightHand)[0];
        const haptics = mallet.handEl.components.haptics;
        if (
          haptics.gamepad.hapticActuators &&
          haptics.gamepad.hapticActuators.length > 0
        ) {
          mallet.haptics = haptics;
        }
      }, 1000);
    });

    // Keyboard events
    document.addEventListener("keydown", (e) => {
      if (document.activeElement != document.getElementById("url-input")) {
        this.handleKeyboardPress(e.key);
        if (this.keyboardMapping[e.key] != undefined) {
          e.preventDefault();
        }
      }
    });

    document.addEventListener("keyup", (e) => {
      if (document.activeElement != document.getElementById("url-input")) {
        this.handleKeyboardRelease(e.key);
        if (this.keyboardMapping[e.key] != undefined) {
          e.preventDefault();
        }
      }
    });

    const raycaster = new THREE.Raycaster();
    // Mouse events
    document.addEventListener("click", (e) => {
      const mouse = new THREE.Vector2();
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera.getObject3D("camera"));
      for (let clickable of this.clickableObjects) {
        if (raycaster.intersectObject(clickable.mesh).length > 0) {
          clickable.el.dispatchEvent(new Event("click"));
          break;
        }
      }
    });

    // Vive and WMR pause
    document.addEventListener("trackpaddown", () => {
      this.handleKeyboardPress("p");
    });

    // Oculus pause
    document.addEventListener("abuttondown", () => {
      this.handleKeyboardPress("p");
    });
    document.addEventListener("xbuttondown", () => {
      this.handleKeyboardPress("p");
    });

    // Touchscreen input
    document.addEventListener("touchstart", (e) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      let keyTouched = false;
      for (let touch of e.changedTouches) {
        const touchCoordinates = new THREE.Vector2();
        touchCoordinates.x = (touch.clientX / width) * 2 - 1;
        touchCoordinates.y = -(touch.clientY / height) * 2 + 1;
        raycaster.setFromCamera(
          touchCoordinates,
          this.camera.getObject3D("camera")
        );
        for (let i = 0; i < this.keys.length; i++) {
          const key = this.keys[i];
          if (raycaster.intersectObject(key.mesh).length > 0) {
            const keyboardKey = this.keyMapping[i];
            this.handleKeyboardPress(keyboardKey);
            setTimeout(() => this.handleKeyboardRelease(keyboardKey), 10);
            keyTouched = true;
            break;
          }
        }
      }
      if (!keyTouched) {
        this.handleKeyboardPress("p");
      }
    });

    // Progress ring for clickable ui elements
    const progressRing = createProgressRing(0.06);
    this.clickableProgressRing = progressRing;
    this.scene.object3D.add(progressRing.object3D);

    this.keyContainer = document.createElement("a-entity");
    // Initialize key lines, spawn points, key text, note rise effects
    for (let i = 0; i < numKeys; i++) {
      const keyLinePosition = {
        x: -3.5 * this.keyLineWidth + this.keyLineWidth * i,
        y: keyY,
        z: keyZ,
      };

      const keyLine = document.createElement("a-entity");
      keyLine.setAttribute("geometry", {
        primitive: "plane",
        height: keyLineLength,
        width: this.keyLineWidth - 0.01,
      });

      keyLine.setAttribute("material", {
        color: "#fff",
        emissive: "#fff",
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0.2,
      });

      keyLine.object3D.position.set(
        keyLinePosition.x,
        keyLinePosition.y,
        keyLinePosition.z
      );
      keyLine.object3D.rotation.setFromVector3(keyLineRotation);

      this.keyLines[i] = keyLine;
      this.keyContainer.appendChild(keyLine);
      // initialize key text
      const keyText = document.createElement("a-text");
      keyText.setAttribute("width", 0.6);
      keyText.setAttribute("align", "center");
      keyText.setAttribute("font", "/fonts/SpaceMono-Regular-msdf.json");
      keyText.setAttribute("negate", false);
      keyText.object3D.position.set(keyLinePosition.x, 0.95, -0.37);
      keyText.object3D.rotation.setFromVector3(new THREE.Vector3(-0.5, 0, 0));
      this.keyTexts.push(keyText);
      this.keyContainer.appendChild(keyText);

      // initialize note emitters
      const noteEmitter = document.createElement("a-entity");
      noteEmitter.object3D.position.set(keyLinePosition.x, 0.915, -0.33);
      noteEmitter.object3D.rotation.x = THREE.Math.degToRad(-90);
      noteEmitter.setAttribute("note-emitter", "");
      this.noteEmitters.push(noteEmitter);
      this.keyContainer.appendChild(noteEmitter);

      // initialize note queue for each key
      this.notes[i] = [];
    }

    // Initialize ripple surfaces
    for (let i = 0; i < 3; i++) {
      const rippleSurface = createRippleSurface();
      this.rippleSurfaces.push(rippleSurface);
      this.keyContainer.object3D.add(rippleSurface);
      rippleSurface.position.set(0, 0.901 + i * 0.001, -0.1);
    }

    // Initialize key line separators
    for (let i = 0; i <= numKeys; i++) {
      const separator = document.createElement("a-entity");
      separator.setAttribute("geometry", {
        primitive: "plane",
        height: keyLineLength,
        width: 0.01,
      });

      separator.setAttribute("material", {
        color: "#fff",
        emissive: "#fff",
      });

      const separatorPosition = {
        x: (i - 4) * this.keyLineWidth,
        y: keyY,
        z: keyZ,
      };
      separator.object3D.position.set(
        separatorPosition.x,
        separatorPosition.y,
        separatorPosition.z
      );
      separator.object3D.rotation.setFromVector3(keyLineRotation);
      this.keyContainer.appendChild(separator);
    }

    // Initialize key separators
    for (let i = 0; i < numKeys - 1; i++) {
      const keySeparator = document.createElement("a-entity");
      keySeparator.setAttribute("geometry", {
        primitive: "box",
        depth: 0.401,
        height: 0.015,
        width: 0.005,
      });

      keySeparator.setAttribute("material", {
        color: "white",
        shader: "flat",
      });

      const keyPosition = {
        x: -0.45 + i * 0.15,
        y: 0.9,
        z: -0.1,
      };
      keySeparator.object3D.position.set(
        keyPosition.x,
        keyPosition.y,
        keyPosition.z
      );
      this.keyContainer.appendChild(keySeparator);
    }

    // Initialize keys
    for (let i = 0; i < numKeys; i++) {
      const key = document.createElement("a-box");
      key.setAttribute("geometry", {
        depth: 0.4,
        height: 0.1,
        width: 0.15,
      });

      key.setAttribute("material", {
        color: "#fff",
        emissive: "#fff",
        emissiveIntensity: 0.1,
        opacity: 0.2,
      });

      const keyPosition = {
        x: -0.525 + i * 0.15,
        y: 0.85,
        z: -0.1,
      };
      key.object3D.position.set(keyPosition.x, keyPosition.y, keyPosition.z);
      this.keyContainer.appendChild(key);
      key.addEventListener("loaded", () => this.registerKey(key, i));
    }

    // Initialize beatline
    const beatline = document.createElement("a-entity");
    beatline.setAttribute("material", {
      color: "white",
      shader: "flat",
    });
    beatline.setAttribute("geometry", {
      primitive: "plane",
      height: 0.05,
      width: 1.2,
    });
    beatline.object3D.position.set(0, 0.9004, -0.326);
    beatline.object3D.rotation.x = -Math.PI / 2;
    this.keyContainer.appendChild(beatline);

    //Initialize horizontal separator
    const horizontalSeparator = document.createElement("a-entity");
    horizontalSeparator.setAttribute("geometry", {
      primitive: "box",
      depth: 0.005,
      height: 0.015,
      width: 1.2,
    });

    horizontalSeparator.setAttribute("material", {
      color: "white",
      shader: "flat",
    });

    horizontalSeparator.object3D.position.set(0, 0.9, -0.1);
    this.keyContainer.appendChild(horizontalSeparator);

    // Initialize info text
    this.infoText = createTextElement(2, "left");
    this.infoText.setAttribute("value", "");
    this.infoText.object3D.position.set(-0.65, 1, -0.45);
    this.infoText.object3D.rotation.x = -0.5;
    this.keyContainer.appendChild(this.infoText);

    // Initialize loading text
    this.loadingText = createTextElement(1, "left");
    this.loadingText.setAttribute("value", "");
    this.loadingText.object3D.position.set(-0.65, 1.08, -0.5);
    this.loadingText.object3D.rotation.x = -0.5;
    this.keyContainer.appendChild(this.loadingText);
    this.menu.addEventListener("progress", (event) => {
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

    this.menu.addEventListener("downloadComplete", (event) => {
      this.loadingText.setAttribute("value", "");
    });

    this.scene.appendChild(this.keyContainer);

    this.setState(GameState.MENU);

    // initialize audio behaviour
    this.audio.song.ontimeupdate = () => {
      this.songTime = this.audio.song.currentTime * 1000;
      this.songUpdateTime = performance.now();
      if (this.audio.song.ended) {
        this.endMap();
      }
    };

    // Add a starfield to the background of a scene
    // TODO replace with skysphere
    var starsGeometry = new THREE.Geometry();
    const sunDirection = new THREE.Vector3(1, 1, -1);
    for (var i = 0; i < 500; i++) {
      var star = new THREE.Vector3();
      do {
        star.x = THREE.Math.randFloatSpread(1000);
        star.y = THREE.Math.randFloat(0, 500);
        star.z = THREE.Math.randFloatSpread(1000);
      } while (star.length() < 300 || star.angleTo(sunDirection) < 0.2);

      const starMirror = new THREE.Vector3();
      starMirror.x = star.x;
      starMirror.z = star.z;
      starMirror.y = -1 * star.y;
      starsGeometry.vertices.push(star);
      starsGeometry.vertices.push(starMirror);
    }
    var starsMaterial = new THREE.PointsMaterial({ color: 0xffffff });
    this.starField = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.object3D.add(this.starField);

    this.noteManager.init(this.scene, 0);

    const playButton = document.getElementById("play-button");
    playButton.addEventListener("click", async () => {
      const menu = this.menu.components["menu"];
      this.setState(GameState.LOADINGMAP);
      this.audio.menuAudio.pause();
      this.menu.object3D.visible = false;
      this.selectedMap = menu.getSelectedMap();
      let mapUrl;
      if (!isNaN(this.selectedMap.mapSrc)) {
        const beatmap = await this.db.getBeatmap(this.selectedMap.mapSrc);
        mapUrl = URL.createObjectURL(beatmap.data);
      } else {
        mapUrl = this.selectedMap.mapSrc;
      }
      fetch(mapUrl)
        .then((response) => {
          return response.json();
        })
        .then((beatmap) => {
          //parse json notes into objects
          beatmap.sections.forEach((section) => {
            section.notes = section.notes.map((noteArr) => {
              return {
                type: noteArr[0],
                key: noteArr[1],
                startTime: noteArr[2],
                width: noteArr[3],
                endTime: noteArr[4] ? noteArr[4] : null,
              };
            });
          });
          this.loadBeatmap(beatmap, true);
        });
    });

    const saveButton = document.getElementById("save-button");
    saveButton.addEventListener("click", () => {
      const menu = this.menu.components["menu"];
      const selectedBeatmapSet = menu.getSelectedBeatmapSet();
      if (!selectedBeatmapSet.isDefaultMap) {
        if (!selectedBeatmapSet.isSaved) {
          saveButton.object3D.visible = false;
          this.db.saveBeatmapSet(selectedBeatmapSet).then(() => {
            selectedBeatmapSet.isSaved = true;
          });
        } else {
          //todo
        }
      }
    });
  },

  getState: function () {
    return this.gameState;
  },

  setState: function (newState) {
    this.gameState = newState;
    if (this.gameState === GameState.PLAYING) {
      this.infoText.setAttribute("width", 1);
    } else {
      this.infoText.setAttribute("width", 2);
    }
    this.updateInfoText();
    this.updateKeyText();
  },

  play: async function () {
    try {
      await this.audio.song.play();
      this.setState(GameState.PLAYING);
    } catch (err) {
      console.log(err);
    }
  },

  pause: function () {
    this.audio.song.pause();
    this.setState(GameState.PAUSED);
  },

  resume: function () {
    this.audio.song.play();
    this.songUpdateTime = performance.now();
    this.setState(GameState.PLAYING);
  },

  restart: function () {
    this.resetMap();
    this.loadBeatmap(this.currentBeatmap.beatmap, false);
  },

  returnToMenu: function () {
    this.setState(GameState.MENU);
    this.resetMap();

    for (let mixer of this.animationMixers) {
      mixer.stopAllAction();
    }
    this.animationMixers = [];

    if (this.defaultSkysphereMaterial) {
      this.skysphere.object3D.children[0].material = this.defaultSkysphereMaterial;
      this.defaultSkysphereMaterial = null;
      this.customSkysphereMaterial.dispose();
    }

    for (let model of this.loadedModels) {
      this.scene.object3D.remove(model);
      console.log(model);
    }

    this.menu.object3D.visible = true;
    this.audio.menuAudio.play();
  },

  endMap: function () {
    this.setState(GameState.GAME_OVER);
    this.setHighscores();
    this.resetMap();
    //TODO game over menu
  },

  resetMap: function () {
    this.audio.song.pause();
    this.currentSection = 0;
    this.currentNote = 0;
    this.keyHitTimes.fill(0);
    this.songTime = 0;
    this.combo = 0;
    this.score = 0;

    // cleanup existing notes if any
    this.noteManager.reset();
    for (let noteQueue of this.notes) {
      noteQueue.length = 0;
    }
  },

  loadSkysphere: async function (skysphere) {
    if (skysphere.fragmentShader && skysphere.vertexShader) {
      const fragmentShader = await fetch(skysphere.fragmentShader).then((res) =>
        res.text()
      );
      const vertexShader = await fetch(skysphere.vertexShader).then((res) =>
        res.text()
      );

      const material = new THREE.ShaderMaterial({
        fragmentShader: fragmentShader,
        vertexShader: vertexShader,
        side: THREE.BackSide,
      });

      this.customSkysphereMaterial = material;

      this.defaultSkysphereMaterial = this.skysphere.object3D.children[0].material;
      this.skysphere.object3D.children[0].material = material;
    }
  },

  loadModels: async function (models) {
    for (let model of models) {
      await new Promise((resolve, reject) => {
        this.gltfLoader.load(model.file, (gltf) => {
          this.scene.object3D.add(gltf.scene);
          this.loadedModels.push(gltf.scene);
          const positionVector = model.position;
          if (positionVector) {
            gltf.scene.position.set(
              positionVector[0],
              positionVector[1],
              positionVector[2]
            );
          }
          if (gltf.animations.length > 0) {
            console.log(gltf);
            const mixer = new THREE.AnimationMixer(gltf.scene);
            mixer.clipAction(gltf.animations[0]).play();
            this.animationMixers.push(mixer);
          }
          resolve();
        });
      });
    }
  },

  loadBeatmap: async function (beatmap, isFirstLoad = false) {
    this.currentBeatmap.beatmap = beatmap;
    this.getHighscores();

    //duration of each beat in milliseconds
    this.beatDuration = 60000 / beatmap.sections[0].bpm;
    this.beatDurationMultiplier = (2 * Math.PI) / this.beatDuration;

    //determine speed of note movement
    this.noteOffset = 3000;
    this.moveAmount = 8 / this.noteOffset;

    this.noteManager.load(beatmap);

    this.audio.song.onloadeddata = () => {
      this.songUpdateTime = performance.now();
      this.play();
    };

    if (isFirstLoad) {
      if (beatmap.skysphere) {
        await this.loadSkysphere(beatmap.skysphere);
      }

      if (beatmap.models) {
        await this.loadModels(beatmap.models);
      }
    }

    if (isNaN(this.selectedMap.mapSrc)) {
      this.audio.loadSong(beatmap.song);
    } else {
      this.audio.loadSong(this.currentAudioObjectUrl);
    }
  },

  adjustFov: function () {
    const camera = this.camera.getObject3D("camera");
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
      camera.fov =
        (Math.atan(Math.tan((80 * Math.PI) / 360) / camera.aspect) * 360) /
        Math.PI; // degrees
      camera.position.z = 1 - Math.sqrt(camera.fov / 80, 2);
      camera.updateProjectionMatrix();
    }
  },

  getHighscores: function () {
    this.highscore = localStorage.getItem(
      "score" + this.selectedMap.difficulty + this.selectedMap.mapSrc
    );
    if (this.highscore == null) {
      this.highscore = 0;
    }
    this.maxCombo = localStorage.getItem(
      "combo" + this.selectedMap.difficulty + this.selectedMap.mapSrc
    );
    if (this.maxCombo == null) {
      this.maxCombo = 0;
    }
  },

  setHighscores: function () {
    localStorage.setItem(
      "score" + this.selectedMap.difficulty + this.selectedMap.mapSrc,
      this.highscore
    );
    localStorage.setItem(
      "combo" + this.selectedMap.difficulty + this.selectedMap.mapSrc,
      this.maxCombo
    );
  },

  registerCamera: function (camera) {
    this.camera = camera;
    this.scene.addEventListener("loaded", () => {
      this.adjustFov();
    });
    window.addEventListener("orientationchange", () => {
      this.adjustFov();
    });
    window.addEventListener("resize", () => {
      this.adjustFov();
    });
  },

  registerKey: function (el, id) {
    const key = {
      boundingBox: new THREE.Box3().setFromObject(el.object3D),
      z: el.object3D.position.z,
      el: el,
      mesh: el.getObject3D("mesh"),
      state: 0,
      keyLine: this.keyLines[id],
    };
    this.keys.push(key);
  },

  registerMallet: function (el, isHandJoint, radius) {
    const mallet = {
      handEl: isHandJoint ? null : el.parentElement.parentElement.parentElement,
      baseEl: isHandJoint ? null : el.parentElement.parentElement,
      targetPos: new THREE.Vector3(0, 0, 0),
      moveVelocity: new THREE.Vector3(0, 0, 0),
      moveState: 0,
      bit: Math.pow(2, this.mallets.length),
      object3D: el.object3D,
      radius: radius ? radius : el.getAttribute("geometry").radius,
      isHandJoint: isHandJoint,
    };

    mallet.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0, 0),
      mallet.radius
    );
    this.mallets.push(mallet);
  },

  registerClickable: function (
    el,
    activationTime,
    showProgressRing,
    repeatOnHold,
    repeatTime
  ) {
    setTimeout(() => {
      const mesh = el.getObject3D("mesh");
      const planeGeometryPoints = [];
      for (let i = 0; i < 3; i++) {
        planeGeometryPoints.push(
          mesh.localToWorld(
            new THREE.Vector3().fromBufferAttribute(
              mesh.geometry.attributes.position,
              i
            )
          )
        );
      }
      //const worldPosition = el.object3D.getWorldPosition(new THREE.Vector3());
      this.clickableObjects.push({
        boundingBox: new THREE.Box3().setFromObject(mesh),
        surfacePlane: new THREE.Plane().setFromCoplanarPoints(
          planeGeometryPoints[0],
          planeGeometryPoints[1],
          planeGeometryPoints[2]
        ),
        el: el,
        mesh: mesh,
        object3D: el.object3D,
        state: 0,
        activatingTime: 0,
        activationTime: activationTime,
        activationCount: 0,
        showProgressRing: showProgressRing,
        repeatOnHold: repeatOnHold,
        repeatTime: repeatTime,
      });
    }, 1000);
  },

  unregisterClickable: function (el) {
    const i = this.clickableObjects.findIndex((obj) => obj.el === el);
    if (this.activeClickable === this.clickableObjects[i]) {
      this.clearActiveClickable();
    }
    this.clickableObjects.splice(i, 1);
  },

  handleKeyboardRelease: function (key) {
    const keyID = this.keyboardMapping[key];
    if (keyID != undefined) {
      const key = this.keys[keyID];
      key.state &= ~4; //treat keyboard as extra mallet
      this.keyReleases[keyID] = 1;
      this.keyHits[keyID] = 0;
      key.el.setAttribute("material", "emissiveIntensity", "0.1");
      key.keyLine.setAttribute("material", "emissiveIntensity", "0");
    }
  },

  handleKeyboardPress: function (key) {
    const keyID = this.keyboardMapping[key];

    if (keyID != undefined) {
      const key = this.keys[keyID];
      if (!this.keyHits[keyID]) {
        this.keyHits[keyID] = 1;
        this.audio.playHitSound();
        this.handleKeyHit(this.getCurrentSongTime(), keyID);
      }
      key.state |= 4; //treat keyboard as extra mallet
      key.el.setAttribute("material", "emissiveIntensity", "1");
      key.keyLine.setAttribute("material", "emissiveIntensity", "1");
      // ripple effect
      let rippleSurface = this.rippleSurfaces[this.nextRippleSurface];
      const posRippleSurface = rippleSurface.position;
      rippleSurface.material.uniforms.time.value = 0;
      rippleSurface.material.uniforms.hitPosition.value.set(
        key.el.object3D.position.x - posRippleSurface.x,
        posRippleSurface.z - key.el.object3D.position.z
      );
      this.nextRippleSurface =
        (this.nextRippleSurface + 1) % this.rippleSurfaces.length;
    } else if (this.gameState === GameState.PLAYING) {
      if (key === "p") {
        this.pause();
      }
    } else if (this.gameState === GameState.PAUSED) {
      if (key === "p") {
        this.resume();
      }
    }
  },

  handleKeyHit: function (currentSongTime, keyID) {
    if (this.gameState === GameState.PLAYING) {
      const nextKeyNote = this.notes[keyID][0];
      if (this.activeRollNotes[keyID]) {
        this.updateCombo(this.combo + 1, this.score + 1);
        this.noteEmitters[keyID].components["note-emitter"].setColor(1, 1, 1);
        this.noteEmitters[keyID].components["note-emitter"].activate();
      } else if (
        nextKeyNote &&
        nextKeyNote["note"]["type"] != NoteTypes.SLIDE_NOTE &&
        !this.activeHoldNotes[keyID]
      ) {
        const error = Math.abs(
          currentSongTime - nextKeyNote["note"]["startTime"]
        );
        if (error < this.timingThreshold) {
          // todo visual effects
          const noteType = nextKeyNote["note"]["type"];
          if (noteType == NoteTypes.ROLL_NOTE) {
            if (currentSongTime >= nextKeyNote["note"]["startTime"]) {
              this.updateCombo(this.combo + 1, this.score + 1);
              for (let id of nextKeyNote["noteKeys"]) {
                this.activeRollNotes[id] = 1;
              }
              this.noteEmitters[keyID].components["note-emitter"].setColor(
                1,
                1,
                1
              );
              this.noteEmitters[keyID].components["note-emitter"].activate();
            }
          } else {
            if (error < ErrorThresholds.BAD) {
              this.updateCombo(
                this.combo + 1,
                this.score + Math.round(6 - error / 36)
              );
              for (let id of nextKeyNote["noteKeys"]) {
                this.noteEmitters[id].components[
                  "note-emitter"
                ].setColorFromError(error);
                this.noteEmitters[id].components["note-emitter"].activate();
                if (noteType == NoteTypes.HOLD_NOTE) {
                  this.activeHoldNotes[id] = 1;
                }
              }
            } else {
              if (
                currentSongTime - this.keyHitTimes[keyID] <=
                this.keyHitWindow
              ) {
                //ignore the hit
                return;
              }
              this.updateCombo(0);
            }

            if (noteType == NoteTypes.HIT_NOTE) {
              const note = nextKeyNote["elem"];
              const width = nextKeyNote["note"]["width"];
              this.noteManager.deactivateHitNote(note, width);
              for (let id of nextKeyNote["noteKeys"]) {
                const noteQueue = this.notes[id];
                noteQueue.splice(
                  noteQueue.findIndex(
                    (elem) => elem["id"] === nextKeyNote["id"]
                  ),
                  1
                );
                this.keyHitTimes[id] = currentSongTime;
              }
            }
          }
        }
      }
    }
  },

  handleKeyRelease: function (currentSongTime, keyID) {
    if (this.gameState === GameState.PLAYING) {
      const nextKeyNote = this.notes[keyID][0];
      if (
        nextKeyNote &&
        nextKeyNote["note"]["type"] == NoteTypes.HOLD_NOTE &&
        this.activeHoldNotes[keyID]
      ) {
        // ignore if other keys that cover the note are still held down
        for (let id of nextKeyNote["noteKeys"]) {
          if (this.keys[id].state) {
            return;
          }
        }
        if (currentSongTime > nextKeyNote["note"]["startTime"]) {
          const error = Math.abs(
            currentSongTime - nextKeyNote["note"]["endTime"]
          );

          if (error < ErrorThresholds.BAD) {
            this.audio.playReleaseSound();
            this.updateCombo(
              this.combo + 1,
              this.score + Math.round(6 - error / 36)
            );
            for (let id of nextKeyNote["noteKeys"]) {
              this.noteEmitters[id].components[
                "note-emitter"
              ].setColorFromError(error);
              this.noteEmitters[id].components["note-emitter"].activate();
            }
          } else {
            this.updateCombo(0);
          }

          const note = nextKeyNote["elem"];
          this.noteManager.deactivateHoldNote(note);
          for (let id of nextKeyNote["noteKeys"]) {
            this.activeHoldNotes[id] = 0;
            const noteQueue = this.notes[id];
            noteQueue.splice(
              noteQueue.findIndex((elem) => elem["id"] === nextKeyNote["id"]),
              1
            );
          }
        }
      }
    } else if (this.gameState === GameState.PAUSED) {
      if (keyID === 2) {
        //menu
        this.returnToMenu();
      } else if (keyID === 3) {
        //restart
        this.restart();
      } else if (keyID === 4) {
        //resume
        this.resume();
      }
    } else if (this.gameState === GameState.GAME_OVER) {
      if (keyID === 3) {
        //menu
        this.returnToMenu();
      } else if (keyID === 4) {
        //restart
        this.restart();
      }
    }
  },

  updateCombo: function (combo, newScore = null) {
    this.combo = combo;
    if (combo > this.maxCombo) {
      this.maxCombo = combo;
    }
    if (newScore != null) {
      this.score = newScore;
      if (newScore > this.highscore) {
        this.highscore = newScore;
      }
    }
    this.updateInfoText();
  },

  updateInfoText: function () {
    if (this.gameState === GameState.PAUSED) {
      this.infoText.setAttribute("value", "Paused");
    } else if (this.gameState === GameState.GAME_OVER) {
      this.infoText.setAttribute("value", "Game Over");
    } else if (this.gameState === GameState.PLAYING) {
      this.infoText.setAttribute(
        "value",
        "Combo: " +
          this.combo +
          " (" +
          this.maxCombo +
          ")\nScore: " +
          this.score +
          " (" +
          this.highscore +
          ")"
      );
    } else if (this.gameState === GameState.LOADINGMAP) {
      this.infoText.setAttribute("value", "Loading...");
    } else if (this.gameState === GameState.MENU && this.menu.components) {
      this.infoText.setAttribute("value", "");
    }
  },

  updateKeyText: function () {
    for (let keyText of this.keyTexts) {
      keyText.setAttribute("value", "");
    }
    if (this.gameState === GameState.PAUSED) {
      this.keyTexts[2].setAttribute("value", "MENU");
      this.keyTexts[3].setAttribute("value", "RESTART");
      this.keyTexts[4].setAttribute("value", "RESUME");
    } else if (this.gameState === GameState.GAME_OVER) {
      this.keyTexts[3].setAttribute("value", "MENU");
      this.keyTexts[4].setAttribute("value", "RESTART");
    }
  },

  getCurrentSongTime: function () {
    return (
      performance.now() -
      this.songUpdateTime +
      this.songTime -
      this.settings.timingOffset
    );
  },

  clearActiveClickable: function () {
    this.activeClickable.activatingTime = 0;
    this.activeClickable.activationCount = 0;
    this.activeClickable = null;
    this.clickableProgressRing.material.uniforms.percent.value = 0;
    this.clickableProgressRing.object3D.visible = false;
  },

  tick: function (time, deltaTime) {
    const keys = this.keys;

    const currentSongTime = this.getCurrentSongTime();
    if (this.gameState === GameState.PLAYING && this.songTime > 0) {
      // adjust note positions
      let shifted = new Set();
      //remove already passed notes and add them back to the pool
      let shiftCounts = [0, 0, 0, 0, 0, 0, 0, 0];
      for (let key = 0; key < this.notes.length; key++) {
        const noteQueue = this.notes[key];
        let noteElem;
        let noteId;
        let noteWidth;
        let noteType;
        let note;
        for (let i = 0; i < noteQueue.length; i++) {
          noteElem = noteQueue[i]["elem"];
          note = noteQueue[i]["note"];
          noteWidth = note["width"];
          noteType = note["type"];
          noteId = noteQueue[i]["id"];
          const timeAfterNote = currentSongTime - note["startTime"];
          if (timeAfterNote >= 0) {
            let thresholdPassed = timeAfterNote > ErrorThresholds.BAD;
            const isHoldNote = noteType == NoteTypes.HOLD_NOTE;
            if (isHoldNote && this.activeHoldNotes[key]) {
              thresholdPassed =
                currentSongTime - note["endTime"] > ErrorThresholds.BAD;
            }

            const isRollNote = noteType == NoteTypes.ROLL_NOTE;
            if (isRollNote && this.activeRollNotes[key]) {
              thresholdPassed = currentSongTime - note["endTime"] > 0;
            }

            const slideNoteHit =
              noteType == NoteTypes.SLIDE_NOTE && keys[key].state;
            if (!shifted.has(noteId) && (slideNoteHit || thresholdPassed)) {
              shifted.add(noteId);
              this.noteManager.deactivateNote(noteType, noteElem, noteWidth);
              for (let id of noteQueue[i]["noteKeys"]) {
                shiftCounts[id] += 1;
              }

              if (isHoldNote) {
                for (let id of noteQueue[i]["noteKeys"]) {
                  this.activeHoldNotes[id] = 0;
                }
              }

              if (isRollNote) {
                for (let id of noteQueue[i]["noteKeys"]) {
                  this.activeRollNotes[id] = 0;
                }
              }

              if (slideNoteHit) {
                this.updateCombo(this.combo + 1, this.score + 6);
                for (let id of noteQueue[i]["noteKeys"]) {
                  this.noteEmitters[id].components["note-emitter"].setColor(
                    0,
                    1,
                    0
                  );
                  this.noteEmitters[id].components["note-emitter"].activate();
                }
              } else if (!isRollNote) {
                this.updateCombo(0);
              }
              break;
            }
          } else {
            break;
          }
        }
      }

      // update note queues
      for (let i = 0; i < shiftCounts.length; i++) {
        const noteQueue = this.notes[i];
        for (let j = 0; j < shiftCounts[i]; j++) {
          noteQueue.shift();
        }
      }

      //shift the valid notes
      this.noteManager.moveActiveNotesForwards(deltaTime * this.moveAmount);

      // add new notes
      const offsetTime = currentSongTime + this.noteOffset;
      const sectionNotes = this.currentBeatmap.beatmap.sections[
        this.currentSection
      ].notes;

      let i = this.currentNote;
      let note = sectionNotes[i];
      while (note != null && offsetTime > note["startTime"]) {
        const noteType = note["type"];
        const noteWidth = note["width"];
        const noteKey = note["key"];

        const newNote = this.noteManager.spawnNewNote(
          noteType,
          noteWidth,
          noteKey,
          note,
          this.moveAmount * (offsetTime - note["startTime"])
        );
        // enqueue the note along with its time and keys
        let noteKeys = [];
        for (let j = 0; j < noteWidth; j++) {
          this.notes[noteKey + j].push({
            id: noteType + "-" + newNote + "-" + noteWidth,
            elem: newNote,
            note: note,
            noteKeys: noteKeys,
          });
          noteKeys.push(noteKey + j);
        }
        i += 1;
        note = sectionNotes[i];
      }
      this.currentNote = i;
    }

    for (let keyId = 0; keyId < this.keyHits.length; keyId++) {
      if (this.keyReleases[keyId]) {
        this.handleKeyRelease(currentSongTime, keyId);
        this.keyReleases[keyId] = 0;
      }
    }

    for (let mallet of this.mallets) {
      if (!mallet.object3D.visible) {
        continue;
      }
      //update position
      if (mallet.moveState != 0) {
        const basePosition = mallet.baseEl.object3D.position;
        const newPosition = mallet.moveVelocity
          .clone()
          .multiplyScalar(deltaTime)
          .add(basePosition);

        if (
          mallet.targetPos.distanceTo(newPosition) >=
          mallet.targetPos.distanceTo(basePosition)
        ) {
          basePosition.copy(mallet.targetPos);
          mallet.moveVelocity.normalize().multiplyScalar(-0.0005); // return bounce slowly
          mallet.targetPos.set(0, 0, 0);
          mallet.moveState = (mallet.moveState + 1) % 3;
        } else {
          basePosition.set(newPosition.x, newPosition.y, newPosition.z);
        }
      }

      const prevPosition = mallet.boundingSphere.center.clone();
      mallet.object3D.getWorldPosition(mallet.boundingSphere.center);

      //check collision
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const prevState = key.state;
        if (key.boundingBox.intersectsSphere(mallet.boundingSphere)) {
          if (!prevState) {
            // register hit
            this.handleKeyHit(currentSongTime, i);
          }
          const isMalletFirstContact = !(prevState & mallet.bit);
          if (isMalletFirstContact) {
            if (!prevState || !mallet.isHandJoint) {
              this.audio.playHitSound();
            }

            key.state |= mallet.bit;
            // hand control vibration
            if (mallet.haptics) {
              mallet.haptics.pulse(0.4, 20);
            }
          } else if (this.activeHoldNotes[i]) {
            if (mallet.haptics) {
              mallet.haptics.pulse(0.4, 10);
            }
          }
          key.el.setAttribute("material", "emissiveIntensity", "1");
          key.keyLine.setAttribute("material", "emissiveIntensity", "1");

          if (
            !mallet.isHandJoint &&
            (mallet.moveState === 0 || mallet.moveState === 2)
          ) {
            // only bounce if key was hit from above and on the bottom half
            if (
              prevPosition.y > mallet.boundingSphere.center.y &&
              prevPosition.y - key.boundingBox.max.y > -0.03
            ) {
              if (key.z < mallet.boundingSphere.center.z) {
                // start mallet bounce
                mallet.targetPos.subVectors(
                  prevPosition,
                  mallet.boundingSphere.center
                );
                const movedAmount = mallet.targetPos.length();
                mallet.targetPos.set(0, 1, 0);
                mallet.targetPos.applyQuaternion(
                  mallet.handEl.object3D.quaternion.clone().inverse()
                );
                mallet.moveVelocity = mallet.targetPos
                  .clone()
                  .multiplyScalar(0.005); // 5m/s
                mallet.targetPos.multiplyScalar(0.11 + movedAmount); //bounce up at least 11cm
                mallet.moveState = 1;
              }

              if (isMalletFirstContact) {
                // ripple effect
                let rippleSurface = this.rippleSurfaces[this.nextRippleSurface];
                const posRippleSurface = rippleSurface.position;
                rippleSurface.material.uniforms.time.value = 0;
                rippleSurface.material.uniforms.hitPosition.value.set(
                  mallet.boundingSphere.center.x - posRippleSurface.x,
                  mallet.boundingSphere.center.z - posRippleSurface.z
                );
                this.nextRippleSurface =
                  (this.nextRippleSurface + 1) % this.rippleSurfaces.length;
              }
            }
          }
        } else {
          key.state &= ~mallet.bit;
          if (!key.state) {
            if (prevState) {
              this.handleKeyRelease(currentSongTime, i);
            }
            key.el.setAttribute("material", "emissiveIntensity", "0.1");
            key.keyLine.setAttribute("material", "emissiveIntensity", "0");
          }
        }
      }

      if (this.gameState === GameState.MENU) {
        if (this.activeClickable) {
          if (mallet.bit === this.activeClickable.state) {
            if (
              this.activeClickable.boundingBox.intersectsSphere(
                mallet.boundingSphere
              ) &&
              this.activeClickable.surfacePlane.intersectsSphere(
                mallet.boundingSphere
              )
            ) {
              this.activeClickable.activatingTime += deltaTime;
              let activationPercent;
              if (
                this.activeClickable.repeatOnHold &&
                this.activeClickable.activationCount > 0
              ) {
                activationPercent = Math.min(
                  this.activeClickable.activatingTime /
                    (this.activeClickable.repeatTime /
                      Math.pow(1.5, this.activeClickable.activationCount)),
                  1
                );
              } else {
                activationPercent = Math.min(
                  this.activeClickable.activatingTime /
                    this.activeClickable.activationTime,
                  1
                );
              }
              this.clickableProgressRing.material.uniforms.percent.value = activationPercent;
              if (
                (this.activeClickable.activationCount == 0 ||
                  this.activeClickable.repeatOnHold) &&
                activationPercent === 1
              ) {
                this.activeClickable.activatingTime = 0;
                this.activeClickable.activationCount += 1;
                this.activeClickable.el.dispatchEvent(new Event("click"));
                this.clickableProgressRing.object3D.visible = false;
              }
            } else {
              this.activeClickable.el.dispatchEvent(new Event("mouseout"));
              this.clearActiveClickable();
            }
          }
        } else {
          for (let clickable of this.clickableObjects) {
            if (
              clickable.object3D.visible &&
              clickable.boundingBox.intersectsSphere(mallet.boundingSphere) &&
              clickable.surfacePlane.intersectsSphere(mallet.boundingSphere)
            ) {
              this.activeClickable = clickable;
              this.activeClickable.el.dispatchEvent(new Event("mouseover"));
              this.activeClickable.state = mallet.bit;
              if (clickable.showProgressRing) {
                this.clickableProgressRing.object3D.visible = true;
                clickable.object3D.getWorldPosition(
                  this.clickableProgressRing.object3D.position
                );
                clickable.object3D.getWorldQuaternion(
                  this.clickableProgressRing.object3D.quaternion
                );
                this.clickableProgressRing.object3D.position.z += 0.001;
              }
              if (mallet.haptics) {
                mallet.haptics.pulse(0.4, 20);
              }
              break;
            }
          }
        }
      }
    }

    // Update ripple surfaces
    const deltaSeconds = deltaTime / 1000;
    for (let surface of this.rippleSurfaces) {
      surface.material.uniforms.time.value =
        surface.material.uniforms.time.value + deltaSeconds;
    }

    // Update animation mixers
    for (let animationMixer of this.animationMixers) {
      animationMixer.update(deltaSeconds);
    }
  },
});
