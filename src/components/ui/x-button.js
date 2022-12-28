import { createXShape } from "../../objects/x-shape";

AFRAME.registerComponent("x-button", {
  init: function () {
    const xShape = createXShape(0.015);
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(xShape),
      new THREE.MeshBasicMaterial()
    );
    this.el.object3D.add(mesh);
    this.el.addEventListener("click", () => {
      mesh.geometry.dispose();
      mesh.material.dispose();
      this.el.object3D.remove(mesh);
      const parent = this.el.parentElement;
      parent.parentElement.removeChild(parent);
    });
  },
});
