import { Event, Object3D, Vector3 } from "three";
import Beatmap from "../../beatmap/models/Beatmap";
import Note from "../../beatmap/models/Note";
import ArrayPooledNoteManager from "../ArrayPooledNoteManager";
import Initializable from "./Initializable";

/**
 * Simple note manager that just spawns notes and moves them forwards
 */
export default class SimpleNoteManager<T>
  extends ArrayPooledNoteManager<Object3D>
  implements Initializable<T>
{
  protected moveSpeed: number;
  protected moveDirection: Vector3;
  protected spawnPoint: Vector3;

  constructor(
    pool: Object3D[],
    spawnPoint: Vector3,
    moveSpeed: number,
    moveDirection: Vector3
  ) {
    super(pool);
    this.moveSpeed = moveSpeed;
    this.moveDirection = moveDirection;
    this.spawnPoint = spawnPoint;
  }

  init(parent: Object3D<Event>, params: T): void {
    for (const instance of this.pool) {
      parent.add(instance);
      instance.lookAt(this.moveDirection);
    }
  }

  updateInstance(instance: Object3D<Event>, deltaTime: number): void {
    instance.position.z += deltaTime * this.moveSpeed;
  }

  releaseInstanceToPool(instance: Object3D<Event>): void {
    super.releaseInstanceToPool(instance);
    instance.visible = false;
  }

  spawnInstance(
    note: Note,
    instance: Object3D<Event>,
    spawnOffsetTime: number
  ): void {
    instance.position.set(
      this.spawnPoint.x,
      this.spawnPoint.y,
      this.spawnPoint.z + spawnOffsetTime * this.moveSpeed
    );
    instance.visible = true;
  }

  async load(beatmap: Beatmap): Promise<void> {
    //TODO performance optimizations
  }
}
