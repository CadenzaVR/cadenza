import {
  Box3,
  CapsuleGeometry,
  Euler,
  Mesh,
  MeshBasicMaterial,
  Plane,
  Quaternion,
  Sphere,
  Vector3,
} from "three";
import {
  createAABB3,
  createAARect,
  createCapsule,
  createCircle,
  createSphere,
} from "../../physics/shapes/CollisionShape";

const DEG2RAD = Math.PI / 180;
const SHAPEMATERIAL = new MeshBasicMaterial({ wireframe: true });
const temp = new Vector3();
AFRAME.registerComponent("shape", {
  dependencies: ["collider"],
  schema: {
    type: {
      type: "string",
      default: "box",
      oneOf: ["box", "circle", "rect", "sphere", "capsule"],
    },
    auto: { type: "boolean", default: true },

    positionOffset: { type: "vec3" },
    rotationOffset: { type: "vec3" },

    width: { type: "number" },
    height: { type: "number" },
    depth: { type: "number" },

    radius: { type: "number" },
    draw: { type: "boolean", default: false },
  },

  multiple: true,

  init: function () {
    this.mesh = this.el.getObject3D("mesh");
    this.collider = this.el.components.collider;
    this.positionOffset = new Vector3();
    if (this.data.positionOffset) {
      this.positionOffset.x = this.data.positionOffset.x;
      this.positionOffset.y = this.data.positionOffset.y;
      this.positionOffset.z = this.data.positionOffset.z;
    }
    if (this.data.rotationOffset) {
      this.rotationOffset = new Quaternion().setFromEuler(
        new Euler(
          this.data.rotationOffset.x * DEG2RAD,
          this.data.rotationOffset.y * DEG2RAD,
          this.data.rotationOffset.z * DEG2RAD
        )
      );
    }
    switch (this.data.type) {
      case "box":
        this.shape = this.__initBox();
        this.updatePosition = this.__updatePositionAABB3;
        break;
      case "circle":
        this.shape = this.__initCircle();
        this.updatePosition = this.__updatePositionCircle;
        break;
      case "rect":
        this.shape = this.__initRect();
        this.updatePosition = this.__updatePositionAARect;
        break;
      case "sphere":
        this.shape = this.__initSphere();
        this.updatePosition = this.__updatePositionSphere;
        break;
      case "capsule":
        this.shape = this.__initCapsule();
        this.updatePosition = this.__updatePositionCapsule;
        break;
    }
    if (this.data.draw && this.shapeMesh) {
      this.shapeMesh.position.copy(this.positionOffset);
      this.shapeMesh.quaternion.copy(this.rotationOffset);
      this.el.object3D.add(this.shapeMesh);
    }
    this.collider.addCollisionShape(this.shape);
    setTimeout(() => {
      this.updatePosition();
    }, 3000);
  },

  __initBox: function () {
    if (this.data.auto) {
      return createAABB3(new Box3().setFromObject(this.mesh));
    }
    return null;
  },

  __initCircle: function () {
    if (this.data.auto) {
      const planeGeometryPoints: Vector3[] = this.__getPointsFromFlatGeometry();
      return createCircle(
        new Sphere(
          this.el.object3D.getWorldPosition(new Vector3()),
          this.data.radius
        ),
        new Plane().setFromCoplanarPoints(
          planeGeometryPoints[0],
          planeGeometryPoints[1],
          planeGeometryPoints[2]
        )
      );
    }
    return null;
  },

  __getPointsFromFlatGeometry: function () {
    const planeGeometryPoints: Vector3[] = [];
    for (let i = 0; i < 3; i++) {
      planeGeometryPoints.push(
        this.mesh.localToWorld(
          new Vector3().fromBufferAttribute(
            this.mesh.geometry.attributes.position,
            i
          )
        )
      );
    }
    return planeGeometryPoints;
  },

  __initRect: function () {
    if (this.data.auto) {
      const planeGeometryPoints: Vector3[] = this.__getPointsFromFlatGeometry();
      return createAARect(
        new Box3().setFromObject(this.mesh),
        new Plane().setFromCoplanarPoints(
          planeGeometryPoints[0],
          planeGeometryPoints[1],
          planeGeometryPoints[2]
        )
      );
    }
    return null;
  },

  __initSphere: function () {
    if (this.data.auto) {
      return createSphere(
        new Sphere(
          this.el.object3D.getWorldPosition(new Vector3()),
          this.data.radius
        )
      );
    }
    return null;
  },

  __initCapsule: function () {
    if (this.data.draw) {
      this.shapeMesh = new Mesh(
        new CapsuleGeometry(this.data.radius, this.data.height),
        SHAPEMATERIAL
      );
    }
    return createCapsule(
      this.data.height,
      this.data.radius,
      {
        matrix: this.el.object3D.matrixWorld,
      },
      {
        position: this.positionOffset,
        rotation: this.rotationOffset,
      }
    );
  },

  __updatePositionAABB3: function () {
    this.shape.boundingBox.setFromObject(this.mesh);
  },

  __updatePositionCircle: function () {
    const planeGeometryPoints: Vector3[] = this.__getPointsFromFlatGeometry();
    this.el.object3D.getWorldPosition(this.shape.boundingSphere.center);
    this.shape.boundingBox.setFromObject(this.mesh);
    this.shape.plane.setFromCoplanarPoints(
      planeGeometryPoints[0],
      planeGeometryPoints[1],
      planeGeometryPoints[2]
    );
  },

  __updatePositionAARect: function () {
    const planeGeometryPoints: Vector3[] = this.__getPointsFromFlatGeometry();
    this.shape.boundingBox.setFromObject(this.mesh);
    this.shape.plane.setFromCoplanarPoints(
      planeGeometryPoints[0],
      planeGeometryPoints[1],
      planeGeometryPoints[2]
    );
  },

  __updatePositionSphere: function () {
    this.shape.updateParentTransform(this.el.object3D.matrixWorld);
  },

  __updatePositionCapsule: function () {
    this.shape.updateParentTransform(this.el.object3D.matrixWorld);
    this.shape.updateParentScale(
      temp.setFromMatrixScale(this.el.object3D.matrixWorld)
    );
  },

  updatePosition: function () {
    // update shape from object position
  },
});
