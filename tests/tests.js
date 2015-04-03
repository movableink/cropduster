var container = $("<div style='position: absolute; left: -5000px;'></div>").appendTo('body');

test("CD.$", function() {
  equal(CD.$('body')[0], document.body, "finds elements" );
});

test("CD.param when parameter not found", function() {
  equal(CD.param('not_found'), null, "returns null");
});

// can't test CD.param returning query params from here, unfortunately...

test("CD.autofill", function() {
  container.html('');
  var el = $("<div id='autofill_foo'></div>");
  container.append(el);

  CD._urlParams = {foo: 'bar'};
  CD.autofill();
  equal(el.html(), 'bar', "auto-fills the query param into the element");
});

test("CD.proxyUrl with http url", function() {
  var url = "http://google.com";
  equal(CD.proxyUrl(url), "http://cors.movableink.com/google.com/", "returns CORS url");
});

test("CD.proxyUrl with https url", function() {
  var url = "https://google.com";
  equal(CD.proxyUrl(url), "http://cors.movableink.com/google.com:443/", "returns CORS url");
});

test("CD.suspend", function() {
  CD.capture(); // clean out previous test
  CD.suspend();
  equal(CD._readyToCapture, false, "sets readyToCapture");
});

test("CD.capture", function() {
  CD.suspend(); // clean out previous test
  CD.capture();
  equal(CD._readyToCapture, true, "sets readyToCapture");
});

QUnit.test("CD.getCors", function(assert) {
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
  equal(requests[0].requestHeaders['Accept'], 'application/json');
  equal(requests[0].method, 'GET');
  equal(requests[0].async, true);
  equal(requests[0].url, "http://cors.movableink.com/google.com/");

  xhr.restore();
});

QUnit.test("CD.getCors without options", function(assert) {
  var xhr = sinon.useFakeXMLHttpRequest();
  var requests = this.requests = [];
  xhr.onCreate = function (xhr) {
    requests.push(xhr);
  };

  var spy = sinon.spy();

  CD.getCORS("http://google.com", spy);

  equal(requests.length, 1);
  equal(requests[0].requestHeaders['x-reverse-proxy-ttl'], 10);
  equal(requests[0].url, "http://cors.movableink.com/google.com/");

  xhr.restore();
});


QUnit.test("CD.getCors with POST", function(assert) {
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
  equal(requests[0].method, 'POST');
  equal(requests[0].async, true);
  equal(requests[0].requestBody, 'foobar');
  equal(requests[0].url, "http://cors.movableink.com/google.com/");

  xhr.restore();
});
