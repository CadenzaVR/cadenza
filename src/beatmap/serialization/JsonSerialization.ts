import Beatmap from "../models/Beatmap";
import ClassicNote from "../models/ClassicNote";

export async function deserializeJsonBeatmap(
  blob: Blob,
  beatmap: Beatmap
): Promise<void> {
  const beatmapObj = await blob.text().then((text) => {
    return JSON.parse(text);
  });
  if (beatmap.notes == null) {
    beatmap.notes = [];
  }
  beatmap.notes.length = 0;

  // TODO: Add support for other note types/game modes
  for (const section of beatmapObj.sections) {
    for (const note of section.notes) {
      (beatmap.notes as ClassicNote[]).push({
        type: note[0],
        key: note[1],
        startTime: note[2],
        width: note[3],
        endTime: note[4] ? note[4] : null,
        duration: note[4] ? note[4] - note[2] : 0,
        sound: note[0] === 2 ? 0 : null,
      });
    }
  }
}
