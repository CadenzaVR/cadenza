import { Box3, Sphere } from "three";
import AARect from "./shapes/AARect";
import Circle from "./shapes/Circle";

/**
 * AABB3 = 0,
 * SPHERE = 1,
 * AARECT = 2,
 * CIRCLE = 3,
 */
export const COLLISION_MATRIX: Array<(s1: any, s2: any) => boolean>[] = [
  [null, AABB3Sphere, null, null],
  [sphereAABB3, sphereSphere, sphereAARect, sphereCircle],
  [null, AARectSphere, null, null],
  [null, circleSphere, null, null],
];

export function sphereAABB3(sphere: Sphere, box: Box3) {
  return box.intersectsSphere(sphere);
}
export function AABB3Sphere(box: Box3, sphere: Sphere) {
  return box.intersectsSphere(sphere);
}

export function sphereAARect(sphere: Sphere, rect: AARect) {
  return (
    sphere.intersectsPlane(rect.plane) &&
    rect.boundingBox.intersectsSphere(sphere)
  );
}
export function AARectSphere(rect: AARect, sphere: Sphere) {
  return (
    sphere.intersectsPlane(rect.plane) &&
    rect.boundingBox.intersectsSphere(sphere)
  );
}

export function sphereCircle(sphere: Sphere, circle: Circle) {
  return (
    sphere.intersectsPlane(circle.plane) &&
    circle.boundingSphere.intersectsSphere(sphere)
  );
}
export function circleSphere(circle: Circle, sphere: Sphere) {
  return (
    sphere.intersectsPlane(circle.plane) &&
    circle.boundingSphere.intersectsSphere(sphere)
  );
}

export function sphereSphere(sphere1: Sphere, sphere2: Sphere) {
  return sphere1.intersectsSphere(sphere2);
}

export function intersects(
  [type1, shape1]: [number, AARect | Circle | Box3 | Sphere],
  [type2, shape2]: [number, AARect | Circle | Box3 | Sphere]
) {
  return COLLISION_MATRIX[type1][type2](shape1, shape2);
}
