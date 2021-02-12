AFRAME.registerComponent("button", {
  schema: {
    highlightColor: { type: "color", default: "#e1e1e1" },
  },

  init: function () {
    this.material = this.el.getObject3D("mesh").material;
    this.originalColor = this.material.color.getHex();
    this.el.addEventListener("mouseover", () => {
      this.material.color.set(this.data.highlightColor);
    });
    this.el.addEventListener("mouseout", () => {
      this.material.color.set(this.originalColor);
    });
  },

  deselect: function () {
    this.material.color.set(this.originalColor);
  },

  select: function () {
    this.material.color.set(this.data.highlightColor);
  },

  registerClickHandler: function (clickHandler) {
    this.el.addEventListener("click", clickHandler);
  },
});
