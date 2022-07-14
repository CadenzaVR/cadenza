// //update position
// if (mallet.moveState != 0) {
//   const basePosition = mallet.baseEl.object3D.position;
//   const newPosition = mallet.moveVelocity
//     .clone()
//     .multiplyScalar(deltaTime)
//     .add(basePosition);

//   if (
//     mallet.targetPos.distanceTo(newPosition) >=
//     mallet.targetPos.distanceTo(basePosition)
//   ) {
//     basePosition.copy(mallet.targetPos);
//     mallet.moveVelocity.normalize().multiplyScalar(-0.0005); // return bounce slowly
//     mallet.targetPos.set(0, 0, 0);
//     mallet.moveState = (mallet.moveState + 1) % 3;
//   } else {
//     basePosition.set(newPosition.x, newPosition.y, newPosition.z);
//   }
// }

// const prevPosition = mallet.boundingSphere.center.clone();
// mallet.object3D.getWorldPosition(mallet.boundingSphere.center);

// if (
//   !mallet.isHandJoint &&
//   (mallet.moveState === 0 || mallet.moveState === 2)
// ) {
//   // only bounce if key was hit from above and on the bottom half
//   if (
//     prevPosition.y > mallet.boundingSphere.center.y &&
//     prevPosition.y - key.boundingBox.max.y > -0.03
//   ) {
//     if (key.z < mallet.boundingSphere.center.z) {
//       // start mallet bounce
//       mallet.targetPos.subVectors(
//         prevPosition,
//         mallet.boundingSphere.center
//       );
//       const movedAmount = mallet.targetPos.length();
//       mallet.targetPos.set(0, 1, 0);
//       mallet.targetPos.applyQuaternion(
//         mallet.handEl.object3D.quaternion.clone().inverse()
//       );
//       mallet.moveVelocity = mallet.targetPos
//         .clone()
//         .multiplyScalar(0.005); // 5m/s
//       mallet.targetPos.multiplyScalar(0.11 + movedAmount); //bounce up at least 11cm
//       mallet.moveState = 1;
//     }
//   }
// }
