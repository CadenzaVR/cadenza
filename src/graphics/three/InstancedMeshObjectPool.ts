import {
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  Material,
  Matrix4,
  Vector3,
} from "three";

const dummyMatrix = new Matrix4();
const dummyVector = new Vector3();
export default class InstancedMeshObjectPool {
  public mesh: InstancedMesh;
  private pool: number[];
  private defaultPosition: Vector3;

  constructor(
    geometry: BufferGeometry,
    material: Material,
    count: number,
    defaultPosition: Vector3
  ) {
    this.mesh = new InstancedMesh(geometry, material, count);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.defaultPosition = defaultPosition;
    this.pool = [];
    for (let i = 0; i < count; i++) {
      this.releaseInstance(i);
    }
  }

  getInstance(): number {
    return this.pool.pop();
  }

  releaseInstance(instance: number) {
    dummyMatrix.identity();
    dummyMatrix.setPosition(this.defaultPosition);
    this.mesh.setMatrixAt(instance, dummyMatrix);
    this.pool.push(instance);
  }

  setInstanceColor(instance: number, color: Color) {
    this.mesh.setColorAt(instance, color);
  }

  setInstancePositionFromVector3(instance: number, vector: Vector3) {
    this.mesh.getMatrixAt(instance, dummyMatrix);
    dummyMatrix.setPosition(vector);
    this.mesh.setMatrixAt(instance, dummyMatrix);
  }

  setInstanceScaleX(instance: number, x: number) {
    this.mesh.getMatrixAt(instance, dummyMatrix);
    dummyVector.setFromMatrixScale(dummyMatrix);
    dummyVector.set(x / dummyVector.x, 1, 1);
    this.mesh.setMatrixAt(instance, dummyMatrix);
  }

  setInstanceScaleY(instance: number, y: number) {
    this.mesh.getMatrixAt(instance, dummyMatrix);
    dummyVector.setFromMatrixScale(dummyMatrix);
    dummyVector.set(1, y / dummyVector.y, 1);
    this.mesh.setMatrixAt(instance, dummyMatrix);
  }

  setInstanceScaleZ(instance: number, z: number) {
    this.mesh.getMatrixAt(instance, dummyMatrix);
    dummyVector.setFromMatrixScale(dummyMatrix);
    dummyVector.set(1, 1, z / dummyVector.z);
    this.mesh.setMatrixAt(instance, dummyMatrix);
  }

  setInstanceScaleXZ(instance: number, x: number, z: number) {
    this.mesh.getMatrixAt(instance, dummyMatrix);
    dummyVector.setFromMatrixScale(dummyMatrix);
    dummyVector.set(x / dummyVector.x, 1, z / dummyVector.z);
    this.mesh.setMatrixAt(instance, dummyMatrix);
  }

  setInstanceScale(instance: number, x: number, y: number, z: number) {
    this.mesh.getMatrixAt(instance, dummyMatrix);
    dummyVector.setFromMatrixScale(dummyMatrix);
    dummyVector.set(x / dummyVector.x, y / dummyVector.y, z / dummyVector.z);
    this.mesh.setMatrixAt(instance, dummyMatrix);
  }

  setInstancePosition(instance: number, x: number, y: number, z: number) {
    this.mesh.getMatrixAt(instance, dummyMatrix);
    dummyMatrix.setPosition(x, y, z);
    this.mesh.setMatrixAt(instance, dummyMatrix);
  }

  incrementInstancePositionZ(instance: number, z: number) {
    this.mesh.getMatrixAt(instance, dummyMatrix);
    dummyVector.setFromMatrixPosition(dummyMatrix);
    dummyVector.z += z;
    dummyMatrix.setPosition(dummyVector);
    this.mesh.setMatrixAt(instance, dummyMatrix);
  }

  requireUpdate() {
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
