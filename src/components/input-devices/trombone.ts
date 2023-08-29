import { Group, Vector3 } from "three";
import { TONE_PITCH_INPUT } from "../../game/TonoGameState";
import Input from "../../input/Input";
import SimpleInputProvider from "../../input/SimpleInputProvider";

const MAX_SLIDE_VALUE = 0.16;
const MIN_SLIDE_VALUE = 0;
const SLIDE_OFFSET = 0.05;

const TROMBONE_RANGE_MAX = 57; // A4
const TROMBONE_RANGE_MIN = 45; // A2
const TROMBONE_RANGE = TROMBONE_RANGE_MAX - TROMBONE_RANGE_MIN;
let x;
let length;
AFRAME.registerComponent("trombone", {
  schema: {
    slideEntity: { type: "selector" },
  },
  init: function () {
    this.input = { id: TONE_PITCH_INPUT, value: 40 };
    this.inputProvider = new SimpleInputProvider([this.input]);
    this.el.sceneEl.systems.input.registerInputProvider(this.inputProvider);
    this.mouseX = 0;
    this.mouseY = 0;

    this.notes = [
      "A2",
      "Bb2",
      "B2",
      "C3",
      "Db3",
      "D3",
      "Eb3",
      "E3",
      "F3",
      "Gb3",
      "G3",
      "Ab3",
      "A3",
      "Bb3",
      "B3",
      "C4",
      "Db4",
      "D4",
      "Eb4",
      "E4",
      "F4",
      "Gb4",
      "G4",
      "Ab4",
      "A4",
    ];
    this.noteAudioBuffers = new Array(this.notes.length);

    this.audioContext = new AudioContext();
    for (let i = 0; i < this.notes.length; i++) {
      fetch("/soundfonts/trombone/" + this.notes[i] + ".mp3").then(
        (response) => {
          response
            .arrayBuffer()
            .then((buffer) => {
              return this.audioContext.decodeAudioData(buffer);
            })
            .then((audioBuffer) => {
              this.noteAudioBuffers[i] = audioBuffer;
            });
        }
      );
    }

    this.el.sceneEl.addEventListener("enter-vr", () => {
      this.audioContext.resume();
    });

    if (this.data.slideEntity === null) {
      this.slide = this.el.children[0].object3D;
    } else {
      this.slide = this.data.slideEntity.object3D;
    }
    this.targetSlidePosition = null;
    this.camera = document.querySelector("#camera").object3D;

    this.el.addEventListener("collision-enter", (e: CustomEvent) => {
      if (!this.targetSlidePosition) {
        this.targetSlidePosition =
          e.detail.collisionShapes[0].boundingSphere.center;
      }
    });
    this.el.addEventListener("collision-exit", (e: CustomEvent) => {
      if (
        this.targetSlidePosition ===
        e.detail.collisionShapes[0].boundingSphere.center
      ) {
        this.targetSlidePosition = null;
      }
    });

    const microphone = document.querySelector("#microphone");
    microphone.addEventListener("loaded", () => {
      microphone.components["microphone"].inputProvider.addListener(
        (input: Input) => {
          if (input.value) {
            if (this.audioSource) return;

            this.audioSource = this.audioContext.createBufferSource();
            this.baseNoteIndex = Math.round(
              this.input.value - TROMBONE_RANGE_MIN
            );
            this.baseNoteOffset = TROMBONE_RANGE_MIN + this.baseNoteIndex;
            this.audioSource.buffer = this.noteAudioBuffers[this.baseNoteIndex];
            this.audioSource.loop = true;
            this.audioSource.loopStart = 1;
            this.audioSource.loopEnd = 2.9;
            this.audioSource.connect(this.audioContext.destination);
            this.audioSource.start();
          } else if (this.audioSource) {
            this.audioSource.stop();
            this.audioSource.disconnect();
            this.audioSource = null;
            if (this.rebaseTimeout) {
              clearTimeout(this.rebaseTimeout);
            }
          }
        }
      );
    });

    const MAX_ANGLE = Math.PI / 4;
    document.addEventListener("mousemove", (e) => {
      this.mouseX += e.movementX / 100;
      this.mouseY -= e.movementY / 100;
      if (this.mouseX > 4.8) this.mouseX = 4.8;
      else if (this.mouseX < 0) this.mouseX = 0;
      if (this.mouseY > MAX_ANGLE) this.mouseY = MAX_ANGLE;
      else if (this.mouseY < -0.5) this.mouseY = -0.5;
    });

    // Create parent object for octave switching
    this.parentObject = new Group();
    this.el.object3D.parent.add(this.parentObject);
    this.parentObject.position.x = 0;
    this.parentObject.position.y = 0;
    this.parentObject.position.z = 0;
    this.parentObject.add(this.el.object3D);

    this.directionVector = new Vector3();
    this.cameraDirection = new Vector3();
  },

  tick: function () {
    if (this.targetSlidePosition) {
      this.directionVector.copy(this.targetSlidePosition);
      this.el.object3D.getWorldPosition(this.cameraDirection);
      this.directionVector.sub(this.cameraDirection);
      length = this.directionVector.length();
      x = length * length - SLIDE_OFFSET;
      if (x > MAX_SLIDE_VALUE) x = MAX_SLIDE_VALUE;
      else if (x < MIN_SLIDE_VALUE) x = MIN_SLIDE_VALUE;
      x /= MAX_SLIDE_VALUE;
      this.input.value = TROMBONE_RANGE_MAX - TROMBONE_RANGE * x;
      this.slide.position.x = x * 4.8;

      this.camera.getWorldDirection(this.cameraDirection);
      this.parentObject.rotation.x =
        Math.asin(this.directionVector.y / length) -
        Math.asin(-this.cameraDirection.y);

      if (this.parentObject.rotation.x > 0) {
        this.input.value += 12;
      }
    } else {
      this.parentObject.rotation.x = this.mouseY;
      this.slide.position.x = this.mouseX;
      this.input.value =
        TROMBONE_RANGE_MAX - (TROMBONE_RANGE * this.mouseX) / 4.8;
      if (this.mouseY > 0.25) {
        this.input.value += 12;
      }
    }
    if (this.audioSource) {
      const newNoteIndex = Math.round(this.input.value - TROMBONE_RANGE_MIN);
      if (newNoteIndex !== this.baseNoteIndex) {
        this.baseNoteIndex = newNoteIndex;
        if (this.rebaseTimeout) {
          clearTimeout(this.rebaseTimeout);
        }
        this.rebaseTimeout = setTimeout(() => {
          const previousAudioSource = this.audioSource;
          const newAudioSource = this.audioContext.createBufferSource();
          newAudioSource.buffer = this.noteAudioBuffers[newNoteIndex];
          newAudioSource.loop = true;
          newAudioSource.loopStart = 1;
          newAudioSource.loopEnd = 2.9;
          newAudioSource.connect(this.audioContext.destination);
          newAudioSource.start();
          this.audioSource = newAudioSource;
          this.baseNoteOffset = TROMBONE_RANGE_MIN + newNoteIndex;
          previousAudioSource.stop(this.audioContext.currentTime + 0.1);
        }, 200);
      }
      this.audioSource.playbackRate.value = Math.pow(
        2,
        (this.input.value - this.baseNoteOffset) / 12
      );
    }
  },
});
