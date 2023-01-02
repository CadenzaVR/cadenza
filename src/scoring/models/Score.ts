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

export default class Score {
  beatmapId: string;
  score: number;
  highScore: number;
  combo: number;
  maxCombo: number;
  accuracy: number;
  judgementCounts: Record<string, number>;
  data: Array<number>;
  constructor(
    beatmapId: string,
    score: number,
    highScore: number,
    combo: number,
    maxCombo: number,
    accuracy: number,
    data: Array<number>
  ) {
    this.beatmapId = beatmapId;
    this.score = score;
    this.highScore = highScore;
    this.combo = combo;
    this.maxCombo = maxCombo;
    this.accuracy = accuracy;
    this.data = data;
  }

  computeAccuracyStats(
    judgementThresholds: [string, number][] = DEFAULT_SCORE_THRESHOLDS
  ): void {
    const judgementCounts: Record<string, number> = {};
    for (const [judgement] of judgementThresholds) {
      judgementCounts[judgement] = 0;
    }
    const sortedThresholds = judgementThresholds.sort((a, b) => a[1] - b[1]);
    let cumulativeAccuracy = 0;
    for (const delta of this.data) {
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
    this.judgementCounts = judgementCounts;
    if (this.data.length > 0) {
      this.accuracy = cumulativeAccuracy / this.data.length;
    } else {
      this.accuracy = 0;
    }
  }

  getRank(): string {
    if (this.accuracy > 95 && this.judgementCounts["Miss"] == 0) {
      if (
        Object.values(this.judgementCounts).filter((x) => x > 0).length === 1
      ) {
        return "SS";
      }
      return "S";
    }
    if (this.accuracy > 90) {
      return "A";
    }
    if (this.accuracy > 80) {
      return "B";
    }
    if (this.accuracy > 70) {
      return "C";
    }
    if (this.accuracy > 60) {
      return "D";
    }
    return "F";
  }
}
