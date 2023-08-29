import { Vector3, Matrix4 } from "three";
import Note from "../../../beatmap/models/Note";
import { createClampedVisibiltyMaterial } from "../../../objects/note";
import { trapezoidGeometry } from "../../../utils/geometryUtils";
import InstancedMeshObjectPool from "../InstancedMeshObjectPool";
import InstancedSimpleNoteManager from "../InstancedSimpleNoteManager";

const BASE_POSITION = new Vector3(0, 0.0001, 10);

const BASE_NOTE_WIDTH = 0.05;
const BASE_NOTE_HEIGHT = 0.05;

const NOTERANGE = 48;

const dummyMatrix = new Matrix4();
const dummyVector = new Vector3();
export default class InstancedTonoNoteManager extends InstancedSimpleNoteManager {
  baseNoteWidth: number;
  baseNoteHeight: number;
  railWidth: number;
  railLength: number;
  baseSpawnPoint: Vector3;
  horizontalScaleFactor: number;

  constructor(
    numInstances: number,
    moveSpeed: number,
    moveDirection: Vector3,
    railWidth: number,
    railLength: number
  ) {
    super(
      new InstancedMeshObjectPool(
        trapezoidGeometry(
          BASE_NOTE_WIDTH + 0.01,
          BASE_NOTE_WIDTH,
          BASE_NOTE_HEIGHT
        ),
        createClampedVisibiltyMaterial({
          isInstanced: true,
          minZ: 0,
          maxZ: railLength,
        }),
        numInstances,
        BASE_POSITION
      ),
      null,
      moveSpeed,
      moveDirection
    );
    this.baseNoteHeight = BASE_NOTE_HEIGHT;
    this.baseNoteWidth = BASE_NOTE_WIDTH;
    this.railWidth = railWidth;
    this.railLength = railLength;
    this.horizontalScaleFactor = railWidth / NOTERANGE;
  }

  spawnInstance(note: Note, instance: number, spawnOffsetTime: number): void {
    const targetHeight = this.baseNoteHeight + this.moveSpeed * note.duration;
    dummyMatrix.identity();
    dummyVector.x = note.type * this.horizontalScaleFactor;
    dummyVector.y = 0;
    dummyVector.z = 0;
    dummyVector.z +=
      spawnOffsetTime * this.moveSpeed +
      (this.baseNoteHeight - targetHeight) / 2;

    dummyMatrix.setPosition(dummyVector);
    dummyVector.set(1, 1, targetHeight / this.baseNoteHeight);

    dummyMatrix.scale(dummyVector);
    this.pool.mesh.setMatrixAt(instance, dummyMatrix);
  }
}
