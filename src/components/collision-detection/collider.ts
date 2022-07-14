import Collider from "../../physics/Collider";
import { Box3, Plane, Sphere } from "three";

function round(num: number, precision: number) {
  return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
}

AFRAME.registerComponent("collider", {
  schema: {
    group: { type: "string", default: "default" },
    static: { type: "boolean", default: true },
  },

  init: function () {
    this.mesh = this.el.getObject3D("mesh");
    this.collider = new Collider(this.data.group, this.data.static);
    this.collider.onCollisionEnter = (other: Collider) => {
      this.el.emit("collision-enter", other, false);
    };
    this.collider.onCollisionExit = (other: Collider) => {
      this.el.emit("collision-exit", other, false);
    };
    setTimeout(() => {
      this.updateBoundingBox();
    }, 3000);
    this.el.sceneEl.systems["collision-detection"].registerCollider(
      this.collider
    );
  },

  remove: function () {
    this.el.sceneEl.systems["collision-detection"].removeCollider(
      this.collider
    );
  },

  updateBoundingBox: function () {
    this.collider.boundingBox.setFromObject(this.mesh);
    this.collider.boundingBox.min.x = round(this.collider.boundingBox.min.x, 3);
    this.collider.boundingBox.min.y = round(this.collider.boundingBox.min.y, 3);
    this.collider.boundingBox.min.z = round(this.collider.boundingBox.min.z, 3);
    this.collider.boundingBox.max.x = round(this.collider.boundingBox.max.x, 3);
    this.collider.boundingBox.max.y = round(this.collider.boundingBox.max.y, 3);
    this.collider.boundingBox.max.z = round(this.collider.boundingBox.max.z, 3);
  },

  addCollisionShape: function (shape: [number, Plane | Box3 | Sphere]) {
    this.collider.addCollisionShape(shape);
  },

  tick: function () {
    if (!this.collider.isStatic) {
      this.collider.boundingBox.setFromObject(this.mesh);
    }
  },
});
