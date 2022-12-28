// taken from https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_shapes.html
function roundedRectGeometry(x, y, width, height, radius) {
  const rect = new THREE.Shape();
  rect.moveTo(x, y + radius);
  rect.lineTo(x, y + height - radius);
  rect.quadraticCurveTo(x, y + height, x + radius, y + height);
  rect.lineTo(x + width - radius, y + height);
  rect.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
  rect.lineTo(x + width, y + radius);
  rect.quadraticCurveTo(x + width, y, x + width - radius, y);
  rect.lineTo(x + radius, y);
  rect.quadraticCurveTo(x, y, x, y + radius);
  return new THREE.ShapeGeometry(rect);
}

function rectOutlineGeometry(width, height) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const points = [
    new THREE.Vector3(-halfWidth, halfHeight, 0),
    new THREE.Vector3(halfWidth, halfHeight, 0),
    new THREE.Vector3(halfWidth, -halfHeight, 0),
    new THREE.Vector3(-halfWidth, -halfHeight, 0),
    new THREE.Vector3(-halfWidth, halfHeight, 0),
  ];
  return new THREE.BufferGeometry().setFromPoints(points);
}

function flatRectGeometry(width, height) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const geometry = new THREE.BufferGeometry();
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
  return geometry;
}

// adapted from https://github.com/mrdoob/three.js/blob/f021ec0c9051eb11d110b0c2b93305bffd0942e0/examples/webgl_geometry_shapes.html#L253
function capsule2DGeometry(length, radius, numSegments) {
  const halfLength = length / 2;
  const shape = new THREE.Shape()
    .moveTo(-radius, -halfLength)
    .lineTo(-radius, halfLength)
    .absarc(0, halfLength, radius, Math.PI, 0, true)
    .lineTo(radius, -halfLength)
    .absarc(0, -halfLength, radius, 2 * Math.PI, Math.PI, true);
  return new THREE.ShapeGeometry(shape, numSegments);
}

export {
  roundedRectGeometry,
  rectOutlineGeometry,
  capsule2DGeometry,
  flatRectGeometry,
};
