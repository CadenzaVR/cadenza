import Input from "./Input";
import InputProvider from "./InputProvider";
import InputState from "./InputState";

let temp;
let i;
export default class InputManager {
  private inputState: InputState;
  private pollInputProviders: Array<InputProvider>;
  private inputProviders: Array<InputProvider>;
  private queuedEventMap: Map<string, number>;

  constructor() {
    this.pollInputProviders = [];
    this.inputProviders = [];
    this.queuedEventMap = new Map();
    this.inputState = { stateMap: new Map(), eventMap: new Map() };
  }

  addInputProvider(inputProvider: InputProvider) {
    this.inputProviders.push(inputProvider);
    if (inputProvider.update) {
      this.pollInputProviders.push(inputProvider);
    }

    const inputs = inputProvider.getInputs();
    for (const input of inputs) {
      if (!this.inputState.stateMap.has(input.id)) {
        this.inputState.stateMap.set(input.id, { value: 0, inputs: [] });
      }
      this.inputState.stateMap.get(input.id).inputs.push(input);
    }

    inputProvider.addListener((input: Input) => {
      this.queuedEventMap.set(input.id, input.value);
      this.inputState.stateMap.get(input.id).value = input.value; //TODO update in case multiple active inputs for same group is needed
    });
  }

  public getInputState() {
    return this.inputState;
  }

  public update() {
    // clear events from previous frame
    this.inputState.eventMap.clear();
    // update inputs
    i = 0;
    while (i < this.pollInputProviders.length) {
      this.pollInputProviders[i].update();
      i++;
    }
    // swap queued and previously active maps
    temp = this.inputState.eventMap;
    this.inputState.eventMap = this.queuedEventMap;
    this.queuedEventMap = temp;
  }
}
