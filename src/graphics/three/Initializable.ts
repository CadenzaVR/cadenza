import { Object3D } from "three";

export default interface Initializable<T> {
  init(parent: Object3D, params: T): void;
}
