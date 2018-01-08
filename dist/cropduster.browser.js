var CD =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
var DEPRECATION_MSG = 'callbacks are deprecated in cropduster, prefer using promises for asynchronous operations';

var CD = {
  CORS_PROXY_SERVER: 'http://cors.movableink.com',

  $: function $(selector, doc) {
    if (!doc) {
      doc = document;
    }
    return Array.prototype.slice.call(doc.querySelectorAll(selector));
  },
  _initParams: function _initParams() {
    CD._urlParams = {};
    var search = /([^&=]+)=?([^&]*)/g;
    var query = CD._searchString();

    var match = search.exec(query);
    while (match) {
      CD._urlParams[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
      match = search.exec(query);
    }
  },
  param: function param(name) {
    return CD.params()[name];
  },
  params: function params(name) {
    var params = CD._urlParams;
    if (typeof params === 'undefined') {
      CD._initParams();
      params = CD._urlParams;
    }

    if (name) {
      return params[name];
    } else {
      return params;
    }
  },
  _searchString: function _searchString() {
    return window.location.search.substring(1);
  },
  autofill: function autofill() {
    CD.param('init'); // inits CD._urlParams
    var params = CD._urlParams;
    for (var key in params) {
      if (params[key] !== 'undefined' && params[key].length > 0) {
        if (document.getElementById('autofill_' + key)) {
          document.getElementById('autofill_' + key).innerHTML = params[key];
        }
      }
    }
  },
  throwError: function throwError(msg) {
    if (typeof MICapture === 'undefined') {
      CD.log('Capturama error: ' + msg);
    } else {
      MICapture.error(msg);
    }
  },
  cancelRequest: function cancelRequest(msg) {
    if (typeof MICapture === 'undefined') {
      CD.log('Request canceled: ' + msg);
    } else {
      MICapture.cancel(msg);
    }
  },
  setImageRedirect: function setImageRedirect(imageUrl) {
    var a = document.getElementById('mi-redirect-image') || document.createElement('a');

    a.href = imageUrl;
    a.id = 'mi-redirect-image';
    a.style.display = 'none';

    document.body.appendChild(a);

    return a;
  },
  setClickthrough: function setClickthrough(url) {
    var a = document.getElementById('mi_dynamic_link') || document.createElement('a');

    a.href = url;
    a.id = 'mi_dynamic_link';
    a.style.display = 'none';

    document.body.appendChild(a);

    return a;
  },
  setExtraData: function setExtraData(dataObject) {
    var el = document.getElementById('mi-data') || document.createElement('div');

    el.id = 'mi-data';
    el.style.display = 'none';

    var existingData = void 0;
    try {
      existingData = JSON.parse(el.getAttribute('data-mi-data')) || {};
    } catch (_) {
      // Overwrite if there was something in mi-data that wasn't JSON
      existingData = {};
    }

    for (var key in dataObject) {
      if (dataObject.hasOwnProperty(key)) {
        existingData[key] = dataObject[key];
      }
    }

    el.setAttribute('data-mi-data', JSON.stringify(existingData));
    document.body.appendChild(el);

    return el;
  },
  proxyUrl: function proxyUrl(url) {
    var a = document.createElement('a');
    a.href = url;

    var port = '';
    if (a.port === '0' || a.port === '') {
      port = a.protocol === 'https:' ? ':443' : '';
    } else {
      port = ':' + a.port;
    }

    var hostname = a.hostname,
        pathname = a.pathname,
        search = a.search,
        hash = a.hash;

    return CD.CORS_PROXY_SERVER + '/' + hostname + port + pathname + search + hash;
  },


  // internal, do not modify
  _readyToCapture: true,

  _reset: function _reset() {
    CD._readyToCapture = true;
  },
  pause: function pause(maxSuspension, msg) {
    msg = msg || 'manual suspension';

    if (maxSuspension) {
      msg += ', will end in ' + maxSuspension + 'ms';

      setTimeout(function () {
        MICapture.resume(msg);
      }, maxSuspension);
    }

    if (typeof MICapture === 'undefined') {
      CD.log('paused: ' + msg);
    } else {
      MICapture.pause(msg);
    }
  },
  resume: function resume(msg) {
    if (typeof MICapture === 'undefined') {
      CD.log('resuming paused capture: ' + msg);
    } else {
      MICapture.resume(msg);
    }
  },
  getCORS: function getCORS(url) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {};

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    options.corsCacheTime = options.corsCacheTime || 10 * 1000;
    if (!/cors.movableink.com/.test(url)) {
      url = CD.proxyUrl(url);
    }

    options.headers = options.headers || {};
    options.headers['x-reverse-proxy-ttl'] = options.corsCacheTime / 1000;
    options.headers['x-mi-cbe'] = this._hashForRequest(url, options);

    return CD.get(url, options, callback);
  },
  get: function get(url) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {};

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    var deprecatedCallback = function deprecatedCallback() {
      if (callback && typeof callback === 'function') {
        CD.log(DEPRECATION_MSG);
        return callback.apply(undefined, arguments);
      }
    };

    var msg = 'xhr: ' + url;

    return new Promise(function (resolve, reject) {
      try {
        var req = new XMLHttpRequest();

        req.onerror = function () {
          CD.resume(msg);
          CD.log('XHR error for ' + url);

          deprecatedCallback(null);

          reject({
            status: this.status,
            statusText: req.statusText
          });
        };

        req.onload = function () {
          CD.resume(msg);

          var contentType = this.getResponseHeader('content-type');
          var data = this.responseText;
          var status = this.status;

          deprecatedCallback(data, status, contentType);

          resolve({
            contentType: contentType,
            data: data,
            status: status
          });
        };

        req.open(options.method || 'GET', url, true);

        req.withCredentials = true;

        if (options.headers) {
          for (var header in options.headers) {
            req.setRequestHeader(header, options.headers[header]);
          }
        }

        req.send(options.body);
        CD.pause(options.maxSuspension, msg);
      } catch (error) {
        deprecatedCallback(null);

        reject({
          message: 'Cropduster failed to create Promise: ' + error,
          error: error
        });
      }
    });
  },
  getImage: function getImage(url) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {};

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    var deprecatedCallback = function deprecatedCallback() {
      if (callback && typeof callback === 'function') {
        CD.log(DEPRECATION_MSG);

        return callback.apply(undefined, arguments);
      }
    };

    var msg = 'getImage: ' + url;

    return new Promise(function (resolve, reject) {
      var img = new Image();

      img.onload = function () {
        CD.resume(msg);

        deprecatedCallback(img);

        resolve(img);
      };

      img.onerror = function (event) {
        CD.resume(msg);

        deprecatedCallback(null);

        reject(event);
      };

      CD.pause(options.maxSuspension, msg);
      img.src = url;
    });
  },


  /**
   * NOTE: getImages is intended to be used with promises. The `afterAll` callback is
   * now deprecated, and the order of the afterEach and afterAll arguments has
   * been reversed since previous versions of cropduster.
   *
   * To achieve the same effect, users should pass a single callback into the
   * arguments for getImages, and then use a `.then` call to handle any actions
   * after all images have finished loading.
   *
   * If any image fails to load, the Promise will reject.
   */
  getImages: function getImages(urls) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var _this = this;

    var afterEach = arguments[2];
    var afterAll = arguments[3];

    var msg = 'getImages:';
    CD.pause(options.maxSuspension, msg);

    if (typeof options === 'function') {
      afterAll = afterEach;
      afterEach = options;
      options = {};
    }

    var promises = urls.map(function (url) {
      return _this.getImage(url, options.maxSuspension).then(function (img) {
        if (afterEach) {
          afterEach(img);
        }

        return img;
      });
    });

    return Promise.all(promises).then(function (images) {
      if (afterAll) {
        CD.log(DEPRECATION_MSG);
        afterAll(images);
      }

      CD.resume(msg);
      return images;
    }, function (_) {
      CD.resume(msg);
      throw new Error('Not all images loaded successfully');
    });
  },
  waitForAsset: function waitForAsset(assetUrl) {
    if (typeof MICapture === 'undefined') {
      CD.log('Wait for asset: ' + assetUrl);
    } else {
      MICapture.waitForAsset(assetUrl);
    }
  },
  log: function log(message) {
    console.log(message);
  },
  _hashForRequest: function _hashForRequest(url, options) {
    var str = '' + url + JSON.stringify(options);

    var hash = 0;
    if (str.length === 0) return hash;

    for (var i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i) & 0xffffffff;
    }

    return hash.toString();
  }
};

exports.default = CD;
module.exports = exports['default'];

/***/ })
/******/ ]);
//# sourceMappingURL=cropduster.browser.js.map