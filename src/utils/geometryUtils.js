// taken from https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_shapes.html
function roundedRectGeometry( x, y, width, height, radius ) {
  const rect = new THREE.Shape();
  rect.moveTo( x, y + radius );
  rect.lineTo( x, y + height - radius );
  rect.quadraticCurveTo( x, y + height, x + radius, y + height );
  rect.lineTo( x + width - radius, y + height );
  rect.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
  rect.lineTo( x + width, y + radius );
  rect.quadraticCurveTo( x + width, y, x + width - radius, y );
  rect.lineTo( x + radius, y );
  rect.quadraticCurveTo( x, y, x, y + radius );
  return new THREE.ShapeBufferGeometry(rect);
}

function rectOutlineGeometry(width, height) {
  const halfWidth = width/2;
  const halfHeight = height/2;
  const points = [
    new THREE.Vector3(-halfWidth, halfHeight, 0),
    new THREE.Vector3(halfWidth, halfHeight, 0),
    new THREE.Vector3(halfWidth, -halfHeight, 0),
    new THREE.Vector3(-halfWidth, -halfHeight, 0),
    new THREE.Vector3(-halfWidth, halfHeight, 0)
  ];
  return new THREE.BufferGeometry().setFromPoints(points);
}

export {
  roundedRectGeometry,
  rectOutlineGeometry
};