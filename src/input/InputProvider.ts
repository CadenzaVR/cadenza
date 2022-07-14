import Input from "./Input";

export default interface InputProvider {
  update?(): void;
  addListener(listener: (input: Input) => void): void;
  getInputs(): Input[];
}
