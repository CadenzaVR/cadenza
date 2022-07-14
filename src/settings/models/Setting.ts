export default class Setting<Type> {
  key: string;
  value: Type;
  constructor(key: string, value: Type) {
    this.key = key;
    this.value = value;
  }
}
