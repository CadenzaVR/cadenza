import Collider from "../physics/Collider";
import CollisionDetectionSystem from "../physics/CollisionDetectionSystem";

AFRAME.registerSystem("collision-detection", {
  init() {
    this.initialized = false;
    this.groupsToDisable = [];
    this.groupsToEnable = [];
    this.collisionDetectionSystem = new CollisionDetectionSystem([[0, 1]]);
    this.el.addEventListener("loaded", () => {
      //wait for colliders to be registered and then build KDTrees
      setTimeout(() => {
        this.collisionDetectionSystem.buildKDTrees();
        for (const group of this.groupsToDisable) {
          this.collisionDetectionSystem.disableColliderGroup(group);
        }
        this.groupsToDisable.length = 0;

        for (const group of this.groupsToEnable) {
          this.collisionDetectionSystem.enableColliderGroup(group);
        }
        this.groupsToEnable.length = 0;
        this.initialized = true;
      }, 4000);
    });
  },

  enableColliderGroup(group: string) {
    if (this.initialized) {
      this.collisionDetectionSystem.enableColliderGroup(group);
    } else {
      this.groupsToEnable.push(group);
    }
  },

  disableColliderGroup(group: string) {
    if (this.initialized) {
      this.collisionDetectionSystem.disableColliderGroup(group);
    } else {
      this.groupsToDisable.push(group);
    }
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
    if (this.initialized) {
      this.collisionDetectionSystem.update();
    }
  },
});
