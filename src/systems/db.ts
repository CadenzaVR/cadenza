import IndexedDBBeatmapRepository from "../beatmap/repositories/IndexedDBBeatmapRepository";

AFRAME.registerSystem("db", {
  init: function () {
    this.beatmapSetRepository = new IndexedDBBeatmapRepository();
  },
});
