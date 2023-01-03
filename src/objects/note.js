export function createClampedVisibiltyMaterial(params = {}) {
  const uniforms = {
    maxZ: { value: params.maxZ ? params.maxZ : 100 },
    minZ: { value: params.minZ ? params.minZ : -100 },
    color: {
      value: params.color ? params.color : new THREE.Vector4(1, 1, 1, 1),
    },
  };
  if (params.minY || params.maxY) {
    uniforms.minY = { value: params.minY ? params.minY : -1 };
    uniforms.maxY = { value: params.maxY ? params.maxY : 10 };
  }
  const material = new THREE.ShaderMaterial({
    transparent: false,
    uniforms: uniforms,
    //wireframe: true,
    vertexShader: `
      varying vec4 localPosition;
      void main() {
        localPosition = ${
          params.isInstanced ? "instanceMatrix * " : "modelViewMatrix * "
        }vec4(position, 1.0);
        
        
        gl_Position = projectionMatrix ${
          params.isInstanced ? "* modelViewMatrix" : ""
        } * localPosition;
      }
      `,
    fragmentShader: `
      uniform float maxZ;
      uniform float minZ;
      ${params.minY ? "uniform float minY;" : ""}
      ${params.maxY ? "uniform float maxY;" : ""}
      uniform vec4 color;
      varying vec4 localPosition;
      void main() {
        if (localPosition.z > maxZ || localPosition.z < minZ) {
          discard;
        }
        gl_FragColor = color;
      }
      `,
  });
  return material;
}
