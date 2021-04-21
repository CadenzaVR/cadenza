export const createNote = (
  width,
  height,
  isInstanced = false,
  numInstances = 1
) => {
  const geometry = new THREE.BufferGeometry();
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  const vertices = new Float32Array([
    -halfWidth,
    0,
    halfHeight,
    halfWidth,
    0,
    -halfHeight,
    -halfWidth,
    0,
    -halfHeight,

    -halfWidth,
    0,
    halfHeight,
    halfWidth,
    0,
    halfHeight,
    halfWidth,
    0,
    -halfHeight,
  ]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  let mesh;
  let object3D;
  if (isInstanced) {
    const material = new THREE.ShaderMaterial({
      transparent: false,
      uniforms: {
        maxY: { value: 2.29 },
        minY: { value: 0.9 },
        maxZ: { value: -0.326 },
        minZ: { value: -8.23 },
        color: { value: new THREE.Vector4(1, 1, 1, 1) },
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
    mesh = new THREE.InstancedMesh(geometry, material, numInstances);
    for (let i = 0; i < numInstances; i++) {
      mesh.setMatrixAt(i, new THREE.Matrix4());
    }
    mesh.frustumCulled = false;
    object3D = mesh;
  } else {
    const material = new THREE.ShaderMaterial({
      transparent: false,
      uniforms: {
        maxY: { value: 2.29 },
        minY: { value: 0.9 },
        maxZ: { value: -0.326 },
        minZ: { value: -8.23 },
        color: { value: new THREE.Vector4(1, 1, 1, 1) },
      },
      //wireframe: true,
      vertexShader: `
      uniform float maxY;
      uniform float minY;
      uniform float maxZ;
      uniform float minZ;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
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
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.0001;
    object3D = new THREE.Group();
    object3D.add(mesh);
  }

  return {
    object3D: object3D,
    mesh: mesh,
  };
};
