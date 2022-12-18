export default interface BeatmapInfo {
  name: string;
  creator?: string;
  type?: string;
  difficulty?: number;
  sounds?: string[];
  src?: string | number;
}
