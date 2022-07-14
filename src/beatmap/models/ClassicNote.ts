import Note from "./Note";

export default interface ClassicNote extends Note {
  type: number;
  key: number;
  startTime: number;
  width: number;
  endTime: number;
}
