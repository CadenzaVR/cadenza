import Note from "../beatmap/models/Note";

export default interface HitEvent {
  note: Note;
  judgement: number;
}
