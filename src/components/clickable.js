AFRAME.registerComponent("clickable", {
  schema: {
    activationTime: { type: "number", default: 500 },
    showProgressRing: { type: "boolean", default: true },
    repeatOnHold: { type: "boolean", default: false },
    repeatTime: { type: "number", default: 250 },
  },

  init: function () {
    this.activatedId = null;
    this.system.registerClickable(
      this.el,
      this.data.activationTime,
      this.data.showProgressRing,
      this.data.repeatOnHold,
      this.data.repeatTime
    );

    this.el.addEventListener("collision-enter", (e) => {
      if (!this.activatedId) {
        this.activatedId = e.detail.id;
        this.system.activateClickable(this.el);
      }
    });

    this.el.addEventListener("collision-exit", (e) => {
      if (this.activatedId === e.detail.id) {
        this.system.deactivateClickable(this.el);
        this.activatedId = null;
      }
    });
  },

  remove: function () {
    this.system.unregisterClickable(this.el);
  },
});
