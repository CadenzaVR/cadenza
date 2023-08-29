import { Euler, Group, Object3D, Vector3 } from "three";
import Note from "../../../beatmap/models/Note";
import BaseNotesManager from "../../BaseNotesManager";
import InstancedTonoNoteManager from "./InstancedTonoNoteManager";

const BASE_Y = 1.595;
const BASE_Z = -4.29;
const RAIL_WIDTH = 2.4;

export default class TonoNotesManager extends BaseNotesManager {
  railAngle: number;
  railLength: number;
  railWidth: number;
  timeWindow: number;
  noteContainer: Group;
  constructor(railAngle: number, railLength: number, timeWindow: number) {
    super(
      new Map([
        [
          0,
          new InstancedTonoNoteManager(
            100,
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
  }

  public spawnNote(note: Note, spawnOffset: number): void {
    this.noteManagerArr[0].spawnNote(note, spawnOffset);
  }

  public deactivateNote(note: Note): void {
    this.noteManagerArr[0].deactivateNote(note);
  }

  public init(parent: Object3D) {
    this.noteContainer = new Group();
    parent.add(this.noteContainer);
    this.noteContainer.position.x = 0;
    this.noteContainer.position.y =
      BASE_Y + (this.railLength / 2) * Math.sin(this.railAngle);
    this.noteContainer.position.z =
      BASE_Z - (this.railLength / 2) * Math.cos(this.railAngle);
    for (const noteManager of this.noteManagerArr) {
      (noteManager as InstancedTonoNoteManager).init(this.noteContainer);
    }
  }

  public updateHeight(height: number) {
    this.noteContainer.position.y =
      BASE_Y + (this.railLength / 2) * Math.sin(this.railAngle) + height / 100;
  }
}
