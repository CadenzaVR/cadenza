AFRAME.registerComponent("game-camera", {
  init: function() {
    const scene = document.querySelector("a-scene");
    const gameController = scene.systems["game-controller"];
    gameController.registerCamera(this.el);
    scene.addEventListener("enter-vr", () => {
      this.el.setAttribute("look-controls", "enabled", "true");
    });
    scene.addEventListener("exit-vr", () => {
      this.el.setAttribute("look-controls", "enabled", "false");
    });
  }
});