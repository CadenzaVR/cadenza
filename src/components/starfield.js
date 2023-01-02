AFRAME.registerComponent("starfield", {
  init: function () {
    const vertices = [];
    for (let i = 0; i < 1000; i++) {
      const x = THREE.MathUtils.randFloatSpread(1000);
      const y = THREE.MathUtils.randFloat(0, 500);
      const z = THREE.MathUtils.randFloatSpread(1000);
      vertices.push(x, y, z);
      vertices.push(x, -y, z);
    }
    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    this.el.object3D.add(starField);
  },
});
