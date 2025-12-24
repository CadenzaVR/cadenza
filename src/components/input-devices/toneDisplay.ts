import {
  BufferGeometry,
  Group,
  Line,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  Vector3,
  ShaderMaterial,
  Color,
  Points,
  PointsMaterial,
  Float32BufferAttribute,
  AdditiveBlending,
} from "three";
import { TONE_PITCH_INPUT, TONE_VOLUME_INPUT } from "../../game/TonoGameState";
import { GAMEMODE_TONO } from "../../game/GameModes";

// Particle system constants
const PARTICLE_COUNT = 20;
const PARTICLE_LIFETIME = 80;
const PARTICLE_SPAWN_INTERVAL = 5;
const PARTICLE_SPEED = 0.001;
const PARTICLE_SPREAD = 0.004;

// Particle data array indices (Structure of Arrays pattern)
// Layout: [velX, velY, velZ, life] per particle
const P_VEL_X = 0;
const P_VEL_Y = 1;
const P_VEL_Z = 2;
const P_LIFE = 3;
const P_STRIDE = 4;

let spawnX = 0;

AFRAME.registerComponent("tone-display", {
  schema: {
    numOctaves: { type: "number", default: 3 },
    octaveWidth: { type: "number", default: 0.6 },
  },

  init: function () {
    this.targetScale = 0;
    this.noteRailRotation = new Vector3(-80 * MathUtils.DEG2RAD, 0, 0);
    this.noteRailLength = 8;

    this.container = new Group();
    this.el.object3D.add(this.container);
    this.container.position.z = -2;
    this.container.position.y = 0;
    this.container.position.x = Math.sin(MathUtils.DEG2RAD * 10) * (8) + 0.001;
    this.container.rotation.z = Math.PI / 2;

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
      this.container.add(separator);
      separator.position.set(
        i * this.data.octaveWidth - (3 * this.data.octaveWidth) / 12, // 3 semitones
        Math.cos(this.noteRailRotation.x) * this.noteRailLength * 0.5,
        Math.sin(this.noteRailRotation.x) * this.noteRailLength * 0.5
      );
      separator.rotation.setFromVector3(this.noteRailRotation);
    }

    this.toneLine = new Group();
    this.container.add(this.toneLine);

    const halfWidth = this.data.numOctaves * this.data.octaveWidth;
    
    const points = [];
    const segments = 100;
    for (let i = 0; i <= segments; i++) {
      const x = -halfWidth + (i / segments) * (2 * halfWidth);
      points.push(new Vector3(x, 0, 0));
    }

    this.line = new Line(
      new BufferGeometry().setFromPoints(points),
      new ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          amplitude: { value: 0 },
          color: { value: new Color(0xffffff) },
          halfWidth: { value: halfWidth },
        },
        vertexShader: `
          uniform float time;
          uniform float amplitude;
          uniform float halfWidth;
          void main() {
            vec3 pos = position;
            float normalizedX = pos.x / halfWidth;
            float envelope = cos(normalizedX * 1.5708);
            pos.y += sin(pos.x * 10.0 + time * 10.0) * amplitude * envelope;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          void main() {
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      })
    );
    this.toneLine.add(this.line);

    this.spheres = [];
    const sphereMaterial = new MeshBasicMaterial({ color: 0xffffff });
    for (let i = -this.data.numOctaves; i <= this.data.numOctaves; i++) {
      const progress = (i + this.data.numOctaves) / (2 * this.data.numOctaves);
      const radius = progress * 0.04 + (1 - progress) * 0.01;
      const sphereGeometry = new SphereGeometry(radius, 16, 16);
      const sphere = new Mesh(sphereGeometry, sphereMaterial);
      this.spheres.push(sphere);
      this.toneLine.add(sphere);
      sphere.position.x = i * this.data.octaveWidth;
    }

    // Particle System - using flat array (Structure of Arrays) for better cache performance
    this.particlesGeometry = new BufferGeometry();
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    
    // Initialize particles off-screen
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particlePositions[i * 3 + 1] = -1000;
    }
    
    this.particlesGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(particlePositions, 3)
    );

    this.particleMaterial = new PointsMaterial({
      color: 0xffffff,
      size: 0.04,
      blending: AdditiveBlending,
      sizeAttenuation: true,
      depthTest: false,
    });

    this.particleSystem = new Points(
      this.particlesGeometry,
      this.particleMaterial
    );
    this.particleSystem.frustumCulled = false; // Disable culling since particles move dynamically
    this.container.add(this.particleSystem);

    // Flat array for particle data: [velX, velY, velZ, life] per particle
    this.particleData = new Float32Array(PARTICLE_COUNT * P_STRIDE);
    this.spawnTimer = 0;

    this.gameEl = this.el.sceneEl.querySelector("#game");
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

    const volumeInput = this.inputState.get(TONE_VOLUME_INPUT);
    let spawnParticles = false;
    if (volumeInput) {
      const volume = volumeInput.inputs[0].value;
      this.line.material.uniforms.amplitude.value = volume * 0.0005;
      this.line.material.uniforms.time.value = t / 200;
    }

    const gameEl = this.gameEl;
    if (gameEl && gameEl.components.game) {
      const state = gameEl.components.game.controller.state;

      // 2. Check if we are in Tono mode (GAMEMODE_TONO is 2)
      if (state.getGameMode() === GAMEMODE_TONO) {
        // 3. Check the current note
        // In TonoGameState, the note at the end of the queue is the current one
        const currentNote = state.noteQueue[state.noteQueue.length - 1];

        if (currentNote && currentNote.isActive) {
          // The note is being actively played!
          spawnParticles = true;
          // 4. Calculate position based on the note's pitch (note.type)
          spawnX = (currentNote.type * this.data.octaveWidth) / 12;
        }
      }
    }

    // Update Particles
    let particlesToSpawn = 0;
    if (spawnParticles) {
      particlesToSpawn = Math.ceil(dt / PARTICLE_SPAWN_INTERVAL);
    }

    const positions = this.particlesGeometry.attributes.position.array as Float32Array;
    const data = this.particleData;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const baseIdx = i * P_STRIDE;
      const life = data[baseIdx + P_LIFE];

      if (life > 0) {
        data[baseIdx + P_LIFE] = life - dt;

        // Update position using velocity
        positions[i * 3] += data[baseIdx + P_VEL_X] * dt;
        positions[i * 3 + 1] += data[baseIdx + P_VEL_Y] * dt;
        positions[i * 3 + 2] += data[baseIdx + P_VEL_Z] * dt;

        // When life ends, hide particle
        if (life - dt <= 0) {
          positions[i * 3 + 1] = -1000;
        }
      } else if (particlesToSpawn > 0) {
        // Spawn new particle
        particlesToSpawn--;
        data[baseIdx + P_LIFE] = PARTICLE_LIFETIME;
        positions[i * 3] = spawnX + (Math.random() - 0.5) * PARTICLE_SPREAD;
        positions[i * 3 + 1] = Math.random() * 0.1;
        positions[i * 3 + 2] = 0;
        data[baseIdx + P_VEL_X] = (Math.random() - 0.5) * PARTICLE_SPREAD;
        data[baseIdx + P_VEL_Y] = PARTICLE_SPEED * (0.7 + Math.random() * 0.6);
        data[baseIdx + P_VEL_Z] = 0;
      }
    }

    this.particlesGeometry.attributes.position.needsUpdate = true;
  },
});
