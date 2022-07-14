import Beatmap from "./Beatmap";
import BeatmapSetInfo from "./BeatmapSetInfo";

export default interface BeatmapSet {
  info: BeatmapSetInfo;
  beatmaps: Beatmap[];
}
