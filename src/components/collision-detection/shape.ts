import { Box3, Plane, Sphere, Vector3 } from "three";

const enum SHAPE_TYPES {
  AABB3 = 0,
  SPHERE = 1,
  AARECT = 2,
  CIRCLE = 3,
}

AFRAME.registerComponent("shape", {
  dependencies: ["collider"],
  schema: {
    type: {
      type: "string",
      default: "box",
      oneOf: ["box", "circle", "rect", "sphere"],
    },
    auto: { type: "boolean", default: true },

    offset: { type: "vec3" },

    width: { type: "number" },
    height: { type: "number" },
    depth: { type: "number" },

    radius: { type: "number" },
  },

  multiple: true,

  init: function () {
    this.mesh = this.el.getObject3D("mesh");
    this.collider = this.el.components.collider;
    switch (this.data.type) {
      case "box":
        this.type = SHAPE_TYPES.AABB3;
        this.shape = this.__initBox();
        this.updatePosition = this.__updatePositionAABB3;
        break;
      case "circle":
        this.type = SHAPE_TYPES.CIRCLE;
        this.shape = this.__initCircle();
        this.updatePosition = this.__updatePositionCircle;
        break;
      case "rect":
        this.type = SHAPE_TYPES.AARECT;
        this.shape = this.__initRect();
        this.updatePosition = this.__updatePositionAARect;
        break;
      case "sphere":
        this.type = SHAPE_TYPES.SPHERE;
        this.shape = this.__initSphere();
        this.updatePosition = this.__updatePositionSphere;
        break;
    }
    this.collider.addCollisionShape([this.type, this.shape]);
    setTimeout(() => {
      this.updatePosition();
    }, 3000);
  },

  __initBox: function () {
    if (this.data.auto) {
      return new Box3().setFromObject(this.mesh);
    }
    return null;
  },

  __initCircle: function () {
    if (this.data.auto) {
      const planeGeometryPoints: Vector3[] = this.__getPointsFromFlatGeometry();
      return {
        boundingSphere: new Box3().setFromPoints(planeGeometryPoints),
        plane: new Plane().setFromCoplanarPoints(
          planeGeometryPoints[0],
          planeGeometryPoints[1],
          planeGeometryPoints[2]
        ),
      };
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
      return {
        boundingBox: new Box3().setFromObject(this.mesh),
        plane: new Plane().setFromCoplanarPoints(
          planeGeometryPoints[0],
          planeGeometryPoints[1],
          planeGeometryPoints[2]
        ),
      };
    }
    return null;
  },

  __initSphere: function () {
    if (this.data.auto) {
      return new Sphere(
        this.el.object3D.getWorldPosition(new Vector3()),
        this.data.radius
      );
    }
    return null;
  },

  __updatePositionAABB3: function () {
    this.shape.setFromObject(this.mesh);
  },

  __updatePositionCircle: function () {
    const planeGeometryPoints: Vector3[] = this.__getPointsFromFlatGeometry();
    this.shape.boundingSphere.setFromObject(this.mesh);
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
    this.el.object3D.getWorldPosition(this.shape.center);
  },

  updatePosition: function () {
    // update shape from object position
  },

  tick: function () {
    if (!this.collider.collider.isStatic) {
      this.updatePosition();
    }
  },
});
