import DBManager from "../DBManager";

AFRAME.registerSystem("db", {
  init: function () {
    this.db = new DBManager();
  },
});
