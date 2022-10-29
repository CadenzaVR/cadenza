import {
  Group,
  Mesh,
  CircleBufferGeometry,
  PlaneBufferGeometry,
  Vector4,
  Vector3,
  Object3D,
  Event,
} from "three";
import Note from "../../../beatmap/models/Note";
import { createClampedVisibiltyMaterial } from "../../../objects/note";
import SimpleNoteManager from "../SimpleNoteManager";
import TaikoParams from "./TaikoParams";

const COLOR_YELLOW = new Vector4(1, 1, 0, 1);
const DRUMROLLMATERIAL = createClampedVisibiltyMaterial({
  color: COLOR_YELLOW,
});

function createDrumroll(radius: number, numSegments: number, length: number) {
  const head = new Mesh(
    new CircleBufferGeometry(radius, numSegments),
    DRUMROLLMATERIAL
  );
  const tail = new Mesh(
    new CircleBufferGeometry(radius, numSegments),
    DRUMROLLMATERIAL
  );
  const body = new Mesh(
    new PlaneBufferGeometry(radius * 2, 1),
    DRUMROLLMATERIAL
  );
  body.scale.set(1, length, 1);

  const object = new Group();
  object.add(head);
  object.add(body);
  object.add(tail);

  // Position head, tail, and body to lie flat
  head.position.set(0, 0, -length / 2);
  tail.position.set(0, 0, length / 2);

  head.rotateX(Math.PI / 2);
  tail.rotateX(Math.PI / 2);
  body.rotateX(Math.PI / 2);

  return object;
}

function setDrumrollLength(
  length: number,
  drumrollComponents: [Object3D, Object3D, Object3D]
) {
  drumrollComponents[0].position.set(0, 0, -length / 2);
  drumrollComponents[1].scale.set(1, length, 1);
  drumrollComponents[2].position.set(0, 0, length / 2);
}
export default class DrumrollNoteManager extends SimpleNoteManager<TaikoParams> {
  constructor(
    isLarge: boolean,
    numInstances: number,
    spawnPoint: Vector3,
    moveSpeed: number,
    moveDirection: Vector3
  ) {
    super([], spawnPoint, moveSpeed, moveDirection);
    for (let i = 0; i < numInstances; i++) {
      if (isLarge) {
        this.pool.push(createDrumroll(0.3, 16, 1));
      } else {
        this.pool.push(createDrumroll(0.15, 8, 1));
      }
    }
  }

  public init(parent: Object3D, params: TaikoParams) {
    super.init(parent, params);
    const offset = params.drumHeight / 100;
    DRUMROLLMATERIAL.uniforms.maxY.value = 2.29 + offset;
    DRUMROLLMATERIAL.uniforms.minY.value = 0.9 + offset;
    //TODO get rid of hardcoded value
  }

  spawnInstance(
    note: Note,
    instance: Object3D<Event>,
    spawnOffsetTime: number
  ): void {
    setDrumrollLength(
      note.duration * this.moveSpeed,
      <[Object3D, Object3D, Object3D]>instance.children
    );
    super.spawnInstance(note, instance, spawnOffsetTime);
  }
}
