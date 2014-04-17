/* hyperwarp.js - handles details of hyperwarp.  */
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
define( ['signal','engines','field','galaxy','console','vars','resize'],
function (signal , engines , field , galaxy , console , vars , resize) {
/*
 * Note: the state of "entering hyperwarp" is stored
 * by the engines, because that module is responsible
 * for handling our velocity.  This module installs a
 * callback to handle entry into hyperspace.
 */

/*
 * Terminology:
 * hyperwarp - the part where the ship is speeding up to
 *   100.0 metrons/second
 * hyperspace - the "null part" where the display is blanked
 *   while the ship is travelling between sectors.
 */

/* Rate at which energy is consumed while in hyperspace, in
   units per second.  */
var energyConsumeRate = 600.0;
/* Rate at which they hyperwarp target can move/be moved, in
   sectors per second.  */
var targetSpeed = 2.0;
/* Energy actually consumed to jump from one sector to another.  */
var jumpEnergy = [
    100,
    130,
    160,
    200,
    230,
    500,
    700,
    800,
    900,
    1200,
    1250,
    1300,
    1350,
    1400,
    1550,
    1700,
    1840,
    2000,
    2080,
    2160,
    2230,
    2320,
    2410,
    2500
];

/* Create the DOM node for the hyperwarp target.  */
function createTargetDom() {
    var dom;
    var sub;
    var i;

    dom = document.createElement('main');
    dom.id = 'hyperwarptarget';

    for (i = 0; i < 4; ++i) {
        sub = document.createElement('div');
        sub.id = 'hyperwarptarget_sub' + i;
        dom.appendChild(sub);
    }

    document.body.appendChild(dom);
    return dom;
}

function Hyperwarp() {
    /* Set if the current difficulty requires hyperwarp to be
       steered manually.  */
    this._needSteer = false;

    /* The amount of time still remaining to spend in
       hyperspace.  */
    this._hyperspaceTime = 0.0;

    /* Offset of the hyperwarp target from the center.  */
    this._offsetX = 0.0;
    this._offsetY = 0.0;

    /* Target sector's location.  */
    this._targetX = 0.0;
    this._targetY = 0.0;

    /* DOM nodes for target and hyperspace-hiding.  */
    this._domTarget = null;
    this._domHyperspace = null;

    /* 2-dimensional scratch array.  */
    this._ar2 = [0.0, 0.0];

    /* Bound version of _onHyperwarp method, so that we
       don't have to keep allocating.  */
    this._cb = this._onHyperwarp.bind(this);

    signal('newGame', this.newGame.bind(this));
    signal('mainMenu', this.mainMenu.bind(this));
    signal('update', this.update.bind(this));
    signal('render', this.render.bind(this));
}
Hyperwarp.prototype.newGame = function (difficulty) {
    this._needSteer = (difficulty !== 'NOVICE');
    this._hyperspaceTime = 0.0;
    return this;
};
Hyperwarp.prototype.mainMenu = function () {
    this._hyperspaceTime = 0.0;
    return this;
};
Hyperwarp.prototype.engage = function () {
    engines.hyperwarp(this._cb);
    return this;
};
Hyperwarp.prototype.engaged = function () {
    return engines.isHyperwarp();
};
Hyperwarp.prototype._onHyperwarp = function () {
    var dist = 0;
    var energy = 0;
    /* Compute location of target sector.  */
    galaxy.chart.getTargetPosition(this._ar2);
    this._targetX = this._ar2[0] + this._offsetX;
    this._targetY = this._ar2[1] + this._offsetY;
    if (this._targetX < 0.0) {
        this._targetX += 16.0;
    } else if (this._targetX >= 16.0) {
        this._targetX -= 16.0;
    }
    if (this._targetY < 0.0) {
        this._targetY += 8.0;
    } else if (this._targetY >= 8.0) {
        this._targetY -= 8.0;
    }
    /* Determine offset from player location.  */
    galaxy.getPlayerPosition(this._ar2);
    dist = Math.floor(
        Math.abs(this._ar2[1] - this._targetY) +
        Math.abs(this._ar2[0] - this._targetX)
    );
    /* Get energy required to jump.  */
    energy = jumpEnergy[dist];
    /* Compute hyperspace time.  */
    this._hyperspaceTime = energy / energyConsumeRate;

    /* Tell the rest of the game we're entering hyperspace.
       (Prevent bogeys from hunting us down).  */
    signal.raise('enterHyperspace');

    console.write('Hyperspace.');
    return this;
};
Hyperwarp.prototype.update = function (seconds) {
    /* Drain energy while travelling in hyperspace.  */
    if (this._hyperspaceTime > 0.0) {
        if (this._hyperspaceTime > seconds) {
            vars.energy.consume(seconds * energyConsumeRate);
            this._hyperspaceTime -= seconds;
        } else {
            vars.energy.consume(this._hyperspaceTime * energyConsumeRate);
            this._hyperspaceTime = 0.0;
            /* Tell galactic chart to update.  */
            this._ar2[0] = this._targetX;
            this._ar2[1] = this._targetY;
            galaxy.setPlayerPosition(this._ar2)
            .chart.setTargetPosition(this._ar2);
            /* Tell rest of the game that we have entered normal space.  */
            signal.raise('enterNormal');
        }
    }
    /* Offset the target at random in hyperwarp.  */
    if (this._needSteer && engines.isHyperwarp()) {
        this._offsetX += (Math.random() - 0.5) * seconds * targetSpeed * 2.0;
        this._offsetY += (Math.random() - 0.5) * seconds * targetSpeed * 2.0;
    }
    /* Reset the offset when hyperwarp isn't engaged.  */
    if (!engines.isHyperwarp()) {
        this._offsetX = 0.0;
        this._offsetY = 0.0;
    } else {
        /* Navigate the hyperwarp target.  */
        this._offsetX += -seconds * field.yaw * targetSpeed;
        this._offsetY += -seconds * field.pitch * targetSpeed;
    }
    return this;
};
Hyperwarp.prototype.render = function () {
    return this._renderTarget()._renderHyperspace();
};
Hyperwarp.prototype._renderTarget = function () {
    var display = false;
    var sz = 0;
    var size = '';
    var ox = this._offsetX;
    var oy = this._offsetY;

    /* Show the target only if we are in hyperwarp (but not in
       hyperspace), the
       field is shown, and the field is in Front mode.  */
    display = this._hyperspaceTime === 0.0 &&
        engines.isHyperwarp() &&
        field.display &&
        field.currentView === 'front';

    if (display) {
        if (!this._domTarget) {
            this._domTarget = createTargetDom();
        }
        sz = Math.floor(resize.maxsize / 2);
        size = sz + 'px';
        this._domTarget.style.width = this._domTarget.style.height = size;
        this._domTarget.style.left = Math.floor(resize.cenx + ox * sz) + 'px';
        this._domTarget.style.top = Math.floor(resize.ceny + oy * sz) + 'px';
        this._domTarget.style.display = 'block';
    } else {
        if (this._domTarget) {
            this._domTarget.style.display = 'none';
        }
    }

    return this;
};
Hyperwarp.prototype._renderHyperspace = function () {
    var display = false;
    /* Display the hyperspace-hiding DOM only if we are in
       hyperspace.  */
    display = this._hyperspaceTime > 0.0;

    if (display) {
        if (!this._domHyperspace) {
            this._domHyperspace = document.createElement('main');
            this._domHyperspace.id = 'hyperspace';
            document.documentElement.appendChild(this._domHyperspace);
        }
        this._domHyperspace.style.display = 'block';
    } else {
        if (this._domHyperspace) {
            this._domHyperspace.style.display = 'none';
        }
    }

    return this;
};


return new Hyperwarp();
});
