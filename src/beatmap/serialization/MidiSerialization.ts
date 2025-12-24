import BeatmapSet from "../models/BeatmapSet";
import { Midi } from "@tonejs/midi";

import Beatmap from "../models/Beatmap";
import {
  BEATMAPTYPE_MIDI_KARAOKE,
  BEATMAPTYPE_MIDI_MANIA,
  BEATMAPTYPE_MIDI_SOLO,
} from "../BeatmapTypes";

export async function deserializeMidiBeatmap(
  blob: Blob,
  beatmap: Beatmap
): Promise<void> {
  if (beatmap.notes == null) {
    beatmap.notes = [];
  }
  beatmap.notes.length = 0;
  const arrayBuffer = await blob.arrayBuffer();
  const midi = new Midi(arrayBuffer);
  const tracks = midi.tracks;
  const track = tracks[parseInt(beatmap.id)];
  const notes = track.notes;
  const noteCount = notes.length;
  for (let i = 0; i < noteCount; i++) {
    const note = notes[i];
    beatmap.notes.push({
      type: note.midi - 60,
      startTime: note.time * 1000,
      endTime: note.time * 1000 + note.duration * 1000,
      duration: note.duration * 1000,
    });
  }
}

export async function deserializeMidiBeatmapSet(
  blob: Blob
): Promise<BeatmapSet> {
  const midi = new Midi(await blob.arrayBuffer());
  const midiUrl = URL.createObjectURL(blob);
  const beatmapSet = {
    id: null,
    info: {
      song: midi.header.name,
      artist: "",
      creator: "",
      imageSrc: "",
      audioSrc: midiUrl,
      type: "",
      language: "",
      genre: "",
      tags: [],
      srcFormat: "midi",
      src: midiUrl,
    },
    beatmaps: [],
  } as BeatmapSet;

  const instrumentCounts = new Map<string, number>();
  for (let i = 0; i < midi.tracks.length; i++) {
    const track = midi.tracks[i];
    let isSoloTrack = true;
    let prevEndTime = -1;
    for (const note of track.notes) {
      if (prevEndTime > note.time) {
        isSoloTrack = false;
        break;
      }
      prevEndTime = note.time + note.duration;
    }
    const instrument = track.instrument.name;
    let instrumentCount = instrumentCounts.get(instrument);
    if (instrumentCount == null) {
      instrumentCount = 0;
    }
    instrumentCounts.set(instrument, instrumentCount + 1);

    const beatmap = {
      id: i.toString(),
      info: {
        name:
          track.name && track.name !== ""
            ? track.name
            : instrument + " " + instrumentCount,
        type:
          "" + (isSoloTrack ? BEATMAPTYPE_MIDI_SOLO : BEATMAPTYPE_MIDI_MANIA),
      },
      notes: null,
      set: beatmapSet,
    } as Beatmap;
    beatmapSet.beatmaps.push(beatmap);
  }

  const hasLyrics = midi.header.meta.find((meta) => meta.type === "lyrics");
  const hasSoloTrack = beatmapSet.beatmaps.find(
    (beatmap) => beatmap.info.type === "" + BEATMAPTYPE_MIDI_SOLO
  );
  beatmapSet.info.type =
    "" +
    (hasSoloTrack
      ? hasLyrics
        ? BEATMAPTYPE_MIDI_KARAOKE
        : BEATMAPTYPE_MIDI_SOLO
      : BEATMAPTYPE_MIDI_MANIA);

  return beatmapSet;
}
