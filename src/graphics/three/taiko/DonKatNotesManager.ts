import {
  Vector3,
  CircleBufferGeometry,
  Vector4,
  Object3D,
  ShaderMaterial,
} from "three";
import { createClampedVisibiltyMaterial } from "../../../objects/note";
import InstancedMeshObjectPool from "../InstancedObjectPool";
import InstancedSimpleNoteManager from "../InstancedSimpleNoteManager";
import TaikoParams from "./TaikoParams";

const COLOR_RED = new Vector4(1, 0, 0, 1);
const COLOR_BLUE = new Vector4(0, 0, 1, 1);

const BASE_POSITION = new Vector3(0, 0.0001, 0);

const SMALLCIRCLE = new CircleBufferGeometry(0.15, 8);
const LARGECIRCLE = new CircleBufferGeometry(0.3, 16);

const DONMATERIAL = createClampedVisibiltyMaterial({
  color: COLOR_RED,
});
const KATMATERIAL = createClampedVisibiltyMaterial({
  color: COLOR_BLUE,
});

export default class DonKatNotesManager extends InstancedSimpleNoteManager<TaikoParams> {
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
        isLarge ? LARGECIRCLE : SMALLCIRCLE,
        isDon ? DONMATERIAL : KATMATERIAL,
        numInstances,
        BASE_POSITION
      ),
      spawnPoint,
      moveSpeed,
      moveDirection
    );
  }

  public init(parent: Object3D, params: TaikoParams) {
    super.init(parent, params);
    const offset = params.drumHeight / 100;
    (<ShaderMaterial>this.pool.mesh.material).uniforms.maxY.value =
      2.29 + offset;
    (<ShaderMaterial>this.pool.mesh.material).uniforms.minY.value =
      0.9 + offset;
    //TODO get rid of hardcoded value
  }
}
