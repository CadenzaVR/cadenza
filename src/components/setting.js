AFRAME.registerComponent("setting", {
  schema: {
    name: { type: "string" },
    component: { type: "string" },
  },

  init: function () {
    this.system.registerSetting(this.data.name, this.el, this.data.component);
  },
});
