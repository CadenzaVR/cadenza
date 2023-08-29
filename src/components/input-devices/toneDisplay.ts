import {
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  Vector3,
} from "three";
import { TONE_PITCH_INPUT } from "../../game/TonoGameState";

const BASE_POINT_SIZE = 0.075;
const POINT_ANIMATION_SPEED = 0.002;

AFRAME.registerComponent("tone-display", {
  schema: {
    numOctaves: { type: "number", default: 3 },
    octaveWidth: { type: "number", default: 0.6 },
  },

  init: function () {
    this.targetScale = 0;
    this.noteRailRotation = new Vector3(-80 * MathUtils.DEG2RAD, 0, 0);
    this.noteRailLength = 8;

    this.inputState =
      this.el.sceneEl.systems.input.inputManager.getInputState().stateMap;

    const octaveSeparatorMaterial = new MeshBasicMaterial();
    const octaveSeparatorGeometry = new PlaneGeometry(
      0.01,
      this.noteRailLength
    );
    for (let i = -2; i <= 2; i++) {
      const separator = new Mesh(
        octaveSeparatorGeometry,
        octaveSeparatorMaterial
      );
      this.el.object3D.add(separator);
      separator.position.set(
        i * this.data.octaveWidth - (3 * this.data.octaveWidth) / 12, // 3 semitones
        Math.cos(this.noteRailRotation.x) * this.noteRailLength * 0.5,
        Math.sin(this.noteRailRotation.x) * this.noteRailLength * 0.5
      );
      separator.rotation.setFromVector3(this.noteRailRotation);
    }

    this.toneLine = new Group();
    this.el.object3D.add(this.toneLine);

    const halfWidth = this.data.numOctaves * this.data.octaveWidth;
    this.line = new Line(
      new BufferGeometry().setFromPoints([
        new Vector3(-halfWidth, 0, 0),
        new Vector3(halfWidth, 0, 0),
      ]),
      new LineBasicMaterial()
    );
    this.toneLine.add(this.line);

    this.spheres = [];
    const sphereMaterial = new MeshBasicMaterial({ color: 0xffffff });
    for (let i = -this.data.numOctaves; i <= this.data.numOctaves; i++) {
      const sphereGeometry = new SphereGeometry(0.025, 16, 16);
      const sphere = new Mesh(sphereGeometry, sphereMaterial);
      this.spheres.push(sphere);
      this.toneLine.add(sphere);
      sphere.position.x = i * this.data.octaveWidth;
    }
  },

  tick: function (t, dt) {
    const input = this.inputState.get(TONE_PITCH_INPUT);
    if (input) {
      const inputValue = input.inputs[0].value;
      if (inputValue) {
        this.toneLine.visible = true;
        this.toneLine.position.x =
          (inputValue * this.data.octaveWidth) / 12 - 3;
      } else {
        this.toneLine.visible = false;
      }
    }
    // if (this.targetScale === 1) {
    //   this.pointsMaterial.size = Math.min(
    //     this.pointsMaterial.size + dt * POINT_ANIMATION_SPEED,
    //     BASE_POINT_SIZE
    //   );
    //   if (this.pointsMaterial.size === BASE_POINT_SIZE) {
    //     this.targetScale = 0;
    //   }
    // } else if (this.targetScale === -1) {
    //   this.pointsMaterial.size = Math.max(
    //     this.pointsMaterial.size - dt * POINT_ANIMATION_SPEED,
    //     0
    //   );
    //   if (this.pointsMaterial.size === 0) {
    //     this.targetScale = 0;
    //     this.toneLine.visible = false;
    //   }
    // }
  },
});
