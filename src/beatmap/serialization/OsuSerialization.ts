import Beatmap from "../models/Beatmap";
import ClassicNote from "../models/ClassicNote";
import Note from "../models/Note";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const OsuParser = require("osu-parser-web");

export async function deserializeOsuBeatmap(
  blob: Blob,
  beatmap: Beatmap
): Promise<void> {
  if (beatmap.notes == null) {
    beatmap.notes = [];
  }
  beatmap.notes.length = 0;
  const osuBeatmap = OsuParser.parseContent(await blob.text());
  osuBeatmap.hitObjects.forEach((hitObject: any) => {
    const note: Note = {
      type: null,
      startTime: null,
    };
    note.startTime = hitObject.startTime;
    if (hitObject.endTime) {
      note.endTime = hitObject.endTime;
      note.duration = hitObject.endTime - hitObject.startTime;
    } else {
      note.duration = 0;
    }
    if (osuBeatmap.Mode == 1) {
      // Taiko
      if (
        hitObject.objectName === "slider" ||
        hitObject.objectName === "spinner"
      ) {
        note.type = 0b0100; // drumroll
        // TODO shaker
      } else {
        if (
          hitObject.soundTypes.indexOf("whistle") != -1 ||
          hitObject.soundTypes.indexOf("clap") != -1
        ) {
          // kat
          note.type = 0b0001;
        } else {
          // don
          note.type = 0b0000;
        }
      }
      if (hitObject.soundTypes.indexOf("finish") != -1) {
        note.type |= 0b0010; // large note
      }
    } else if (osuBeatmap.Mode == 3) {
      // Mania
      if (hitObject.objectName == "hold") {
        note.type = 2;
      } else {
        note.type = 0;
      }
      (note as ClassicNote).key = Math.floor(
        (hitObject.position[0] * osuBeatmap.CircleSize) / 512
      );
      (note as ClassicNote).width = 1;
    }
    beatmap.notes.push(note);
  });
}
