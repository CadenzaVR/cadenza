import { CircleBufferGeometry, Mesh, Vector3, Vector4 } from "three";
import { createClampedVisibiltyMaterial } from "../../../objects/note";
import SimpleNoteManager from "../SimpleNoteManager";
import TaikoParams from "./TaikoParams";

const COLOR_CYAN = new Vector4(0, 1, 1, 1);
const SHAKERMATERIAL = createClampedVisibiltyMaterial({ color: COLOR_CYAN });

export default class ShakerNotesManager extends SimpleNoteManager<TaikoParams> {
  constructor(
    numInstances: number,
    spawnPoint: Vector3,
    moveSpeed: number,
    moveDirection: Vector3
  ) {
    super([], spawnPoint, moveSpeed, moveDirection);
    for (let i = 0; i < numInstances; i++) {
      this.pool.push(
        new Mesh(new CircleBufferGeometry(0.3, 16), SHAKERMATERIAL)
      );
    }
  }
}
