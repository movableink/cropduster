const CD = {
  CORS_PROXY_SERVER : "http://cors.movableink.com",

  $(selector, doc) {
    if(!doc) { doc = document; }
    return Array.prototype.slice.call(doc.querySelectorAll(selector));
  },

  param(name) {
    return CD.params()[name];
  },

  params(name) {
    if (typeof(CD._urlParams) === 'undefined') {
      CD._urlParams = {};
      const search = /([^&=]+)=?([^&]*)/g;
      const query  = CD._searchString();
      let match = search.exec(query);
      while (match) {
        CD._urlParams[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
        match = search.exec(query);
      }
    }

    if (name) {
      return CD._urlParams[name];
    } else {
      return CD._urlParams;
    }
  },

  _searchString() {
    return window.location.search.substring(1);
  },

  autofill() {
    CD.param("init"); // inits CD._urlParams
    Object.keys(CD._urlParams).forEach(function (key) {
      if (CD._urlParams[key] !== "undefined" && CD._urlParams[key].length > 0) {
        if (document.getElementById("autofill_" + key)) {
          document.getElementById("autofill_" + key).innerHTML = CD._urlParams[key];
        }
      }
    });
  },

  throwError(msg) {
    if (typeof MICapture === "undefined") {
      CD.log("Capturama error: " + msg);
    } else {
      MICapture.error(msg);
    }
  },

  cancelRequest(msg) {
    if (typeof MICapture === "undefined") {
      CD.log("Request canceled: " + msg);
    } else {
      MICapture.cancel(msg);
    }
  },

  setImageRedirect(imageUrl) {
    const a = document.querySelector("#mi-redirect-image") || document.createElement('a');

    a.href = imageUrl;
    a.id = "mi-redirect-image";
    a.style.display = "none";

    document.body.appendChild(a);

    return a;
  },

  setClickthrough(url) {
    const a = document.querySelector("#mi_dynamic_link") || document.createElement('a');

    a.href = url;
    a.id = "mi_dynamic_link";
    a.style.display = "none";

    document.body.appendChild(a);

    return a;
  },

  setExtraData(dataObject) {
    const el = document.querySelector("#mi-data") || document.createElement('div');
    el.id = "mi-data";
    el.style.display = "none";

    let existingData;
    try {
      existingData = JSON.parse(el.getAttribute('data-mi-data')) || {};
    } catch(e) {
      // Overwrite if there was something in mi-data that wasn't JSON
      existingData = {};
    }

    for (const i in dataObject) {
      if (dataObject.hasOwnProperty(i)) {
        existingData[i] = dataObject[i];
      }
    }

    el.setAttribute('data-mi-data', JSON.stringify(existingData));
    document.body.appendChild(el);

    return el;
  },

  proxyUrl(url) {
    const a = document.createElement('a');
    let port = "";
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

  _reset() {
    CD._readyToCapture = true;
  },

  pause(maxSuspension, msg) {
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

  getCORS(url, options = {}, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    if (!url.match(/cors.movableink.com/)) {
      url = CD.proxyUrl(url);
    }

    options.corsCacheTime = options.corsCacheTime || 10 * 1000;
    options.headers = options.headers || {};
    options.headers['x-reverse-proxy-ttl'] = options.corsCacheTime / 1000;
    options.headers['x-mi-cbe'] = this._hashForRequest(url, options);

    return CD.get(url, options, callback);
  },

  get(url, options = {}, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    const deprecatedCallback = function() {
      if (callback && typeof callback === 'function') {
        CD.log('callbacks are deprecated in cropduster, prefer using promises with asynchronous operations');
        return callback(...arguments);
      }
    };

    const msg = `XHR: ${url}`;
    CD.pause(options.maxSuspension || 0, msg);

    const requestOptions = CD._optionsForFetch(options);

    return fetch(url, requestOptions).then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const status = response.status;
      const contentType = response.headers.get('content-type');

      return response.text().then(data => {
        deprecatedCallback(data, status, contentType);

        return {
          data,
          status,
          contentType
        };
      });
    }).catch((error) => {
      CD.log(`XHR error for ${url}: ${error}`);

      deprecatedCallback(null);

      throw error;
    }).then(
      () => CD.resume(msg),
      () => CD.resume(msg)
    );
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

  waitForAsset(assetUrl) {
    if(typeof MICapture === "undefined") {
      CD.log("Wait for asset: " + assetUrl);
    } else {
      MICapture.waitForAsset(assetUrl);
    }
  },

  log(message) {
    console.log(message);
  },

  _hashForRequest(url, options) {
    var str = url + JSON.stringify(options);
    var hash = 0;
    if (str.length === 0) return hash;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i) & 0xFFFFFFFF;
    }
    return hash.toString();
  },

  _optionsForFetch(options) {
    return {
      credentials: 'include',
      redirect: 'follow',
      headers: new Headers(options.headers || {}),
      method: options.method || 'GET',
      body: options.body,
      mode: 'cors'
    };
  }
};

export default CD;
