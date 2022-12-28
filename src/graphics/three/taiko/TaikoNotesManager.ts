import { Euler, Object3D, Vector3 } from "three";
import BaseNotesManager from "../../BaseNotesManager";
import NoteManager from "../../NoteManager";
import Initializable from "../Initializable";
import InstancedSimpleNoteManager from "../InstancedSimpleNoteManager";
import SimpleNoteManager from "../SimpleNoteManager";
import DonKatNotesManager from "./DonKatNotesManager";
import DrumrollNoteManager from "./DrumrollNotesManager";

const enum NoteTypes {
  SMALLDON = 0b0000,
  SMALLKAT = 0b0001,
  LARGEDON = 0b0010,
  LARGEKAT = 0b0011,
  SMALLDRUMROLL = 0b0100,
  LARGEDRUMROLL = 0b0110,
  SHAKER = 0b1010,
}

const basePositionY = 1.57;
const basePositionZ = -4.29;

export default class TaikoNotesManager
  extends BaseNotesManager
  implements Initializable
{
  railAngle: number;
  railLength: number;
  timeWindow: number;
  constructor(
    railAngle: number,
    railLength: number,
    timeWindow: number,
    numSmallDon = 50,
    numSmallKat = 50,
    numLargeDon = 25,
    numLargeKat = 25,
    numSmallDrumroll = 5,
    numLargeDrumroll = 5
  ) {
    super(
      new Map<number, NoteManager>([
        [
          NoteTypes.SMALLDON,
          new DonKatNotesManager(
            true,
            false,
            numSmallDon,
            new Vector3(
              0,
              basePositionY + (railLength / 2) * Math.sin(railAngle),
              basePositionZ - (railLength / 2) * Math.cos(railAngle)
            ).applyAxisAngle(new Vector3(-1, 0, 0), railAngle),
            railLength / timeWindow,
            new Vector3(0, 0, 1).applyEuler(new Euler(railAngle, 0, 0))
          ),
        ],
        [
          NoteTypes.SMALLKAT,
          new DonKatNotesManager(
            false,
            false,
            numSmallKat,
            new Vector3(
              0,
              basePositionY + (railLength / 2) * Math.sin(railAngle),
              basePositionZ - (railLength / 2) * Math.cos(railAngle)
            ).applyAxisAngle(new Vector3(-1, 0, 0), railAngle),
            railLength / timeWindow,
            new Vector3(0, 0, 1).applyEuler(new Euler(railAngle, 0, 0))
          ),
        ],
        [
          NoteTypes.LARGEDON,
          new DonKatNotesManager(
            true,
            true,
            numLargeDon,
            new Vector3(
              0,
              basePositionY + (railLength / 2) * Math.sin(railAngle),
              basePositionZ - (railLength / 2) * Math.cos(railAngle)
            ).applyAxisAngle(new Vector3(-1, 0, 0), railAngle),
            railLength / timeWindow,
            new Vector3(0, 0, 1).applyEuler(new Euler(railAngle, 0, 0))
          ),
        ],
        [
          NoteTypes.LARGEKAT,
          new DonKatNotesManager(
            false,
            true,
            numLargeKat,
            new Vector3(
              0,
              basePositionY + (railLength / 2) * Math.sin(railAngle),
              basePositionZ - (railLength / 2) * Math.cos(railAngle)
            ).applyAxisAngle(new Vector3(-1, 0, 0), railAngle),
            railLength / timeWindow,
            new Vector3(0, 0, 1).applyEuler(new Euler(railAngle, 0, 0))
          ),
        ],
        [
          NoteTypes.SMALLDRUMROLL,
          new DrumrollNoteManager(
            false,
            numSmallDrumroll,
            new Vector3(
              0,
              basePositionY + (railLength / 2) * Math.sin(railAngle),
              basePositionZ - (railLength / 2) * Math.cos(railAngle)
            ).applyAxisAngle(new Vector3(-1, 0, 0), railAngle),
            railLength / timeWindow,
            new Vector3(0, 0, 1).applyEuler(new Euler(railAngle, 0, 0))
          ),
        ],
        [
          NoteTypes.LARGEDRUMROLL,
          new DrumrollNoteManager(
            true,
            numLargeDrumroll,
            new Vector3(
              0,
              basePositionY + (railLength / 2) * Math.sin(railAngle),
              basePositionZ - (railLength / 2) * Math.cos(railAngle)
            ).applyAxisAngle(new Vector3(-1, 0, 0), railAngle),
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
      (<SimpleNoteManager | InstancedSimpleNoteManager>noteManager).init(
        parent
      );
    }
  }

  public updateHeight(height: number) {
    for (const noteManager of this.noteManagerArr) {
      (noteManager as DonKatNotesManager | DrumrollNoteManager).updateHeight(
        height
      );
    }
  }
}
