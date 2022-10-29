import { Entity } from "aframe";
import { Euler, MathUtils, Vector3 } from "three";
import BaseNotesManager from "../../BaseNotesManager";
import InstancedClassicNoteManager from "./InstancedClassicNoteManager";

const enum NoteTypes {
  HIT_NOTE = 0,
  SLIDE_NOTE = 1,
  HOLD_NOTE = 2,
  ROLL_NOTE = 3,
}

const RAIL_LENGTH = 8;
const RAIL_ANGLE = MathUtils.degToRad(10);
const TIME_WINDOW = 3000;
const MOVE_SPEED = RAIL_LENGTH / TIME_WINDOW;
const MOVE_DIRECTION = new Vector3(0, 0, 1).applyEuler(
  new Euler(RAIL_ANGLE, 0, 0)
);

export default class ClassicNotesManager extends BaseNotesManager {
  constructor() {
    super(
      new Map([
        [
          NoteTypes.HIT_NOTE,
          new InstancedClassicNoteManager(
            NoteTypes.HIT_NOTE,
            100,
            MOVE_SPEED,
            MOVE_DIRECTION
          ),
        ],
        [
          NoteTypes.SLIDE_NOTE,
          new InstancedClassicNoteManager(
            NoteTypes.SLIDE_NOTE,
            100,
            MOVE_SPEED,
            MOVE_DIRECTION
          ),
        ],
        [
          NoteTypes.HOLD_NOTE,
          new InstancedClassicNoteManager(
            NoteTypes.HOLD_NOTE,
            20,
            MOVE_SPEED,
            MOVE_DIRECTION
          ),
        ],
        [
          NoteTypes.ROLL_NOTE,
          new InstancedClassicNoteManager(
            NoteTypes.ROLL_NOTE,
            20,
            MOVE_SPEED,
            MOVE_DIRECTION
          ),
        ],
      ])
    );
  }

  public init(parentEntity: Entity, keyboardHeight: number) {
    for (const noteManager of this.noteManagerArr) {
      (noteManager as InstancedClassicNoteManager).init(parentEntity.object3D, {
        keyboardHeight: keyboardHeight,
      });
    }
  }

  public updateKeyboardHeight(keyboardHeight: number) {
    for (const noteManager of this.noteManagerArr) {
      (noteManager as InstancedClassicNoteManager).updateKeyboardHeight(
        keyboardHeight
      );
    }
  }
}
