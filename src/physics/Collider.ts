import { Box3 } from "three";
import CollisionShape from "./shapes/CollisionShape";

const EMPTY_FUNCTION = function () {
  return;
};

export default class Collider {
  id: number;
  collisionShapes: CollisionShape[];
  groupId: string;
  isStatic: boolean;
  boundingBox: Box3;
  collisions: Map<number, Collider>;
  layer: number;
  layerMask: number;
  layerCollisionMask: number;
  onCollisionEnter: (other: Collider) => void;
  onCollisionExit: (other: Collider) => void;

  constructor(groupId: string, isStatic: boolean, layer = 0) {
    this.collisionShapes = [];
    this.groupId = groupId;
    this.isStatic = isStatic;
    this.boundingBox = new Box3();
    this.collisions = new Map();
    this.layer = layer;
    this.layerMask = 1 << layer;
    this.layerCollisionMask = 0;
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

  addCollisionShape(shape: CollisionShape) {
    this.collisionShapes.push(shape);
  }

  getBoundingBox() {
    return this.boundingBox;
  }
}
