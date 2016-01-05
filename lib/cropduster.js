window.CD = {
  CORS_PROXY_SERVER : "http://cors.movableink.com",

  $: function(selector, doc) {
    if(!doc) { doc = document; }
    return Array.prototype.slice.call(doc.querySelectorAll(selector));
  },

  param: function(name) {
    if(typeof(CD._urlParams) == "undefined") {
      CD._urlParams = {};
      var match,
        search = /([^&=]+)=?([^&]*)/g,
        query  = window.location.search.substring(1);
      while (match = search.exec(query))
        CD._urlParams[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
    }
    return CD._urlParams[name];
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
    a.href = url;
    var ssl = a.protocol == "https:" ? ":443" : "";

    return [
      CD.CORS_PROXY_SERVER,
      "/",
      a.hostname,
      ssl,
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

  suspend: function(maxSuspension) {
    CD._openCalls++;
    CD._readyToCapture = false;
    if (typeof(MICapture) == 'undefined') {
      CD.log("suspended, will end in " + maxSuspension + " millis");
    } else {
      MICapture.begin();
    }

    if(maxSuspension) {
      setTimeout(function() {
        CD.capture();
      }, maxSuspension);
    }
  },

  capture: function() {
    CD._openCalls--;

    if(CD._openCalls > 0) {
      CD.log("outstanding calls, not capturing");
      return;
    }

    CD._readyToCapture = true;
    if(typeof(MICapture) == 'undefined') {
      CD.log("now ready to capture");
    } else {
      CD.$('body')[0].style.width = CD.$('body')[0].offsetWidth + 'px';
      MICapture.end();
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

    return CD.get(url, options, callback);
  },

  get: function(url, options, callback) {
    var args = Array.prototype.slice.call(arguments);

    url = args[0];
    callback = args.pop();
    options = args[1] || {};

    var req = new XMLHttpRequest();

    req.onerror = function () {
      CD.capture();
      CD.log("XHR error for " + url);
      callback(null);
    };
    req.onload = function() {
      CD.capture();
      callback(this.responseText);
    };

    req.open(options.method || 'GET', url, true);

    if(options.headers) {
      for(var header in options.headers) {
        req.setRequestHeader(header, options.headers[header]);
      }
    }

    req.send(options.body);
    CD.suspend(options.maxSuspension);
  },

  getImage: function(url, options, callback) {
    var args = Array.prototype.slice.call(arguments);

    callback = args.pop();
    url = args[0];
    options = args[1] || {};

    var img = new Image();
    img.onload = function() {
      CD.capture();
      if(callback) { callback(img); }
    };
    img.onerror = function() {
      CD.capture();
      callback(null);
    };
    img.src = url;
    CD.suspend(options.maxSuspension);
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

    CD.suspend(options.maxSuspension);

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
        CD.capture();
        if(callback) {
          callback(imgs);
        }
      }
    }
  },

  log: function(message) {
    console.log(message);
  }
};
