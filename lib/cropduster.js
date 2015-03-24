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

  suspend: function(maxSuspension) {
    maxSuspension = maxSuspension || 1000;

    CD._readyToCapture = false;
    if (typeof(MICapture) == 'undefined') {
      console.log("suspended, will end in " + maxSuspension + " millis");
    } else {
      MICapture.begin();
    }

    window.onerror = function(message, file, lineNumber) {
      CD.capture();
      console.log(message);
    };
    setTimeout(function() {
      CD.capture();
    }, maxSuspension);
  },

  capture: function() {
    CD._readyToCapture = true;
    if(typeof(MICapture) == 'undefined') {
      console.log("now ready to capture");
    } else {
      MICapture.end();
    }
  },

  getCORS: function(url, options, callback) {
    var args = Array.prototype.slice.call(arguments);

    url = args[0];
    callback = args.pop();
    options = args[1] || {};

    options.corsCacheTime = options.corsCacheTime || 10 * 1000;
    options.maxSuspension = options.maxSuspension || 1000;

    var req = new XMLHttpRequest();
    req.onerror = function () {
      CD.capture();
      console.log("XHR error for " + url);
    };
    req.onload = function() {
      CD.capture();
      callback(this.responseText);
    };

    req.open('GET', CD.proxyUrl(url), true);
    req.setRequestHeader('x-reverse-proxy-ttl', options.corsCacheTime / 1000);

    req.send(null);
    CD.suspend(options.maxSuspension);
  },

  getImage: function(url, options, callback) {
    var args = Array.prototype.slice.call(arguments);

    callback = args.pop();
    url = args[0];
    options = args[1] || {};

    options.maxSuspension = options.maxSuspension || 1000;

    var img = new Image();
    img.onload = function() {
      CD.capture();
      callback(img);
    };
    img.onerror = function() {
      CD.capture();
      callback(null);
    };
    img.src = url;
    CD.suspend(options.maxSuspension);
  },

  getImages: function(urls, options, callback) {
    var args = Array.prototype.slice.call(arguments);

    callback = args.pop();
    url = args[0];
    options = args[1] || {};

    var imagesLeft = urls.length;

    for(var i = 0; i < urls.length; i++) {
      (function(url){

      var img = new Image();
      img.onload = function() {
        imagesLeft -= 1;
        finish();
        callback(img);
      };
      img.onerror = function() {
        imagesLeft -= 1;
        console.log("Error for " + url);
        finish();
      };
        img.src = url;
      })(urls[i]);
    }

    function finish() {
      if(imagesLeft == 0) {
        CD.capture();
      }
    }
  }
};
