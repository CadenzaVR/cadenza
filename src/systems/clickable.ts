import { createProgressRing } from "../objects/progressRing";
import { Raycaster, Vector2 } from "three";

const CLICK_EVENT = new Event("click");
const MOUSEOVER_EVENT = new Event("mouseover");
const MOUSEOUT_EVENT = new Event("mouseout");

AFRAME.registerSystem("clickable", {
  init: function () {
    this.activeClickable = null;
    this.clickableObjects = new Map();
    this.clickableProgressRing;

    const raycaster = new Raycaster();
    // Mouse events
    document.addEventListener("click", (e) => {
      const mouse = new Vector2();
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.el.camera);
      for (const clickable of this.clickableObjects) {
        const mesh = clickable[0].getObject3D("mesh");
        if (
          mesh.visible &&
          mesh.parent.visible &&
          raycaster.intersectObject(mesh).length > 0
        ) {
          clickable[0].dispatchEvent(CLICK_EVENT);
          break;
        }
      }
    });

    // Progress ring for clickable ui elements
    const progressRing = createProgressRing(0.06);
    this.clickableProgressRing = progressRing;
    this.el.object3D.add(progressRing.object3D);
  },

  registerClickable: function (
    el: any,
    activationTime: number,
    showProgressRing: boolean,
    repeatOnHold: boolean,
    repeatTime: number
  ) {
    this.clickableObjects.set(el, {
      el: el,
      object3D: el.object3D,
      state: 0,
      activatingTime: 0,
      activationTime: activationTime,
      activationCount: 0,
      showProgressRing: showProgressRing,
      repeatOnHold: repeatOnHold,
      repeatTime: repeatTime,
    });
  },

  unregisterClickable: function (el: any) {
    if (this.activeClickable === this.clickableObjects.get(el)) {
      this.clearActiveClickable();
    }
    this.clickableObjects.delete(el);
  },

  clearActiveClickable: function () {
    this.activeClickable.activatingTime = 0;
    this.activeClickable.activationCount = 0;
    this.activeClickable = null;
    this.clickableProgressRing.material.uniforms.percent.value = 0;
    this.clickableProgressRing.object3D.visible = false;
  },

  activateClickable: function (el: any) {
    if (!this.activeClickable) {
      this.activeClickable = this.clickableObjects.get(el);
      this.activeClickable.el.dispatchEvent(MOUSEOVER_EVENT);
      if (this.activeClickable.showProgressRing) {
        this.clickableProgressRing.object3D.visible = true;
        this.activeClickable.object3D.getWorldPosition(
          this.clickableProgressRing.object3D.position
        );
        this.activeClickable.object3D.getWorldQuaternion(
          this.clickableProgressRing.object3D.quaternion
        );
        this.clickableProgressRing.object3D.position.z += 0.001;
      }
    }
  },

  deactivateClickable: function (el: any) {
    if (el === this.activeClickable.el) {
      this.activeClickable.el.dispatchEvent(MOUSEOUT_EVENT);
      this.clearActiveClickable();
    }
  },

  tick: function (time, delta) {
    if (this.activeClickable) {
      this.activeClickable.activatingTime += delta;
      let activationPercent;
      if (
        this.activeClickable.repeatOnHold &&
        this.activeClickable.activationCount > 0
      ) {
        activationPercent = Math.min(
          this.activeClickable.activatingTime /
            (this.activeClickable.repeatTime /
              Math.pow(1.5, this.activeClickable.activationCount)),
          1
        );
      } else {
        activationPercent = Math.min(
          this.activeClickable.activatingTime /
            this.activeClickable.activationTime,
          1
        );
      }
      this.clickableProgressRing.material.uniforms.percent.value =
        activationPercent;
      if (
        (this.activeClickable.activationCount == 0 ||
          this.activeClickable.repeatOnHold) &&
        activationPercent === 1
      ) {
        this.activeClickable.activatingTime = 0;
        this.activeClickable.activationCount += 1;
        this.activeClickable.el.dispatchEvent(CLICK_EVENT);
        this.clickableProgressRing.object3D.visible = false;
      }
    }
  },
});
