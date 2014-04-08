/* signal.js - signal for significant game events.  */
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

var registry = {};
var update = [];
var render = [];

var emptyArray = [];

function signal(name, fun) {
    var arr;
    if (name === 'update') {
        update.push(fun);
    } else if (name === 'render') {
        render.push(fun);
    } else {
        arr = registry[name] || (registry[name] = {});
        arr.push(fun);
    }
    return signal;
}
signal.raise = function (name, i1) {
    var atgs;
    var i;
    var l;
    var arr;
    if (name === 'update') {
        return signal.update(i1);
    } else if (name === 'render') {
        return signal.render();
    }
    args = Array.prototype.slice.call(arguments, 1);
    arr = registry[name] || emptyArray;
    l = arr.length;
    for (i = 0; i < l; ++i) {
        arr[i].apply(signal, args);
    }
    return signal;
};
signal.update = function (seconds) {
    var i;
    var l;
    l = update.length;
    for (i = 0; i < l; ++i) {
        update[i](seconds);
    }
    return signal;
};
signal.render = function () {
    var i;
    var l;
    l = render.length;
    for (i = 0; i < l; ++i) {
        render[i]();
    }
    return signal;
};

return signal;
});
