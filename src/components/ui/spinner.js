import {
  createTextElement,
  createTriangleButton,
} from "../../utils/entityUtils";
import { rectOutlineGeometry } from "../../utils/geometryUtils";

const SpinnerTypes = Object.freeze({
  HORIZONTAL: 0,
  VERTICAL: 1,
});

AFRAME.registerComponent("spinner", {
  schema: {
    value: { type: "number", default: 0 },
    increment: { type: "number", default: 1 },
    min: { type: "number", default: Number.NEGATIVE_INFINITY },
    max: { type: "number", default: Number.POSITIVE_INFINITY },
    width: { type: "number", default: 1 },
    wrapCount: { type: "number", default: 16 },
    type: { type: "number", default: SpinnerTypes.HORIZONTAL },
    showOutline: { type: "boolean", default: true },
    displayedValues: { type: "string", default: "" },
    buttonColor: { type: "color", default: "#fff" },
    buttonOpacity: { type: "number", default: 0.2 },
    buttonHighlightColor: { type: "color", default: "#fff" },
    buttonHighlightOpacity: { type: "number", default: 0.5 },
    buttonTransparent: { type: "boolean", default: false },
  },

  init: function () {
    this.outline = new THREE.Line(
      rectOutlineGeometry(0.06, 0.06),
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    this.el.object3D.add(this.outline);

    this.increaseButton = createTriangleButton(
      0.02,
      0.06,
      this.data.buttonColor,
      this.data.buttonOpacity,
      this.data.buttonTransparent,
      this.data.buttonHighlightColor,
      this.data.buttonHighlightOpacity
    );
    this.el.appendChild(this.increaseButton);
    this.increaseButton.components.button.registerClickHandler(() => {
      this.data.value += this.data.increment;
      this.update();
    });

    this.decreaseButton = createTriangleButton(
      0.02,
      0.06,
      this.data.buttonColor,
      this.data.buttonOpacity,
      this.data.buttonTransparent,
      this.data.buttonHighlightColor,
      this.data.buttonHighlightOpacity
    );
    this.el.appendChild(this.decreaseButton);
    this.decreaseButton.components.button.registerClickHandler(() => {
      this.data.value -= this.data.increment;
      this.update();
    });

    this.text = createTextElement(
      this.data.width,
      "center",
      "/fonts/Roboto-msdf.json",
      true
    );
    this.text.setAttribute("text", "wrapCount", this.data.wrapCount);
    this.el.appendChild(this.text);

    const buttonPadding = 0.015;
    const halfWidth = this.data.width / 2;
    if (this.data.type == SpinnerTypes.HORIZONTAL) {
      this.increaseButton.object3D.position.set(
        halfWidth + buttonPadding,
        0,
        0
      );
      this.decreaseButton.object3D.position.set(
        -(halfWidth + buttonPadding),
        0,
        0
      );
      this.decreaseButton.object3D.rotation.z = Math.PI;
    } else {
      this.increaseButton.object3D.position.set(
        0,
        halfWidth + buttonPadding,
        0
      );
      this.increaseButton.object3D.rotation.z = Math.PI / 2;
      this.decreaseButton.object3D.position.set(
        0,
        -(halfWidth + buttonPadding),
        0
      );
      this.decreaseButton.object3D.rotation.z = -Math.PI / 2;
    }

    this.update();
  },

  update: function () {
    this.outline.visible = this.data.showOutline;

    this.displayedValues = this.data.displayedValues
      .split("|")
      .map((str) => str.trim())
      .filter((str) => str != "");

    this.applyBounds();
    this.data.value = parseFloat(this.data.value.toFixed(2));
    if (
      this.displayedValues.length > 0 &&
      this.data.value < this.displayedValues.length
    ) {
      this.text.setAttribute("value", this.displayedValues[this.data.value]);
    } else {
      this.text.setAttribute("value", this.data.value);
    }
    this.text.setAttribute("wrapCount", this.data.wrapCount);
    this.el.dispatchEvent(
      new CustomEvent("change", { detail: { value: this.data.value } })
    );
  },

  applyBounds: function () {
    if (this.data.value < this.data.min) {
      this.data.value = this.data.min;
    } else if (this.data.value > this.data.max) {
      this.data.value = this.data.max;
    }
    this.decreaseButton.object3D.visible = this.data.value > this.data.min;
    this.increaseButton.object3D.visible = this.data.value < this.data.max;
  },
});
