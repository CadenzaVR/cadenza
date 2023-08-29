import Note from "./Note";

export default interface TonoNote extends Note {
  pitchDiff?: number;
  absPitchDiff?: number;
  totalError?: number;
}
