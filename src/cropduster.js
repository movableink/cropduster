const CD = {
  CORS_PROXY_SERVER : "http://cors.movableink.com",

  $: function(selector, doc) {
    if(!doc) { doc = document; }
    return Array.prototype.slice.call(doc.querySelectorAll(selector));
  },

  param: function(name) {
    return CD.params()[name];
  },

  params: function(name) {
    if(typeof(CD._urlParams) == "undefined") {
      CD._urlParams = {};
      var match;
      var search = /([^&=]+)=?([^&]*)/g;
      var query  = CD._searchString();
      while (match = search.exec(query))
        CD._urlParams[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
    }
    if (name) {
      return CD._urlParams[name];
    } else {
      return CD._urlParams;
    }
  },

  _searchString: function() {
    return window.location.search.substring(1);
  },

  autofill: function() {
    CD.param("init"); // inits CD._urlParams
    Object.keys(CD._urlParams).forEach(function (key) {
      if (CD._urlParams[key] !== "undefined" && CD._urlParams[key].length > 0) {
        if (document.getElementById("autofill_" + key)) {
          document.getElementById("autofill_" + key).innerHTML = CD._urlParams[key];
        }
      }
    });
  },

  throwError: function(msg) {
    if(typeof(MICapture) == "undefined") {
      CD.log("Capturama error: " + msg);
    } else {
      MICapture.error(msg);
    }
  },

  cancelRequest: function(msg) {
    if(typeof(MICapture) == "undefined") {
      CD.log("Request canceled: " + msg);
    } else {
      MICapture.cancel(msg);
    }
  },

  setImageRedirect: function(imageUrl) {
    var a = document.querySelector("#mi-redirect-image");
    a = a || document.createElement('a');

    a.href = imageUrl;
    a.id = "mi-redirect-image";
    a.style.display = "none";

    document.body.appendChild(a);

    return a;
  },

  setClickthrough: function(url) {
    var a = document.querySelector("#mi_dynamic_link");
    a = a || document.createElement('a');
    a.href = url;
    a.id = "mi_dynamic_link";
    a.style.display = "none";
    document.body.appendChild(a);

    return a;
  },

  setExtraData: function(dataObject) {
    var el = document.querySelector("#mi-data");
    el = el || document.createElement('div');
    el.id = "mi-data";
    el.style.display = "none";

    var existingData;
    try {
      existingData = JSON.parse(el.getAttribute('data-mi-data')) || {};
    } catch(e) {
      // Overwrite if there was something in mi-data that wasn't JSON
      existingData = {};
    }

    for(var i in dataObject) {
      if(dataObject.hasOwnProperty(i)) {
        existingData[i] = dataObject[i];
      }
    }
    el.setAttribute('data-mi-data', JSON.stringify(existingData));
    document.body.appendChild(el);

    return el;
  },

  proxyUrl: function(url) {
    var a = document.createElement('a');
    var port = "";
    a.href = url;

    if (a.port === '0' || a.port === "") {
      port = a.protocol == "https:" ? ":443" : "";
    } else {
      port = ":" + a.port;
    }

    return [
      CD.CORS_PROXY_SERVER,
      "/",
      a.hostname,
      port,
      a.pathname,
      a.search,
      a.hash
    ].join("");
  },

  // internal, do not modify
  _readyToCapture: true,

  _reset: function() {
    CD._readyToCapture = true;
  },

  pause: function(maxSuspension, msg) {
    msg = msg || "manual suspension";

    if(maxSuspension) {
      msg += ", will end in " + maxSuspension + "ms";

      setTimeout(function() {
        MICapture.resume(msg);
      }, maxSuspension);
    }

    if (typeof(MICapture) == 'undefined') {
      CD.log("paused: " + msg);
    } else {
      MICapture.pause(msg);
    }
  },

  resume: function(msg) {
    if(typeof MICapture === 'undefined') {
      CD.log("resuming paused capture: " + msg);
    } else {
      MICapture.resume(msg);
    }
  },

  getCORS: function(url, options, callback) {
    var args = Array.prototype.slice.call(arguments);

    url = args[0];
    callback = args.pop();
    options = args[1] || {};

    options.corsCacheTime = options.corsCacheTime || 10 * 1000;
    if(!url.match(/cors.movableink.com/)) {
      url = CD.proxyUrl(url);
    }

    options.headers = options.headers || {};
    options.headers['x-reverse-proxy-ttl'] = options.corsCacheTime / 1000;
    options.headers['x-mi-cbe'] = this._hashForRequest(url, options);

    return CD.get(url, options, callback);
  },

  get: function(url, options, callback) {
    const args = Array.prototype.slice.call(arguments);

    url = args[0];
    if (typeof options === 'function') {
      options = args[1] || {};
      callback = options;
    }

    return this.getPromise(url, options).then(
      (response) => {
        callback(response.data, response.status, response.contentType);
        return response;
      },
      ({ status }) => {
        callback(null, status);
        return null;
      }
    );
  },

  getPromise: function(url, options) {
    options = options || {};
    const msg = "xhr: " + url;

    return new Promise(function(resolve, reject) {
      try {
        const req = new XMLHttpRequest();

        req.onerror = function () {
          CD.resume(msg);
          CD.log("XHR error for " + url);

          reject({
            status: this.status,
            statusText: req.statusText
          });
        };

        req.onload = function() {
          CD.resume(msg);
          const contentType = this.getResponseHeader('content-type');

          resolve({
            contentType,
            data: this.responseText,
            status: this.status,
          });
        };

        req.open(options.method || 'GET', url, true);

        req.withCredentials = true;

        if(options.headers) {
          for(const header in options.headers) {
            req.setRequestHeader(header, options.headers[header]);
          }
        }

        req.send(options.body);
        CD.pause(options.maxSuspension, msg);
      } catch (error) {
        reject({
          message: `Cropduster failed to create Promise: ${error}`,
          error: error
        });
      }
    });
  },

  getImage(url, options, callback) {
    const args = Array.prototype.slice.call(arguments);

    callback = args.pop();
    url = args[0];
    options = args[1] || {};

    return this.getImagePromise(url, options.maxSuspension).then(
      image => callback(image),
      _ => callback(null)
    );
  },

  getImagePromise(url, maxSuspension) {
    const msg = "getImage: " + url;

    return new Promise(function(resolve, reject) {
      const img = new Image();

      img.onload = function() {
        CD.resume(msg);
        resolve(img);
      };

      img.onerror = function(event) {
        CD.resume(msg);
        reject(event);
      };

      img.src = url;
      CD.pause(maxSuspension, msg);
    });
  },

  getImages(urls, options, afterAll, afterEach) {
    if(typeof(options) === "function") {
      afterEach = afterAll;
      afterAll = options;
      options = {};
    }

    options = options || {};

    return new Promise((resolve, reject) => {
      return this.getImagesPromise(urls, options.maxSuspension, afterEach).then(
        (images) => {
          if (afterAll) {
            afterAll(images);
          }

          resolve(images);
        },
        _ => reject(null)
      );
    });
  },

  getImagesPromise(urls, maxSuspension, afterEach) {
    const msg = 'getImages';
    CD.pause(maxSuspension, msg);

    const promises = urls.map((url) => {
      return this.getImagePromise(url, maxSuspension).then((img) => {
        if (afterEach) {
          afterEach(img);
        }

        return img;
      })
    });

    return Promise.all(promises).then((images) => {
      CD.resume(msg);
      return images;
    });
  },

  waitForAsset: function(assetUrl) {
    if(typeof MICapture === "undefined") {
      CD.log("Wait for asset: " + assetUrl);
    } else {
      MICapture.waitForAsset(assetUrl);
    }
  },

  log: function(message) {
    console.log(message);
  },

  _hashForRequest: function(url, options) {
    var str = url + JSON.stringify(options);
    var hash = 0;
    if (str.length === 0) return hash;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i) & 0xFFFFFFFF;
    }
    return hash.toString();
  }
};

export default CD;
