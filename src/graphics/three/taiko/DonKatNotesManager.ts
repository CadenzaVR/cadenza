import {
  Vector3,
  CircleBufferGeometry,
  Vector4,
  RingBufferGeometry,
  BufferGeometryUtils,
} from "three";
import { createClampedVisibiltyMaterial } from "../../../objects/note";
import InstancedMeshObjectPool from "../InstancedMeshObjectPool";
import InstancedSimpleNoteManager from "../InstancedSimpleNoteManager";

const COLOR_RED = new Vector4(1, 0, 0, 1);
const COLOR_BLUE = new Vector4(0, 0.6, 0.8, 1);

const BASE_POSITION = new Vector3(0, 0.0001, 100);

const SMALLDON = new CircleBufferGeometry(0.08, 24);
SMALLDON.rotateX(-Math.PI / 2);
const LARGEDON = new CircleBufferGeometry(0.15, 24);
LARGEDON.rotateX(-Math.PI / 2);

const dot = new CircleBufferGeometry(0.02, 16);
const SMALLKAT = BufferGeometryUtils.mergeBufferGeometries([
  new RingBufferGeometry(0.15, 0.21, 24, 1, 0, Math.PI),
  dot,
]);
SMALLKAT.rotateX(-Math.PI / 2);
const LARGEKAT = BufferGeometryUtils.mergeBufferGeometries([
  new RingBufferGeometry(0.15, 0.3, 48, 1, 0, Math.PI),
  dot,
]);
LARGEKAT.rotateX(-Math.PI / 2);

const DONMATERIAL = createClampedVisibiltyMaterial({
  color: COLOR_RED,
  isInstanced: true,
  maxZ: -0.5,
});

const KATMATERIAL = createClampedVisibiltyMaterial({
  color: COLOR_BLUE,
  isInstanced: true,
  maxZ: -0.5,
});

export default class DonKatNotesManager extends InstancedSimpleNoteManager {
  constructor(
    isDon: boolean,
    isLarge: boolean,
    numInstances: number,
    spawnPoint: Vector3,
    moveSpeed: number,
    moveDirection: Vector3
  ) {
    super(
      new InstancedMeshObjectPool(
        isLarge ? (isDon ? LARGEDON : LARGEKAT) : isDon ? SMALLDON : SMALLKAT,
        isDon ? DONMATERIAL : KATMATERIAL,
        numInstances,
        BASE_POSITION
      ),
      spawnPoint,
      moveSpeed,
      moveDirection
    );
  }

  updateHeight(height: number) {
    return;
  }
}
