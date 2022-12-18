import BeatmapSet from "../models/BeatmapSet";

export default interface BeatmapRepository {
  getBeatmapSets(): Promise<BeatmapSet[]>;
}
