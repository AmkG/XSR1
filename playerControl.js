/* playerControl.js - handles the controls of the player.  */
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

var chart = require('galaxy').chart;
var console = require('console');
var engines = require('engines');
var field = require('field');
var keys = require('keys');
var label = require('label');
var loop = require('loop');
var panel = require('panel');
var shield = require('shield');
var signal = require('signal');
var vars = require('vars');

/*-----------------------------------------------------------------------------
Key Handler Table
-----------------------------------------------------------------------------*/

var keytable = {};

(function () {
var i;
function engineControl(k) {
    engines.setSpeed(parseInt(k));
}
for (i = 0; i <= 9; ++i) {
    keytable[i.toString()] = engineControl;
}
})();

keytable['a'] = keytable['A'] = function () {
    label('AFT VIEW');
    panel.show();
    field.viewAft();
    field.display = true;
    chart.hide();
};
keytable['f'] = keytable['F'] = function () {
    label('');
    panel.show();
    field.viewFront();
    field.display = true;
    chart.hide();
};
// TODO: LRS
keytable['g'] = keytable['G'] = function () {
    label('GALACTIC CHART');
    panel.hide();
    field.display = false;
    chart.show();
};

keytable['s'] = keytable['S'] = function () {
    if (shield.isEnabled()) {
        console.write('Shields Disabled.');
        shield.disable();
    } else {
        console.write('Shields Enabled.');
        shield.enable();
    }
};

keytable['\e'] = keytable['p'] = keytable['P'] = function () {
    loop.enterPause();
};

/*-----------------------------------------------------------------------------
Interface
-----------------------------------------------------------------------------*/

function onUpdate() {
    var movex = 0;
    var movey = 0;
    var k = '';
    var f = null;

    if (keys.left) {
        --movex;
    }
    if (keys.right) {
        ++movex;
    }
    if (keys.up) {
        --movey;
    }
    if (keys.down) {
        ++movey;
    }

    if (!chart.isShown()) {
        field.yaw = movex;
        field.pitch = -movey;
        chart.movex = 0;
        chart.movey = 0;
    } else {
        field.yaw = 0;
        field.pitch = 0;
        chart.movex = movex;
        chart.movey = movey;
    }

    k = keys.key;
    if (k !== '') {
        if (typeof keytable[k] === 'function') {
            keytable[k](k);
        }
    }
}

signal('update', onUpdate);
return onUpdate;
});