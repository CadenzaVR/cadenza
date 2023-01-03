import { Event, Object3D, Vector3 } from "three";
import Beatmap from "../../beatmap/models/Beatmap";
import Note from "../../beatmap/models/Note";
import Initializable from "./Initializable";
import InstancedMeshNoteManager from "./InstancedMeshNotesManager";
import InstancedMeshObjectPool from "./InstancedMeshObjectPool";

const dummyVector = new Vector3();
/**
 * Simple note manager that just spawns notes and moves them forwards
 */
export default class InstancedSimpleNoteManager
  extends InstancedMeshNoteManager
  implements Initializable
{
  protected moveSpeed: number;
  protected moveDirection: Vector3;
  protected spawnPoint: Vector3;

  constructor(
    pool: InstancedMeshObjectPool,
    spawnPoint: Vector3,
    moveSpeed: number,
    moveDirection: Vector3
  ) {
    super(pool);
    this.moveSpeed = moveSpeed;
    this.moveDirection = moveDirection;
    this.spawnPoint = spawnPoint;
  }

  init(parent: Object3D<Event>): void {
    this.pool.mesh.lookAt(this.moveDirection);
    parent.add(this.pool.mesh);
  }

  getOffsetSpawnPosition(note: Note, spawnOffsetTime: number): Vector3 {
    dummyVector.copy(this.spawnPoint);
    dummyVector.z += spawnOffsetTime * this.moveSpeed;
    return dummyVector;
  }
  updateInstance(instance: number, deltaTime: number): void {
    this.pool.incrementInstancePositionZ(instance, deltaTime * this.moveSpeed);
  }
  async load(beatmap: Beatmap): Promise<void> {
    //TODO performance optimizations
  }
}
