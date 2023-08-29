import Collider from "../../physics/Collider";
import CollisionShape from "../../physics/shapes/CollisionShape";

let i;
let len;
AFRAME.registerComponent("collider", {
  schema: {
    group: { type: "string", default: "default" },
    static: { type: "boolean", default: true },
    layer: { type: "int", default: 0 },
  },

  init: function () {
    this.parentMatrix = this.el.object3D.matrixWorld;
    this.collider = new Collider(
      this.data.group,
      this.data.static,
      this.data.layer
    );
    this.collisionShapes = this.collider.collisionShapes;
    this.collider.onCollisionEnter = (other: Collider) => {
      this.el.emit("collision-enter", other, false);
    };
    this.collider.onCollisionExit = (other: Collider) => {
      this.el.emit("collision-exit", other, false);
    };
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
    console.log(this.collisionShapes);
  },

  addCollisionShape: function (shape: CollisionShape) {
    this.collider.addCollisionShape(shape);
    if (this.collisionShapes.length === 1) {
      this.collider.boundingBox = shape.boundingBox;
    }
  },

  tick: function () {
    if (!this.collider.isStatic) {
      i = 0;
      len = this.collisionShapes.length;
      while (i < len) {
        this.collisionShapes[i].updateParentTransform(this.parentMatrix);
        i++;
      }
    }
  },
});
