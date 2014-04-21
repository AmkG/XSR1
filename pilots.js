/* pilots.js - Implementation of two Nyloz pilots.  */
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
define(['signal','field'],
function(signal , field) {

/*-----------------------------------------------------------------------------
Nyloz Ship Engines
-----------------------------------------------------------------------------*/
/*
 * Nyloz have two engines:
 *   One engine only moves in the Z direction
 *     at either away, towards, or no movement
 *     relative to player.
 *   The second engine moves in one of the 6
 *     3-d directions, or no movement.
 *
 * The main "Z" engine runs at speed 12.5
 *   (the "engines 6" speed of the player).
 * The secondary "Direction" engine runs
 *   at speed 10
 */
var NONE = 0;
var XP = 1;
var XN = 2;
var YP = 3;
var YN = 4;
var ZP = 5;
var ZN = 6;
function Engines() {
    this._z = 0;
    this._dir = NONE;
}
Engines.prototype.apply = (function () {

var tb = [];
tb[NONE] = function (vec) {
    vec[0] = 0.0;
    vec[1] = 0.0;
    vec[2] = 0.0;
};
tb[XP] = function (vec) {
    vec[0] = 10.0;
    vec[1] = 0.0;
    vec[2] = 0.0;
};
tb[XN] = function (vec) {
    vec[0] = -10.0;
    vec[1] = 0.0;
    vec[2] = 0.0;
};
tb[YP] = function (vec) {
    vec[0] = 0.0;
    vec[1] = 10.0;
    vec[2] = 0.0;
};
tb[YN] = function (vec) {
    vec[0] = 0.0;
    vec[1] = -10.0;
    vec[2] = 0.0;
};
tb[ZP] = function (vec) {
    vec[0] = 0.0;
    vec[1] = 0.0;
    vec[2] = 10.0;
};
tb[ZN] = function (vec) {
    vec[0] = 0.0;
    vec[1] = 0.0;
    vec[2] = -10.0;
};
function apply(vec) {
    tb[this._dir](vec);
    vec[2] += this._z * 12.5;
    return this;
}

return apply;
})();
Engines.prototype.setZ = function (z) {
    this._z = z;
    return this;
};
Engines.prototype.getZ = function () {
    return this._z;
};
Engines.prototype.setDir = function (dir) {
    this._dir = dir;
    return this;
};
Engines.prototype.getDir = function (dir) {
    return this._dir;
};

/*-----------------------------------------------------------------------------
Nyloz Pilot Behavior
-----------------------------------------------------------------------------*/

function Pilot(num) {
    // Bogey number.
    this._num = num;

    // Ship engines.
    this._engines = new Engines();
    // Ship total life.
    this._life = 1;

    // Will the pilot shoot the player from behind?
    // (false on NOVICE and PILOT)
    this._shootFromBehind = true;

    // Scratch space.
    this._ar3d = [0.0, 0.0, 0.0];

    // Create callbacks.
    this._cb_updateBogey = this._updateBogey.bind(this);
    this._cb_collideBogey = this._collideBogey.bind(this);

    // Signals.
    signal('newGame', this.newGame.bind(this));
}
/* Called by the sector manager to instantiate a random Nyloz
   craft outside the normal detection range of the player.  */
Pilot.prototype.create = function () {
    var html = '';
    var x = 0.0;
    var y = 0.0;
    var z = 150.0;
    var shipSize = 2.5;

    // TODO: randomize state of the pilot.

    // Randomize location of the Nyloz ship.
    x = Math.random() * 100.0 - 50.0;
    y = Math.random() * 100.0 - 50.0;
    z = Math.random() * 300.0 + 121.0;
    z = (Math.random() < 0.5) ? z : -z;

    // TODO: Vary the Nyloz ship
    html = '&gt;&bull;&lt;';
    shipSize = 2.5;
    this._life = 1;

    field.setBogey(this._num, x, y, z,
                   this._cb_updateBogey, this._cb_collideBogey, html,
                   shipSize);
    return this;
};
/* Called by the field manager to update the speed of the Nyloz
   craft based on its position and internal state.  */
Pilot.prototype._updateBogey = function (pos, vec, seconds) {
    // TODO: Update engines
    this._engines.apply(vec);
    return this;
};
/* Called by the field manager when a Nyloz ship is hit by
    the player.  */
Pilot.prototype._collideBogey = function () {
    var ar3d = this._ar3d;
    var num = this._num;
    var missilePower = 0;

    field.getBogeyPosition(num, ar3d);
    /* Judge the pleyer missile's power according to the Nyloz's
       distance to the player.  */
    if (ar3d[2] < 25.0) {
        missilePower = 2;
    } else {
        missilePower = 1;
    }

    /* Damage the Nyloz ship.  */
    this._life -= missilePower;
    if (this._life <= 0) {
        field.clearBogey(num);
        signal.raise('killNyloz', num);
        /* Raising killNyloz could re-create this ship, so this
           step should be the last.  */
    }

    return this;
};
/* Called by the game loop at start of the game.  */
Pilot.prototype.newGame = function (difficulty) {
    switch (difficulty) {
    case 'NOVICE':
        this._shootFromBehind = false;
        break;
    case 'PILOT':
        this._shootFromBehind = false;
        break;
    case 'WARRIOR':
        this._shootFromBehind = true;
        break;
    case 'COMMANDER':
        this._shootFromBehind = true;
        break;
    }

    return this;
};

return [new Pilot(0), new Pilot(1)];
});
