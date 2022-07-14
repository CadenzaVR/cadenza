import InputGroup from "./InputGroup";

export default interface InputState {
  stateMap: Map<string, InputGroup>;
  eventMap: Map<string, number>;
}
