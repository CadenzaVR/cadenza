export const createProgressRing = (maxRadius) => {
  const geometry = new THREE.PlaneBufferGeometry(maxRadius * 2, maxRadius * 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      outerRadius: {value: maxRadius},
      innerRadius: {value: maxRadius - 0.02},
      percent: { value: 0 },
      color: { value: new THREE.Vector2() }
    },
    vertexShader: `
      varying vec2 vPosition;
      void main() {
        vPosition = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
      `,
    fragmentShader: `
      varying vec2 vPosition;
      uniform float percent;
      uniform float outerRadius;
      uniform float innerRadius;
      void main() {
        float theta = 3.14159265359 - 6.28318530718 * percent;
        float angle = atan(vPosition.y, vPosition.x);
        float radius = length(vPosition);
        float pct = step(0.0, angle - theta) * (step(innerRadius, radius) - step(outerRadius, radius));
        if (pct == 0.0) {
          discard;
        }
        gl_FragColor = vec4(vec3(pct), 1.0);
      }
      `,
    transparent: true
  });
  const ringMesh = new THREE.Mesh(geometry, material);
  const wrapper = new THREE.Group().add(ringMesh);
  ringMesh.rotation.z = -Math.PI/2;
  return {
    object3D: wrapper,
    material: material
  };
};
