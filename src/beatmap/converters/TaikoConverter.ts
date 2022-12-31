import Beatmap from "../models/Beatmap";
import ClassicNote from "../models/ClassicNote";

const enum ClassicNoteTypes {
  HIT_NOTE = 0,
  SLIDE_NOTE = 1,
  HOLD_NOTE = 2,
  ROLL_NOTE = 3,
}

const enum TaikoNoteTypes {
  SMALLDON = 0b0000,
  SMALLKAT = 0b0001,
  LARGEDON = 0b0010,
  LARGEKAT = 0b0011,
  SMALLDRUMROLL = 0b0100,
  LARGEDRUMROLL = 0b0110,
  SHAKER = 0b1010,
}
export function taikoToClassic(beatmap: Beatmap): void {
  const newNotes = [] as ClassicNote[];
  let prevKat = null;
  for (const note of beatmap.notes) {
    if (
      note.type === TaikoNoteTypes.SMALLDRUMROLL ||
      note.type === TaikoNoteTypes.LARGEDRUMROLL ||
      note.type === TaikoNoteTypes.SHAKER
    ) {
      newNotes.push({
        key: 3,
        width: 2,
        startTime: note.startTime,
        endTime: note.endTime,
        duration: note.endTime - note.startTime,
        type: ClassicNoteTypes.ROLL_NOTE,
      });
    } else {
      const newNote = {
        type: ClassicNoteTypes.HIT_NOTE,
        key: null,
        width: null,
        startTime: note.startTime,
        duration: 0,
      } as ClassicNote;

      if (note.type & 0b1) {
        //kat
        newNote.key = prevKat == 5 ? 2 : 5;
        newNote.width = 1;
        prevKat = newNote.key;
      } else {
        //don
        newNote.width = 2;
        newNote.key = 3;
        prevKat = null;
      }

      if (note.type & 0b10) {
        //large
        const newNote2 = {
          ...newNote,
        };
        if (note.type & 0b1) {
          //kat
          newNote.key = 2;
          newNote2.key = 5;
        } else {
          //don
          newNote.width = 1;
          newNote2.key = 4;
          newNote2.width = 1;
        }
        newNotes.push(newNote2);
      }
      newNotes.push(newNote);
    }
  }
  beatmap.notes = newNotes;
}
