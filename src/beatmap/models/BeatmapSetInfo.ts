export default interface BeatmapSetInfo {
  song: string;
  artist: string;
  creator: string;
  imageSrc: string;
  audioSrc: string;
  type: string;
  language: string;
  genre: string;
  tags: string[];
  srcFormat: string;
  src?: string | number;
  sounds?: string[];
}
