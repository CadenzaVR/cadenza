import Beatmap from "../../beatmap/models/Beatmap";

const DEFAULT_SCORE_THRESHOLDS = [
  ["Excellent", 45],
  ["Good", 120],
  ["Bad", 180],
] as [string, number][];

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function getAccuracy(
  timeDelta: number,
  scaleFactor = 27,
  fiftyPctValue = 120
): number {
  const absTimeDelta = Math.abs(timeDelta);
  const adjust = 100 / (1 - sigmoid(-fiftyPctValue / scaleFactor));
  return adjust * (1 - sigmoid((absTimeDelta - fiftyPctValue) / scaleFactor));
}

export default interface Score {
  beatmap: Beatmap;
  gameMode: number;
  score: number;
  highScore: number;
  combo: number;
  maxCombo: number;
  accuracy: number;
  judgementCounts: Record<string, number>;
  data: Array<number>;
}

export function computeAccuracyStats(
  score: Score,
  judgementThresholds: [string, number][] = DEFAULT_SCORE_THRESHOLDS
): void {
  const judgementCounts: Record<string, number> = {};
  for (const [judgement] of judgementThresholds) {
    judgementCounts[judgement] = 0;
  }
  const sortedThresholds = judgementThresholds.sort((a, b) => a[1] - b[1]);
  let cumulativeAccuracy = 0;
  for (const delta of score.data) {
    cumulativeAccuracy += getAccuracy(delta);
    for (let i = 0; i < sortedThresholds.length; i++) {
      const [judgement, threshold] = sortedThresholds[i];
      if (Math.abs(delta) <= threshold) {
        judgementCounts[judgement] += 1;
        break;
      }
      if (i === sortedThresholds.length - 1) {
        if (judgementCounts["Miss"] === undefined) {
          judgementCounts["Miss"] = 0;
        }
        judgementCounts["Miss"] += 1;
      }
    }
  }
  score.judgementCounts = judgementCounts;
  if (score.data.length > 0) {
    score.accuracy = cumulativeAccuracy / score.data.length;
  } else {
    score.accuracy = 0;
  }
}

export function getRank(score: Score): string {
  if (score.accuracy > 95 && !score.judgementCounts["Miss"]) {
    if (
      Object.values(score.judgementCounts).filter((x) => x > 0).length === 1
    ) {
      return "SS";
    }
    return "S";
  }
  if (score.accuracy > 85) {
    return "A";
  }
  if (score.accuracy > 75) {
    return "B";
  }
  if (score.accuracy > 65) {
    return "C";
  }
  if (score.accuracy > 55) {
    return "D";
  }
  return "F";
}
