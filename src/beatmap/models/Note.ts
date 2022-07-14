export default interface Note {
  type: number;
  startTime: number;

  isActive?: boolean;
  isMiss?: boolean;
  isHit?: boolean;
  timeDelta?: number;
  absTimeDelta?: number;
  sound?: number;
}
