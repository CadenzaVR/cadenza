import { Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from "three";
import { getColor } from "../graphics/JudgementColors";

AFRAME.registerComponent("note-emitter", {
  /**
   * Creates a new THREE.ShaderMaterial using the two shaders defined
   * in vertex.glsl and fragment.glsl.
   */
  init: function () {
    this.active = false;
    this.animationTime = 0;
    this.geometry = new PlaneGeometry(0.15, 0.05, 1, 1);
    this.material = new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new Vector3(1, 1, 1) },
      },
      //wireframe: true,
      vertexShader: `
      uniform float time;
      void main() {
        float displacement = time;
        vec3 newPosition = position + displacement * vec3(0, 0, 1.5);
        gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
      }
      `,
      fragmentShader: `
      uniform float time;
      uniform vec3 color;
      void main() {
        gl_FragColor = vec4( color, 1.0 - time/0.3);
      }
      `,
      transparent: true,
    });
    this.el.object3D.visible = false;
    this.el.addEventListener("model-loaded", () => this.update());
  },

  /**
   * Apply the material to the current entity.
   */
  update: function () {
    const newMesh = new Mesh(this.geometry, this.material);
    this.el.setObject3D("mesh", newMesh);
  },

  activate: function (judgement: number) {
    const judgementColor = getColor(judgement);
    if (judgementColor) {
      this.material.uniforms.color.value.copy(judgementColor);
      this.animationTime = 0;
      this.el.object3D.visible = true;
      this.active = true;
    }
  },

  /**
   * On each frame, update the 'time' uniform in the shaders.
   */
  tick: function (t, dt) {
    if (this.active) {
      this.animationTime += dt;
      this.material.uniforms.time.value = this.animationTime / 1000;
      if (this.animationTime > 300) {
        this.active = false;
        this.el.object3D.visible = false;
      }
    }
  },
});
