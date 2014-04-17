/* photons.js - Handles the player's photon cannons.  */
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
define(['signal', 'field'], function (signal, field) {

/* Refire rate for an individual tube.  */
var tubeRefire = 0.5;
/* Refire rate for the ship in general.  */
var mainRefire = 0.2;

/* Position of the photon tubes.  */
var tubeY = 1.0;
var leftTubeX = -1.0;
var rightTubeX = 1.0;

/* _state values.  */
var FIXED = 0;
var DEADLEFT = 1;
var DEADRIGHT = 2;
var DESTROYED = 3;
/* _priority values.  */
var LEFT = 0;
var RIGHT = 1;

function Photons() {
    this._state = FIXED;

    /* Refire delay.  */
    this._leftRefire = 0.0;
    this._rightRefire = 0.0;
    this._shipRefire = 0.0;

    /* Which tube has firing priority.  */
    this._priority = LEFT;

    /* Fire button control.  */
    this.fire = false;

    signal('update', this.update.bind(this));
    /* Nothing to render, as field does rendering of photons for us.  */
    signal('newGame', this.newGame.bind(this));
}
Photons.prototype.colorState = function () {
    var state = this._state;
    if (state === FIXED) {
        return 'green';
    } else if (state === 'DEADLEFT' || state === 'DEADRIGHT') {
        return 'yellow';
    } else {
        return 'red';
    }
};
Photons.prototype.fix = function () {
    this._state = FIXED;
    return this;
};
Photons.prototype.damageLeft = function () {
    if (this._state === FIXED) {
        this._state = DEADLEFT;
    } else if (this._state === DEADRIGHT) {
        this._state = DESTROYED;
    }
    return this;
};
Photons.prototype.damageRight = function () {
    if (this._state === FIXED) {
        this._state = DEADRIGHT;
    } else if (this._state === DEADLEFT) {
        this._state = DESTROYED;
    }
    return this;
};
Photons.prototype.destroy = function () {
    this._state = DESTROYED;
    return this;
};
Photons.prototype.canFireLeft = function () {
    return (this._state === FIXED || this._state === DEADRIGHT);
};
Photons.prototype.canFireRight = function () {
    return (this._state === FIXED || this._state === DEADLEFT);
};
Photons.prototype.update = function (seconds) {
    var dir;
    /* Handle refire rates.  */
    if (this._leftRefire > 0.0) {
        this._leftRefire -= seconds;
        if (this._leftRefire < 0.0) {
            this._leftRefire = 0.0;
        }
    }
    if (this._rightRefire > 0.0) {
        this._rightRefire -= seconds;
        if (this._rightRefire < 0.0) {
            this._rightRefire = 0.0;
        }
    }
    if (this._shipRefire > 0.0) {
        this._shipRefire -= seconds;
        if (this._shipRefire < 0.0) {
            this._shipRefire = 0.0;
        }
    }

    /* Handle firing of photons.  */
    if (this.fire && this._state !== DESTROYED) {
        if (this._shipRefire <= 0.0) {
            if (this._priority === LEFT) {
                this._tryFireLeft() || this._tryFireRight();
            } else {
                this._tryFireRight() || this._tryFireLeft();
            }
        }
    }

    return this;
};
Photons.prototype._tryFireLeft = function () {
    var dir = 0;
    if (this._leftRefire <= 0.0 && this.canFireLeft()) {
        this._leftRefire = tubeRefire;
        this._shipRefire = mainRefire;
        dir =
            (field.currentView === 'aft' && field.display) ?    -1 :
            /*otherwise*/                                       1 ;
        field.fireMissile(0, leftTubeX, tubeY, 0.0, dir);
        this._priority = RIGHT;
        return true;
    } else {
        return false;
    }
};
Photons.prototype._tryFireRight = function () {
    var dir = 0;
    if (this._rightRefire <= 0.0 && this.canFireRight()) {
        this._rightRefire = tubeRefire;
        this._shipRefire = mainRefire;
        dir =
            (field.currentView === 'aft' && field.display) ?    -1 :
            /*otherwise*/                                       1 ;
        field.fireMissile(1, rightTubeX, tubeY, 0.0, dir);
        this._priority = LEFT;
        return true;
    } else {
        return false;
    }
};
Photons.prototype.newGame = function () {
    this.fix();
    this._leftRefire = 0.0;
    this._rightRefire = 0.0;
    this._shipRefire = 0.0;
    this.fire = false;
    this._priority = LEFT;
    return this;
};

return new Photons();
});
