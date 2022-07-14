const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/index.ts",
  externals: {
    three: "THREE",
    aframe: "AFRAME",
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
    fallback: {
      fs: false,
      "react-native-fs": false,
      buffer: false,
    },
  },
  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
      { test: /\.tsx?$/, loader: "ts-loader" },
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { test: /\.js$/, loader: "source-map-loader" },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/templates/index.ejs",
      scriptLoading: "blocking",
      inject: "head",
    }),
  ],
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    server: "https",
    static: {
      directory: "./dist/",
    },
    port: 8000,
  },
};
