import InputManager from "../input/InputManager";
import InputProvider from "../input/InputProvider";
import KeyboardInputProvider from "../input/KeyboardInputProvider";

AFRAME.registerSystem("input", {
  schema: {}, // System schema. Parses into `this.data`.

  init: function () {
    this.keyboardInputProvider = new KeyboardInputProvider(
      new Map([
        ["a", "key0"],
        ["s", "key1"],
        ["d", "key2"],
        ["f", "key3"],
        ["g", "key4"],
        ["h", "key5"],
        ["j", "key6"],
        ["k", "key7"],
      ])
    );
    this.keyboardInputProvider.init(document);
    this.inputManager = new InputManager();
    this.inputManager.addInputProvider(this.keyboardInputProvider);
  },

  registerInputProvider: function (inputProvider: InputProvider) {
    this.inputManager.addInputProvider(inputProvider);
  },
});
