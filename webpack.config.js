const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');

const defaultConfig = {
  entry: './src/cropduster.js',
  plugins: [new UglifyJsPlugin({ sourceMap: true })],
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['babel-preset-env']
          }
        }
      }
    ]
  }
};

const importConfig = {
  target: 'node',
  output: {
    filename: 'cropduster.js',
    path: path.resolve(__dirname, 'dist')
  },
  ...defaultConfig
};

const browserConfig = {
  target: 'web',
  output: {
    filename: 'cropduster.browser.js',
    path: path.resolve(__dirname, 'dist')
  },
  ...defaultConfig
};

module.exports = [importConfig, browserConfig];
