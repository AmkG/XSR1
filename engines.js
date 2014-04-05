/* engines.js - simulate ion pulse engines.  */
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
define(['field'], function (field) {
/*
engines.initialize()
- initialize the engines.

engines.damage()
- damage the engines (stutter).

engines.destroy()
- destroy the engines (almost 1 speed).

engines.fix()
- cancel engine damage or destruction.

engines.colorState()
- string 'red' for destroyed, 'yellow' for
  damaged, 'green' for OK.

engines.setSpeed(n)
- 0 <= n <= 9
- Sets the target speed according to the
  player's requested speed.  If fixed,
  engines will attempt to move to that
  speed, if damaged, engines will stutter
  to that speed, if destroyed, engines
  will saturate to 1.
- cancels hyperwarp mode.

engines.hyperwarp(fun)
- fun is a function to be called when
  speed reaches 100.
- cancels normal speed.
- ignores engine destruction.

engines.isHyperwarp()
- return true if currently in hyperwarp,
  false otherwise.

engines.toString()
- Returns a two-digit string indicating
  the Math.floor of the current speed,
  or &infin; if 100 or more.

engines.update(seconds)
- Updates the field speed.
*/

var FIXED = 0;
var DAMAGED = 1;
var DESTROYED = 2;

var speeds = [
    0.0,
    0.390625,
    0.78125,
    1.5625,
    3.125,
    6.25,
    12.5,
    25.0,
    37.5,
    43.75
];

var acceleration = 5.0;

function nullFun() { }

function Engines() {
    this.initialize();
}
Engines.prototype.initialize = function () {
    this._state = FIXED;

    this._warping = false;
    this._warpcb = nullFun;

    this._curspeed = 0.0;
    this._actualspeed = 0.0;
    this._targetspeed = 0.0;

    return this;
};
Engines.prototype.damage = function () {
    this._state = DAMAGED;
    return this;
};
Engines.prototype.destroy = function () {
    this._state = DESTROYED;
    return this;
};
Engines.prototype.fix = function () {
    this._state = FIXED;
    return this;
};
Engines.prototype.colorState = function () {
    if (this._state === FIXED) {
        return 'green';
    } else if (this._state === DAMAGED) {
        return 'yellow';
    } else {
        return 'red';
    }
};
Engines.prototype.setSpeed = function (n) {
    this._targetspeed = speeds[n];
    this._warping = false;
    this._warpcb = nullFun;
    return this;
};
Engines.prototype.hyperwarp = function (f) {
    this._targetspeed = 100.0;
    this._warping = true;
    this._warpcb = f;
    return this;
};
Engines.prototype.isHyperwarp = function () {
    return this._warping;
};
Engines.prototype.toString = function () {
    var rv = Math.floor(this._actualspeed);
    if (rv < 10) {
        return '0' + rv;
    } else if (rv >= 100) {
        return '&infin;';
    } else {
        return '' + rv;
    }
};
Engines.prototype.update = function (seconds) {
    var step;
    if (this._curspeed < this._targetspeed) {
        step = acceleration * seconds;
        this._curspeed += step;
        if (this._curspeed > this._targetspeed) {
            this._curspeed = this._targetspeed;
        }
    } else if (this._curspeed > this._targetspeed) {
        step = acceleration * seconds;
        this._curspeed -= step;
        if (this._curspeed < this._targetspeed) {
            this._curspeed = this._targetspeed;
        }
    }

    if (this._state === FIXED || this._warping) {
        this._actualspeed = this._curspeed;
    } else if (this._state === DAMAGED) {
        this._actualspeed = this._curspeed * Math.random();
    } else {
        this._curspeed = this._curspeed * 0.1;
        if (this._curspeed >= 1.5625) {
            this._curspeed = 1.5625;
        }
        this._actualspeed = this._curspeed;
    }

    field.speed = this._actualspeed;

    return this;
};

return new Engines();
});
