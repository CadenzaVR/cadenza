import {
  Vector3,
  CircleBufferGeometry,
  Vector4,
  RingBufferGeometry,
} from "three";
import { createClampedVisibiltyMaterial } from "../../../objects/note";
import InstancedMeshObjectPool from "../InstancedMeshObjectPool";
import InstancedSimpleNoteManager from "../InstancedSimpleNoteManager";

const COLOR_RED = new Vector4(1, 0, 0, 1);
const COLOR_BLUE = new Vector4(0, 0.6, 0.8, 1);

const BASE_POSITION = new Vector3(0, 0.0001, 100);

const SMALLDON = new CircleBufferGeometry(0.13, 24);
SMALLDON.rotateX(-Math.PI / 2);
const LARGEDON = new CircleBufferGeometry(0.26, 48);
LARGEDON.rotateX(-Math.PI / 2);
const SMALLKAT = new RingBufferGeometry(0.1, 0.13, 24);
SMALLKAT.rotateX(-Math.PI / 2);
const LARGEKAT = new RingBufferGeometry(0.16, 0.26, 48);
LARGEKAT.rotateX(-Math.PI / 2);

const DONMATERIAL = createClampedVisibiltyMaterial({
  color: COLOR_RED,
  isInstanced: true,
  maxZ: -0.5,
});

const LARGEDONMATERIAL = createClampedVisibiltyMaterial({
  color: COLOR_RED,
  isInstanced: true,
  maxZ: -0.35,
});

const KATMATERIAL = createClampedVisibiltyMaterial({
  color: COLOR_BLUE,
  isInstanced: true,
  maxZ: -0.5,
});

const LARGEKATMATERIAL = createClampedVisibiltyMaterial({
  color: COLOR_BLUE,
  isInstanced: true,
  maxZ: -0.35,
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
        isLarge
          ? isDon
            ? LARGEDONMATERIAL
            : LARGEKATMATERIAL
          : isDon
          ? DONMATERIAL
          : KATMATERIAL,
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
