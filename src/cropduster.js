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

  _openCalls: 0,

  _reset: function() {
    CD._openCalls = 0;
    CD._readyToCapture = true;
  },

  suspend: function(maxSuspension, msg) {
    msg = msg || "manual suspension";

    if(maxSuspension) {
      msg += ", will end in " + maxSuspension + "ms";

      setTimeout(function() {
        CD.capture(msg);
      }, maxSuspension);
    }

    CD._openCalls++;
    CD._readyToCapture = false;
    if (typeof(MICapture) == 'undefined') {
      CD.log("suspended: " + msg);
    } else {
      MICapture.begin(msg);
    }
  },

  capture: function(msg) {
    CD._openCalls--;

    if(CD._openCalls > 0) {
      CD.log("outstanding calls, not capturing: " + msg);
      return;
    }

    CD._readyToCapture = true;
    if(typeof(MICapture) == 'undefined') {
      CD.log("now ready to capture: " + msg);
    } else {
      CD.$('body')[0].style.width = CD.$('body')[0].offsetWidth + 'px';
      MICapture.end(msg);
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
    var args = Array.prototype.slice.call(arguments);

    url = args[0];
    callback = args.pop();
    options = args[1] || {};

    var msg = "xhr: " + url;

    var req = new XMLHttpRequest();

    req.onerror = function () {
      CD.capture(msg);
      CD.log("XHR error for " + url);
      callback(null, this.status);
    };
    req.onload = function() {
      CD.capture(msg);
      var contentType = this.getResponseHeader('content-type');
      callback(this.responseText, this.status, contentType);
    };

    req.open(options.method || 'GET', url, true);

    req.withCredentials = options.withCredentials || false;

    if(options.headers) {
      for(var header in options.headers) {
        req.setRequestHeader(header, options.headers[header]);
      }
    }

    req.send(options.body);
    CD.suspend(options.maxSuspension, msg);
  },

  getImage: function(url, options, callback) {
    var args = Array.prototype.slice.call(arguments);

    callback = args.pop();
    url = args[0];
    options = args[1] || {};
    var msg = "getImage: " + url;

    var img = new Image();
    img.onload = function() {
      CD.capture(msg);
      if(callback) { callback(img); }
    };
    img.onerror = function() {
      CD.capture(msg);
      callback(null);
    };
    img.src = url;
    CD.suspend(options.maxSuspension, msg);
  },

  getImages: function(urls, options, callback, singleCallback) {
    if(typeof(options) === "function") {
      singleCallback = callback;
      callback = options;
      options = {};
    }

    options = options || {};

    var imagesLeft = urls.length;
    var imgs = [];
    var calledIndex = -1;
    var msg = "getImages";

    for(var i = 0; i < urls.length; i++) {
      (function(url, i){

        var img = new Image();

        img.onload = function() {
          imagesLeft -= 1;
          imgs[i] = img;
          callbackNext();
          finish();
        };
        img.onerror = function() {
          imagesLeft -= 1;
          CD.log("Image load error for " + url);
          finish();
        };

        img.src = url;
      })(urls[i], i);
    }

    CD.suspend(options.maxSuspension, msg);

    function callbackNext() {
      var next = calledIndex + 1;
      if(imgs[next]) {
        if(singleCallback) {
          singleCallback(imgs[next]);
        }
        calledIndex = next;
        callbackNext();
      }
    }

    function finish() {
      if(imagesLeft == 0) {
        CD.capture(msg);
        if(callback) {
          callback(imgs);
        }
      }
    }
  },

  waitForAsset: function(assetUrl) {
    if(typeof(MICapture) == "undefined") {
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
