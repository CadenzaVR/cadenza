import { ShaderMaterial, Vector3, Vector4, Matrix4 } from "three";
import ClassicNote from "../../../beatmap/models/ClassicNote";
import Note from "../../../beatmap/models/Note";
import { createClampedVisibiltyMaterial } from "../../../objects/note";
import { flatRectGeometry } from "../../../utils/geometryUtils";
import InstancedMeshObjectPool from "../InstancedMeshObjectPool";
import InstancedSimpleNoteManager from "../InstancedSimpleNoteManager";

const enum NoteTypes {
  HIT_NOTE = 0,
  SLIDE_NOTE = 1,
  HOLD_NOTE = 2,
  ROLL_NOTE = 3,
}

const COLOR_CYAN = new Vector4(0, 1, 1, 1);
const COLOR_YELLOW = new Vector4(1, 1, 0, 1);
const BASE_POSITION = new Vector3(0, 0.0001, 10);

const BASE_NOTE_WIDTH = 0.12;
const BASE_NOTE_HEIGHT = 0.05;

const dummyMatrix = new Matrix4();
const dummyVector = new Vector3();
export default class InstancedClassicNoteManager extends InstancedSimpleNoteManager {
  baseNoteWidth: number;
  baseNoteHeight: number;
  railWidth: number;
  railLength: number;
  baseSpawnPoint: Vector3;

  constructor(
    type: number,
    numInstances: number,
    moveSpeed: number,
    moveDirection: Vector3,
    railWidth: number,
    railLength: number
  ) {
    super(
      new InstancedMeshObjectPool(
        flatRectGeometry(BASE_NOTE_WIDTH, BASE_NOTE_HEIGHT),
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

    if (type === NoteTypes.SLIDE_NOTE) {
      (<ShaderMaterial>this.pool.mesh.material).uniforms.color.value =
        COLOR_YELLOW;
    } else if (type === NoteTypes.ROLL_NOTE) {
      (<ShaderMaterial>this.pool.mesh.material).uniforms.color.value =
        COLOR_CYAN;
    }
    this.baseNoteHeight = BASE_NOTE_HEIGHT;
    this.baseNoteWidth = BASE_NOTE_WIDTH;
    this.railWidth = railWidth;
    this.railLength = railLength;
  }

  spawnInstance(note: Note, instance: number, spawnOffsetTime: number): void {
    const targetHeight = this.baseNoteHeight + this.moveSpeed * note.duration;
    dummyMatrix.identity();
    dummyVector.x = (note as ClassicNote).key * this.railWidth;
    dummyVector.y = 0;
    dummyVector.z = 0;
    dummyVector.z +=
      spawnOffsetTime * this.moveSpeed +
      (this.baseNoteHeight - targetHeight) / 2;
    dummyVector.x += (((note as ClassicNote).width - 1) * this.railWidth) / 2;

    dummyMatrix.setPosition(dummyVector);
    dummyVector.set(
      (this.railWidth * (<ClassicNote>note).width - 0.02) / this.baseNoteWidth,
      1,
      targetHeight / this.baseNoteHeight
    );

    dummyMatrix.scale(dummyVector);
    this.pool.mesh.setMatrixAt(instance, dummyMatrix);
  }
}
