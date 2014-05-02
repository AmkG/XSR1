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
define(['field', 'vars', 'signal'], function (field, vars, signal) {
"use strict";
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

engines.getSetSpeed()
- returns the value given to setSpeed().

engines.atTargetSpeed()
- return true if running at the speed
  targeted by setSpeed().

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
var rates = [
    0.0,
    1.0,
    1.5,
    2.0,
    2.5,
    3.0,
    3.5,
    7.5,
    11.25,
    15.0
];
var hyperwarprate = 18.0;

var acceleration = 15.0;

function nullFun() { }

function Engines() {
    this.initialize();
    signal('update', this.update.bind(this));
    signal('mainMenu', this._onMainMenu.bind(this));
    signal('newGame', this._onNewGame.bind(this));
    signal('enterNormal', this._onEnterNormal.bind(this));
    signal('enterHyperspace', this._onEnterHyperspace.bind(this));
    signal('fix', this.fix.bind(this));
}
Engines.prototype.initialize = function () {
    this._state = FIXED;

    this._warping = false;
    this._inhyperspace = false;
    this._warpcb = nullFun;
    this._warpspeed = 0.0;
    this._speedsetting = 0;

    this._curspeed = 0.0;
    this._actualspeed = 0.0;
    this._targetspeed = 0.0;

    this._enerate = 0.0;

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
    if (this._inhyperspace) {
        // ignore player attempts to change speed.
        return this;
    }
    this._targetspeed = speeds[n];
    this._enerate = rates[n];
    this._warping = false;
    this._warpcb = nullFun;
    this._speedsetting = n;
    return this;
};
Engines.prototype.getSetSpeed = function () {
    return this._speedsetting;
};
Engines.prototype.atTargetSpeed = function () {
    return this._targetspeed === this._actualspeed;
};
Engines.prototype.hyperwarp = function (f) {
    if (this._inhyperspace) {
        // ignore player attempts to change speed.
        return this;
    }
    this._enerate = hyperwarprate;
    this._warping = true;
    this._warpcb = f;
    this._speedsetting = -1;
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
    var step = acceleration * seconds;
    var warpcb = nullFun;
    if (this._inhyperspace) {
        // Don't update in hyperspace
        return this;
    }

    /* Update normal engines.  */
    if (this._curspeed < this._targetspeed) {
        this._curspeed += step;
        if (this._curspeed > this._targetspeed) {
            this._curspeed = this._targetspeed;
        }
    } else if (this._curspeed > this._targetspeed) {
        this._curspeed -= step;
        if (this._curspeed < this._targetspeed) {
            this._curspeed = this._targetspeed;
        }
    }
    /* Handle engine damage.  */
    if (this._state === FIXED) {
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

    /* Update warp engines.  */
    if (this._warping) {
        if (this._warpspeed < 100.0) {
            this._warpspeed += step;
            if (this._warpspeed > 100.0) {
                this._warpspeed = 100.0;
            }
        }
    } else {
        if (this._warpspeed > 0.0) {
            this._warpspeed -= step;
            if (this._warpspeed < 0.0) {
                this._warpspeed = 0.0;
            }
        }
    }

    /* Get the higher of actual and warp speed*/
    if (this._warpspeed > this._actualspeed) {
        this._actualspeed = this._warpspeed;
    }
    field.speed = this._actualspeed;

    vars.energy.consume(this._enerate * seconds);

    /* On hyperwarp entry.  */
    if (this._warping && this._warpspeed >= 99.999) {
        warpcb = this._warpcb;
        this.setSpeed(0);
        warpcb.call(warpcb);
    }

    return this;
};
Engines.prototype._onMainMenu = function () {
    this._curspeed = 0.0;
    this._targetspeed = speeds[6];
    this._enerate = 0.0;
    this._warping = false;
    this._warpspeed = 0.0;
    this._warpcb = nullFun;
    this._state = FIXED;
    this._speedsetting = 6;
    return this;
};
Engines.prototype._onNewGame = function () {
    this._enerate = rates[6];
    return this;
};
Engines.prototype._onEnterNormal = function () {
    this._inhyperspace = false;
    return this;
};
Engines.prototype._onEnterHyperspace = function () {
    this._inhyperspace = true;
    return this;
};

return new Engines();
});
