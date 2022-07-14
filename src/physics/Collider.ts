import { Box3, Sphere } from "three";
import AARect from "./shapes/AARect";
import Circle from "./shapes/Circle";

const EMPTY_FUNCTION = function () {
  return;
};

export default class Collider {
  id: number;
  collisionShapes: [number, AARect | Circle | Box3 | Sphere][];
  groupId: string;
  isStatic: boolean;
  boundingBox: Box3;
  collisions: Map<number, Collider>;
  onCollisionEnter: (other: Collider) => void;
  onCollisionExit: (other: Collider) => void;

  constructor(groupId: string, isStatic: boolean) {
    this.collisionShapes = [];
    this.groupId = groupId;
    this.isStatic = isStatic;
    this.boundingBox = new Box3();
    this.collisions = new Map();
    this.onCollisionEnter = EMPTY_FUNCTION;
    this.onCollisionExit = EMPTY_FUNCTION;
  }

  collisionStart(id: number, other: Collider) {
    this.collisions.set(id, other);
    this.onCollisionEnter(other);
  }

  collisionEnd(id: number) {
    this.onCollisionExit(this.collisions.get(id));
    this.collisions.delete(id);
  }

  addCollisionShape(shape: [number, AARect | Circle | Box3 | Sphere]) {
    this.collisionShapes.push(shape);
  }

  getBoundingBox() {
    return this.boundingBox;
  }
}
