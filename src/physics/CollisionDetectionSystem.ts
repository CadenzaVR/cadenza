import Collider from "./Collider";
import KDTreeNode from "./KDTreeNode";
import { intersects } from "./ShapeCollisions";

/**
 * Assumptions:
 * - few dynamic colliders (typically 2, max 10) that only interact with static colliders in the environment (not with each other)
 * - dynamic colliders consist only of spheres for now
 * - static colliders will be in clusters of related objects which may be enabled/disabled together (mostly either keys of an input device or UI elements belonging to a menu)
 * - input devices will typically have relatively few colliders and majority of collisions will often come from a single direction
 * - during gameplay, dynamic colliders typically hover close to input devices
 */
let tempVar;
export default class CollisionDetectionSystem {
  numColliders = 0;

  currentCollisionMap: Map<number, Collider>;
  previousCollisionMap: Map<number, Collider>;

  dynamicColliders: Collider[];
  activeStaticColliderTrees: Set<KDTreeNode>;
  staticColliderGroups: Map<string, Collider[]>;
  staticColliderGroupTrees: Map<string, KDTreeNode>;

  constructor() {
    this.dynamicColliders = [];
    this.activeStaticColliderTrees = new Set();
    this.staticColliderGroups = new Map();
    this.staticColliderGroupTrees = new Map();
    this.currentCollisionMap = new Map();
    this.previousCollisionMap = new Map();
  }

  buildKDTrees(enableAllGroups = true) {
    for (const entry of this.staticColliderGroups) {
      this.buildKDTree(entry[0]);
      if (enableAllGroups) {
        this.enableColliderGroup(entry[0]);
      }
    }
  }

  buildKDTree(groupId: string) {
    this.staticColliderGroupTrees.set(
      groupId,
      this._buildKDTree(this.staticColliderGroups.get(groupId))
    );
  }

  /**
   * Builds a K-D tree, attempting to select planes that most evenly divides the given Colliders.
   * TODO: use surface area heuristic, optimize
   * @param colliders
   *
   * @returns
   */
  _buildKDTree(colliders: Collider[]): KDTreeNode {
    const node = new KDTreeNode();

    if (colliders.length <= 1) {
      node.colliders = colliders;
      return node;
    }

    const splittingPlanesX = new Set<number>();
    const splittingPlanesY = new Set<number>();
    const splittingPlanesZ = new Set<number>();

    for (const collider of colliders) {
      splittingPlanesX.add(collider.boundingBox.min.x);
      splittingPlanesY.add(collider.boundingBox.min.y);
      splittingPlanesZ.add(collider.boundingBox.min.z);
      splittingPlanesX.add(collider.boundingBox.max.x);
      splittingPlanesY.add(collider.boundingBox.max.y);
      splittingPlanesZ.add(collider.boundingBox.max.z);
    }

    const sortedSplittingPlanesX: ["x" | "y" | "z", Array<number>] = [
      "x",
      [...splittingPlanesX].sort((a, b) => a - b),
    ];
    const sortedSplittingPlanesY: ["x" | "y" | "z", Array<number>] = [
      "y",
      [...splittingPlanesY].sort((a, b) => a - b),
    ];
    const sortedSplittingPlanesZ: ["x" | "y" | "z", Array<number>] = [
      "z",
      [...splittingPlanesY].sort((a, b) => a - b),
    ];

    //prioritize axis with most number values
    const splittingPlanesSorted = [
      sortedSplittingPlanesX,
      sortedSplittingPlanesY,
      sortedSplittingPlanesZ,
    ].sort((a, b) => b[1].length - a[1].length);

    let currentBestAxis: "x" | "y" | "z";
    let currrentBestAxisValue: number;
    let currentBestLeft: Collider[];
    let currentBestRight: Collider[];
    const lowestPossibleScore = Math.round(colliders.length / 2);
    let currentLowestScore = Number.POSITIVE_INFINITY;

    let left: Collider[];
    let right: Collider[];
    let score: number;
    let numIntersections: number;
    let index: number;
    let increment: number;
    let sign: number;
    let i: number;

    for (const entry of splittingPlanesSorted) {
      const axis = entry[0];
      const values = entry[1];

      index = Math.floor(values.length / 2);
      increment = 1;
      sign = -1;

      while (index >= 0 && index < values.length) {
        const value = values[index];

        // split the colliders based on the given axis and value
        // colliders that intersect with the plane will go into both sides
        left = [];
        right = [];
        numIntersections = 0;

        for (i = 0; i < colliders.length; i++) {
          if (colliders[i].boundingBox.min[axis] >= value) {
            right.push(colliders[i]);
          } else if (colliders[i].boundingBox.max[axis] <= value) {
            left.push(colliders[i]);
          } else {
            numIntersections++;
            left.push(colliders[i]);
            right.push(colliders[i]);
          }
        }

        score = Math.max(left.length, right.length) + numIntersections;

        // compare with the best result so far
        if (score < currentLowestScore) {
          currentLowestScore = score;
          currentBestLeft = left;
          currentBestRight = right;
          currentBestAxis = axis;
          currrentBestAxisValue = value;

          if (numIntersections === 0 && score === lowestPossibleScore) {
            //can't do any better than this
            node.axis = axis;
            node.axisValue = value;
            node.left = this._buildKDTree(left);
            node.right = this._buildKDTree(right);
            return node;
          }
        }

        // update index
        index += increment * sign;
        increment++;
        sign *= -1;
      }
    }

    if (
      currentBestLeft.length >= colliders.length ||
      currentBestRight.length >= colliders.length
    ) {
      node.colliders = colliders;
    } else {
      node.axis = currentBestAxis;
      node.axisValue = currrentBestAxisValue;
      node.left = this._buildKDTree(currentBestLeft);
      node.right = this._buildKDTree(currentBestRight);
    }

    return node;
  }

  // Only run on dynamic colliders for now
  findCollisions(collider: Collider, tree: KDTreeNode) {
    if (tree.colliders !== null) {
      // leaf node
      for (const other of tree.colliders) {
        collisionCheck: for (const shape of collider.collisionShapes) {
          for (const otherShape of other.collisionShapes) {
            if (intersects(shape, otherShape)) {
              let collisionId;
              if (collider.id < other.id) {
                // get unique id for collision
                collisionId = other.id * other.id - collider.id;
              } else {
                collisionId = collider.id * collider.id - other.id;
              }
              this.currentCollisionMap.set(collisionId, collider);

              if (this.previousCollisionMap.has(collisionId)) {
                this.previousCollisionMap.delete(collisionId);
              } else {
                // collision started
                collider.collisionStart(collisionId, other);
                other.collisionStart(collisionId, collider);
              }
              break collisionCheck;
            }
          }
        }
      }
      return;
    }
    if (collider.boundingBox.min[tree.axis] >= tree.axisValue) {
      //
      this.findCollisions(collider, tree.right);
    } else if (collider.boundingBox.max[tree.axis] <= tree.axisValue) {
      //
      this.findCollisions(collider, tree.left);
    } else {
      //
      this.findCollisions(collider, tree.right);
      this.findCollisions(collider, tree.left);
    }
  }

  update() {
    this.previousCollisionMap.clear();
    tempVar = this.currentCollisionMap;
    this.currentCollisionMap = this.previousCollisionMap;
    this.previousCollisionMap = tempVar;
    for (const dynamicCollider of this.dynamicColliders) {
      for (const tree of this.activeStaticColliderTrees) {
        this.findCollisions(dynamicCollider, tree);
      }
    }
    for (const entry of this.previousCollisionMap) {
      // old collisions remaining have ended
      entry[1].collisions.get(entry[0]).collisionEnd(entry[0]);
      entry[1].collisionEnd(entry[0]);
    }
  }

  addCollider(collider: Collider) {
    collider.id = this.numColliders++;
    if (collider.isStatic) {
      if (!this.staticColliderGroups.has(collider.groupId)) {
        this.staticColliderGroups.set(collider.groupId, []);
      }
      this.staticColliderGroups.get(collider.groupId).push(collider);
    } else {
      this.dynamicColliders.push(collider);
    }
  }

  removeCollider(collider: Collider) {
    if (collider.isStatic) {
      const groupColliders = this.staticColliderGroups.get(collider.groupId);
      groupColliders.splice(groupColliders.indexOf(collider), 1);
      this.buildKDTree(collider.groupId);
    } else {
      this.dynamicColliders.splice(this.dynamicColliders.indexOf(collider), 1);
    }
  }

  disableColliderGroup(groupId: string) {
    if (this.staticColliderGroups.has(groupId)) {
      this.activeStaticColliderTrees.delete(
        this.staticColliderGroupTrees.get(groupId)
      );
    }
  }

  enableColliderGroup(groupId: string) {
    if (this.staticColliderGroups.has(groupId)) {
      this.activeStaticColliderTrees.add(
        this.staticColliderGroupTrees.get(groupId)
      );
    }
  }
}
