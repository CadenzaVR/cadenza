import Beatmap from "../models/Beatmap";
import { deserializeJsonBeatmap } from "./JsonSerialization";
import { deserializeOsuBeatmap } from "./OsuSerialization";

export function deserializeBeatmap(
  blob: Blob,
  beatmap: Beatmap
): Promise<void> {
  const format = beatmap.set.info.srcFormat;
  if (format.startsWith("json")) {
    return deserializeJsonBeatmap(blob, beatmap);
  } else if (format.startsWith("osu")) {
    return deserializeOsuBeatmap(blob, beatmap);
  } else {
    throw new Error("Invalid beatmap format");
  }
}
