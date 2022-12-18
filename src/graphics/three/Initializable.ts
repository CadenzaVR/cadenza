import { Object3D } from "three";

export default interface Initializable {
  init(parent: Object3D): void;
}
