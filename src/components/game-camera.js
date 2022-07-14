AFRAME.registerComponent("game-camera", {
  init: function () {
    this.el.sceneEl.addEventListener("enter-vr", () => {
      this.el.setAttribute("look-controls", "enabled", "true");
    });
    this.el.sceneEl.addEventListener("exit-vr", () => {
      this.el.setAttribute("look-controls", "enabled", "false");
    });
  },
});
