import Beatmap from "../models/Beatmap";
import { xxhash128 } from "hash-wasm";

export const KEYFIELDS_TAIKO: readonly string[] = [
  "startTime",
  "type",
  "endTime",
];
export const KEYFIELDS_CLASSIC: readonly string[] = [
  "startTime",
  "type",
  "endTime",
  "key",
  "width",
];

export default function hash(
  beatmap: Beatmap,
  keyFields: string[] | readonly string[] = KEYFIELDS_CLASSIC
): Promise<string> {
  const sortedKeyFields = [...keyFields].sort();
  const str = beatmap.notes
    .sort((a, b) => {
      // sort by key fields in order
      for (let i = 0; i < sortedKeyFields.length; i++) {
        const field = sortedKeyFields[i];
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
        sortedKeyFields.reduce((acc, field) => {
          let val = (note as any)[field];
          if (val === undefined || val === null) val = "";
          return acc + val + ",";
        }, "") +
        "]"
      );
    }, "");
  return xxhash128(str);
}
