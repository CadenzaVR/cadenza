const enum Judgement {
  MISS = 0b00000000,
  PASS = 0b00000010,
  BAD = 0b00000001,
  GOOD = 0b00000011,
  EXCELLENT = 0b00000111,
}

AFRAME.registerComponent("note-emitter", {
  /**
   * Creates a new THREE.ShaderMaterial using the two shaders defined
   * in vertex.glsl and fragment.glsl.
   */
  init: function () {
    this.active = false;
    this.animationTime = 0;
    this.geometry = new THREE.PlaneBufferGeometry(0.15, 0.05, 1, 1);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Vector3(1, 1, 1) },
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
    const newMesh = new THREE.Mesh(this.geometry, this.material);
    this.el.setObject3D("mesh", newMesh);
  },

  activate: function (judgement: number) {
    if (judgement !== Judgement.PASS) {
      switch (judgement) {
        case Judgement.MISS:
        case Judgement.BAD:
          this.material.uniforms.color.value.set(1, 0, 0);
          break;
        case Judgement.GOOD:
          this.material.uniforms.color.value.set(1, 0.8, 0);
          break;
        case Judgement.EXCELLENT:
          this.material.uniforms.color.value.set(0, 1, 0);
          break;
      }
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
