import {
  Vector3,
  CircleBufferGeometry,
  Vector4,
  RingBufferGeometry,
  BufferGeometryUtils,
  PlaneBufferGeometry,
} from "three";
import { createClampedVisibiltyMaterial } from "../../../objects/note";
import InstancedMeshObjectPool from "../InstancedMeshObjectPool";
import InstancedSimpleNoteManager from "../InstancedSimpleNoteManager";

const COLOR_RED = new Vector4(1, 0, 0, 1);
const COLOR_BLUE = new Vector4(0, 0.6, 0.8, 1);

const BASE_POSITION = new Vector3(0, 0.0001, 100);

const dot = new CircleBufferGeometry(0.01, 24);
const line = new PlaneBufferGeometry(0.3, 0.02, 1, 1);

const smallDonRadius = 0.08;
const SMALLDON = BufferGeometryUtils.mergeBufferGeometries([
  new CircleBufferGeometry(smallDonRadius, 24),
]);
SMALLDON.rotateX(-Math.PI / 2);

const largeDonRadius = 0.13;
const LARGEDON = BufferGeometryUtils.mergeBufferGeometries([
  new CircleBufferGeometry(largeDonRadius, 24),
]);
LARGEDON.rotateX(-Math.PI / 2);

const katAngle = Math.PI / 8;
const startAngle = 0 - katAngle / 2;
const endAngle = startAngle + Math.PI;
const SMALLKAT = BufferGeometryUtils.mergeBufferGeometries([
  new RingBufferGeometry(0.15, 0.21, 8, 1, startAngle, katAngle),
  new RingBufferGeometry(0.15, 0.21, 8, 1, endAngle, katAngle),
  line,
]);
SMALLKAT.rotateX(-Math.PI / 2);
const LARGEKAT = BufferGeometryUtils.mergeBufferGeometries([
  new RingBufferGeometry(0.15, 0.3, 16, 1, startAngle, katAngle),
  new RingBufferGeometry(0.15, 0.3, 16, 1, endAngle, katAngle),
  line,
]);
LARGEKAT.rotateX(-Math.PI / 2);

const DONMATERIAL = createClampedVisibiltyMaterial({
  color: COLOR_RED,
  isInstanced: true,
  maxZ: -0.37,
});

const KATMATERIAL = createClampedVisibiltyMaterial({
  color: COLOR_BLUE,
  isInstanced: true,
  maxZ: -0.37,
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
