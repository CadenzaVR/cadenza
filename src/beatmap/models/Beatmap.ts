import BeatmapInfo from "./BeatmapInfo";
import BeatmapSet from "./BeatmapSet";
import Note from "./Note";

export default interface Beatmap {
  id: string;
  info: BeatmapInfo;
  notes: Note[];
  set: BeatmapSet;
}
