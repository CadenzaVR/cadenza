export function createXShape(segmentLength) {
  const doubleSegmentLength = segmentLength * 2;
  const xShape = new THREE.Shape();
  xShape.moveTo(-doubleSegmentLength, segmentLength);
  xShape.lineTo(-segmentLength, doubleSegmentLength);
  xShape.lineTo(0, segmentLength);
  xShape.lineTo(segmentLength, doubleSegmentLength);
  xShape.lineTo(doubleSegmentLength, segmentLength);
  xShape.lineTo(segmentLength, 0);
  xShape.lineTo(doubleSegmentLength, -segmentLength);
  xShape.lineTo(segmentLength, -doubleSegmentLength);
  xShape.lineTo(0, -segmentLength);
  xShape.lineTo(-segmentLength, -doubleSegmentLength);
  xShape.lineTo(-doubleSegmentLength, -segmentLength);
  xShape.lineTo(-segmentLength, 0);
  xShape.lineTo(-doubleSegmentLength, segmentLength);
  return xShape;
}
