import CD from '../src/cropduster';
import jQuery from 'jquery';
import sinon from 'sinon';

const container = jQuery("<div style='position: absolute; left: -5000px;'></div>").appendTo('body');

// Disable debugging output
CD.log = function() {};

// Stub out search string
CD._searchString = function() {
  return 'foo=bar&baz%20test=quux%20value';
};

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

QUnit.test("CD.$", function(assert) {
  assert.equal(CD.$('body')[0], document.body, "finds elements" );
});

QUnit.test("CD.param when parameter not found", function(assert) {
  assert.equal(CD.param('not_found'), null, "returns null");
});

QUnit.test("CD.param when parameter is found", function(assert) {
  assert.equal(CD.param('foo'), 'bar', "returns value");
});

QUnit.test("CD.params returns all query params", function(assert) {
  assert.deepEqual(CD.params(), {'baz test': 'quux value', foo: 'bar'}, "returns the url params");
});

QUnit.test("CD.params with argument returns that query param", function(assert) {
  assert.equal(CD.params('baz test'), 'quux value', "returns the url param");
});

// can't test CD.param returning query params from here, unfortunately...

QUnit.test("CD.autofill", function(assert) {
  container.html('');
  var el = jQuery("<div id='autofill_foo'></div>");
  container.append(el);

  CD.autofill();
  assert.equal(el.html(), 'bar', "auto-fills the query param into the element");
});

QUnit.test("CD.setImageRedirect", function(assert) {
  CD.setImageRedirect("http://example.com/foo.png");

  assert.equal(jQuery("#mi-redirect-image").attr('href'), "http://example.com/foo.png",
        "sets the image redirect");
});

QUnit.test("CD.setImageRedirect multiple times", function(assert) {
  CD.setImageRedirect("http://example.com/foo.png");
  CD.setImageRedirect("http://example.com/bar.png");

  assert.equal(jQuery("#mi-redirect-image").attr('href'), "http://example.com/bar.png",
        "uses the last setImageRedirect url");
});

QUnit.test("CD.setClickthrough", function(assert) {
  CD.setClickthrough("http://example.com/");

  assert.equal(jQuery("#mi_dynamic_link").attr('href'), "http://example.com/",
        "sets the dynamic link");
});

QUnit.test("CD.setExtraData with no existing data", function(assert) {
  CD.setExtraData({foo: 'bar'});

  assert.equal(jQuery("#mi-data").attr('data-mi-data'), '{"foo":"bar"}',
        "sets the data in json");
});

QUnit.test("CD.setExtraData with existing data", function(assert) {
  CD.setExtraData({foo: 'bar'});
  CD.setExtraData({foo: 'baz'});
  CD.setExtraData({my: 'data'});

  assert.equal(jQuery("#mi-data").attr('data-mi-data'), '{"foo":"baz","my":"data"}',
        "sets the data in json");
});

QUnit.test("CD.proxyUrl with http url", function(assert) {
  var url = "http://google.com";
  assert.equal(CD.proxyUrl(url), "http://cors.movableink.com/google.com/", "returns CORS url");
});

QUnit.test("CD.proxyUrl with https url", function(assert) {
  var url = "https://google.com";
  assert.equal(CD.proxyUrl(url), "http://cors.movableink.com/google.com:443/", "returns CORS url");
});

QUnit.test("CD.proxyUrl with port", function(assert) {
  var url = "http://google.com:8080";
  assert.equal(CD.proxyUrl(url), "http://cors.movableink.com/google.com:8080/", "returns CORS url");
});

QUnit.test("CD.suspend", function(assert) {
  CD._reset(); // clean out previous test
  CD.suspend();
  assert.equal(CD._readyToCapture, false, "sets readyToCapture");
});

QUnit.test("CD.capture", function(assert) {
  CD._reset(); // clean out previous test
  CD.capture();
  assert.equal(CD._readyToCapture, true, "sets readyToCapture");
});

QUnit.test("CD.getImage load success", function(assert) {
  var done = assert.async();
  window.Image = imageSuccessStub;
  var src = "http://example.com/foo.png";
  CD.getImage(src, function(img) {
    assert.equal(img.src, src, "called with src");
    done();
  });
});

QUnit.test("CD.getImage load failure", function(assert) {
  var done = assert.async();
  window.Image = imageFailureStub;
  var src = "http://example.com/foo.png";
  CD.getImage(src, function(img) {
    assert.equal(img, null, "called with null");
    done();
  });
});

QUnit.test("CD.getImages without callback", function(assert) {
  assert.expect(0);

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
    assert.ok(cb.calledOnce);
    assert.equal(cb.firstCall.args[0].length, 2);
    done();
  }, 10);
});

QUnit.test("CD.waitForAsset", function(assert) {
  assert.equal(CD.waitForAsset('http://example.com/foo.png'), undefined);
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
    assert.ok(cb.calledOnce, "callback is called only once");
    assert.equal(cb.firstCall.args[0].length, 2, "called with both images");

    assert.ok(singleCb.calledTwice, "single image callback is called for each image");
    assert.equal(singleCb.firstCall.args[0].src, srcA, "first image called first");
    assert.equal(singleCb.secondCall.args[0].src, srcB, "last image called last");

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

  assert.ok(spy.calledWith('response'), 'calls the callback with a response');

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
  server.requests[0].onerror();

  assert.ok(spy.calledWith(null), 'calls the callback with a response');

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

  assert.equal(requests.length, 1);
  assert.equal(requests[0].requestHeaders['x-reverse-proxy-ttl'], null); // not automatically added
  assert.equal(requests[0].requestHeaders['Accept'], 'application/json');
  assert.equal(requests[0].method, 'GET');
  assert.equal(requests[0].async, true);
  assert.equal(requests[0].url, "http://google.com");

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

  assert.equal(requests.length, 1);
  assert.equal(requests[0].requestHeaders['x-reverse-proxy-ttl'], 5);
  assert.equal(requests[0].requestHeaders['x-mi-cbe'], '-2134781906');
  assert.equal(requests[0].requestHeaders['Accept'], 'application/json');
  assert.equal(requests[0].method, 'GET');
  assert.equal(requests[0].async, true);
  assert.equal(requests[0].url, "http://cors.movableink.com/google.com/");

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

  assert.equal(requests.length, 1);
  assert.equal(requests[0].requestHeaders['x-reverse-proxy-ttl'], 10);
  assert.equal(requests[0].requestHeaders['x-mi-cbe'], '2084411041');
  assert.equal(requests[0].url, "http://cors.movableink.com/google.com/");

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

  assert.equal(requests.length, 1);
  assert.equal(requests[0].requestHeaders['x-reverse-proxy-ttl'], 5);
  assert.equal(requests[0].requestHeaders['Accept'], 'application/json');
  assert.equal(requests[0].requestHeaders['x-mi-cbe'], '-1217831332');
  assert.equal(requests[0].method, 'POST');
  assert.equal(requests[0].async, true);
  assert.equal(requests[0].requestBody, 'foobar');
  assert.equal(requests[0].url, "http://cors.movableink.com/google.com/");

  xhr.restore();
});

QUnit.test("concurrent calls", function(assert) {
  CD._reset();

  CD.suspend(1000); // 1 open call
  CD.suspend(500); // 2 open calls
  CD.capture(); // 1 open call
  CD.suspend(1000); // 2 open calls

  CD.capture(); // 1 open call
  assert.equal(CD._readyToCapture, false, "waits for open calls to get to zero");
  assert.equal(CD._openCalls, 1, "one open call");

  CD.capture(); // 0 open calls
  assert.equal(CD._readyToCapture, true, "sets readyToCapture");
  assert.equal(CD._openCalls, 0, "zero open calls");
});


QUnit.test("_hashForRequest", function(assert) {
  var hash = CD._hashForRequest("http://www.google.com", {"foo": "bar"});
  assert.equal(hash, "387990350");
  hash = CD._hashForRequest("http://www.google.com", {"foo": "bar"});
  assert.equal(hash, "387990350");
  var different = CD._hashForRequest("http://www.google.com", {"foo": "baz"});
  assert.equal(different, "387998038");
  var another = CD._hashForRequest("http://www.example.com", {"foo": "baz"});
  assert.equal(another, "-164085129");
});

QUnit.test("CD.cancelRequest", function(assert) {
  var callback = sinon.spy();
  window.MICapture = { cancel: callback };
  CD.cancelRequest();
  assert.ok(callback.calledOnce);
});

QUnit.test("CD.throwError", function(assert) {
  var callback = sinon.spy();
  window.MICapture = { error: callback };
  CD.throwError();
  assert.ok(callback.calledOnce);
});
