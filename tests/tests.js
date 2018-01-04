import CD from '../src/cropduster';
import jQuery from 'jquery';
import { fakeServer, useFakeXMLHttpRequest, spy } from 'sinon';

const { module, test } = QUnit;

const container = jQuery("<div style='position: absolute; left: -5000px;'></div>").appendTo('body');

module('cropduster tests', {
  beforeEach() {
    window.MICapture = {
      pause: spy(),
      resume: spy(),
      cancel: spy(),
      error: spy(),
      waitForAsset: spy()
    };
  }
});

// Disable debugging output
CD.log = function() {};

// Stub out search string
CD._searchString = function() {
  return 'foo=bar&baz%20test=quux%20value';
};

const imageSuccessStub = function() {
  const self = this;
  setTimeout(function() {
    self.onload();
  }, 1);
};

const imageFailureStub = function() {
  const self = this;
  setTimeout(function() {
    self.onerror();
  }, 1);
};

test("CD.$", function(assert) {
  assert.equal(CD.$('body')[0], document.body, "finds elements" );
});

test("CD.param when parameter not found", function(assert) {
  assert.equal(CD.param('not_found'), null, "returns null");
});

test("CD.param when parameter is found", function(assert) {
  assert.equal(CD.param('foo'), 'bar', "returns value");
});

test("CD.params returns all query params", function(assert) {
  assert.deepEqual(CD.params(), {'baz test': 'quux value', foo: 'bar'}, "returns the url params");
});

test("CD.params with argument returns that query param", function(assert) {
  assert.equal(CD.params('baz test'), 'quux value', "returns the url param");
});

// can't test CD.param returning query params from here, unfortunately...

test("CD.autofill", function(assert) {
  container.html('');
  const el = jQuery("<div id='autofill_foo'></div>");
  container.append(el);

  CD.autofill();
  assert.equal(el.html(), 'bar', "auto-fills the query param into the element");
});

test("CD.setImageRedirect", function(assert) {
  CD.setImageRedirect("http://example.com/foo.png");

  assert.equal(jQuery("#mi-redirect-image").attr('href'), "http://example.com/foo.png",
        "sets the image redirect");
});

test("CD.setImageRedirect multiple times", function(assert) {
  CD.setImageRedirect("http://example.com/foo.png");
  CD.setImageRedirect("http://example.com/bar.png");

  assert.equal(jQuery("#mi-redirect-image").attr('href'), "http://example.com/bar.png",
        "uses the last setImageRedirect url");
});

test("CD.setClickthrough", function(assert) {
  CD.setClickthrough("http://example.com/");

  assert.equal(jQuery("#mi_dynamic_link").attr('href'), "http://example.com/",
        "sets the dynamic link");
});

test("CD.setExtraData with no existing data", function(assert) {
  CD.setExtraData({foo: 'bar'});

  assert.equal(jQuery("#mi-data").attr('data-mi-data'), '{"foo":"bar"}',
        "sets the data in json");
});

test("CD.setExtraData with existing data", function(assert) {
  CD.setExtraData({foo: 'bar'});
  CD.setExtraData({foo: 'baz'});
  CD.setExtraData({my: 'data'});

  assert.equal(jQuery("#mi-data").attr('data-mi-data'), '{"foo":"baz","my":"data"}',
        "sets the data in json");
});

test("CD.proxyUrl with http url", function(assert) {
  const url = "http://google.com";
  assert.equal(CD.proxyUrl(url), "http://cors.movableink.com/google.com/", "returns CORS url");
});

test("CD.proxyUrl with https url", function(assert) {
  const url = "https://google.com";
  assert.equal(CD.proxyUrl(url), "http://cors.movableink.com/google.com:443/", "returns CORS url");
});

test("CD.proxyUrl with port", function(assert) {
  const url = "http://google.com:8080";
  assert.equal(CD.proxyUrl(url), "http://cors.movableink.com/google.com:8080/", "returns CORS url");
});

test("CD.pause", function(assert) {
  CD.pause();
  assert.equal(MICapture.pause.calledOnce, true, "calls MICapture.pause");
});

test("CD.resume", function(assert) {
  CD.resume();
  assert.equal(MICapture.resume.calledOnce, true, "calls MICapture.resume");
});

test("CD.getImage load success", function(assert) {
  const done = assert.async();
  window.Image = imageSuccessStub;
  const src = "http://example.com/foo.png";
  CD.getImage(src, function(img) {
    assert.equal(img.src, src, "called with src");
    done();
  });
});

test("CD.getImage load failure", function(assert) {
  const done = assert.async();
  window.Image = imageFailureStub;
  const src = "http://example.com/foo.png";
  CD.getImage(src, function(img) {
    assert.equal(img, null, "called with null");
    done();
  });
});

test("CD.getImages without callback", function(assert) {
  assert.expect(0);

  window.Image = imageSuccessStub;
  const srcA = "http://example.com/foo.png";
  const srcB = "http://example.com/bar.png";
  CD.getImages([srcA, srcB]);
});

test("CD.getImages with callback", function(assert) {
  const done = assert.async();
  window.Image = imageSuccessStub;
  const srcA = "http://example.com/foo.png";
  const srcB = "http://example.com/bar.png";
  const cb = spy();
  CD.getImages([srcA, srcB], cb).then(() => {
    assert.ok(cb.calledOnce);
    assert.equal(cb.firstCall.args[0].length, 2);
    done();
  });
});

test("CD.waitForAsset", function(assert) {
  assert.equal(CD.waitForAsset('http://example.com/foo.png'), undefined);
});

test("CD.getImages with callback and single image callback", function(assert) {
  const done = assert.async();
  window.Image = imageSuccessStub;
  const srcA = "http://example.com/foo.png";
  const srcB = "http://example.com/bar.png";
  const cb = spy();
  const singleCb = spy();
  CD.getImages([srcA, srcB], cb, singleCb).then(() => {
    assert.ok(cb.calledOnce, "callback is called only once");
    assert.equal(cb.firstCall.args[0].length, 2, "called with both images");

    assert.ok(singleCb.calledTwice, "single image callback is called for each image");
    assert.equal(singleCb.firstCall.args[0].src, srcA, "first image called first");
    assert.equal(singleCb.secondCall.args[0].src, srcB, "last image called last");

    done();
  });
});

test("CD.get with response", function(assert) {
  const done = assert.async();
  const server = fakeServer.create();

  server.respondWith([200, {"Content-Type": "text/html"}, "response"]);

  const cb = spy();

  CD.get("http://google.com", {
    headers: {
      'Accept': 'application/json'
    }
  }, cb).then(() => {
    assert.ok(cb.calledWith('response'), 'calls the callback with a response');
    done();
  });

  server.respond();


  server.restore();
});

test("CD.get with a failing response", function(assert) {
  const server = fakeServer.create();
  const done = assert.async();

  const cb = spy();

  CD.get("http://google.com", {
    headers: {
      'Accept': 'application/json'
    }
  }, cb).then(() => {
    assert.ok(cb.calledWith(null), 'calls the callback with a response');
    done();
  });

  server.requests[0].abort();
  server.requests[0].onerror();

  server.restore();
});


test("CD.get", function(assert) {
  const xhr = useFakeXMLHttpRequest();
  const requests = this.requests = [];
  xhr.onCreate = function (xhr) {
    requests.push(xhr);
  };

  const cb = spy();

  CD.get("http://google.com", {
    corsCacheTime: 5000,
    headers: {
      'Accept': 'application/json'
    }
  }, cb);

  assert.equal(requests.length, 1);
  assert.equal(requests[0].requestHeaders['x-reverse-proxy-ttl'], null); // not automatically added
  assert.equal(requests[0].requestHeaders['Accept'], 'application/json');
  assert.equal(requests[0].method, 'GET');
  assert.equal(requests[0].async, true);
  assert.equal(requests[0].withCredentials, true);
  assert.equal(requests[0].url, "http://google.com");

  xhr.restore();
});

test("CD.getCORS", function(assert) {
  const xhr = useFakeXMLHttpRequest();
  const requests = this.requests = [];
  xhr.onCreate = function (xhr) {
    requests.push(xhr);
  };

  const cb = spy();

  CD.getCORS("http://google.com", {
    corsCacheTime: 5000,
    headers: {
      'Accept': 'application/json'
    }
  }, cb);

  assert.equal(requests.length, 1);
  assert.equal(requests[0].requestHeaders['x-reverse-proxy-ttl'], 5);
  assert.equal(requests[0].requestHeaders['x-mi-cbe'], '-2134781906');
  assert.equal(requests[0].requestHeaders['Accept'], 'application/json');
  assert.equal(requests[0].method, 'GET');
  assert.equal(requests[0].async, true);
  assert.equal(requests[0].url, "http://cors.movableink.com/google.com/");

  xhr.restore();
});

test("CD.getCORS without options", function(assert) {
  const xhr = useFakeXMLHttpRequest();
  const requests = this.requests = [];
  xhr.onCreate = function (xhr) {
    requests.push(xhr);
  };

  CD.getCORS("http://google.com", () => {});

  assert.equal(requests.length, 1);
  assert.equal(requests[0].requestHeaders['x-reverse-proxy-ttl'], 10);
  assert.equal(requests[0].requestHeaders['x-mi-cbe'], '2084411041');
  assert.equal(requests[0].url, "http://cors.movableink.com/google.com/");

  xhr.restore();
});

test("CD.getCORS with POST", function(assert) {
  const xhr = useFakeXMLHttpRequest();
  const requests = this.requests = [];
  xhr.onCreate = function (xhr) {
    requests.push(xhr);
  };

  CD.getCORS("http://google.com", {
    corsCacheTime: 5000,
    method: 'POST',
    body: 'foobar',
    headers: {
      'Accept': 'application/json'
    }
  }, () => {});

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

test("_hashForRequest", function(assert) {
  let hash = CD._hashForRequest("http://www.google.com", {"foo": "bar"});
  assert.equal(hash, "387990350");
  hash = CD._hashForRequest("http://www.google.com", {"foo": "bar"});
  assert.equal(hash, "387990350");
  const different = CD._hashForRequest("http://www.google.com", {"foo": "baz"});
  assert.equal(different, "387998038");
  const another = CD._hashForRequest("http://www.example.com", {"foo": "baz"});
  assert.equal(another, "-164085129");
});

test("CD.cancelRequest", function(assert) {
  CD.cancelRequest();
  assert.ok(MICapture.cancel.calledOnce);
});

test("CD.throwError", function(assert) {
  CD.throwError();
  assert.ok(MICapture.error.calledOnce);
});
