AFRAME.registerComponent("mallet", {
  schema: {
    isHandJoint: {type: 'boolean', default: false},
    radius: {type: 'number'}
  },

  init: function() {
    const gameController = document.querySelector("a-scene").systems[
      "game-controller"
    ];
    gameController.registerMallet(this.el, this.data.isHandJoint, this.data.radius);
  }
});