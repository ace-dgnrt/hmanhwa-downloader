var path = require("path");
var webpack = require("webpack");

module.exports = (env, args) => {
  return {
    target: "node",
    entry: path.resolve(__dirname, "src/server.ts"),
    devtool: args.mode === "development" ? "source-map" : false,
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "bundle.js",
      publicPath: "",
      globalObject: "this",
      clean: true,
    },
    resolve: {
      extensions: [".js", ".ts"],
      alias: {
        "@Server": path.resolve(__dirname, "src/server"),
        "@Api": path.resolve(__dirname, "src/API"),
        "@Data": path.resolve(__dirname, "src/Data"),
        "@Endpoints": path.resolve(__dirname, "src/Endpoints"),
        "@Hooks": path.resolve(__dirname, "src/Hooks"),
        "@Routines": path.resolve(__dirname, "src/Routines"),
        "@Utils": path.resolve(__dirname, "src/Utils"),
        "@Workers": path.resolve(__dirname, "src/Workers"),
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: "ts-loader",
            options: {
              configFile: path.resolve(__dirname, "tsconfig.build.json"),
            },
          },
          exclude: [/node_modules/, /__tests__/, /__mocks__/],
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
