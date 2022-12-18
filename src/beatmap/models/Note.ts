export default interface Note {
  type: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  sound?: number;

  isActive?: boolean;
  timeDelta?: number;
  absTimeDelta?: number;
}
