# Cropduster

Cropduster is a collection of tools for building pages to be web cropped by
Movable Ink.

## Installation

Cropduster is on bower. Install it with:

```bash
npm install -g bower # if bower is not installed yet
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

### Fetching third-party resources via CORS

Movable Ink's capture engine traditionally captures the web page as soon as the page's `ready` event fires. This can cause issues when the user tries to fetch pages via ajax, as the capture engine does not wait for the ajax load to complete before rendering. In order to delay capture until the request has finished, use `CD.getCORS`. It temporarily suspends capture until the request completes.

Example:

```javascript
CD.getCORS('http://example.com/page', function(data) {
  CD.$('h1')[0].innerHTML = data.header;
});
```

### Fetching images

Images that are included in the source of the rendered page's HTML will always get loaded before the page is captured. However, images injected into the page with javascript will not always finish loading before the page is captured. To ensure the capture happens afterwards, use `CD.getImage`. It takes an image URL and calls a callback with a javascript `Image` that can be placed on the page.

Example:

```javascript
CD.getImage('http://example.com/image.png', function(img) {
  CD.$('div.images')[0].appendChild(img);
});
```

### Fetching multiple images

It is not possible to make many `CD.getImage` calls concurrently, because the first one that returns will trigger a page capture. Instead, use `CD.getImages`. It receives an array of URLs and calls a callback with a javascript `Image` object for each of the loaded images. The callbacks are guaranteed to fire in the same order as the list of image URLs.

Example:

```javascript
CD.getImages(['http://example.com/1.png',
              'http://example.com/2.png'], function(img) {
  CD.$('div.images')[0].appendChild(img);
});
```

## Changelog

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
