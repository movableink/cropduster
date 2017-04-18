var container = $("<div style='position: absolute; left: -5000px;'></div>").appendTo('body');

// Disable debugging output
CD.log = function() {};

var imageSuccessStub = function() {
  var self = this;
  setTimeout(function() {
    self.onload();
  }, 1);
};

var imageFailureStub = function() {
  var self = this;
  setTimeout(function() {
    self.onerror();
  }, 1);
};

QUnit.test("CD.$", function() {
  equal(CD.$('body')[0], document.body, "finds elements" );
});

QUnit.test("CD.param when parameter not found", function() {
  equal(CD.param('not_found'), null, "returns null");
});

// can't test CD.param returning query params from here, unfortunately...

QUnit.test("CD.autofill", function() {
  container.html('');
  var el = $("<div id='autofill_foo'></div>");
  container.append(el);

  CD._urlParams = {foo: 'bar'};
  CD.autofill();
  equal(el.html(), 'bar', "auto-fills the query param into the element");
});

QUnit.test("CD.setImageRedirect", function() {
  CD.setImageRedirect("http://example.com/foo.png");

  equal($("#mi-redirect-image").attr('href'), "http://example.com/foo.png",
        "sets the image redirect");
});

QUnit.test("CD.setImageRedirect multiple times", function() {
  CD.setImageRedirect("http://example.com/foo.png");
  CD.setImageRedirect("http://example.com/bar.png");

  equal($("#mi-redirect-image").attr('href'), "http://example.com/bar.png",
        "uses the last setImageRedirect url");
});

QUnit.test("CD.setClickthrough", function() {
  CD.setClickthrough("http://example.com/");

  equal($("#mi_dynamic_link").attr('href'), "http://example.com/",
        "sets the dynamic link");
});

QUnit.test("CD.setExtraData with no existing data", function() {
  CD.setExtraData({foo: 'bar'});

  equal($("#mi-data").attr('data-mi-data'), '{"foo":"bar"}',
        "sets the data in json");
});

QUnit.test("CD.setExtraData with existing data", function() {
  CD.setExtraData({foo: 'bar'});
  CD.setExtraData({foo: 'baz'});
  CD.setExtraData({my: 'data'});

  equal($("#mi-data").attr('data-mi-data'), '{"foo":"baz","my":"data"}',
        "sets the data in json");
});

QUnit.test("CD.proxyUrl with http url", function() {
  var url = "http://google.com";
  equal(CD.proxyUrl(url), "http://cors.movableink.com/google.com/", "returns CORS url");
});

QUnit.test("CD.proxyUrl with https url", function() {
  var url = "https://google.com";
  equal(CD.proxyUrl(url), "http://cors.movableink.com/google.com:443/", "returns CORS url");
});

QUnit.test("CD.proxyUrl with port", function() {
  var url = "http://google.com:8080";
  equal(CD.proxyUrl(url), "http://cors.movableink.com/google.com:8080/", "returns CORS url");
});

test("CD.suspend", function() {
  CD._reset(); // clean out previous test
  CD.suspend();
  equal(CD._readyToCapture, false, "sets readyToCapture");
});

test("CD.capture", function() {
  CD._reset(); // clean out previous test
  CD.capture();
  equal(CD._readyToCapture, true, "sets readyToCapture");
});

QUnit.test("CD.getImage load success", function(assert) {
  var done = assert.async();
  window.Image = imageSuccessStub;
  var src = "http://example.com/foo.png";
  CD.getImage(src, function(img) {
    equal(img.src, src, "called with src");
    done();
  });
});

QUnit.test("CD.getImage load failure", function(assert) {
  var done = assert.async();
  window.Image = imageFailureStub;
  var src = "http://example.com/foo.png";
  CD.getImage(src, function(img) {
    equal(img, null, "called with null");
    done();
  });
});

QUnit.test("CD.getImages without callback", function(assert) {
  expect(0);
  window.Image = imageSuccessStub;
  var srcA = "http://example.com/foo.png";
  var srcB = "http://example.com/bar.png";
  CD.getImages([srcA, srcB]);
});

QUnit.test("CD.getImages with callback", function(assert) {
  var done = assert.async();
  window.Image = imageSuccessStub;
  var srcA = "http://example.com/foo.png";
  var srcB = "http://example.com/bar.png";
  var cb = sinon.spy();
  CD.getImages([srcA, srcB], cb);

  setTimeout(function() {
    ok(cb.calledOnce);
    equal(cb.firstCall.args[0].length, 2);
    done();
  }, 10);
});

QUnit.test("CD.getImages with callback and single image callback", function(assert) {
  var done = assert.async();
  window.Image = imageSuccessStub;
  var srcA = "http://example.com/foo.png";
  var srcB = "http://example.com/bar.png";
  var cb = sinon.spy();
  var singleCb = sinon.spy();
  CD.getImages([srcA, srcB], cb, singleCb);

  setTimeout(function() {
    ok(cb.calledOnce, "callback is called only once");
    equal(cb.firstCall.args[0].length, 2, "called with both images");

    ok(singleCb.calledTwice, "single image callback is called for each image");
    equal(singleCb.firstCall.args[0].src, srcA, "first image called first");
    equal(singleCb.secondCall.args[0].src, srcB, "last image called last");

    done();
  }, 10);
});

QUnit.test("CD.get with response", function(assert) {
  var server = sinon.fakeServer.create();

  server.respondWith([200, {"Content-Type": "text/html"}, "response"]);

  var spy = sinon.spy();

  CD.get("http://google.com", {
    headers: {
      'Accept': 'application/json'
    }
  }, spy);

  server.respond();

  ok(spy.calledWith('response'), 'calls the callback with a response');

  server.restore();
});

QUnit.test("CD.get with a failing response", function(assert) {
  var server = sinon.fakeServer.create();

  var spy = sinon.spy();

  CD.get("http://google.com", {
    headers: {
      'Accept': 'application/json'
    }
  }, spy);

  server.requests[0].abort();

  ok(spy.calledWith(null), 'calls the callback with a response');

  server.restore();
});


QUnit.test("CD.get", function(assert) {
  var xhr = sinon.useFakeXMLHttpRequest();
  var requests = this.requests = [];
  xhr.onCreate = function (xhr) {
    requests.push(xhr);
  };

  var spy = sinon.spy();

  CD.get("http://google.com", {
    corsCacheTime: 5000,
    headers: {
      'Accept': 'application/json'
    }
  }, spy);

  equal(requests.length, 1);
  equal(requests[0].requestHeaders['x-reverse-proxy-ttl'], null); // not automatically added
  equal(requests[0].requestHeaders['Accept'], 'application/json');
  equal(requests[0].method, 'GET');
  equal(requests[0].async, true);
  equal(requests[0].url, "http://google.com");

  xhr.restore();
});

QUnit.test("CD.getCORS", function(assert) {
  var xhr = sinon.useFakeXMLHttpRequest();
  var requests = this.requests = [];
  xhr.onCreate = function (xhr) {
    requests.push(xhr);
  };

  var spy = sinon.spy();

  CD.getCORS("http://google.com", {
    corsCacheTime: 5000,
    headers: {
      'Accept': 'application/json'
    }
  }, spy);

  equal(requests.length, 1);
  equal(requests[0].requestHeaders['x-reverse-proxy-ttl'], 5);
  equal(requests[0].requestHeaders['x-mi-cbe'], '-2134781906');
  equal(requests[0].requestHeaders['Accept'], 'application/json');
  equal(requests[0].method, 'GET');
  equal(requests[0].async, true);
  equal(requests[0].url, "http://cors.movableink.com/google.com/");

  xhr.restore();
});

QUnit.test("CD.getCORS without options", function(assert) {
  var xhr = sinon.useFakeXMLHttpRequest();
  var requests = this.requests = [];
  xhr.onCreate = function (xhr) {
    requests.push(xhr);
  };

  var spy = sinon.spy();

  CD.getCORS("http://google.com", spy);

  equal(requests.length, 1);
  equal(requests[0].requestHeaders['x-reverse-proxy-ttl'], 10);
  equal(requests[0].requestHeaders['x-mi-cbe'], '2084411041');
  equal(requests[0].url, "http://cors.movableink.com/google.com/");

  xhr.restore();
});

QUnit.test("CD.getProfile", function(assert) {
  var xhr = sinon.useFakeXMLHttpRequest();
  var requests = this.requests = [];
  xhr.onCreate = function (xhr) {
    requests.push(xhr);
  };

  var spy = sinon.spy();
  var profiles = CD.getProfile("6225", "mierictest", "cart_abandon", spy);

  this.requests[0].respond(200, { "Content-Type": "application/json" },
    '[{ "product_url": "www.product.com", "event_type": "cart_add" }, { "product_url": "www.product.com", "event_type": "conversion" }, { "product_url": "www.product2.com", "event_type": "cart_add" }]');

  equal(requests[0].url, "http://cors.movableink.com/profile.movableink.com:8081/company/6225/profile/mierictest");
  sinon.assert.calledWith(spy, ["www.product2.com"]);

  xhr.restore();
});

QUnit.test("CD.getCORS with POST", function(assert) {
  var xhr = sinon.useFakeXMLHttpRequest();
  var requests = this.requests = [];
  xhr.onCreate = function (xhr) {
    requests.push(xhr);
  };

  var spy = sinon.spy();

  CD.getCORS("http://google.com", {
    corsCacheTime: 5000,
    method: 'POST',
    body: 'foobar',
    headers: {
      'Accept': 'application/json'
    }
  }, spy);

  equal(requests.length, 1);
  equal(requests[0].requestHeaders['x-reverse-proxy-ttl'], 5);
  equal(requests[0].requestHeaders['Accept'], 'application/json');
  equal(requests[0].requestHeaders['x-mi-cbe'], '-1217831332');
  equal(requests[0].method, 'POST');
  equal(requests[0].async, true);
  equal(requests[0].requestBody, 'foobar');
  equal(requests[0].url, "http://cors.movableink.com/google.com/");

  xhr.restore();
});

QUnit.test("concurrent calls", function(assert) {
  CD._reset();

  CD.suspend(1000); // 1 open call
  CD.suspend(500); // 2 open calls
  CD.capture(); // 1 open call
  CD.suspend(1000); // 2 open calls

  CD.capture(); // 1 open call
  equal(CD._readyToCapture, false, "waits for open calls to get to zero");
  equal(CD._openCalls, 1, "one open call");

  CD.capture(); // 0 open calls
  equal(CD._readyToCapture, true, "sets readyToCapture");
  equal(CD._openCalls, 0, "zero open calls");
});


QUnit.test("_hashForRequest", function(assert) {
  var hash = CD._hashForRequest("http://www.google.com", {"foo": "bar"});
  equal(hash, "387990350");
  hash = CD._hashForRequest("http://www.google.com", {"foo": "bar"});
  equal(hash, "387990350");
  var different = CD._hashForRequest("http://www.google.com", {"foo": "baz"});
  equal(different, "387998038");
  var another = CD._hashForRequest("http://www.example.com", {"foo": "baz"});
  equal(another, "-164085129");
});

QUnit.test("CD.cancelRequest", function(assert) {
  var callback = sinon.spy();
  window.MICapture = { cancel: callback };
  CD.cancelRequest();
  ok(callback.calledOnce);
});

QUnit.test("CD.throwError", function(assert) {
  var callback = sinon.spy();
  window.MICapture = { error: callback };
  CD.throwError();
  ok(callback.calledOnce);
});
