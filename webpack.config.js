var path = require("path");
const { web } = require("webpack");
var webpack = require("webpack");

module.exports = (env, args) => {
  return {
    target: "node",
    entry: path.resolve(__dirname, "src/server.ts"),
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "bundle.js",
      publicPath: "",
    },
    resolve: {
      extensions: [".js", ".ts"],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.ENV": JSON.stringify({
          hostname: args.mode === "development" ? "127.0.0.1" : "127.0.0.1",
          port: args.mode === "development" ? 8080 : 80,
          cors: args.mode === "development" ? "*" : "127.0.0.1",
        }),
      }),
    ],
  };
};
