import Dexie from "dexie";

export default class DBManager {
  constructor() {
    this.db = new Dexie("CadenzaBeatmaps");
    this.db.version(1).stores({
      beatmapInfos: "++id, mode, genre, language, *tags",
      beatmaps: "++id",
      songs: "++id",
    });
  }

  /**
   *
   * @param {BeatmapSet} beatmapSet
   */
  async saveBeatmapSet(beatmapSet) {
    const beatmapIds = [];
    beatmapSet.beatmaps.sort((a, b) => a.difficulty - b.difficulty);
    for (const beatmap of beatmapSet.beatmaps) {
      const beatmapBlob = await fetch(beatmap.mapSrc).then((res) => res.blob());
      const beatmapId = await this.db.beatmaps.add({
        data: beatmapBlob,
      });
      beatmapIds.push(beatmapId);
    }

    const songId = await fetch(beatmapSet.beatmapInfo.audioSrc)
      .then((res) => res.blob())
      .then((blob) =>
        this.db.songs.add({
          data: blob,
        })
      );

    const imageSrc = beatmapSet.beatmapInfo.imageSrc;
    let imageBlob;

    if (imageSrc.startsWith("#")) {
      imageBlob = await fetch(
        document.getElementById(imageSrc.substring(1)).src
      ).then((res) => res.blob());
    } else {
      imageBlob = await fetch(imageSrc).then((res) => res.blob());
    }

    this.db.beatmapInfos.put({
      name: beatmapSet.beatmapInfo.name,
      songId: songId,
      artist: beatmapSet.beatmapInfo.artist,
      creator: beatmapSet.beatmapInfo.creator,
      image: imageBlob,
      mode: beatmapSet.beatmapInfo.mode,
      genre: beatmapSet.beatmapInfo.genre,
      language: beatmapSet.beatmapInfo.language,
      tags: beatmapSet.beatmapInfo.tags,
      difficulties: beatmapSet.beatmaps.map((beatmap) => beatmap.difficulty),
      difficultyNames: beatmapSet.beatmaps.map(
        (beatmap) => beatmap.difficultyName
      ),
      beatmapIds: beatmapIds,
    });
  }

  getBeatmapInfos() {
    return this.db.beatmapInfos.toArray();
  }

  getBeatmap(id) {
    return this.db.beatmaps.get(id);
  }

  getSong(id) {
    return this.db.songs.get(id);
  }
}
