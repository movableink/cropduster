import CD from '../src/cropduster';
import { spy } from 'sinon';
import Pretender from 'pretender';

const { module, test } = QUnit;

const container = document.createElement('DIV');
container.style = 'position: absolute; left: -5000px;';
document.body.appendChild(container);

module('cropduster tests', {
  beforeEach() {
    this.fakeServer = new Pretender(function() {
      this.get('http://callback.com', () => {
        return [200, { 'Content-Type': 'text/html' }, 'ok'];
      });
    });

    window.MICapture = {
      pause: spy(),
      resume: spy(),
      cancel: spy(),
      error: spy(),
      waitForAsset: spy()
    };
  },

  afterEach() {
    this.fakeServer.shutdown();
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

test("CD.autofill", function(assert) {
  container.innerHTML = '';
  const el = document.createElement('div');
  el.id = 'autofill_foo';
  container.append(el);

  CD.autofill();
  assert.equal(el.innerHTML, 'bar', "auto-fills the query param into the element");
});

test("CD.setImageRedirect", function(assert) {
  CD.setImageRedirect("http://example.com/foo.png");

  const href = document.getElementById('mi-redirect-image').getAttribute('href');
  assert.equal(href, "http://example.com/foo.png", "sets the image redirect");
});

test("CD.setImageRedirect multiple times", function(assert) {
  CD.setImageRedirect("http://example.com/foo.png");
  CD.setImageRedirect("http://example.com/bar.png");

  const href = document.getElementById('mi-redirect-image').getAttribute('href');
  assert.equal(href, "http://example.com/bar.png", "uses the last setImageRedirect url");
});

test("CD.setClickthrough", function(assert) {

  CD.setClickthrough("http://example.com/");

  const href = document.getElementById('mi_dynamic_link').getAttribute('href');
  assert.equal(href, "http://example.com/",
        "sets the dynamic link");
});

test("CD.setExtraData with no existing data", function(assert) {
  CD.setExtraData({foo: 'bar'});

  const data = document.getElementById('mi-data').getAttribute('data-mi-data');
  assert.equal(data, '{"foo":"bar"}', "sets the data in json");
});

test("CD.setExtraData with existing data", function(assert) {
  CD.setExtraData({foo: 'bar'});
  CD.setExtraData({foo: 'baz'});
  CD.setExtraData({my: 'data'});

  const data = document.getElementById('mi-data').getAttribute('data-mi-data');
  assert.equal(data, '{"foo":"baz","my":"data"}',
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

test("DEPRECATED - CD.getImage with a callback and successful load", function(assert) {
  const done = assert.async();
  window.Image = imageSuccessStub;
  const src = "http://example.com/foo.png";
  CD.getImage(src, function(img) {
    assert.equal(img.src, src, "called with src");
    done();
  });
});

test("CD.getImage with a promise and successful load", function(assert) {
  const done = assert.async();
  window.Image = imageSuccessStub;
  const src = "http://example.com/foo.png";
  CD.getImage(src).then((img) => {
    assert.equal(img.src, src, "called with src");
    done();
  });
});

test("DEPRECATED - CD.getImage with a callback and a failing load", function(assert) {
  const done = assert.async();
  window.Image = imageFailureStub;
  const src = "http://example.com/foo.png";
  CD.getImage(src, function(img) {
    assert.equal(img, null, "called with null");
    done();
  }).catch(() => {});
});

test("CD.getImage with a promise and a failing load", function(assert) {
  const done = assert.async();
  window.Image = imageFailureStub;
  const src = "http://example.com/foo.png";
  CD.getImage(src).then(
    () => {
      assert.ok(false, 'this function should never be called');
      done();
    },
    (error) => {
      assert.ok(true, 'the promise rejects if the image fails to load');
      done();
    }
  );
});

test("CD.waitForAsset", function(assert) {
  assert.equal(CD.waitForAsset('http://example.com/foo.png'), undefined);
});

test("DEPRECATED - CD.getImages with final callback and single image callback", function(assert) {
  const done = assert.async();
  window.Image = imageSuccessStub;
  const srcA = "http://example.com/foo.png";
  const srcB = "http://example.com/bar.png";
  const cb = spy();
  const singleCb = spy();
  CD.getImages([srcA, srcB], singleCb, cb).then(() => {
    assert.ok(cb.calledOnce, "callback is called only once");
    assert.equal(cb.firstCall.args[0].length, 2, "called with both images");

    assert.ok(singleCb.calledTwice, "single image callback is called for each image");
    assert.equal(singleCb.firstCall.args[0].src, srcA, "first image called first");
    assert.equal(singleCb.secondCall.args[0].src, srcB, "last image called last");

    done();
  });
});

test("CD.getImages with promises and a single callback", function(assert) {
  const done = assert.async();
  window.Image = imageSuccessStub;
  const srcA = "http://example.com/foo.png";
  const srcB = "http://example.com/bar.png";
  const singleCb = spy();
  CD.getImages([srcA, srcB], singleCb).then((images) => {
    assert.ok(singleCb.calledTwice, "the single callback is called once for each resolved image");
    assert.ok(true, "the promise is resolved if all images resolve");
    assert.equal(images.length, 2, "called with both images");

    assert.equal(singleCb.firstCall.args[0].src, srcA, "first image called first");
    assert.equal(singleCb.secondCall.args[0].src, srcB, "last image called last");

    done();
  });
});

test("DEPRECATED - CD.get with callbacks and a successful response", function(assert) {
  const done = assert.async();

  CD.get("http://callback.com", {
    headers: {
      'Accept': 'application/json'
    }
  }, (data, status, contentType) => {
    assert.ok(data === 'ok', 'resolves with a response');
    assert.ok(status === 200, 'resolves with a status');
    assert.ok(contentType === 'text/html', 'resolves with a content type');

    assert.ok(true, 'the promise resolves successfully');
    done();
  });
});

test("CD.get with promises and a successful response", function(assert) {
  const done = assert.async();

  CD.get("http://callback.com", {
    headers: {
      'Accept': 'application/json'
    }
  }).then(({ data, status, contentType }) => {
    assert.ok(data === 'ok', 'resolves with a response');
    assert.ok(status === 200, 'resolves with a status');
    assert.ok(contentType === 'text/html', 'resolves with a content type');

    assert.ok(true, 'the promise resolves successfully');
    done();
  });
});

test("CD.get yields the response object to the resolved promise", function(assert) {
  const done = assert.async();

  this.fakeServer.get('http://callback.com', () => {
    return [200, { 'Content-Type': 'text/html', 'Every-Thing-Is': 'awesome' }, 'ok'];
  });

  CD.get("http://callback.com").then(({ response }) => {
    assert.equal(response.getResponseHeader('every-thing-is'), 'awesome', 'the response headers are available');
    done();
  });
});

test("DEPRECATED - CD.get with callbacks and a failing response", function(assert) {
  const done = assert.async();

  this.fakeServer.get('*', () => [500, {}, '']);

  CD.get("http://google.com", {
    headers: {
      'Accept': 'application/json'
    }
  }, (value) => {
    assert.equal(value, null, 'the callback is called with null if the request fails');
    done();
  }).catch(() => {
    // do nothing
    // silence "Uncaught Promise rejection" error that gets thrown here
  });
});

test("CD.get with promises and a failing response", function(assert) {
  const done = assert.async();
  this.fakeServer.get('*', () => [500, {}, '']);

  CD.get("http://google.com", {
    headers: {
      'Accept': 'application/json'
    }
  }).then(
    () => {
      assert.ok(false, 'this should never be reached');
      done();
    },
    () => {
      assert.ok(true, 'the promise is rejected if the request fails');
      done();
    }
  );
});

test("CD.get - request options", function(assert) {
  const done = assert.async();

  this.fakeServer.get('http://google.com', req => {
    assert.equal(req.requestHeaders['Accept'], 'application/json');
    assert.equal(req.withCredentials, true);
    done();
    return [200, {}, ''];
  });

  CD.get("http://google.com", {
    corsCacheTime: 5000,
    headers: {
      'Accept': 'application/json'
    }
  });
});

test("CD.get - withoutCredentials option", function(assert) {
  const done = assert.async();

  this.fakeServer.get('http://google.com', req => {
    assert.equal(req.withCredentials, false, 'credentials are not included in request');
    done();
    return [200, {}, ''];
  });

  CD.get("http://google.com", {
    corsCacheTime: 5000,
    headers: {
      'Accept': 'application/json'
    },
    withoutCredentials: true
  });
});

test("CD.getCORS - request options", function(assert) {
  const done = assert.async();

  this.fakeServer.get('http://cors.movableink.com/google.com/', ({ requestHeaders }) => {
    assert.equal(requestHeaders['x-reverse-proxy-ttl'], 5);
    assert.equal(requestHeaders['x-mi-cbe'], '-2134781906');
    done();
    return [200, {}, ''];
  });

  CD.getCORS("http://google.com", {
    corsCacheTime: 5000,
    headers: {
      'Accept': 'application/json'
    }
  });
});

test("CD.getCORS without options", function(assert) {
  const done = assert.async();

  this.fakeServer.get('http://cors.movableink.com/google.com/', ({ requestHeaders }) => {
    assert.equal(requestHeaders['x-reverse-proxy-ttl'], 10);
    assert.equal(requestHeaders['x-mi-cbe'], '2084411041');
    done();
    return [200, {}, ''];
  });

  CD.getCORS("http://google.com");
});

test("CD.getCORS with POST", function(assert) {
  const done = assert.async();

  this.fakeServer.post('http://cors.movableink.com/google.com/', ({ requestHeaders, requestBody }) => {
    assert.equal(requestHeaders['x-reverse-proxy-ttl'], 5);
    assert.equal(requestHeaders['x-mi-cbe'], '-1217831332');
    assert.equal(requestBody, 'foobar');
    done();
    return [200, {}, ''];
  });

  CD.getCORS("http://google.com", {
    corsCacheTime: 5000,
    method: 'POST',
    body: 'foobar',
    headers: {
      'Accept': 'application/json'
    }
  });
});

test("CD.getCORS to sorcerer.movableink-templates.com", function(assert) {
  const done = assert.async();

  // the request goes directly to sorcerer which supports CORS
  this.fakeServer.get('http://sorcerer.movableink-templates.com', ({ requestHeaders }) => {
    assert.equal(requestHeaders['x-reverse-proxy-ttl'], 5);
    assert.equal(requestHeaders['x-mi-cbe'], '1503910540');
    done();
    return [200, {}, ''];
  });

  CD.getCORS("http://sorcerer.movableink-templates.com", {
    corsCacheTime: 5000,
    headers: { 'Accept': 'application/json' }
  });
});

test("CD.getCORS to profiles.movableink.com", function(assert) {
  const done = assert.async();

  // the request goes directly to sherlock which supports CORS
  this.fakeServer.get('http://profiles.movableink.com', ({ requestHeaders }) => {
    assert.equal(requestHeaders['x-reverse-proxy-ttl'], 5);
    assert.equal(requestHeaders['x-mi-cbe'], '750998333');
    done();
    return [200, {}, ''];
  });

  CD.getCORS("http://profiles.movableink.com", {
    corsCacheTime: 5000,
    headers: { 'Accept': 'application/json' }
  });
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

test('CD.miCaptureFallback - with MICapture', function(assert) {
  window.MICapture = {};

  assert.expect(1);

  CD.miCaptureFallback(
    () => { assert.ok(true, 'the second callback is called if MICapture is defined as an object'); },
    () => { assert.ok(false, 'this should not be called'); }
  );
});

test('CD.miCaptureFallback - without MICapture', function(assert) {
  window.MICapture = null;
  assert.expect(1);

  CD.miCaptureFallback(
    () => { assert.ok(false, 'this should not be called'); },
    () => { assert.ok(true, 'the second callback is called if MICapture is undefined'); }
  );
});

