import { MathUtils, Object3D, Vector3 } from "three";
import BaseNotesManager from "../../BaseNotesManager";
import NoteManager from "../../NoteManager";
import Initializable from "../Initializable";
import InstancedSimpleNoteManager from "../InstancedSimpleNoteManager";
import SimpleNoteManager from "../SimpleNoteManager";
import DonKatNotesManager from "./DonKatNotesManager";
import DrumrollNoteManager from "./DrumrollNotesManager";
import TaikoParams from "./TaikoParams";

const enum NoteTypes {
  SMALLDON = 0b0000,
  SMALLKAT = 0b0001,
  LARGEDON = 0b0010,
  LARGEKAT = 0b0011,
  SMALLDRUMROLL = 0b0100,
  LARGEDRUMROLL = 0b0110,
  SHAKER = 0b1010,
}

const timeWindow = 3000; // milliseconds
const moveDirection = new Vector3(0, 0, 1);
const railLength = 8;
const moveSpeed = railLength / timeWindow;
const railAngle = MathUtils.degToRad(10);
const basePositionY = 1.595;
const basePositionZ = -4.29;
const baseSpawnPoint = new Vector3(
  0,
  basePositionY + (railLength / 2) * Math.sin(railAngle),
  basePositionZ - (railLength / 2) * Math.cos(railAngle)
);

export default class TaikoNotesManager
  extends BaseNotesManager
  implements Initializable<TaikoParams>
{
  constructor(
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
            baseSpawnPoint,
            moveSpeed,
            moveDirection
          ),
        ],
        [
          NoteTypes.SMALLKAT,
          new DonKatNotesManager(
            false,
            false,
            numSmallKat,
            baseSpawnPoint,
            moveSpeed,
            moveDirection
          ),
        ],
        [
          NoteTypes.LARGEDON,
          new DonKatNotesManager(
            true,
            true,
            numLargeDon,
            baseSpawnPoint,
            moveSpeed,
            moveDirection
          ),
        ],
        [
          NoteTypes.LARGEKAT,
          new DonKatNotesManager(
            false,
            true,
            numLargeKat,
            baseSpawnPoint,
            moveSpeed,
            moveDirection
          ),
        ],
        [
          NoteTypes.SMALLDRUMROLL,
          new DrumrollNoteManager(
            false,
            numSmallDrumroll,
            baseSpawnPoint,
            moveSpeed,
            moveDirection
          ),
        ],
        [
          NoteTypes.LARGEDRUMROLL,
          new DrumrollNoteManager(
            true,
            numLargeDrumroll,
            baseSpawnPoint,
            moveSpeed,
            moveDirection
          ),
        ],
      ])
    );
  }

  public init(parent: Object3D, params: TaikoParams) {
    for (const noteManager of this.noteManagerArr) {
      (<
        SimpleNoteManager<TaikoParams> | InstancedSimpleNoteManager<TaikoParams>
      >noteManager).init(parent, params);
    }
  }
}
