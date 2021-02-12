AFRAME.registerGeometry('roundedRect', {
  schema: {
    radius: {default: 0.01, min: 0},
    height: {default: 1, min: 0},
    width: {default: 1, min: 0},
    xOffset: {default: 0},
    yOffset: {default: 0}
  },

  init: function (data) {
    // adapted from https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_shapes.html
    const radius = data.radius;
    const width = data.width;
    const height = data.height;
    const x = -data.width/2 + data.xOffset;
    const y = -data.height/2 + data.yOffset;
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
    this.geometry = new THREE.ShapeGeometry(rect);
  }
});