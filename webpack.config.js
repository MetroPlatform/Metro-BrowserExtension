var webpack = require("webpack"),
    path = require("path"),
    fileSystem = require("fs"),
    env = require("./build_utils/env"),
    CleanWebpackPlugin = require("clean-webpack-plugin"),
    CopyWebpackPlugin = require("copy-webpack-plugin"),
    HtmlWebpackPlugin = require("html-webpack-plugin"),
    WriteFilePlugin = require("write-file-webpack-plugin");

// load the secrets
var alias = {};

var secretsPath = path.join(__dirname, ("secrets." + env.NODE_ENV + ".js"));

var fileExtensions = ["jpg", "jpeg", "png", "gif", "eot", "otf", "svg", "ttf", "woff", "woff2"];

if (fileSystem.existsSync(secretsPath)) {
  alias["secrets"] = secretsPath;
}

const SRC_DIR = path.join(__dirname, "src")

var options = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    scriptLoader: path.join(SRC_DIR, "js", "scriptLoader.js"),
    options: path.join(SRC_DIR, "js", "options.js"),
    menuApp: path.join(SRC_DIR, "js", "app", "menuApp.js"),
    background: path.join(SRC_DIR, "js", "background.js")
  },
  chromeExtensionBoilerplate: {
    notHotReload: ["scriptLoader"]
  },
  output: {
    path: path.join(__dirname, "build"),
    filename: "[name].bundle.js"
  },
  module: {
    rules: [
      {
          test: /\.js$/,
          include: SRC_DIR,
          loaders: "babel-loader",
          query: {
              presets: [
                [
                  '@babel/preset-react'
                ], 
                [
                  '@babel/preset-env',
                  {
                    "targets": {
                      "browsers": ["last 2 Chrome versions"]
                    }
                  }
                ],
              ],
              plugins: ['@babel/plugin-proposal-class-properties']
          },
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      },
      {
        test: /\.scss$/,
        loaders: [ 'style-loader', 'css-loader', 'sass-loader' ]
      },
      {
        test: new RegExp('\.(' + fileExtensions.join('|') + ')$'),
        loader: "file-loader?name=[name].[ext]",
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    alias: alias
  },
  plugins: [
    // clean the build folder
    new CleanWebpackPlugin(["build"]),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin(["NODE_ENV"]),
    new CopyWebpackPlugin([
      {
        from: "src/manifest.json",
        transform: function (content, path) {
          // generates the manifest file using the package.json informations
          return Buffer.from(JSON.stringify({
            description: process.env.npm_package_description,
            version: process.env.npm_package_version,
            ...JSON.parse(content.toString())
          }))
        },
      },
      {
        from: 'src/css/',
        to: 'css'
      },
      {
        from: 'src/vendor/jquery',
        to: 'vendor'
      },
      {
        from: 'src/components',
        to: 'components'
      }
    ]),
    new HtmlWebpackPlugin({
      template: path.join(SRC_DIR, "options.html"),
      filename: "options.html",
      chunks: ["menuApp"]
    }),
    new WriteFilePlugin()
  ]
};

if (env.NODE_ENV === "development") {
  options.devtool = "cheap-module-eval-source-map";
}

module.exports = options;