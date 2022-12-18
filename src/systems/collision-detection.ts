import Collider from "../physics/Collider";
import CollisionDetectionSystem from "../physics/CollisionDetectionSystem";

AFRAME.registerSystem("collision-detection", {
  init() {
    this.collisionDetectionSystem = new CollisionDetectionSystem();
    this.el.addEventListener("loaded", () => {
      //wait for colliders to be registered and then build KDTrees
      setTimeout(() => {
        this.collisionDetectionSystem.buildKDTrees();
      }, 4000);
    });
  },

  enableColliderGroup(group: string) {
    this.collisionDetectionSystem.enableColliderGroup(group);
  },

  disableColliderGroup(group: string) {
    this.collisionDetectionSystem.disableColliderGroup(group);
  },

  buildKDTree(groupId: string) {
    this.collisionDetectionSystem.buildKDTree(groupId);
  },

  registerCollider(collider: Collider) {
    this.collisionDetectionSystem.addCollider(collider);
  },

  removeCollider(collider: Collider) {
    this.collisionDetectionSystem.removeCollider(collider);
  },

  tick() {
    this.collisionDetectionSystem.update();
  },
});