import Beatmap from "../beatmap/models/Beatmap";
import GameState, { GameStatus } from "../game/GameState";
import GraphicsManager from "./GraphicsManager";
import NoteManager from "./NoteManager";

export default class BaseGraphicsManager implements GraphicsManager {
  notesManager: NoteManager;
  timeWindow: number;
  currentNote: number;

  constructor(noteManager: NoteManager, timeWindow: number) {
    this.notesManager = noteManager;
    this.timeWindow = timeWindow;
    this.currentNote = 0;
  }
  async loadBeatmap(beatmap: Beatmap): Promise<void> {
    await this.notesManager.load(beatmap);
  }
  update(gamestate: GameState, deltaTime: number): void {
    if (gamestate.status === GameStatus.PLAYING) {
      for (const hitEvent of gamestate.events) {
        const note = hitEvent.note;
        if (!note.isActive) {
          this.notesManager.deactivateNote(note);
        }
      }
      this.notesManager.update(deltaTime);
      const offsetTime = gamestate.currentSongTime + this.timeWindow;
      const notes = gamestate.beatmap.notes;
      let note = notes[this.currentNote];
      while (note != null && note.startTime < offsetTime) {
        this.notesManager.spawnNote(note, offsetTime - note.startTime);
        note = notes[++this.currentNote];
      }
    }
  }
  onGameStart(): void {
    this.currentNote = 0;
  }
  onGameRestart(): void {
    this.currentNote = 0;
    this.notesManager.reset();
  }
  onReturnToMenu(): void {
    this.currentNote = 0;
    this.notesManager.reset();
  }
}
