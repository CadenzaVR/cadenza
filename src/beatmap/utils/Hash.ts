import Beatmap from "../models/Beatmap";
import { xxhash128 } from "hash-wasm";

const KEYFIELDS = ["startTime", "type", "endTime", "key", "width"];

export default function hash(
  beatmap: Beatmap,
  keyFields: string[] = KEYFIELDS
): Promise<string> {
  keyFields.sort();
  const str = beatmap.notes
    .sort((a, b) => {
      // sort by key fields in order
      for (let i = 0; i < keyFields.length; i++) {
        const field = keyFields[i];
        if ((a as any)[field] < (b as any)[field]) return -1;
        if ((a as any)[field] > (b as any)[field]) return 1;
      }
      return 0;
    })
    .reduce((acc, note) => {
      // concatenate key fields
      return (
        acc +
        "[" +
        keyFields.reduce((acc, field) => {
          const val = (note as any)[field];
          if (val === undefined) return acc;
          return acc + val + ",";
        }, "") +
        "]"
      );
    }, "");
  return xxhash128(str);
}
