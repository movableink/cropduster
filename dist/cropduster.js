!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.cropduster=t():e.cropduster=t()}("undefined"!=typeof self?self:this,function(){return function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}return r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:n})},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=0)}([function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const n="callbacks are deprecated in cropduster, prefer using promises for asynchronous operations",o={CORS_PROXY_SERVER:"http://cors.movableink.com",$:(e,t)=>(t||(t=document),[...t.querySelectorAll(e)]),_initParams(){o._urlParams={};const e=/([^&=]+)=?([^&]*)/g,t=o._searchString();let r=e.exec(t);for(;r;)o._urlParams[decodeURIComponent(r[1])]=decodeURIComponent(r[2]),r=e.exec(t)},param:e=>o.params()[e],params(e){let t=o._urlParams;return void 0===t&&(o._initParams(),t=o._urlParams),e?t[e]:t},_searchString:()=>window.location.search.substring(1),autofill(){o.param("init");const e=o._urlParams;for(const t in e)"undefined"!==e[t]&&e[t].length>0&&document.getElementById(`autofill_${t}`)&&(document.getElementById(`autofill_${t}`).innerHTML=e[t])},throwError(e){o.miCaptureFallback(()=>{MICapture.error(e)},()=>{o.log("Capturama error: "+e)})},cancelRequest(e){o.miCaptureFallback(()=>{MICapture.cancel(e)},()=>{o.log(`Request canceled: ${e}`)})},setImageRedirect(e){const t=document.getElementById("mi-redirect-image")||document.createElement("a");return t.href=e,t.id="mi-redirect-image",t.style.display="none",document.body.appendChild(t),t},setClickthrough(e){const t=document.getElementById("mi_dynamic_link")||document.createElement("a");return t.href=e,t.id="mi_dynamic_link",t.style.display="none",document.body.appendChild(t),t},setExtraData(e){const t=document.getElementById("mi-data")||document.createElement("div");let r;t.id="mi-data",t.style.display="none";try{r=JSON.parse(t.getAttribute("data-mi-data"))||{}}catch(e){r={}}for(const n in e)e.hasOwnProperty(n)&&(r[n]=e[n]);return t.setAttribute("data-mi-data",JSON.stringify(r)),document.body.appendChild(t),t},proxyUrl(e){const t=document.createElement("a");t.href=e;let r="";r="0"===t.port||""===t.port?"https:"===t.protocol?":443":"":`:${t.port}`;const{hostname:n,pathname:a,search:s,hash:u}=t;return`${o.CORS_PROXY_SERVER}/${n}${r}${a}${s}${u}`},_readyToCapture:!0,_reset(){o._readyToCapture=!0},pause(e,t="manual suspension"){e&&(t+=`, will end in ${e}ms`,setTimeout(()=>{o.resume(t)},e)),o.miCaptureFallback(()=>{MICapture.pause(t)},()=>{o.log(`paused: ${t}`)})},resume(e){o.miCaptureFallback(()=>{MICapture.resume(e)},()=>{o.log(`resuming paused capture: ${e}`)})},getCORS(e,t={},r){return"function"==typeof t&&(r=t,t={}),t.corsCacheTime=t.corsCacheTime||1e4,/cors.movableink.com/.test(e)||(e=o.proxyUrl(e)),t.headers=t.headers||{},t.headers["x-reverse-proxy-ttl"]=t.corsCacheTime/1e3,t.headers["x-mi-cbe"]=this._hashForRequest(e,t),o.get(e,t,r)},get(e,t={},r){"function"==typeof t&&(r=t,t={});const a=function(){if(r&&"function"==typeof r)return o.log(n),r(...arguments)},s=`xhr: ${e}`;return new Promise(function(r,n){try{const u=new XMLHttpRequest;if(u.onerror=function(){const t=`XHR error for ${e} - ${this.status}: ${this.statusText}`;o.resume(s),a(null),n(new Error(t))},u.onload=function(){const e=this.getResponseHeader("content-type"),t=this.responseText,n=this.status;if(n>=400)return this.onerror();o.resume(s),a(t,n,e),r({contentType:e,data:t,status:n})},u.open(t.method||"GET",e,!0),u.withCredentials=!0,t.headers)for(const e in t.headers)u.setRequestHeader(e,t.headers[e]);u.send(t.body),o.pause(t.maxSuspension,s)}catch(e){a(null),n({message:`Cropduster failed to create Promise: ${e}`,error:e})}})},getImage(e,t={},r){"function"==typeof t&&(r=t,t={});const a=function(){if(r&&"function"==typeof r)return o.log(n),r(...arguments)},s=`getImage: ${e}`;return new Promise(function(r,n){const u=new Image;u.onload=function(){o.resume(s),a(u),r(u)},u.onerror=function(e){o.resume(s),a(null),n(e)},o.pause(t.maxSuspension,s),u.src=e})},getImages(e,t={},r,a){const s="getImages:";o.pause(t.maxSuspension,s),"function"==typeof t&&(a=r,r=t,t={});const u=e.map(e=>this.getImage(e,t.maxSuspension).then(e=>(r&&r(e),e)));return Promise.all(u).then(e=>(a&&(o.log(n),a(e)),o.resume(s),e),e=>{throw o.resume(s),new Error("Not all images loaded successfully")})},waitForAsset(e){o.miCaptureFallback(()=>{MICapture.waitForAsset(e)},()=>{o.log(`Wait for asset: ${e}`)})},log(e){console.log(e)},miCaptureFallback(e,t){const r=!!window.MICapture&&"object"==typeof window.MICapture;return r?e():t()},_hashForRequest(e,t){const r=`${e}${JSON.stringify(t)}`;let n=0;if(0===r.length)return n;for(let o=0;o<r.length;o++)n=(n<<5)-n+r.charCodeAt(o)&4294967295;return n.toString()}};t.default=o}])});