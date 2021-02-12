AFRAME.registerComponent("clickable", {
  schema: {
    activationTime: {type: 'number', default: 500},
    showProgressRing: {type: 'boolean', default: true},
    repeatOnHold: {type: 'boolean', default: false},
    repeatTime: {type: 'number', default: 250},
  },

  init: function() {
    this.gameController = document.querySelector("a-scene").systems[
      "game-controller"
    ];
    this.gameController.registerClickable(this.el, this.data.activationTime, this.data.showProgressRing, this.data.repeatOnHold, this.data.repeatTime);
  },

  remove: function() {
    this.gameController.unregisterClickable(this.el);
  }
});