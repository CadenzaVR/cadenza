import Beatmap from "../models/Beatmap";

export default interface BeatmapRepository {
  getBeatmap(beatmapId: string): Promise<Beatmap>;
}
