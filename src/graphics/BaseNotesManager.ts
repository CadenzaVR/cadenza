import Beatmap from "../beatmap/models/Beatmap";
import Note from "../beatmap/models/Note";
import NoteManager from "./NoteManager";

let noteManager;
/**
 * Simple note manager that handles different types of notes
 * by delegating tasks to the appropriate note manager for the given note type
 */
export default class BaseNotesManager implements NoteManager {
  noteManagers: Map<number, NoteManager>;
  noteManagerArr: NoteManager[];

  constructor(noteManagers: Map<number, NoteManager>) {
    this.noteManagers = noteManagers;
    this.noteManagerArr = Array.from(noteManagers.values());
  }

  public async load(beatmap: Beatmap): Promise<void> {
    for (noteManager of this.noteManagerArr) {
      await noteManager.load(beatmap);
    }
  }

  public spawnNote(note: Note, spawnOffset: number): void {
    this.noteManagers.get(note.type).spawnNote(note, spawnOffset);
  }

  public deactivateNote(note: Note): void {
    this.noteManagers.get(note.type).deactivateNote(note);
  }

  public activateNote(note: Note): void {
    this.noteManagers.get(note.type).activateNote(note);
  }

  public update(deltaTime: number): void {
    for (noteManager of this.noteManagerArr) {
      noteManager.update(deltaTime);
    }
  }

  public reset(): void {
    for (noteManager of this.noteManagerArr) {
      noteManager.reset();
    }
  }
}
