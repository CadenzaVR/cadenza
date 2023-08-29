import Input from "./Input";
import InputProvider from "./InputProvider";

let i;
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
    i = 0;
    while (i < this.listeners.length) {
      this.listeners[i](input);
      i++;
    }
  }

  getInputs(): Input[] {
    return this.inputs;
  }
}
