import {
  Object3D,
  Event,
  Mesh,
  ShaderMaterial,
  Vector3,
  BufferAttribute,
  BufferGeometry,
  Group,
  Vector4,
} from "three";
import ClassicNote from "../../../beatmap/models/ClassicNote";
import Note from "../../../beatmap/models/Note";
import { createClampedVisibiltyMaterial } from "../../../objects/note";
import SimpleNoteManager from "../SimpleNoteManager";

const COLOR_CYAN = new Vector4(0, 1, 1, 1);
const createNote = (width: number, height: number) => {
  const geometry = new BufferGeometry();
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  const vertices = new Float32Array([
    -halfWidth,
    0,
    halfHeight,
    halfWidth,
    0,
    -halfHeight,
    -halfWidth,
    0,
    -halfHeight,

    -halfWidth,
    0,
    halfHeight,
    halfWidth,
    0,
    halfHeight,
    halfWidth,
    0,
    -halfHeight,
  ]);
  geometry.setAttribute("position", new BufferAttribute(vertices, 3));
  const mesh = new Mesh(geometry, createClampedVisibiltyMaterial());
  mesh.position.y = 0.0001;
  const object3D = new Group();
  object3D.add(mesh);

  return object3D;
};

export default class ClassicNoteManager extends SimpleNoteManager {
  baseNoteWidth: number;
  baseNoteHeight: number;
  railWidth: number;

  constructor(
    isHoldNote: boolean,
    numInstances: number,
    spawnPoint: Vector3,
    moveSpeed: number,
    moveDirection: Vector3
  ) {
    super([], spawnPoint, moveSpeed, moveDirection);
    for (let i = 0; i < numInstances; i++) {
      const newNote = createNote(this.baseNoteWidth, this.baseNoteHeight);
      if (!isHoldNote) {
        (<ShaderMaterial>(
          (<Mesh>newNote.children[0]).material
        )).uniforms.color.value = COLOR_CYAN;
        this.pool.push(newNote);
      }
    }
    this.baseNoteHeight = 0.05;
    this.baseNoteWidth = 0.12;
    this.railWidth = 0.15;
  }

  spawnInstance(
    note: Note,
    instance: Object3D<Event>,
    spawnOffsetTime: number
  ): void {
    super.spawnInstance(note, instance, spawnOffsetTime);
    // adjust horizontal position based on key and note width
    instance.position.x += (note as ClassicNote).key * this.railWidth;
    instance.position.x +=
      (this.railWidth / 2) * ((<ClassicNote>note).width - 1);

    // adjust width and length
    const noteObject = instance.children[0];
    const targetHeight = this.baseNoteHeight + this.moveSpeed * note.duration;
    noteObject.scale.x =
      (this.railWidth * (<ClassicNote>note).width - 0.02) / this.baseNoteWidth;
    noteObject.scale.z = targetHeight / this.baseNoteHeight;
    noteObject.position.z = this.baseNoteHeight / 2 - targetHeight / 2;
  }
}
