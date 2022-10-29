export function createClampedVisibiltyMaterial(params = {}) {
  const material = new THREE.ShaderMaterial({
    transparent: false,
    uniforms: {
      maxY: { value: 2.29 },
      minY: { value: 0.9 },
      maxZ: { value: -0.326 },
      minZ: { value: -8.23 },
      color: {
        value: params.color ? params.color : new THREE.Vector4(1, 1, 1, 1),
      },
    },
    //wireframe: true,
    vertexShader: `
      uniform float maxY;
      uniform float minY;
      uniform float maxZ;
      uniform float minZ;
      void main() {
        vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
        worldPosition.y = clamp(worldPosition.y, minY, maxY);
        worldPosition.z = clamp(worldPosition.z, minZ, maxZ);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
      `,
    fragmentShader: `
      uniform vec4 color;
      void main() {
        gl_FragColor = color;
      }
      `,
  });
  return material;
}
