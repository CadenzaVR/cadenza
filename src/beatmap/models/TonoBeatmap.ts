import Beatmap from "./Beatmap";
import TonoNote from "./TonoNote";

export default interface TonoBeatmap extends Beatmap {
  notes: TonoNote[];
  maxPitch: number;
  minPitch: number;

  pitchRange?: number;
}
