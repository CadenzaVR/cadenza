export const createRippleSurface = (geometry = null, plane = "xz") => {
  if (!geometry) {
    const vertices = new Float32Array([
      -0.6, 0, -0.2,

      0.6, 0, 0.2,

      0.6, 0, -0.2,

      -0.6, 0, -0.2,

      -0.6, 0, 0.2,

      0.6, 0, 0.2,

      -0.6, 0, -0.2,

      0.6, 0, -0.2,

      0.6, 0.25, -1.41782,

      -0.6, 0, -0.2,

      0.6, 0.25, -1.41782,

      -0.6, 0.25, -1.41782,
    ]);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  }
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.5 },
      hitPosition: { value: new THREE.Vector2() },
      speed: { value: 1.0 },
      color: { value: new THREE.Vector3(1, 1, 1) },
    },
    vertexShader: `
      varying vec2 vPosition;
      void main() {
        vPosition = position.${plane};
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
      `,
    fragmentShader: `
      varying vec2 vPosition;
      uniform float time;
      uniform vec2 hitPosition;
      uniform float speed;
      uniform vec3 color;
      void main() {
        float radius = speed * distance(vPosition, hitPosition);
        float pct = step(time, radius) - step(time + 0.02, radius);
        float alpha = pct - time/0.5;
        if (alpha <= 0.0) {
          discard;
        }
        gl_FragColor = vec4( pct * color, alpha);
      }
      `,
    transparent: true,
    opacity: 0.1,
  });
  return new THREE.Mesh(geometry, material);
};
