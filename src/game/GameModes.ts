export const GAMEMODE_CLASSIC = 0;
export const GAMEMODE_TAIKO = 1;

interface SupportedTypes {
  primary: number[];
  secondary: number[];
}

/**
 * The supported gamemodes for each gamemode.
 */
export const SUPPORTED_BEATMAP_TYPES = Object.freeze({
  0: Object.freeze({
    primary: [7, 3],
    secondary: [1],
  }), //Classic supports osu!taiko, osu!mania, Cadenza
  1: Object.freeze({
    primary: [1],
    secondary: [],
  }), //Taiko currently only supports osu!taiko
}) as Readonly<Record<number, Readonly<SupportedTypes>>>;
