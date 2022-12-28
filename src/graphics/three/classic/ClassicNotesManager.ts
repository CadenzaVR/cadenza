import { Euler, Object3D, Vector3 } from "three";
import BaseNotesManager from "../../BaseNotesManager";
import InstancedClassicNoteManager from "./InstancedClassicNoteManager";

const enum NoteTypes {
  HIT_NOTE = 0,
  SLIDE_NOTE = 1,
  HOLD_NOTE = 2,
  ROLL_NOTE = 3,
}

export default class ClassicNotesManager extends BaseNotesManager {
  railAngle: number;
  railLength: number;
  timeWindow: number;
  constructor(railAngle: number, railLength: number, timeWindow: number) {
    super(
      new Map([
        [
          NoteTypes.HIT_NOTE,
          new InstancedClassicNoteManager(
            NoteTypes.HIT_NOTE,
            100,
            railLength / timeWindow,
            new Vector3(0, 0, 1).applyEuler(new Euler(railAngle, 0, 0))
          ),
        ],
        [
          NoteTypes.SLIDE_NOTE,
          new InstancedClassicNoteManager(
            NoteTypes.SLIDE_NOTE,
            100,
            railLength / timeWindow,
            new Vector3(0, 0, 1).applyEuler(new Euler(railAngle, 0, 0))
          ),
        ],
        [
          NoteTypes.HOLD_NOTE,
          new InstancedClassicNoteManager(
            NoteTypes.HOLD_NOTE,
            20,
            railLength / timeWindow,
            new Vector3(0, 0, 1).applyEuler(new Euler(railAngle, 0, 0))
          ),
        ],
        [
          NoteTypes.ROLL_NOTE,
          new InstancedClassicNoteManager(
            NoteTypes.ROLL_NOTE,
            20,
            railLength / timeWindow,
            new Vector3(0, 0, 1).applyEuler(new Euler(railAngle, 0, 0))
          ),
        ],
      ])
    );
    this.railAngle = railAngle;
    this.railLength = railLength;
    this.timeWindow = timeWindow;
  }

  public init(parent: Object3D) {
    for (const noteManager of this.noteManagerArr) {
      (noteManager as InstancedClassicNoteManager).init(parent);
    }
  }

  public updateHeight(height: number) {
    for (const noteManager of this.noteManagerArr) {
      (noteManager as InstancedClassicNoteManager).updateHeight(height);
    }
  }
}
