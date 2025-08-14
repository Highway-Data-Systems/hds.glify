const path = require("path");
const webpackConfigGhPages = require("./webpack.config.gh-pages");

module.exports = {
  ...webpackConfigGhPages,
  watch: true,
  devtool: "inline-source-map",
  devServer: {
    static: [
      {
        directory: path.join(__dirname, "dist"),
        publicPath: "/dist/",
        serveIndex: true,
        watch: true
      },
      {
        directory: path.join(__dirname, "src/tests/integration"),
        publicPath: "/",
        serveIndex: true,
        watch: true
      }
    ],
    compress: true,
    port: 9000,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    }
  },
  mode: "development",
  output: {
    filename: "glify-browser.js",
    path: path.resolve(__dirname, ".dev-server"),
    libraryTarget: "umd",
  },
};
