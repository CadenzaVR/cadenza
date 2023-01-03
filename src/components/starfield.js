AFRAME.registerComponent("starfield", {
  init: function () {
    const vertices = [];
    const invalidRegion = new THREE.Box3(
      new THREE.Vector3(-0.6, 0, 0.2),
      new THREE.Vector3(0.6, 2.5, -8)
    );
    const point = new THREE.Vector3();
    for (let i = 0; i < 1000; i++) {
      point.x = THREE.MathUtils.randFloatSpread(50);
      point.y = THREE.MathUtils.randFloat(0, 25);
      point.z = THREE.MathUtils.randFloatSpread(50);
      while (invalidRegion.containsPoint(point)) {
        point.x = THREE.MathUtils.randFloatSpread(50);
        point.y = THREE.MathUtils.randFloat(0, 25);
        point.z = THREE.MathUtils.randFloatSpread(50);
      }
      vertices.push(point.x, point.y, point.z);
      vertices.push(point.x, -point.y, point.z);
    }
    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      map: new THREE.TextureLoader().load("/images/star_texture_32x32.png"),
      size: 0.125,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    this.el.object3D.add(starField);
  },
});
