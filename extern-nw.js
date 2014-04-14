/* extern-nw.js - Makes external links open in an external browser
   if running in node-webkit.  */
/**
 *
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2014  Alan Manuel K. Gloria
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
/* NOTE!  This code needs to be loaded before require.js is.  */
if (typeof process !== 'undefined') {
(function (require) {
/* Code to handle node-webkit case.  */

var gui = require('nw.gui');
var win = gui.Window.get();
var Shell = gui.Shell;

/* onclick handler.  */
function handler(e) {
    win.minimize();
    e = e || window.event;
    e.preventDefault();
    e.stopPropagation();
    Shell.openExternal(this.href);
}

function fixLinks() {
    document.removeEventListener('DOMContentLoaded', fixLinks);
    var as = Array.prototype.slice.call(
        document.getElementsByClassName('extern'),
        0
    );
    var i = 0;
    var l = as.length;
    for (i = 0; i < l; ++i) {
        as[i].onclick = handler;
    }
}
document.addEventListener('DOMContentLoaded', fixLinks);

})(require);
}
