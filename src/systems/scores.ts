import ScoreManager from "../scoring/ScoreManager";
import LocalStorageScoreRepository from "../scoring/repositories/LocalStorageScoreRepository";

AFRAME.registerSystem("scores", {
  init: function () {
    this.scoreManager = new ScoreManager(new LocalStorageScoreRepository());
  },
});
