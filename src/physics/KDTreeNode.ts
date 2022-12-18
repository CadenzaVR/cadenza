import Collider from "./Collider";

export default class KDTreeNode {
  axis: "x" | "y" | "z" | null;
  axisValue: number;
  left: KDTreeNode;
  right: KDTreeNode;
  colliders: Collider[];
  constructor() {
    this.axis = null;
    this.axisValue = null;
    this.left = null;
    this.right = null;
    this.colliders = null;
  }
}