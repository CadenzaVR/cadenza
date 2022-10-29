import Beatmap from "../beatmap/models/Beatmap";
import Note from "../beatmap/models/Note";
import NoteManager from "./NoteManager";

let instance;
/**
 * Basic single note type manager
 */
export default abstract class PooledNoteManager<T> implements NoteManager {
  protected noteInstanceMap: Map<Note, T>;
  protected activeNotes: Set<T>;

  constructor() {
    this.noteInstanceMap = new Map();
    this.activeNotes = new Set();
  }

  abstract getInstanceFromPool(): T;

  abstract releaseInstanceToPool(instance: T): void;

  abstract spawnInstance(
    note: Note,
    instance: T,
    spawnOffsetTime: number
  ): void;

  abstract updateInstance(instance: T, deltaTime: number): void;

  abstract load(beatmap: Beatmap): Promise<void>;

  spawnNote(note: Note, spawnOffsetTime: number): void {
    instance = this.getInstanceFromPool();
    this.spawnInstance(note, instance, spawnOffsetTime);
    this.noteInstanceMap.set(note, instance);
    this.activeNotes.add(instance);
  }

  deactivateNote(note: Note): void {
    instance = this.noteInstanceMap.get(note);
    if (this.activeNotes.delete(instance)) {
      this.releaseInstanceToPool(instance);
    }
  }
  update(deltaTime: number): void {
    for (instance of this.activeNotes) {
      this.updateInstance(instance, deltaTime);
    }
  }
  reset(): void {
    for (instance of this.activeNotes) {
      this.releaseInstanceToPool(instance);
    }
    this.activeNotes.clear();
  }
}
