/* main.js - main source.  */
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
define(function (require) {
"use strict";

var resize = require('resize');
var keys = require('keys');
var menu = require('menu');
var engines = require('engines');
var playerControl = require('playerControl'); // needed.
var loop = require('loop');
var sector = require('sector'); // needed.
var damageControl = require('damageControl'); // needed.

function stopDefault(e) {
    e = e || window.event;
    e.preventDefault();
    e.stopPropagation();
}

function realMain() {
    // register mousedown on event capture.
    window.addEventListener('mousedown', stopDefault, true);

    resize.initialize();
    keys.initialize();
    menu.initialize();
    engines.initialize();

    loop();
}

/*-----------------------------------------------------------------------------
Initialization
-----------------------------------------------------------------------------*/

function main() {
    function nullFun() { }

    function onDOMContentLoaded() {
        document.removeEventListener('DOMContentLoaded', onDOMContentLoaded, false);
        window.removeEventListener('load', onDOMContentLoaded, false);
        document.onreadystatechange = nullFun;
        realMain();
    }
    function onreadystatechange() {
        if (document.readyState === 'complete') {
            onDOMContentLoaded();
        }
    }

    if (document.readyState === 'complete') {
        realMain();
    } else {
        document.addEventListener('DOMContentLoaded', onDOMContentLoaded, false);
        window.addEventListener('load', onDOMContentLoaded, false);
        document.onreadystatechange = onreadystatechange;
    }

}

return main;
});
