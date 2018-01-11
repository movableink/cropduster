const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const inDev = process.env.NODE_ENV === 'development';
const plugins = inDev ? [] : [new UglifyJsPlugin({
  uglifyOptions: {
    mangle: {
      // Necessary because of Safari 10 bug
      // https://bugs.webkit.org/show_bug.cgi?id=171041
      safari10: true
    }
  }
})];

const defaultConfig = {
  plugins,
  entry: './src/cropduster.js',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  }
};

const importConfig = {
  output: {
    library: 'cropduster',
    libraryTarget: 'umd',
    filename: 'cropduster.js',
    path: path.resolve(__dirname, 'dist')
  },
  ...defaultConfig
};

const browserConfig = {
  output: {
    library: 'CD',
    libraryTarget: 'var',
    filename: 'cropduster.browser.js',
    path: path.resolve(__dirname, 'dist')
  },
  ...defaultConfig
};

module.exports = [importConfig, browserConfig];
