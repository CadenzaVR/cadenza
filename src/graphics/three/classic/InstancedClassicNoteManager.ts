import {
  Object3D,
  Event,
  ShaderMaterial,
  Vector3,
  Vector4,
  Matrix4,
  MathUtils,
} from "three";
import ClassicNote from "../../../beatmap/models/ClassicNote";
import Note from "../../../beatmap/models/Note";
import { createClampedVisibiltyMaterial } from "../../../objects/note";
import { flatRectGeometry } from "../../../utils/geometryUtils";
import InstancedMeshObjectPool from "../InstancedObjectPool";
import InstancedSimpleNoteManager from "../InstancedSimpleNoteManager";
import ClassicParams from "./ClassicParams";

const enum NoteTypes {
  HIT_NOTE = 0,
  SLIDE_NOTE = 1,
  HOLD_NOTE = 2,
  ROLL_NOTE = 3,
}

const COLOR_CYAN = new Vector4(0, 1, 1, 1);
const COLOR_YELLOW = new Vector4(1, 1, 0, 1);
const BASE_POSITION = new Vector3(0, 0.0001, 0);

const BASE_NOTE_WIDTH = 0.12;
const BASE_NOTE_HEIGHT = 0.05;
const RAIL_LENGTH = 8;
const RAIL_WIDTH = 0.15;
const RAIL_ANGLE = MathUtils.degToRad(10);

const dummyMatrix = new Matrix4();
const dummyVector = new Vector3();
export default class InstancedClassicNoteManager extends InstancedSimpleNoteManager<ClassicParams> {
  baseNoteWidth: number;
  baseNoteHeight: number;
  railWidth: number;
  spawnPoints: Vector3[];
  angleAdjustedSpawnPoints: Vector3[];

  constructor(
    type: number,
    numInstances: number,
    moveSpeed: number,
    moveDirection: Vector3
  ) {
    super(
      new InstancedMeshObjectPool(
        flatRectGeometry(BASE_NOTE_WIDTH, BASE_NOTE_HEIGHT),
        createClampedVisibiltyMaterial(),
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
    this.railWidth = RAIL_WIDTH;

    this.spawnPoints = [];
    this.angleAdjustedSpawnPoints = [];
    for (let i = 0; i < 8; i++) {
      this.spawnPoints.push(
        new Vector3(
          -3.5 * RAIL_WIDTH + RAIL_WIDTH * i,
          1.595 + (RAIL_LENGTH / 2) * Math.sin(RAIL_ANGLE),
          -4.29 - (RAIL_LENGTH / 2) * Math.cos(RAIL_ANGLE)
        )
      );

      this.angleAdjustedSpawnPoints.push(
        this.spawnPoints[i]
          .clone()
          .applyAxisAngle(new Vector3(-1, 0, 0), RAIL_ANGLE)
      );
    }
  }
  init(parent: Object3D<Event>, params: ClassicParams): void {
    super.init(parent, params);
    this.updateKeyboardHeight(params.keyboardHeight);
  }

  updateKeyboardHeight(keyboardHeight: number) {
    const offset = keyboardHeight / 100;
    (<ShaderMaterial>this.pool.mesh.material).uniforms.maxY.value =
      2.29 + offset;
    (<ShaderMaterial>this.pool.mesh.material).uniforms.minY.value =
      0.9 + offset;

    for (let i = 0; i < this.spawnPoints.length; i++) {
      this.spawnPoints[i].y =
        1.595 + offset + (RAIL_LENGTH / 2) * Math.sin(RAIL_ANGLE);
      this.angleAdjustedSpawnPoints[i]
        .copy(this.spawnPoints[i])
        .applyAxisAngle(new Vector3(-1, 0, 0), RAIL_ANGLE);
    }
  }

  spawnInstance(note: Note, instance: number, spawnOffsetTime: number): void {
    const targetHeight = this.baseNoteHeight + this.moveSpeed * note.duration;
    dummyMatrix.identity();
    dummyVector.copy(this.angleAdjustedSpawnPoints[(note as ClassicNote).key]);
    dummyVector.z +=
      spawnOffsetTime * this.moveSpeed +
      (this.baseNoteHeight - targetHeight) / 2;
    dummyVector.x += (((note as ClassicNote).width - 1) * RAIL_WIDTH) / 2;

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
