import { createXShape } from "../../objects/x-shape";
import { rectOutlineGeometry } from "../../utils/geometryUtils";

AFRAME.registerComponent("checkbox", {
  schema: {
    value: { type: "boolean", default: false },
  },

  init: function () {
    const boxOutline = new THREE.Line(
      rectOutlineGeometry(0.06, 0.06),
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    const xShape = createXShape(0.01);
    this.xMesh = new THREE.Mesh(
      new THREE.ShapeBufferGeometry(xShape),
      new THREE.MeshBasicMaterial()
    );
    this.xMesh.visible = this.data.value;
    boxOutline.add(this.xMesh);
    this.el.object3D.add(boxOutline);
    this.el.addEventListener("click", () => {
      this.data.value = !this.data.value;
      this.update();
    });
  },

  update: function () {
    this.xMesh.visible = this.data.value;
    this.el.dispatchEvent(
      new CustomEvent("change", { detail: { value: this.xMesh.visible } })
    );
  },
});
