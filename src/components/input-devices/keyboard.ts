import SimpleInputProvider from "../../input/SimpleInputProvider";
import { createRippleSurface } from "../../objects/rippleSurface";
import { MathUtils, Vector3 } from "three";
import Input from "../../input/Input";

AFRAME.registerComponent("keyboard", {
  init: function () {
    this.inputs = [];
    this.inputKeyMap = new Map();
    this.keys = [];
    this.keyCollisions = [];
    this.keyTexts = [];
    this.noteRails = [];
    this.noteEmitters = [];

    this.rippleSurfaces = [];
    this.nextRippleSurface = 0;

    this.noteRailWidth = 0.15;
    // Constants
    const numKeys = 8;
    this.noteRailLength = 8;
    this.noteRailRotation = new Vector3(-80 * MathUtils.DEG2RAD, 0, 0);

    this.keyY = 1.595;
    this.keyZ = -4.29;

    this.hitSound = "/sounds/hit.ogg";
    this.audio = this.el.sceneEl.systems.audio.audioManager;

    // Initialize keys, key lines, key text, note rise effects
    for (let i = 0; i < numKeys; i++) {
      this.keyCollisions.push(new Set());
      const noteRailX = -3.5 * this.noteRailWidth + this.noteRailWidth * i;
      const noteRail = this._createRail(noteRailX);
      this.noteRails.push(noteRail);
      this.el.appendChild(noteRail);
      // initialize key text
      const keyText = this._createKeyText(noteRailX);
      this.keyTexts.push(keyText);
      this.el.appendChild(keyText);

      // initialize note emitters
      const noteEmitter = this.__createNoteEmitter(noteRailX);
      this.noteEmitters.push(noteEmitter);
      this.el.appendChild(noteEmitter);

      this.inputs.push({ id: "key" + i, value: 0 });
      const key = this._createKey(i);
      this.inputKeyMap.set("key" + i, i);
      this.keys.push(key);
      this.el.appendChild(key);
    }

    this.inputProvider = new SimpleInputProvider(this.inputs);
    this.el.sceneEl.systems["input"].registerInputProvider(this.inputProvider);

    // Initialize ripple surfaces
    for (let i = 0; i < 3; i++) {
      const rippleSurface = createRippleSurface();
      this.rippleSurfaces.push(rippleSurface);
      this.el.object3D.add(rippleSurface);
      rippleSurface.position.set(0, 0.901 + i * 0.001, -0.1);
    }

    // Initialize rail separator lines
    for (let i = 0; i <= numKeys; i++) {
      this.el.appendChild(this._createRailSeparator(i));
    }

    // Initialize key separator lines
    for (let i = 0; i < numKeys - 1; i++) {
      this.el.appendChild(this._createKeySeparator(i));
    }

    // Initialize beatline
    this.el.appendChild(this._createBeatline());

    //Initialize horizontal separator
    // const horizontalSeparator = document.createElement("a-entity");
    // horizontalSeparator.setAttribute("geometry", {
    //   primitive: "box",
    //   depth: 0.005,
    //   height: 0.015,
    //   width: 1.2,
    // });

    // horizontalSeparator.setAttribute("material", {
    //   color: "white",
    //   shader: "flat",
    // });

    // horizontalSeparator.object3D.position.set(0, 0.9, -0.1);
    // this.el.appendChild(horizontalSeparator);
    setTimeout(() => {
      let keyboardHeight = this.el.sceneEl.systems[
        "setting"
      ].settingsManager.getSettingValue("keyboardHeightOffset");
      keyboardHeight = keyboardHeight ? keyboardHeight : 0;
      this.adjustHeight(keyboardHeight);
      this.el.sceneEl.systems["setting"].settingsManager.addObserver(
        "keyboardHeightOffset",
        (value: number) => {
          if (this.adjustHeightTimeout) {
            clearTimeout(this.adjustHeightTimeout);
          }
          this.adjustHeightTimeout = setTimeout(() => {
            this.adjustHeight(value);
          }, 100);
        }
      );
    }, 2500); // TODO get rid of this hack

    this.audio.registerSoundFromUrl(this.hitSound).then((soundId: number) => {
      this.hitSoundId = soundId;
    });

    this.el.sceneEl.systems["input"].keyboardInputProvider.addListener(
      (input: Input) => {
        if (this.el.object3D.visible) {
          const id = this.inputKeyMap.get(input.id);
          const key = this.keys[id];
          if (input.value === 1) {
            this.audio.playHitSound(this.hitSoundId);
            this.triggerRipple(
              key.object3D.position.x,
              key.object3D.position.z + 0.1
            );
            key.setAttribute("material", "emissiveIntensity", 1);
            this.noteRails[id].setAttribute("material", "emissiveIntensity", 1);
          } else {
            key.setAttribute("material", "emissiveIntensity", 0.1);
            this.noteRails[id].setAttribute("material", "emissiveIntensity", 0);
          }
        }
      }
    );
  },

  _createKey: function (index: number) {
    const key = document.createElement("a-box");
    key.setAttribute(
      "position",
      `${-0.525 + index * 0.15 + " " + 0.85 + " " + -0.1}`
    );
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

    key.setAttribute("collider", {
      group: "keyboard",
      static: true,
    });

    key.setAttribute("shape", {
      type: "box",
    });

    const input = this.inputs[index];
    const noteRail = this.noteRails[index];
    const keyCollisions = this.keyCollisions[index];

    key.addEventListener("collision-enter", (e: CustomEvent) => {
      if (input.value === 0) {
        input.value = 1;
        this.inputProvider.notifyListeners(input);
        key.setAttribute("material", "emissiveIntensity", 1);
        noteRail.setAttribute("material", "emissiveIntensity", 1);
      }
      this.audio.playHitSound(this.hitSoundId);
      keyCollisions.add(e.detail.id);
      const colliderCenter = e.detail.collisionShapes[0][1].center; // Assume collision shape is Sphere
      this.triggerRipple(colliderCenter.x, colliderCenter.z + 0.1);
    });

    key.addEventListener("collision-exit", (e: CustomEvent) => {
      if (input.value === 1 && keyCollisions.size === 1) {
        input.value = 0;
        this.inputProvider.notifyListeners(input);
        key.setAttribute("material", "emissiveIntensity", 0.1);
        noteRail.setAttribute("material", "emissiveIntensity", 0);
      }
      keyCollisions.delete(e.detail.id);
    });
    return key;
  },

  _createKeyText: function (xPosition: number) {
    const keyText = document.createElement("a-text");
    keyText.setAttribute("width", 0.6);
    keyText.setAttribute("align", "center");
    keyText.setAttribute("font", "/fonts/SpaceMono-Regular-msdf.json");
    keyText.setAttribute("negate", false);
    keyText.object3D.position.set(xPosition, 0.95, -0.37);
    keyText.object3D.rotation.setFromVector3(new Vector3(-0.5, 0, 0));
    return keyText;
  },

  __createNoteEmitter: function (xPosition: number) {
    const noteEmitter = document.createElement("a-entity");
    noteEmitter.object3D.position.set(xPosition, 0.915, -0.33);
    noteEmitter.object3D.rotation.x = MathUtils.degToRad(-90);
    noteEmitter.setAttribute("note-emitter", "");
    return noteEmitter;
  },

  _createRail: function (xPosition: number) {
    const noteRail = document.createElement("a-entity");
    noteRail.setAttribute("geometry", {
      primitive: "plane",
      height: this.noteRailLength,
      width: this.noteRailWidth - 0.01,
    });

    noteRail.setAttribute("material", {
      color: "#fff",
      emissive: "#fff",
      emissiveIntensity: 0,
      transparent: true,
      opacity: 0.2,
    });

    noteRail.object3D.position.set(xPosition, this.keyY, this.keyZ);
    noteRail.object3D.rotation.setFromVector3(this.noteRailRotation);
    return noteRail;
  },

  _createRailSeparator: function (index: number) {
    const separator = document.createElement("a-entity");
    separator.setAttribute("geometry", {
      primitive: "plane",
      height: this.noteRailLength,
      width: 0.01,
    });

    separator.setAttribute("material", {
      color: "#fff",
      emissive: "#fff",
    });

    separator.object3D.position.set(
      (index - 4) * this.noteRailWidth,
      this.keyY,
      this.keyZ
    );
    separator.object3D.rotation.setFromVector3(this.noteRailRotation);
    return separator;
  },

  _createKeySeparator: function (index: number) {
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

    keySeparator.object3D.position.set(-0.45 + index * 0.15, 0.9, -0.1);
    return keySeparator;
  },

  _createBeatline: function () {
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
    return beatline;
  },

  tick: function (time, deltaTime) {
    // Update ripple surfaces
    const deltaSeconds = deltaTime / 1000;
    for (const surface of this.rippleSurfaces) {
      surface.material.uniforms.time.value =
        surface.material.uniforms.time.value + deltaSeconds;
    }
  },

  triggerRipple: function (x: number, z: number) {
    const rippleSurface = this.rippleSurfaces[this.nextRippleSurface];
    rippleSurface.material.uniforms.time.value = 0;
    rippleSurface.material.uniforms.hitPosition.value.set(x, z);
    this.nextRippleSurface =
      (this.nextRippleSurface + 1) % this.rippleSurfaces.length;
  },

  adjustHeight: function (value: number) {
    this.el.object3D.position.y = value / 100;
    for (const keyEl of this.keys) {
      keyEl.components["collider"].updateBoundingBox();
      for (const component of Object.entries(keyEl.components)) {
        if (component[0] === "shape" || component[0].startsWith("shape__")) {
          (<any>component[1]).updatePosition();
        }
      }
    }
    this.el.sceneEl.systems["collision-detection"].buildKDTree("keyboard");
  },
});
