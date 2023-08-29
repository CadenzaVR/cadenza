import { SUPPORTED_BEATMAP_TYPES } from "../../game/GameModes";
import Beatmap from "../models/Beatmap";
import getHash from "../utils/Hash";
import { taikoToClassic } from "./TaikoConverter";

const converters = new Map([[1, new Map([[0, taikoToClassic]])]]);
export default async function convertBeatmap(
  beatmap: Beatmap,
  toGameMode: number
): Promise<void> {
  const beatmapType = parseInt(
    beatmap.info.type ? beatmap.info.type : beatmap.set.info.type
  );
  if (
    SUPPORTED_BEATMAP_TYPES[toGameMode] &&
    SUPPORTED_BEATMAP_TYPES[toGameMode].primary.indexOf(beatmapType) > -1
  ) {
    beatmap.hash = await getHash(beatmap, toGameMode);
    return;
  }

  const fromGameMode = parseInt(
    Object.entries(SUPPORTED_BEATMAP_TYPES).find(([, types]) =>
      types.primary.includes(beatmapType)
    )?.[0]
  );

  if (converters.has(fromGameMode)) {
    const converter = converters.get(fromGameMode).get(toGameMode);
    if (converter) {
      converter(beatmap);
      beatmap.hash = await getHash(beatmap, toGameMode);
    } else {
      console.warn(`No converter found for ${fromGameMode} to ${toGameMode}`);
      beatmap.hash = await getHash(beatmap, fromGameMode);
    }
  } else {
    console.warn(`No converter found for ${fromGameMode}`);
    beatmap.hash = await getHash(beatmap, fromGameMode);
  }
}
