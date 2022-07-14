AFRAME.registerComponent("mallet", {
  schema: {
    isHandJoint: { type: "boolean", default: false },
    handEl: { type: "selector" },
  },

  init: function () {
    if (this.data.handEl) {
      this.handEl = this.data.handEl;
      this.handEl.addEventListener("controllerconnected", () => {
        setTimeout(() => {
          const haptics = this.handEl.components.haptics;
          if (
            haptics.gamepad.hapticActuators &&
            haptics.gamepad.hapticActuators.length > 0
          ) {
            this.haptics = haptics;
          }
        }, 1000);
      });
      this.el.addEventListener("collision-enter", () => {
        this.vibrate(0.4, 20);
      });
    }
  },

  vibrate: function (strength, duration) {
    if (this.haptics) {
      this.haptics.pulse(strength, duration);
    }
  },
});
