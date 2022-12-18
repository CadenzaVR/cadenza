import {
  CircleBufferGeometry,
  CylinderBufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from "three";
import { getColor } from "../../graphics/JudgementColors";
import Input from "../../input/Input";
import SimpleInputProvider from "../../input/SimpleInputProvider";
import { createRippleSurface } from "../../objects/rippleSurface";

AFRAME.registerComponent("drum", {
  dependencies: ["shape"],
  schema: {
    innerRadius: { type: "number", default: 0.1 },
  },
  init: function () {
    // Inputs
    this.donInput = { id: "don", value: 0 };
    this.katInput = { id: "kat", value: 0 };
    this.keyInputMap = new Map([
      ["key0", "kat1"],
      ["key1", "don2"],
      ["key2", "don3"],
      ["key3", "kat4"],
    ]);
    this.inputs = [this.donInput, this.katInput];
    this.inputProvider = new SimpleInputProvider(this.inputs);
    this.el.sceneEl.systems.input.registerInputProvider(this.inputProvider);
    this.el.sceneEl.systems["input"].keyboardInputProvider.addListener(
      (input: Input) => {
        const inputId = this.keyInputMap.get(input.id);
        if (this.el.object3D.visible && inputId) {
          const colliderId = -parseInt(inputId.slice(-1));
          if (input.value === 1) {
            if (inputId.startsWith("don")) {
              this.el.emit("collision-enter", {
                id: colliderId,
                collisionShapes: [[null, this.boundingSphere]],
              });
            } else {
              this.el.emit("collision-enter", {
                id: colliderId,
                collisionShapes: [[null, this.offCenter]],
              });
            }
          } else {
            this.el.emit("collision-exit", {
              id: colliderId,
              collisionShapes: [[null, this.boundingSphere]],
            });
          }
        }
      }
    );

    // Audio
    this.hitSoundDon = "/sounds/taikohit.ogg";
    this.hitSoundDonId;
    this.hitSoundKat = "/sounds/taikorimhit.ogg";
    this.hitSoundKatId;
    this.audio = this.el.sceneEl.systems.audio.audioManager;

    this.audio
      .registerSoundFromUrl(this.hitSoundDon)
      .then((soundId: number) => {
        this.hitSoundDonId = soundId;
      });

    this.audio
      .registerSoundFromUrl(this.hitSoundKat)
      .then((soundId: number) => {
        this.hitSoundKatId = soundId;
      });

    // Children
    this.rippleSurfaces = [];
    this.nextRippleSurface = 0;
    // Initialize ripple surfaces
    for (let i = 0; i < 5; i++) {
      const rippleSurfaceGeometry = new CircleBufferGeometry(1, 32);
      const rippleSurface = createRippleSurface(rippleSurfaceGeometry, "xy");
      this.rippleSurfaces.push(rippleSurface);
      this.el.object3D.add(rippleSurface);
      rippleSurface.position.set(0, 0, 0.01);
    }

    this.innerCircleMaterial = new MeshBasicMaterial({
      color: 0xdddddd,
    });
    this.innerCircle = new Mesh(
      new CircleBufferGeometry(this.data.innerRadius, 24),
      this.innerCircleMaterial
    );
    this.el.object3D.add(this.innerCircle);
    this.innerCircle.position.z = 0.0001;

    this.barrelMaterial = new MeshBasicMaterial({
      color: 0xaaaaaa,
      transparent: true,
      opacity: 0.5,
    });

    const cylinderGeometry = new CylinderBufferGeometry(0.3, 0.25, 0.2, 32);
    cylinderGeometry.rotateX(Math.PI / 2);
    this.barrel = new Mesh(cylinderGeometry, this.barrelMaterial);

    this.el.object3D.add(this.barrel);
    this.barrel.position.z = -0.1;

    this.plane = this.el.components.shape.shape.plane;
    this.boundingSphere = this.el.components.shape.shape.boundingSphere;
    this.center = this.boundingSphere.center;
    this.offCenter = { center: this.center.clone() };
    this.offCenter.center.x += this.data.innerRadius;

    // Collision
    this.collisionInputMap = new Map();
    this.colliderBitMap = new Map();
    this.bitStack = [
      0b1000000000, 0b0100000000, 0b0010000000, 0b0001000000, 0b0000100000,
      0b0000010000, 0b0000001000, 0b0000000100, 0b0000000010, 0b0000000001,
    ];

    this.el.addEventListener("collision-enter", (e: CustomEvent) => {
      const colliderCenter = e.detail.collisionShapes[0][1].center; // Assume collision shape is Sphere
      if (!this.colliderBitMap.has(e.detail.id)) {
        const bit = this.bitStack.pop();
        this.colliderBitMap.set(e.detail.id, bit);
        if (this.center.distanceTo(colliderCenter) < this.data.innerRadius) {
          this.audio.playHitSound(this.hitSoundDonId);
          this.donInput.value |= bit;
          this.inputProvider.notifyListeners(this.donInput);
          this.collisionInputMap.set(e.detail.id, this.donInput);
          this.barrel.scale.x = 1.1;
          this.barrel.scale.y = 1.1;
        } else {
          this.audio.playHitSound(this.hitSoundKatId);
          this.katInput.value |= bit;
          this.inputProvider.notifyListeners(this.katInput);
          this.collisionInputMap.set(e.detail.id, this.katInput);
          this.barrel.material.opacity = 1;
          this.barrel.scale.x = 1.05;
          this.barrel.scale.y = 1.05;
        }
        this.triggerRipple();
      }
    });
    this.el.addEventListener("collision-exit", (e: CustomEvent) => {
      // Assume collision shape is Sphere
      if (
        this.plane.distanceToPoint(e.detail.collisionShapes[0][1].center) >= 0
      ) {
        const id = e.detail.id;
        const input = this.collisionInputMap.get(id);
        this.barrel.scale.x = 1;
        this.barrel.scale.y = 1;
        if (input === this.katInput) {
          this.barrel.material.opacity = 0.5;
        }
        const bit = this.colliderBitMap.get(id);
        input.value &= ~bit;
        this.colliderBitMap.delete(id);
        this.collisionInputMap.delete(id);
        this.bitStack.push(bit);
      }
    });
  },

  setRippleColorsFromJudgement: function (judgementValues: number[]) {
    this.setPrevRippleColors(
      judgementValues
        .map((v) => {
          getColor(v);
        })
        .filter((v) => v !== null)
    );
  },

  setPrevRippleColors: function (colors: Vector3[]) {
    const numRippleSurfaces = this.rippleSurfaces.length;
    const prevIndex =
      ((this.nextRippleSurface - 1) % numRippleSurfaces) + numRippleSurfaces;
    for (let i = 0; i < colors.length; i++) {
      this.rippleSurfaces[
        (prevIndex - i) % numRippleSurfaces
      ].material.uniforms.color.value.copy(colors[i]);
    }
  },

  triggerRipple: function (r = 1, g = 1, b = 1) {
    const rippleSurface = this.rippleSurfaces[this.nextRippleSurface];
    rippleSurface.material.uniforms.time.value = 0;
    rippleSurface.material.uniforms.hitPosition.value.set(0, 0);
    rippleSurface.material.uniforms.color.value.set(r, g, b);
    this.nextRippleSurface =
      (this.nextRippleSurface + 1) % this.rippleSurfaces.length;
  },

  tick: function (time, deltaTime) {
    // Update ripple surfaces
    const deltaSeconds = deltaTime / 1000;
    for (const surface of this.rippleSurfaces) {
      surface.material.uniforms.time.value =
        surface.material.uniforms.time.value + deltaSeconds;
    }
  },
});
