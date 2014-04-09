// @license magnet:?xt=urn:btih:90dc5c0be029de84e523b9b3922520e79e0e6f08&dn=cc0.txt CC0
// @source https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul
/* imul-shim.js - polyfill for imul, based on Mozilla code.
 *
 * The core code here is from the Mozilla documentation wiki.
 *
 * According to: https://developer.mozilla.org/en-US/docs/MDN/About#Copyrights_and_licenses
 *
 *     Code samples added on or after August 20, 2010 are in the public
 *     domain. No licensing notice is necessary, but if you need one,
 *     you can use: "Any copyright is dedicated to the Public Domain.
 *     http://creativecommons.org/publicdomain/zero/1.0/".
 *
 * The source page is a wiki page that, according to its history, was
 * created December 17, 2012, so logically the code sample is after
 * August 20, 2010.  The indicated license is really the CC0 license,
 * so we use that in the LibreJS markup.
 */
(function(){
    if (typeof Math.imul !== 'function') {
        Math.imul = function (a, b) {
            var ah  = (a >>> 16) & 0xffff;
            var al = a & 0xffff;
            var bh  = (b >>> 16) & 0xffff;
            var bl = b & 0xffff;
            // the shift by 0 fixes the sign on the high part
            // the final |0 converts the unsigned value into a signed value
            return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0)|0);
        };
    }
})();
// @license-end
