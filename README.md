# Cropduster

Cropduster is a collection of tools for building pages to be web cropped by
Movable Ink.

[![Build Status](https://travis-ci.org/movableink/cropduster.svg?branch=master)](https://travis-ci.org/movableink/cropduster)

## Installation

Cropduster is on npm. Install it with:

```bash
npm install --save-dev cropduster
```

The use it by importing it from your es6-enabled javascript file:

```javascript
import CD from 'cropduster';
```

## Legacy Installation

To use Cropduster directly in the browser, loaded from a script tag, you can
find legacy versions at:

http://projects.movableink.com/production/libs/cropduster.[version].js

Going forward, browser-ready versions of the library are available at:

http://projects.movableink.com/production/libs/cropduster.browser.[version].js

Where you replace `[version]` with the version you want to use.

## API

### Asynchronous actions
Sometimes, Capturama needs to be explicitly told to hold off on finishing its
screen capture in order for some asynchronous actions to fire and complete. This
can be accomplished by calling `CD.pause` when an asynchronous action is about
to start, and `CD.resume` when it has completed. `pause` takes a `maxSuspension`
Number argument specifying the maximum amount of time in milliseconds that your
asynchronous action is allowed to take, and both functions take an optional
final argument of a String message explaining the suspension, purely used for
debugging the Capturama log.

If you are using the Cropduster API for common asynchronous actions like
fetching a URL or an image with `CD.get` and `CD.getImage`, or if you are using
Promises directly, you do not need to manually call pause and resume. These
methods are used internally in the necessary places. However, if you are
doing something unusual that requires work to be delayed manually, each call to
`CD.pause` must have a corresponding call to `CD.resume`, or the request to
Capturama will eventually time out.

Example:
```javascript
const target = document.getElementById('text-box');
const customerQuality = CD.param('mi_customer_rating');
const tenSeconds = 10 * 1000;

if (customerQuality === 'very-good') {
  target.innerText = 'good customers get images quickly';
} else if (customerQuality === 'very-bad') {
  CD.pause(tenSeconds, 'making bad customers wait for their email to load...');

  setTimeout(() => {
    target.innerText = 'bad customers have to wait for their images';
    CD.resume();
  }, 1000);
}
```

*NOTE:* Cropduster previously offered `CD.suspend` and `CD.capture` functions
that achieved a similar goal. These functions have been replaced with `pause`
and `resume`, to support a better synchronisation of state with Capturama, and
to give a clearer sense of how these functions affect Capturama's workflow.

### Selecting elements

`CD.$` is useful for getting an array of DOM elements via a CSS selector. It always returns an array.

Example:

```javascript
const elements = CD.$('div.items');
for (let i = 0; i < elements.length; i++) {
  const element = elements[i];
  element.style.display = 'none';
}
```

or:

```javascript
const elements = CD.$('div.items');
for (const element of elements) {
  element.style.display = 'none';
}
```

### Query params

`CD.param` retrieves query parameters from the current document's URL. It does not support nested params or arrays of values.

Example:

```javascript
// document.location is 'http://example.com/?fname=john
const fname = CD.param('fname');
console.log(fname); // logs 'john'
```

### Fetching third-party resources

Movable Ink's capture engine traditionally captures the web page as soon as the page's `ready` event fires. This can cause
issues when the user tries to fetch pages via ajax, as the capture engine does not wait for the ajax load to complete
before rendering. In order to delay capture until the request has finished, use `CD.get`. It temporarily suspends capture
until the request completes. Note: the URL has to be CORS-accessible, see `CD.getCORS` if it isn't. When in doubt, use `CD.getCORS`.

Example:

```javascript
CD.get('http://cors-enabled-site.com/page').then((response) => {
  const { data, status, contentType } = response;
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
}).then((response) => {
  CD.$('h1')[0].innerHTML = response.data.h1;
})
```

### Fetching third-party resources with CORS

Security restrictions prevent web pages from making cross-domain ajax requests. CORS
is a workaround, but requires support from the website, and many websites do not
support it. Instead, use `CD.getCORS` to use Movable Ink's CORS proxy to access the
page.

Example:

```javascript
CD.getCORS('http://example.com/page').then((response) => {
  CD.$('h1')[0].innerHTML = response.data.header;
});
```

### Fetching images

_Deprecated:_ The `CD.getImage()` and `CD.getImages()` calls have been superseded by `CD.waitForAsset()`. They will continue to work for the foreseeable future, but `CD.waitForAsset` is preferred.

`CD.waitForAsset` ensures that in-flight requests for a particular asset URL complete before capturing the page. `CD.waitForAsset` does not fetch the image, that is up to you to do however you may normally do it. If the image is not loading ("in-flight") when capturama tries to capture the page, there will be no impact. It can be called any time before page capture. `CD.waitForAsset` is compatible with `<img>` tags, css `background-image` properties, and any other way an image is loaded into a webpage.

Example:

```javascript
CD.$('.background')[0].style.backgroundImage = 'url(http://example.com/foo.png)';
CD.waitForAsset('http://example.com/foo.png');
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

## Testing

    yarn install
    yarn run test

## Changelog

### 5.1.0
  * CD.get uses the `fetch` API instead of XMLHttpRequest

### 5.0.0
  * Compiles the app with Webpack and Babel down to ES5 with sourcemaps.
  * Returns Promises from CD.get, CD.getCORS, CD.getImage and CD.getImages
  * NPM publishes the browser-ready script in dist/cropduster.browser.js

### 4.1.0
  * Add `withCredentials: true` to all `CD.get()` requests.

### 4.0.1
  * npm publishes the alternate es5 scripts in dist/cropduster.es5.js.

### 4.0.0
  * Switch from bower to npm; CD is now exported as es6 module. See the new installation instructions above.

### 3.4.2
  * Remove `bower` from npm postinstall, for npm usage.

### 3.4.1
  * Adds `CD.params()`, returning an object with all parameters.

### 3.4.0
  * Exposes the `content-type` response header within the callback of `CD.get()`.

### 3.3.0
  * Add support for `CD.waitForAsset()`. This API can be used to ensure that we will not render while the passed URL is in-flight.

### 3.2.3
  * fix bower/npm version numbers

### 3.2.2
  * Ensure that `CD.suspend(msg)` always logs the `msg` string

### 3.2.1
  * `CD.get()` and `CD.getCORS()` return the (integer) http status as the second argument of their callbacks. This is currently completely backwards-compatible, but we would like to make backwards-incompatible changes to this API in the future.

### 3.2.0
  * Support `CD.cancelRequest(msg)` for when crop wants to show fallback but not trigger error condition
  * Support `CD.throwError(msg)` for when crop fails (such as XHR failure) and trigger error
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
