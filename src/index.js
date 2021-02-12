function requireAll(req) {
  req.keys().forEach(req);
}

require("aframe-haptics-component");
requireAll(require.context("./geometries/", true, /\.js$/));
requireAll(require.context("./components/", true, /\.js$/));
require("./AudioManager");
require("./game");
require("./hand-tracking");
