const DEPRECATION_MESSAGE =
  'callbacks are deprecated in cropduster, prefer using promises for asynchronous operations';

const CD = {
  CORS_PROXY_SERVER: 'http://cors.movableink.com',

  $(selector, doc) {
    if (!doc) {
      doc = document;
    }

    return [...doc.querySelectorAll(selector)];
  },

  _initParams() {
    CD._urlParams = {};
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
    let params = CD._urlParams;
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

  throwError(message) {
    CD.miCaptureFallback(
      () => {
        MICapture.error(message);
      },
      () => {
        CD.log('Capturama error: ' + message);
        CD.notify('error', { message });
      }
    );
  },

  cancelRequest(message) {
    CD.miCaptureFallback(
      () => {
        MICapture.cancel(message);
      },
      () => {
        CD.log(`Request canceled: ${message}`);
        CD.notify('canceled', { message });
      }
    );
  },

  setImageRedirect(imageUrl) {
    const a = document.getElementById('mi-redirect-image') || document.createElement('a');

    a.href = imageUrl;
    a.id = 'mi-redirect-image';
    a.style.display = 'none';

    document.body.appendChild(a);
    CD.notify('imageRedirect', { url: imageUrl });

    return a;
  },

  setClickthrough(url) {
    const a = document.getElementById('mi_dynamic_link') || document.createElement('a');

    a.href = url;
    a.id = 'mi_dynamic_link';
    a.style.display = 'none';

    document.body.appendChild(a);
    CD.notify('clickthrough', { url });

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
    CD.notify('extraData', { data: existingData });

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

    const { hostname, pathname, search, hash } = a;
    return `${CD.CORS_PROXY_SERVER}/${hostname}${port}${pathname}${search}${hash}`;
  },

  // internal, do not modify
  _readyToCapture: true,

  _reset() {
    CD._readyToCapture = true;
  },

  pause(maxSuspension, message = 'manual suspension') {
    if (maxSuspension) {
      message += `, will end in ${maxSuspension}ms`;

      setTimeout(() => {
        CD.resume(message);
      }, maxSuspension);
    }

    CD.miCaptureFallback(
      () => {
        MICapture.pause(message);
      },
      () => {
        CD.log(`paused: ${message}`);
        CD.notify('pause', { message });
      }
    );
  },

  resume(message) {
    CD.miCaptureFallback(
      () => {
        MICapture.resume(message);
      },
      () => {
        CD.log(`resuming paused capture: ${message}`);
        CD.notify('resume', { message });
      }
    );
  },

  getCORS(url, options = {}, callback) {
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

  get(url, options = {}, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    const message = `xhr: ${url}`;
    const deprecatedCallback = function() {
      if (callback && typeof callback === 'function') {
        CD.log(DEPRECATION_MESSAGE);
        return callback(...arguments);
      }
    };

    CD.pause(options.maxSuspension || 0, message);

    return ajaxPromise(url, options)
      .then(response => {
        const contentType = response.getResponseHeader('content-type');
        const { status, responseText: data } = response;

        deprecatedCallback(data, status, contentType);

        return {
          data,
          status,
          contentType,
          response
        };
      })
      .then(
        response => {
          CD.resume(message);
          return response;
        },
        error => {
          CD.log(`Error encountered in CD.get for ${url}: ${error}`);
          CD.resume(message);

          deprecatedCallback(null);

          throw error;
        }
      );
  },

  getImage(url, options = {}, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    const deprecatedCallback = function() {
      if (callback && typeof callback === 'function') {
        CD.log(DEPRECATION_MESSAGE);

        return callback(...arguments);
      }
    };

    const message = `getImage: ${url}`;

    return new Promise(function(resolve, reject) {
      const img = new Image();

      img.onload = function() {
        CD.resume(message);

        deprecatedCallback(img);

        resolve(img);
      };

      img.onerror = function(event) {
        CD.resume(message);

        deprecatedCallback(null);

        reject(event);
      };

      CD.pause(options.maxSuspension, message);
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
  getImages(urls, options = {}, afterEach, afterAll) {
    const message = 'getImages:';
    CD.pause(options.maxSuspension, message);

    if (typeof options === 'function') {
      afterAll = afterEach;
      afterEach = options;
      options = {};
    }

    const promises = urls.map(url => {
      return this.getImage(url, options.maxSuspension).then(img => {
        if (afterEach) {
          afterEach(img);
        }

        return img;
      });
    });

    return Promise.all(promises).then(
      images => {
        if (afterAll) {
          CD.log(DEPRECATION_MESSAGE);
          afterAll(images);
        }

        CD.resume(message);
        return images;
      },
      _ => {
        CD.resume(message);
        throw new Error('Not all images loaded successfully');
      }
    );
  },

  waitForAsset(assetUrl) {
    CD.miCaptureFallback(
      () => {
        MICapture.waitForAsset(assetUrl);
      },
      () => {
        CD.log(`Wait for asset: ${assetUrl}`);
        CD.notify('waitForAsset', { url: assetUrl });
      }
    );
  },

  log(message) {
    console.log(message);
  },

  notify(type, attrs = {}) {
    window.parent && window.parent.postMessage({ type, attrs }, '*');
  },

  miCaptureFallback(ifCapturama, ifBrowser) {
    const loadedInCapturama = !!window.MICapture && typeof window.MICapture === 'object';
    return loadedInCapturama ? ifCapturama() : ifBrowser();
  },

  _hashForRequest(url, options) {
    const str = `${url}${JSON.stringify(options)}`;

    let hash = 0;
    if (str.length === 0) return hash;

    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff;
    }

    return hash.toString();
  }
};

function ajaxPromise(url, options) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();

    req.onerror = function() {
      reject(this.status);
    };

    req.onload = function() {
      resolve(this);
    };

    req.open(options.method || 'GET', url, true);

    if (!options.withoutCredentials) {
      req.withCredentials = true;
    }

    if (options.headers) {
      const { headers } = options;
      Object.keys(headers).forEach(header => {
        req.setRequestHeader(header, headers[header]);
      });
    }

    req.send(options.body);
  });
}

export default CD;
