const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = function(config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    browsers: ['Chrome'],

    // frameworks to use
    frameworks: ['qunit'],

    // list of files / patterns to load in the browser
    files: [
      'tests/**/*.js'
    ],

    // preprocess matching files before serving them to the browser
    preprocessors: {
      'tests/*.js': ['webpack', 'sourcemap']
    },

    webpack: {
      devtool: 'inline-source-map',
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader'
            }
          }
        ]
      }
    },

    webpackMiddleware: {
      noInfo: true
    },

    // list of files to exclude
    exclude: [],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: isDevelopment,


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: !isDevelopment
  });
};
