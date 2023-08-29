import {
  BEATMAPTYPE_CADENZA_CLASSIC,
  BEATMAPTYPE_MIDI_SOLO,
  BEATMAPTYPE_MIDI_KARAOKE,
  BEATMAPTYPE_OSU_MANIA,
  BEATMAPTYPE_OSU_TAIKO,
} from "../beatmap/BeatmapTypes";

export const GAMEMODE_CLASSIC = 0;
export const GAMEMODE_TAIKO = 1;
export const GAMEMODE_TONO = 2;

interface SupportedTypes {
  primary: number[];
  secondary: number[];
}

/**
 * The supported beatmap types for each gamemode.
 */
export const SUPPORTED_BEATMAP_TYPES = Object.freeze({
  0: Object.freeze({
    primary: [BEATMAPTYPE_CADENZA_CLASSIC, BEATMAPTYPE_OSU_MANIA],
    secondary: [BEATMAPTYPE_OSU_TAIKO],
  }), //Classic supports osu!taiko, osu!mania, Cadenza
  1: Object.freeze({
    primary: [BEATMAPTYPE_OSU_TAIKO],
    secondary: [],
  }), //Taiko currently only supports osu!taiko
  2: Object.freeze({
    primary: [BEATMAPTYPE_MIDI_SOLO, BEATMAPTYPE_MIDI_KARAOKE],
    secondary: [],
  }), //Tono currently supports no gamemodes
}) as Readonly<Record<number, Readonly<SupportedTypes>>>;
