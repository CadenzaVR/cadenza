import Input from "./Input";
import InputProvider from "./InputProvider";

export default class SimpleInputProvider implements InputProvider {
  private inputs: Input[];
  private listeners: Array<(input: Input) => void>;

  constructor(inputs: Input[]) {
    this.inputs = inputs;
    this.listeners = [];
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
    return this.inputs;
  }
}
