AFRAME.registerSystem("detachable", {
  init: function () {
    this.activatedObjects = [];
    this.isEnabled = true;
  },

  addActivatedObject: function (object) {
    if (!this.isEnabled) return;
    this.activatedObjects.push(object);
    if (this.activatedObjects.length === 2) {
      for (const object of this.activatedObjects) {
        object.detachFromParent();
      }
    }
  },

  removeActivatedObject: function (object) {
    if (!this.isEnabled) return;
    if (this.activatedObjects.length === 2) {
      for (const object of this.activatedObjects) {
        object.attachToParent();
      }
    }
    this.activatedObjects.splice(this.activatedObjects.indexOf(object), 1);
  },
});

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
    let hand = this.parentObject.el.parentElement;

    hand.addEventListener("triggerdown", () => {
      this.system.addActivatedObject(this);
    });

    hand.addEventListener("triggerup", () => {
      this.system.removeActivatedObject(this);
    });
  },

  detachFromParent: function () {
    this.detach(this.el.object3D, this.parentObject, this.scene);
  },

  attachToParent: function () {
    this.attach(this.el.object3D, this.parentObject, this.scene);
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
