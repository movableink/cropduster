const CD = {
  CORS_PROXY_SERVER: 'http://cors.movableink.com',

  $(selector, doc) {
    if(!doc) { doc = document; }
    return Array.prototype.slice.call(doc.querySelectorAll(selector));
  },

  _initParams() {
    const search = /([^&=]+)=?([^&]*)/g;
    const query = CD._searchString();

    let match = search.exec(query);
    while (match) {
      CD._urlParams[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
      match = search.exec(query);
    }
  },

  param(name) {
    return CD.params()[name];
  },

  params(name) {
    let params = CD._urlParams || {};
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

  _searchString() {
    return window.location.search.substring(1);
  },

  autofill() {
    CD.param('init'); // inits CD._urlParams
    const params = CD._urlParams;
    for (const key in params) {
      if (params[key] !== 'undefined' && params[key].length > 0) {
        if (document.getElementById(`autofill_${key}`)) {
          document.getElementById(`autofill_${key}`).innerHTML = params[key];
        }
      }
    }
  },

  throwError(msg) {
    if (typeof MICapture  === 'undefined') {
      CD.log('Capturama error: ' + msg);
    } else {
      MICapture.error(msg);
    }
  },

  cancelRequest(msg) {
    if (typeof MICapture === 'undefined') {
      CD.log(`Request canceled: ${msg}`);
    } else {
      MICapture.cancel(msg);
    }
  },

  setImageRedirect(imageUrl) {
    const a = document.getElementById('mi-redirect-image') || document.createElement('a');

    a.href = imageUrl;
    a.id = 'mi-redirect-image';
    a.style.display = 'none';

    document.body.appendChild(a);

    return a;
  },

  setClickthrough(url) {
    const a = document.getElementById('mi_dynamic_link') || document.createElement('a');

    a.href = url;
    a.id = 'mi_dynamic_link';
    a.style.display = 'none';

    document.body.appendChild(a);

    return a;
  },

  setExtraData(dataObject) {
    const el = document.getElementById('mi-data') || document.createElement('div');

    el.id = 'mi-data';
    el.style.display = 'none';

    let existingData;
    try {
      existingData = JSON.parse(el.getAttribute('data-mi-data')) || {};
    } catch (_) {
      // Overwrite if there was something in mi-data that wasn't JSON
      existingData = {};
    }

    for (const key in dataObject) {
      if (dataObject.hasOwnProperty(key)) {
        existingData[key] = dataObject[key];
      }
    }

    el.setAttribute('data-mi-data', JSON.stringify(existingData));
    document.body.appendChild(el);

    return el;
  },

  proxyUrl(url) {
    const a = document.createElement('a');
    a.href = url;

    let port = '';
    if (a.port === '0' || a.port === '') {
      port = a.protocol === 'https:' ? ':443' : '';
    } else {
      port = `:${a.port}`;
    }

    return [
      CD.CORS_PROXY_SERVER,
      '/',
      a.hostname,
      port,
      a.pathname,
      a.search,
      a.hash
    ].join('');
  },

  // internal, do not modify
  _readyToCapture: true,

  _reset() {
    CD._readyToCapture = true;
  },

  pause(maxSuspension, msg) {
    msg = msg || 'manual suspension';

    if (maxSuspension) {
      msg += `, will end in ${maxSuspension}ms`;

      setTimeout(() => {
        MICapture.resume(msg);
      }, maxSuspension);
    }

    if (typeof MICapture === 'undefined') {
      CD.log(`paused: ${msg}`);
    } else {
      MICapture.pause(msg);
    }
  },

  resume(msg) {
    if(typeof MICapture === 'undefined') {
      CD.log(`resuming paused capture: ${msg}`);
    } else {
      MICapture.resume(msg);
    }
  },

  getCORS(url, options = {}, callback = () => {}) {
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

  get(url, options = {}, callback = () => {}) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
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

  getPromise(url, options = {}) {
    const msg = `xhr: ${url}`;

    return new Promise(function(resolve, reject) {
      try {
        const req = new XMLHttpRequest();

        req.onerror = function () {
          CD.resume(msg);
          CD.log(`XHR error for ${url}`);

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

  getImage(url, options = {}, callback = () => {}) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    return this.getImagePromise(url, options.maxSuspension).then(
      image => callback(image),
      _ => callback(null)
    );
  },

  getImagePromise(url, maxSuspension) {
    const msg = `getImage: ${url}`;

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

  getImages(urls, options = {}, afterAll, afterEach) {
    if (typeof options === 'function') {
      afterEach = afterAll;
      afterAll = options;
      options = {};
    }

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
    if (typeof MICapture === 'undefined') {
      CD.log(`Wait for asset: ${assetUrl}`);
    } else {
      MICapture.waitForAsset(assetUrl);
    }
  },

  log(message) {
    console.log(message);
  },

  _hashForRequest(url, options) {
    const str = `${url}${JSON.stringify(options)}`;

    let hash = 0;
    if (str.length === 0) return hash;

    for (const i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i) & 0xFFFFFFFF;
    }

    return hash.toString();
  }
};

export default CD;
