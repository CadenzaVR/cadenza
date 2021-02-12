module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "main.js"
  },
  devServer: {
    https: true,
    contentBase: "./dist/",
    port: 8000
  }
};
