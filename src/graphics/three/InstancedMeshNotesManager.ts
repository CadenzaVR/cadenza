import { Vector3 } from "three";
import InstancedMeshObjectPool from "./InstancedMeshObjectPool";
import NoteManager from "../NoteManager";
import PooledNoteManager from "../PooledNoteManager";
import Note from "../../beatmap/models/Note";

export default abstract class InstancedMeshNoteManager
  extends PooledNoteManager<number>
  implements NoteManager
{
  protected pool: InstancedMeshObjectPool;

  constructor(pool: InstancedMeshObjectPool) {
    super();
    this.pool = pool;
  }

  abstract getOffsetSpawnPosition(note: Note, spawnOffsetTime: number): Vector3;

  getInstanceFromPool(): number {
    return this.pool.getInstance();
  }

  releaseInstanceToPool(instance: number): void {
    this.pool.releaseInstance(instance);
  }

  reset(): void {
    super.reset();
    this.pool.requireUpdate();
  }

  spawnInstance(note: Note, instance: number, spawnOffsetTime: number): void {
    this.pool.setInstancePositionFromVector3(
      instance,
      this.getOffsetSpawnPosition(note, spawnOffsetTime)
    );
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    this.pool.mesh.instanceMatrix.needsUpdate = true;
  }
}
