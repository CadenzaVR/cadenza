import { Vector3 } from "three";

export const COLOR_BAD_MISS = new Vector3(1, 0, 0);
export const COLOR_GOOD = new Vector3(1, 0.8, 0);
export const COLOR_EXCELLENT = new Vector3(0, 1, 0);

const enum Judgement {
  MISS = 0b00000000,
  PASS = 0b00000010,
  BAD = 0b00000001,
  GOOD = 0b00000011,
  EXCELLENT = 0b00000111,
}

export function getColor(judgement: number): Vector3 {
  if (judgement !== Judgement.PASS) {
    switch (judgement) {
      case Judgement.MISS:
      case Judgement.BAD:
        return COLOR_BAD_MISS;
      case Judgement.GOOD:
        return COLOR_GOOD;
      case Judgement.EXCELLENT:
        return COLOR_EXCELLENT;
      default:
        return null;
    }
  }
  return null;
}
