/* vars.js - keep track of energy and kills.  */
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
define(['signal'], function (signal) {
"use strict";

var e = 9999.0;
var energy = {};
energy.clear = function () {
    e = 9999.0;
    return this;
};
energy.consume = function (v) {
    e -= v;
    if (e < 0.0) {
        e = 0.0;
    }
    return this;
};
energy.isEmpty = function () {
    return e <= 0.0;
};
energy.toString = function () {
    if (e >= 10000.0) {
        return '9999';
    } else if (e >= 1000.0) {
        return Math.floor(e).toString();
    } else if (e >= 100.0) {
        return '0' + Math.floor(e).toString();
    } else if (e >= 10.0) {
        return '00' + Math.floor(e).toString();
    } else if (e >= 1.0) {
        return '000' + Math.floor(e).toString();
    } else {
        return '0000';
    }
};

var k = 0;
var kills = {};
kills.clear = function () {
    k = 0;
    return this;
};
kills.add = function () {
    ++k;
    return this;
};
kills.toString = function () {
    if (k >= 100) {
        return '99';
    } else if (k >= 10) {
        return k.toString();
    } else {
        return '0' + k.toString();
    }
};

var vars = {};
vars.energy = energy;
vars.kills = kills;
vars.clear = function () {
    energy.clear();
    kills.clear();
    return vars;
};
vars.update = function (seconds) {
    energy.consume(seconds * 0.25); // life support
};

signal('newGame', vars.clear);
signal('update', vars.update);
signal('killNyloz', kills.add);
signal('fix', energy.clear);

return vars;
});
