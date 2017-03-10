# Cropduster

Cropduster is a collection of tools for building pages to be web cropped by
Movable Ink.

[![Build Status](https://travis-ci.org/movableink/cropduster.svg?branch=master)](https://travis-ci.org/movableink/cropduster)

## Installation

Cropduster is on bower. Install it with:

```bash
npm install -g bower # if bower is not installed yet
bower init
bower install --save cropduster
```

The use it by referencing it from your HTML page:

```html
<script src="bower_components/cropduster/lib/cropduster.js"></script>
```

## API

### Selecting elements

`CD.$` is useful for getting an array of DOM elements via a CSS selector. It always returns an array.

Example:

```javascript
var elements = CD.$('div.items');
for(var i = 0; i < elements.length; i++) {
  var element = elements[i];
  element.style.display = 'none';
}
```

### Query params

`CD.param` retrieves query parameters from the current document's URL. It does not support nested params or arrays of values.

Example:

```javascript
// document.location is 'http://example.com/?fname=john
var fname = CD.param('fname');
console.log(fname); // logs 'john'
```

### Fetching third-party resources

Movable Ink's capture engine traditionally captures the web page as soon as the page's `ready` event fires. This can cause
issues when the user tries to fetch pages via ajax, as the capture engine does not wait for the ajax load to complete
before rendering. In order to delay capture until the request has finished, use `CD.get`. It temporarily suspends capture
until the request completes. Note: the URL has to be CORS-accessible, see `CD.getCORS` if it isn't. When in doubt, use `CD.getCORS`.

Example:

```javascript
CD.get('http://cors-enabled-site.com/page', function(data, status) {
  CD.$('h1')[0].innerHTML = data.header;
});
```

Send POST and sending extra headers:

```javascript
CD.get('http://cors-enabled-site.com/page', {
  method: 'POST',
  body: '{"ok": "yes"}',
  headers: {
    'Accept': 'application/json'
  }
}, function(data, status) {
  CD.$('h1')[0].innerHTML = data.h1;
})
```

### Fetching third-party resources with CORS

Security restrictions prevent web pages from making cross-domain ajax requests. CORS
is a workaround, but requires support from the website, and many websites do not
support it. Instead, use `CD.getCORS` to use Movable Ink's CORS proxy to access the
page.

Example:

```javascript
CD.getCORS('http://example.com/page', function(data, status) {
  CD.$('h1')[0].innerHTML = data.header;
});
```

### Fetching images

Images that are included in the source of the rendered page's HTML will always get loaded before the page is captured. However,
images injected into the page with javascript will not always finish loading before the page is captured. To ensure the capture
happens afterwards, use `CD.getImage`. It takes an image URL and calls a callback with a javascript `Image` that can be placed
on the page.

Example:

```javascript
CD.getImage('http://example.com/image.png', function(img) {
  CD.$('div.images')[0].appendChild(img);
});
```

### Fetching multiple images

As of 3.0.0, it is possible many `CD.getImage` calls concurrently. If, instead if you know all the images needed, you may use
`CD.getImages`. It receives an array of URLs and calls two separate types of callbacks. The first is called once when all images
are done loading with the array of javascript `Image` objects. The second type of callback is with a javascript `Image` object
for each of the loaded images. These callbacks are guaranteed to fire in the same order as the list of image URLs.

Example:

```javascript
CD.getImages(['http://example.com/1.png', 'http://example.com/2.png'],
  function(images) {
    console.log(images[0].height);
  },
  function(img) {
    console.log('this one');
    CD.$('body')[0].appendChild(img);
  }
);
```

### Redirecting to another image

Sometimes, it is necessary to redirect to an image rather than rendering dynamic content. For example, a countdown timer may
want to just show an image after the countdown has expired. It is certainly possible to just render the image inside the
webpage and crop that, but a better solution is to use `CD.setImageRedirect` to issue a 302 redirect to the user to send them
to the static content. If the function is called multiple times, the last image URL called is used.

Example:

```javascript
CD.setImageRedirect('http://example.com/foo.png');
console.log('user will be shown image located at http://example.com/foo.png');
```

### Storing extra analytics data

It is possible to store extra data using the `CD.setExtraData` call. This data will be available in the `extra_data` field of
the User-level Reports. Pass a javascript object, and it will be turned into JSON and stored in `extra_data`. Calling multiple
times results in the objects being combined and any duplicate keys overwritten.

Example:

```javascript
CD.setExtraData({userId: 5});
CD.setExtraData({shownCategory: 'shoes'});
console.log('extra_data field now contains {"userId":5,"shownCategory":"shoes"}');
```

### Setting custom per-user clickthrough URLs

When showing dynamic content, it may be useful to be able to associate dynamic content with matching clickthroughs. Using
`CD.setClickthrough`, you can save a clickthrough URL that users will visit when they click on the web crop. In order to work
properly, the query params on both the embed code's image and link must match. If called multiple times, only the last called
clickthrough URL will be used.

Example:

```javascript
CD.setClickthrough('http://example.com');
console.log('If user clicks on the web crop, they will go to http://example.com');
```

### Recording Stats
Record stats to a specific counter, with a key that is the concatenated value of the "id" and the "endpoint"

Example:
```javascript
CD.recordStat("behavioral", 1, "endpoint");
console.log('Will send extraData containing: {"counter_name":"behavioral","content_key":"1-endpoint"}');
```

## Testing

    bower install
    open tests/index.html

Alternatively, for command-line tests:

    brew install phantomjs
    npm install
    npm test

## Changelog

### 3.2.2
  * Ensure that `CD.suspend(msg)` always logs the `msg` string

### 3.2.1
  * `CD.get()` and `CD.getCORS()` return the (integer) http status as the second argument of their callbacks. This is currently completely backwards-compatible, but we would like to make backwards-incompatible changes to this API in the future.

### 3.2.0
  * Support `CD.cancel()` for when crop wants to show fallback but not trigger error condition
  * Support `CD.throwError()` for when crop fails (such as XHR failure) and trigger error
  * `CD.begin(msg)` and `CD.end(msg)` support an argument that will be logged for easier debugging

### 3.1.1
  * Support for `CD.getCORS()` with non-standard ports

### 3.1.0
  * `CD.getCORS()` sends `x-mi-cbe` request header to ensure requests consistently go to the same backend

### 3.0.0
  * No more reference counting or maxSuspensions
  * `CD.getImages()` accepts two callbacks, one for when all images resolve and once for after each image resolves

### 2.7.3
  * `CD.capture` forces a redraw on the page

### 2.7.2
  * Ensure that `CD.getImages` actually suspends crop

### 2.7.1
  * Remove window.onerror handler
  * Ensure that failing requests actually call callback with `null`, rather than empty string

### 2.7.0
  * Failing requests call the callback with `null`.
  * Do not pass cors ttl headers on regular `get` request.

### 2.6.0
  * Add `get` to fetch resources without using CORS

### 2.5.0
  * Add `setImageRedirect`, `setClickthrough`, and `setExtraData`
  * Set up TravisCI test suite

### 2.4.0
  * New options for CD.getCORS: `method` for changing HTTP method, `body` for sending request body when `POST` method is used,
    and `headers` object for sending extra request headers.

### 2.3.0
  * Guarantee correct ordering of callbacks in getImages()

## License

Copyright &copy; 2015 Movable, Inc

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
