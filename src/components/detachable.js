AFRAME.registerComponent("detachable", {
  schema: {
    parent: { type: "string" },
    detached: { default: false },
  },

  init: function () {
    if (this.data.parent) {
      this.parentObject = document.querySelector(this.data.parent).object3D;
    } else {
      this.parentObject = this.el.object3D.parent;
    }

    this.scene = this.el.sceneEl.object3D;
    this.gameController = this.el.sceneEl.systems["game-controller"];
    let hand = this.parentObject.el.parentElement;

    hand.addEventListener("triggerdown", () => {
      this.detachFromParent();
    });

    hand.addEventListener("triggerup", () => {
      this.attachToParent();
    });
  },

  detachFromParent: function () {
    if (this.gameController.getState() != 0) {
      this.detach(this.el.object3D, this.parentObject, this.scene);
    }
  },

  attachToParent: function () {
    if (this.gameController.getState() != 0) {
      this.attach(this.el.object3D, this.parentObject, this.scene);
    }
  },

  detach: function (child, parent, scene) {
    child.applyMatrix(parent.matrixWorld);
    parent.remove(child);
    scene.add(child);
  },

  attach: function (child, parent, scene) {
    child.applyMatrix(new THREE.Matrix4().getInverse(parent.matrixWorld));
    scene.remove(child);
    parent.add(child);
  },
});
