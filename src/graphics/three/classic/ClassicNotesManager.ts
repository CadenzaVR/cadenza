import { Euler, Group, Object3D, Vector3 } from "three";
import BaseNotesManager from "../../BaseNotesManager";
import InstancedClassicNoteManager from "./InstancedClassicNoteManager";

const enum NoteTypes {
  HIT_NOTE = 0,
  SLIDE_NOTE = 1,
  HOLD_NOTE = 2,
  ROLL_NOTE = 3,
}

const BASE_Y = 1.595;
const BASE_Z = -4.29;
const RAIL_WIDTH = 0.15;
const NUM_RAILS = 8;

export default class ClassicNotesManager extends BaseNotesManager {
  railAngle: number;
  railLength: number;
  railWidth: number;
  numRails: number;
  timeWindow: number;
  noteContainer: Group;
  constructor(railAngle: number, railLength: number, timeWindow: number) {
    super(
      new Map([
        [
          NoteTypes.HIT_NOTE,
          new InstancedClassicNoteManager(
            NoteTypes.HIT_NOTE,
            100,
            railLength / timeWindow,
            new Vector3(0, 0, 1).applyEuler(new Euler(railAngle, 0, 0)),
            RAIL_WIDTH,
            railLength
          ),
        ],
        [
          NoteTypes.SLIDE_NOTE,
          new InstancedClassicNoteManager(
            NoteTypes.SLIDE_NOTE,
            100,
            railLength / timeWindow,
            new Vector3(0, 0, 1).applyEuler(new Euler(railAngle, 0, 0)),
            RAIL_WIDTH,
            railLength
          ),
        ],
        [
          NoteTypes.HOLD_NOTE,
          new InstancedClassicNoteManager(
            NoteTypes.HOLD_NOTE,
            20,
            railLength / timeWindow,
            new Vector3(0, 0, 1).applyEuler(new Euler(railAngle, 0, 0)),
            RAIL_WIDTH,
            railLength
          ),
        ],
        [
          NoteTypes.ROLL_NOTE,
          new InstancedClassicNoteManager(
            NoteTypes.ROLL_NOTE,
            20,
            railLength / timeWindow,
            new Vector3(0, 0, 1).applyEuler(new Euler(railAngle, 0, 0)),
            RAIL_WIDTH,
            railLength
          ),
        ],
      ])
    );
    this.railAngle = railAngle;
    this.railLength = railLength;
    this.timeWindow = timeWindow;
    this.railWidth = RAIL_WIDTH;
    this.numRails = NUM_RAILS;
  }

  public init(parent: Object3D) {
    this.noteContainer = new Group();
    parent.add(this.noteContainer);
    this.noteContainer.position.x =
      (this.numRails / 2 - 0.5) * this.railWidth * -1;
    this.noteContainer.position.y =
      BASE_Y + (this.railLength / 2) * Math.sin(this.railAngle);
    this.noteContainer.position.z =
      BASE_Z - (this.railLength / 2) * Math.cos(this.railAngle);
    for (const noteManager of this.noteManagerArr) {
      (noteManager as InstancedClassicNoteManager).init(this.noteContainer);
    }
  }

  public updateHeight(height: number) {
    this.noteContainer.position.y =
      BASE_Y + (this.railLength / 2) * Math.sin(this.railAngle) + height / 100;
  }
}
