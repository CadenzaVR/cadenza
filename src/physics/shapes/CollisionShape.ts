import {
  Box3,
  Line3,
  Matrix4,
  Plane,
  Quaternion,
  Sphere as ThreeSphere,
  Vector3,
} from "three";

export const SHAPE_TYPE_AABB3 = 0;
export const SHAPE_TYPE_SPHERE = 1;
export const SHAPE_TYPE_AARECT = 2;
export const SHAPE_TYPE_CIRCLE = 3;
export const SHAPE_TYPE_CAPSULE = 4;

export const COLLISION_MATRIX: Array<
  (s1: CollisionShape, s2: CollisionShape) => boolean
>[] = [
  [null, AABB3Sphere, null, null, null],
  [sphereAABB3, sphereSphere, sphereAARect, sphereCircle, sphereCapsule],
  [null, AARectSphere, null, null, null],
  [null, circleSphere, null, null, null],
  [null, capsuleSphere, null, null, null],
];

export default interface CollisionShape {
  type: number;
  boundingBox: Box3;
  position?: Vector3;
  rotation?: Quaternion;
  scale?: Vector3;
  matrixWorld?: Matrix4;
  matrix?: Matrix4;
  updateParentTransform: (matrix: Matrix4) => void;
  updateParentScale?: (scale: Vector3) => void;
}

export interface AABB3 extends CollisionShape {
  type: 0;
}

export interface Sphere extends CollisionShape {
  type: 1;
  boundingSphere: ThreeSphere;
}

export interface AARect extends CollisionShape {
  type: 2;
  plane: Plane;
}

export interface Circle extends CollisionShape {
  type: 3;
  boundingSphere: ThreeSphere;
  plane: Plane;
}

export interface Capsule extends CollisionShape {
  type: 4;
  line: Line3;
  baseLine: Line3;
  radius: number;
  baseRadius: number;
  baseBoundingBox: Box3;
}

// Creation functions
export interface TransformParams {
  position?: Vector3;
  rotation?: Quaternion;
  scale?: Vector3;
  matrix?: Matrix4;
}

export const getMatrix = (params: TransformParams) => {
  if (params.matrix) {
    return params.matrix.clone();
  }
  const matrix = new Matrix4();
  matrix.compose(
    params.position || new Vector3(),
    params.rotation || new Quaternion(),
    params.scale || new Vector3(1, 1, 1)
  );
  return matrix;
};

export const createAABB3 = (
  boundingBox: Box3,
  parentTransform: TransformParams = {},
  localTransform: TransformParams = {}
) => {
  return {
    type: SHAPE_TYPE_AABB3,
    boundingBox,
  };
};

export const createSphere = (
  boundingSphere: ThreeSphere,
  parentTransform: TransformParams = {},
  localTransform: TransformParams = {}
): Sphere => {
  return {
    type: SHAPE_TYPE_SPHERE,
    boundingSphere,
    boundingBox: boundingSphere.getBoundingBox(new Box3()),
    updateParentTransform: function (parentMatrix: Matrix4) {
      this.boundingSphere.center.setFromMatrixPosition(parentMatrix);
      this.boundingSphere.getBoundingBox(this.boundingBox);
    },
  };
};

export const createAARect = (
  boundingBox: Box3,
  plane: Plane,
  parentTransform: TransformParams = {},
  localTransform: TransformParams = {}
) => {
  return {
    type: SHAPE_TYPE_AARECT,
    boundingBox,
    plane,
  };
};

export const createCircle = (
  boundingSphere: ThreeSphere,
  plane: Plane,
  parentTransform: TransformParams = {},
  localTransform: TransformParams = {}
) => {
  return {
    type: SHAPE_TYPE_CIRCLE,
    boundingSphere,
    plane,
    boundingBox: boundingSphere.getBoundingBox(new Box3()),
  };
};

export const createCapsule = (
  height: number,
  radius: number,
  parentTransform: TransformParams = {},
  localTransform: TransformParams = {}
): Capsule => {
  const localMatrix = getMatrix(localTransform);
  const worldMatrix = localMatrix.clone();
  worldMatrix.premultiply(getMatrix(parentTransform));

  const baseBoundingBox = new Box3().setFromCenterAndSize(
    new Vector3(0, 0, 0),
    new Vector3(radius * 2, height + radius * 2, radius * 2)
  );
  const boundingBox = baseBoundingBox.clone();
  boundingBox.applyMatrix4(worldMatrix);

  const baseLine = new Line3(
    new Vector3(0, height / 2, 0),
    new Vector3(0, -height / 2, 0)
  );
  const line = baseLine.clone();
  line.applyMatrix4(worldMatrix);

  return {
    type: SHAPE_TYPE_CAPSULE,
    baseLine,
    line,
    radius,
    baseRadius: radius,
    boundingBox,
    baseBoundingBox,
    matrix: localMatrix,
    matrixWorld: worldMatrix,
    updateParentTransform: function (parentMatrix: Matrix4) {
      this.matrixWorld.copy(this.matrix);
      this.matrixWorld.premultiply(parentMatrix);
      this.line.copy(this.baseLine);
      this.line.applyMatrix4(this.matrixWorld);
      this.boundingBox.copy(this.baseBoundingBox);
      this.boundingBox.applyMatrix4(this.matrixWorld);
    },
    updateParentScale: function (parentScale: Vector3) {
      this.radius =
        (this.baseRadius * (parentScale.x + parentScale.y + parentScale.z)) / 3;
    },
  };
};

// Collision detection functions

export function sphereAABB3(sphere: Sphere, box: AABB3) {
  return box.boundingBox.intersectsSphere(sphere.boundingSphere);
}
export function AABB3Sphere(box: AABB3, sphere: Sphere) {
  return box.boundingBox.intersectsSphere(sphere.boundingSphere);
}

export function sphereAARect(sphere: Sphere, rect: AARect) {
  return (
    sphere.boundingSphere.intersectsPlane(rect.plane) &&
    rect.boundingBox.intersectsSphere(sphere.boundingSphere)
  );
}
export function AARectSphere(rect: AARect, sphere: Sphere) {
  return (
    sphere.boundingSphere.intersectsPlane(rect.plane) &&
    rect.boundingBox.intersectsSphere(sphere.boundingSphere)
  );
}

export function sphereCircle(sphere: Sphere, circle: Circle) {
  return (
    sphere.boundingSphere.intersectsPlane(circle.plane) &&
    circle.boundingSphere.intersectsSphere(sphere.boundingSphere)
  );
}
export function circleSphere(circle: Circle, sphere: Sphere) {
  return (
    sphere.boundingSphere.intersectsPlane(circle.plane) &&
    circle.boundingSphere.intersectsSphere(sphere.boundingSphere)
  );
}

export function sphereSphere(sphere1: Sphere, sphere2: Sphere) {
  return sphere1.boundingSphere.intersectsSphere(sphere2.boundingSphere);
}

const ab = new Vector3();
const ac = new Vector3();
const bc = new Vector3();
let e;
let f;
// Adapted from Real-Time Collision Detection by Christer Ericson
function sqDistanceToPoint(line: Line3, point: Vector3) {
  ab.subVectors(line.end, line.start);
  ac.subVectors(point, line.start);

  e = ac.dot(ab);
  if (e <= 0) {
    return ac.lengthSq();
  }

  f = ab.lengthSq();
  if (e >= f) {
    return bc.subVectors(point, line.end).lengthSq();
  }

  return ac.lengthSq() - (e * e) / f;
}

export function sphereCapsule(sphere: Sphere, capsule: Capsule) {
  e = sqDistanceToPoint(capsule.line, sphere.boundingSphere.center);
  f = sphere.boundingSphere.radius + capsule.radius;
  return e <= f * f;
}

export function capsuleSphere(capsule: Capsule, sphere: Sphere) {
  e = sqDistanceToPoint(capsule.line, sphere.boundingSphere.center);
  f = sphere.boundingSphere.radius + capsule.radius;
  return e <= f * f;
}

export function intersects(shape1: CollisionShape, shape2: CollisionShape) {
  return COLLISION_MATRIX[shape1.type][shape2.type](shape1, shape2);
}
