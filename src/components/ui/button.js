AFRAME.registerComponent("button", {
  dependencies: ["material"],
  schema: {
    highlightColor: { type: "color", default: "#e1e1e1" },
    highlightOpacity: { type: "number", default: null },
  },

  init: function () {
    this.material = this.el.getObject3D("mesh").material;
    this.originalColor = this.material.color.getHex();
    this.originalOpacity = this.material.opacity;
    this.el.addEventListener("mouseover", () => {
      this.material.color.set(this.data.highlightColor);
      if (this.material.transparent) {
        this.material.opacity = this.data.highlightOpacity;
      }
    });
    this.el.addEventListener("mouseout", () => {
      this.material.color.set(this.originalColor);
      if (this.material.transparent) {
        this.material.opacity = this.originalOpacity;
      }
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
