import { CircleGeometry, Mesh, Vector3, Vector4 } from "three";
import { createClampedVisibiltyMaterial } from "../../../objects/note";
import SimpleNoteManager from "../SimpleNoteManager";

const COLOR_CYAN = new Vector4(0, 1, 1, 1);
const SHAKERMATERIAL = createClampedVisibiltyMaterial({ color: COLOR_CYAN });

export default class ShakerNotesManager extends SimpleNoteManager {
  constructor(
    numInstances: number,
    spawnPoint: Vector3,
    moveSpeed: number,
    moveDirection: Vector3
  ) {
    super([], spawnPoint, moveSpeed, moveDirection);
    for (let i = 0; i < numInstances; i++) {
      this.pool.push(new Mesh(new CircleGeometry(0.3, 16), SHAKERMATERIAL));
    }
  }
}
