AFRAME.registerComponent("starfield", {
  init: function () {
    const vertices = [];
    for (let i = 0; i < 1000; i++) {
      const x = THREE.MathUtils.randFloatSpread(50);
      const y = THREE.MathUtils.randFloat(0, 25);
      const z = THREE.MathUtils.randFloatSpread(50);
      vertices.push(x, y, z);
      vertices.push(x, -y, z);
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
