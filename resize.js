/* resize.js - Object that handles resizing of the window.  */
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
define([], function () {
"use strict";
var resize = {};
resize.width = 0;
resize.height = 0;
resize.cenx = 0.1;
resize.ceny = 0.1;
resize.scale = 0.1;
resize.maxsize = 0.1;

function onresize() {
    var w = window.innerWidth ||
        document.documentElement.clientWidth;
    var h = window.innerHeight ||
        document.documentElement.clientHeight;
    resize.cenx = w / 2;
    resize.ceny = h / 2;
    if (w > h) {
        resize.scale = resize.ceny;
    } else {
        resize.scale = resize.cenx;
    }
    resize.maxsize = resize.scale / 4;
    resize.height = h;
    resize.width = w;
    return this;
}

resize.initialize = function () {
    window.addEventListener('resize', onresize, false);
    onresize();
    return resize;
};

return resize;
});
