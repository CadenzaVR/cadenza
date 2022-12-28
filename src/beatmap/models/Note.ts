export default interface Note {
  type: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  sound?: number;

  isActive?: boolean;
  activationTime?: number;
  timeDelta?: number;
  absTimeDelta?: number;
}
