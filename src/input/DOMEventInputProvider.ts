import Input from "./Input";
import InputProvider from "./InputProvider";

export default class DOMEventInputProvider implements InputProvider {
  listeners: Array<(input: Input) => void>;
  targetEventMap: Map<string, Map<string, string>>;
  inputs: Map<string, Input>;

  constructor(targetEventMap: Map<string, Map<string, string>>) {
    this.targetEventMap = targetEventMap;
    this.inputs = new Map();
  }

  init() {
    for (const [target, eventMappings] of this.targetEventMap.entries()) {
      for (const [event, inputId] of eventMappings.entries()) {
        this.inputs.set(inputId, { id: inputId, value: 1 });
        document.querySelector(target).addEventListener(event, () => {
          this.notifyListeners(this.inputs.get(inputId));
        });
      }
    }
  }

  addListener(listener: (input: Input) => void): void {
    this.listeners.push(listener);
  }

  notifyListeners(input: Input): void {
    for (const listener of this.listeners) {
      listener(input);
    }
  }

  getInputs(): Input[] {
    return [];
  }
}
