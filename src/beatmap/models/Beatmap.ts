import BeatmapInfo from "./BeatmapInfo";
import BeatmapSet from "./BeatmapSet";
import Note from "./Note";

export default interface Beatmap {
  id: string;
  hash?: string;
  info: BeatmapInfo;
  notes: Note[];
  set: BeatmapSet;
}
