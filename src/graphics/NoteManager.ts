import Beatmap from "../beatmap/models/Beatmap";
import Note from "../beatmap/models/Note";

export default interface NoteManager {
  load(beatmap: Beatmap): Promise<void>;
  spawnNote(note: Note, spawnOffsetTime: number): void;
  deactivateNote(note: Note): void;
  update(deltaTime: number): void;
  reset(): void;
}
