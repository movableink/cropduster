const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');

module.exports = {
  entry: './src/cropduster.js',
  output: {
    filename: 'cropduster.js',
    path: path.resolve(__dirname, 'dist')
  },
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
