import Input from "./Input";
import InputProvider from "./InputProvider";

export default class KeyboardInputProvider implements InputProvider {
  private inputs: Input[];
  private inputsMap: Map<string, Input>;
  private inputMap: Map<string, string>;
  private listeners: Array<(input: Input) => void>;

  constructor(inputMap: Map<string, string>) {
    this.inputMap = inputMap;
    this.inputs = [];
    this.inputsMap = new Map();
    this.listeners = [];
    for (const [key, keyAction] of inputMap.entries()) {
      const input = { id: keyAction, value: 0 };
      this.inputs.push(input);
      this.inputsMap.set(key, input);
    }
  }

  addListener(listener: (input: Input) => void): void {
    this.listeners.push(listener);
  }

  init(eventTarget: EventTarget): void {
    eventTarget.addEventListener("keydown", (e: KeyboardEvent) => {
      const input = this.inputsMap.get(e.key);
      if (input) {
        input.value = 1;
        for (const listener of this.listeners) {
          listener(input);
        }
      }
    });

    eventTarget.addEventListener("keyup", (e: KeyboardEvent) => {
      const input = this.inputsMap.get(e.key);
      if (input) {
        input.value = 0;
        for (const listener of this.listeners) {
          listener(input);
        }
      }
    });
  }

  getInputs(): Input[] {
    return this.inputs;
  }
}
