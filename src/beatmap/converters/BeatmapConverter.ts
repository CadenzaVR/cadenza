import { SUPPORTED_BEATMAP_TYPES } from "../../game/GameModes";
import Beatmap from "../models/Beatmap";
import { taikoToClassic } from "./TaikoConverter";

const converters = new Map([[1, new Map([[0, taikoToClassic]])]]);
export default function convertBeatmap(
  beatmap: Beatmap,
  toGameMode: number
): void {
  const beatmapType = parseInt(
    beatmap.info.type ? beatmap.info.type : beatmap.set.info.type
  );
  const fromGameMode = parseInt(
    Object.entries(SUPPORTED_BEATMAP_TYPES).find(([, types]) =>
      types.primary.includes(beatmapType)
    )?.[0]
  );
  if (
    SUPPORTED_BEATMAP_TYPES[toGameMode] &&
    SUPPORTED_BEATMAP_TYPES[toGameMode].primary.indexOf(beatmapType) > -1
  ) {
    return;
  }

  if (converters.has(fromGameMode)) {
    const converter = converters.get(fromGameMode).get(toGameMode);
    if (converter) {
      converter(beatmap);
    } else {
      console.warn(`No converter found for ${fromGameMode} to ${toGameMode}`);
    }
  } else {
    console.warn(`No converter found for ${fromGameMode}`);
  }
}
