import Beatmap from "./Beatmap";
import BeatmapSetInfo from "./BeatmapSetInfo";

export default interface BeatmapSet {
  id: string;
  info: BeatmapSetInfo;
  beatmaps: Beatmap[];
}
