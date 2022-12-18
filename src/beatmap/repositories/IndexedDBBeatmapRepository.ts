import Dexie, { Table } from "dexie";
import BeatmapSet from "../models/BeatmapSet";
import BeatmapRepository from "./BeatmapRepository";

interface Data {
  data: any;
}

class CadenzaDatabase extends Dexie {
  songs!: Dexie.Table<Data, number>;
  beatmaps!: Dexie.Table<Data, number>;
  beatmapInfos!: Dexie.Table<Record<string, any>, number>;

  constructor() {
    super("CadenzaBeatmaps");
    this.version(1).stores({
      beatmapInfos: "++id, mode, genre, language, *tags",
      beatmaps: "++id",
      songs: "++id",
    });
    this.version(2)
      .stores({
        beatmapInfos: "++id, mode, genre, language, *tags, format",
      })
      .upgrade((transaction) => {
        return transaction
          .table("beatmapInfos")
          .toCollection()
          .modify((info) => {
            info.format = "json";
            info.mode = "7";
          });
      });
  }
}

interface BeatmapInfoRecord {
  id: number;
  name: string;
  artist: string;
  creator: string;
  image: Blob;
  mode: string;
  genre: string;
  language: string;
  tags: string[];
  format: string;
  difficulties: number[];
  difficultyNames: string[];
  src?: string | number;
  songId?: number;
  beatmapIds?: number[];
}

export default class IndexedDBBeatmapRepository implements BeatmapRepository {
  db: CadenzaDatabase;
  constructor() {
    this.db = new CadenzaDatabase();
  }

  private async fetchAndSaveData(src: string, table: Table<Data, number>) {
    const blob = await fetch(src).then((res) => res.blob());
    return table.add({
      data: blob,
    });
  }

  async saveBeatmapSet(beatmapSet: BeatmapSet) {
    beatmapSet.beatmaps.sort((a, b) => a.info.difficulty - b.info.difficulty);

    const imageSrc = beatmapSet.info.imageSrc;
    let imageBlob;

    if (imageSrc.startsWith("#")) {
      imageBlob = await fetch(
        (document.getElementById(imageSrc.substring(1)) as HTMLImageElement).src
      ).then((res) => res.blob());
    } else {
      imageBlob = await fetch(imageSrc).then((res) => res.blob());
    }

    const beatmapSetInfo = {
      name: beatmapSet.info.song,
      artist: beatmapSet.info.artist,
      creator: beatmapSet.info.creator,
      image: imageBlob,
      mode: beatmapSet.info.type,
      genre: beatmapSet.info.genre,
      language: beatmapSet.info.language,
      tags: beatmapSet.info.tags,
      format: beatmapSet.info.srcFormat,
      difficulties: beatmapSet.beatmaps.map(
        (beatmap) => beatmap.info.difficulty
      ),
      difficultyNames: beatmapSet.beatmaps.map((beatmap) => beatmap.info.name),
    } as BeatmapInfoRecord;

    if (beatmapSet.info.src) {
      beatmapSetInfo["src"] = await this.fetchAndSaveData(
        beatmapSet.info.src as string,
        this.db.beatmaps
      );
    } else {
      const beatmapIds = [];
      for (const beatmap of beatmapSet.beatmaps) {
        beatmapIds.push(
          await this.fetchAndSaveData(
            beatmap.info.src as string,
            this.db.beatmaps
          )
        );
      }

      beatmapSetInfo["beatmapIds"] = beatmapIds;
      beatmapSetInfo["songId"] = await this.fetchAndSaveData(
        beatmapSet.info.audioSrc,
        this.db.songs
      );
    }

    await this.db.beatmapInfos.put(beatmapSetInfo);
  }

  async getBeatmapSets(): Promise<BeatmapSet[]> {
    return this.db.beatmapInfos.toArray().then((infos) =>
      (infos as BeatmapInfoRecord[]).map((info) => {
        const beatmapSet = {
          id: info.id + "",
          info: {
            song: info.name,
            artist: info.artist,
            creator: info.creator,
            imageSrc: URL.createObjectURL(info.image),
            audioSrc: info.songId,
            type: info.mode,
            genre: info.genre,
            language: info.language,
            tags: info.tags,
            srcFormat: info.format,
          },
          beatmaps: [],
        } as unknown as BeatmapSet;

        for (let i = 0; i < info.difficulties.length; i++) {
          let id;
          if (info.beatmapIds) {
            id = info.beatmapIds[i] + "";
          } else {
            id = info.src + "-" + i;
          }
          beatmapSet.beatmaps.push({
            id: id,
            info: {
              name: info.difficultyNames[i],
              difficulty: info.difficulties[i],
              src: info.beatmapIds ? info.beatmapIds[i] : null,
            },
            notes: null,
            set: beatmapSet,
          });
        }

        if (info.src) {
          beatmapSet.info.src = info.src;
        }

        return beatmapSet;
      })
    );
  }

  getBeatmap(id: number): Promise<Data> {
    return this.db.beatmaps.get(id);
  }

  getSong(id: number): Promise<Data> {
    return this.db.songs.get(id);
  }
}
