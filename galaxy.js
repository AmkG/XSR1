/* galaxy.js - Handles the galactic sectors and the player's galactic
     chart view.  */
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
define(['signal','resize','warpCosts','console'],
function(signal , resize , warpCosts , console) {
"use strict";

/* Cursor movement speed, in sectors per second.  */
var cursorSpeed = 2.0;

/* The galaxy is 16x8.  Sectors are identified from 0 -> 127.  */
/*
The game model array is an array of signed integers.
Positive numbers denote an enemy group, with the magnitude
being the number of enemy ships in the group.
0 denotes an empty sector.
Negative numbers denote a friendly starbase.  -1 is
normal starbase, -2 is a starbase that is surrounded for
one term, -3 for two terms, -4 for three terms (at risk
of destruction).
*/

function asmModule(stdlib) {
    "use asm";
    /* Note: this is mostly an experiment to see
       just how difficult or easy it is to write
       hand-written asm.js.  Any speed benefits
       we might have from using AOT asm.js will
       be lost in the lousy asm.js->js
       interfacing of Firefox up to 28.
       Verdict?  It's not that hard to write small
       asm.js functions that do little
       computations.  Mozilla would greatly
       increase the utility of asm.js if they
       could reduce the asm.js->js interfacing
       overhead.  */

    function sectorOffset(s, x, y) {
        s = s|0;
        x = x|0;
        y = y|0;
        var sx = 0;
        var sy = 0;
        sx = (s & 0xF);
        sy = (s >> 4);
        sx = (sx + x) & 0xF;
        sy = (sy + y) & 0x7;
        return ((sy << 4) + sx)|0;
    }
    /* Gets the difference in X direction,
       s1 - s2.  */
    function sectorXDiff(s1, s2) {
        s1 = s1|0;
        s2 = s2|0;
        var s1x = 0;
        var s2x = 0;
        s1x = (s1 & 0xF);
        s2x = (s2 & 0xF);
        return (s1x - s2x)|0;
    }
    /* Gets the difference in Y direction,
       s1 - s2.  */
    function sectorYDiff(s1, s2) {
        s1 = s1|0;
        s2 = s2|0;
        var s1y = 0;
        var s2y = 0;
        s1y = (s1 >> 4);
        s2y = (s2 >> 4);
        return (s1y - s2y)|0;
    }

    return { sectorOffset: sectorOffset
           , sectorXDiff: sectorXDiff
           , sectorYDiff: sectorYDiff
           };
}
var asm = asmModule(window);
var sectorOffset = asm.sectorOffset;
var sectorXDiff = asm.sectorXDiff;
var sectorYDiff = asm.sectorYDiff;

/*-----------------------------------------------------------------------------
Model of the Galaxy
-----------------------------------------------------------------------------*/

/* A model of the real world.

The currrent star date is stored in
this.dateMaj and this.dateMin.
*/
function Model() {
    var i;

    /* Stardate major and minor date.  */
    this.dateMin = 0;
    this.dateMaj = 0;
    /* The minor date is incremented per second.  */
    this._sec = 0.0;

    /* Sector information.  */
    this.sectors = new Array(128);
    for (i = 0; i < 128; ++i) {
        this.sectors[i] = 0;
    }

    /* The enemy target sector.  */
    this._target = 0;
    /* Scratch space.  */
    this._ar = [];

    /* Player location in x and y coordinates of the map
       as well as the player's sector.  */
    this.px = 0.0;
    this.py = 0.0;
    this.ps = 0;

    /* Reserve for initialization.  */
    this.chart = null;
}
Model.prototype.update = function (seconds) {
    this._sec += seconds;
    if (this._sec > 1.0) {
        this._sec -= 1.0;
        ++this.dateMin;
        if (this.dateMin === 100) {
            ++this.dateMaj;
            this.dateMin = 0;
        }
        /* Update at each x.50 or x.00.  */
        if (this.dateMin === 0 || this.dateMin === 50) {
            this._enemyMove()._surroundStarbase();
            this.chart._modelChange();
        }
    }
    return this;
};
/* Called at each time that the enemy moves.  */
Model.prototype._enemyMove = function () {
    var sectors = this.sectors;
    var target = this._target;
    var dateMaj = this.dateMaj;
    var dateMin = this.dateMin;
    var ar = this._ar;

    var s = 0; // current sector
    var sector = 0; // contents of sector
    var dx = 0; // distance to target, x and y
    var dy = 0;
    var adx = 0; // absolute distance to target, x and y
    var ady = 0;
    var to_s = 0; // desired destination for a fleet

    var s_begin = 0; // sector we start iterating
    var s_end = 0; // sector we end iterating
    var s_step = 0; // direction to iterate

    // Select a new target.  Do this if the current
    // target is invalid, or randomly change targets
    if (sectors[target] >= 0 || Math.random() < 0.05) {
        /* Create a candidate array.  */
        ar.length = 0;
        for (s = 0; s < 128; ++s) {
            if (sectors[s] < 0) {
                ar.push(s);
            }
        }
        /* No candidates?  Only happens at game end.  */
        if (ar.length === 0) {
            return this;
        }
        /* Pick a candidate target at random.  */
        target = this._target = ar[Math.floor(Math.random() * ar.length)];
        ar.length = 0;
    }

    // Iterate upwards or downwards at random.
    if (Math.random() < 0.5) {
        s_begin = 0;
        s_end = 128;
        s_step = 1;
    } else {
        s_begin = 127;
        s_end = -1;
        s_step = -1;
    }

    // Go through all sectors and move Nyloz fleets.
    // We mark already-moved Nyloz fleets by adding
    // 128
    for (s = s_begin; s !== s_end; s += s_step) {
        // Don't move the fleet in the player's sector
        if (s === this.ps) {
            continue;
        }
        sector = sectors[s];
        // Make sure it's a Nyloz fleet.
        if (sector <= 0) {
            continue;
        }
        // Don't move if already moved.
        if (sector > 128) {
            continue;
        }
        // size-3 and above only move on
        // dates ending at .00
        if (sector >= 3 && dateMin !== 0)  {
            continue;
        }
        // size-4 only move on even major
        // dates.
        if (sector === 4 && dateMaj % 2 !== 0) { 
            continue;
        }
        // get distance to target
        dx = sectorXDiff(target, s);
        dy = sectorYDiff(target, s);
        adx = Math.abs(dx);
        ady = Math.abs(dy);
        // don't move if beside target already
        if ((adx === 0 && ady === 1) || (adx === 1 && ady === 0)) {
            continue;
        }
        // Go towards the target.
        if (adx > ady) {
            // Prioritize going in the X direction.
            to_s = sectorOffset(s, dx < 0 ? -1 : 1, 0);
            if (!this._canMoveInto(to_s)) {
                to_s = sectorOffset(s, 0, dy < 0 ? -1 : 1);
            }
        } else {
            // Prioritize going in the Y direction.
            to_s = sectorOffset(s, 0, dy < 0 ? -1 : 1);
            if (!this._canMoveInto(to_s)) {
                to_s = sectorOffset(s, dx < 0 ? -1 : 1, 0);
            }
        }
        // If the destination to_s is invalid, or just randomly,
        // go to any open sector beside this sector.
        if (!this._canMoveInto(to_s) || Math.random() < 0.1) {
            ar.length = 0;
            to_s = sectorOffset(s,  0,  1);
            if (this._canMoveInto(to_s)) ar.push(to_s);
            to_s = sectorOffset(s,  0, -1);
            if (this._canMoveInto(to_s)) ar.push(to_s);
            to_s = sectorOffset(s,  1,  0);
            if (this._canMoveInto(to_s)) ar.push(to_s);
            to_s = sectorOffset(s, -1,  0);
            if (this._canMoveInto(to_s)) ar.push(to_s);
            if (ar.length === 0) {
                // Can't move anyway
                continue;
            }
            to_s = ar[Math.floor(Math.random() * ar.length)];
        }

        // move into the destination
        sectors[to_s] = sectors[s] + 128; // mark as moved.
        sectors[s] = 0;
    }

    // Clear the 128
    for (s = 0; s < 128; ++s) {
        if (sectors[s] > 128) {
            sectors[s] -= 128;
        }
    }

    return this;
};
/* Check if the specified sector can be moved into.  */
Model.prototype._canMoveInto = function (s) {
    return !(s === this.ps || this.sectors[s] !== 0);
};
/* Called to check if starbases are surrounded after
   the enemy moves.  */
Model.prototype._surroundStarbase = function () {
    var sectors = this.sectors;
    var s = 0;
    var isSurrounded = false;

    for (s = 0; s < 128; ++s) {
        // If not a starbase, skip.
        if (sectors[s] >= 0) {
            continue;
        }
        // Check if surrounded
        if (this._isSurrounded(s)) {
            --sectors[s];
            if (sectors[s] < -4) {
                // destroy it.  The Nyloz get two extra ships.
                sectors[s] = 2;
                signal.raise('nylozKillStarbase', s);
            } else {
                isSurrounded = true;
            }
        } else {
            // reset counter
            sectors[s] = -1;
        }
    }
    // If surrounded, call our chart.
    if (isSurrounded) {
        this.chart._starbaseSurrounded();
    }

    return this;
};
/* Check if the sector is surrounded by Nyloz.  */
Model.prototype._isSurrounded = function (s) {
    var sectors = this.sectors;
    return sectors[sectorOffset(s,  0, -1)] > 0 &&
           sectors[sectorOffset(s,  0,  1)] > 0 &&
           sectors[sectorOffset(s, -1,  0)] > 0 &&
           sectors[sectorOffset(s,  1,  0)] > 0;
};
/* Called at the start of the game.  */
Model.prototype.newGame = function (difficulty) {
    /* Number of starbases.
       This also indicates the number of 4-groups,
       3-groups, and 2-groups at the start of
       the game.  */
    var sectors = this.sectors;
    var number = 0;
    var group = 0;
    var s = 0;
    var sx = 0;
    var sy = 0;
    var n = 0;
    var valid = false;

    switch (difficulty) {
    case 'NOVICE':      number = 3; break;
    case 'PILOT':       number = 4; break;
    case 'WARRIOR':     number = 5; break;
    case 'COMMANDER':   number = 6; break;
    }

    /* Clear map.  */
    for (s = 0; s < 128; ++s) {
        sectors[s] = 0;
    }

    /* Position each group size.
       Sector 72 is the sector the player starts in.  */
    for (group = 2; group <= 4; ++group) {
        for (n = 0; n < number; ++n) {
            do {
                s = Math.floor(Math.random() * 128);
            } while (sectors[s] !== 0 || s === 72);
            sectors[s] = group;
        }
    }
    /* Position starbases.  Make sure they're not already
       surrounded, not adjacent to another starbase, not
       on a map edge, and not on the player's starting
       sector.  */
    for (n = 0; n < number; ++n) {
        do {
            s = Math.floor(Math.random() * 128);
            // ensure empty sector and not player's starting sector
            valid = (sectors[s] === 0 && s !== 72);
            // ensure not on map edge
            if (valid) {
                sy = s >>> 4;
                sx = s & 0xF;
                valid = !(sx === 0 || sx === 15 || sy === 0 || sy === 7);
            }
            // ensure not surrounded
            if (valid) {
                valid = (sectors[sectorOffset(s, -1,  0)] === 0) ||
                        (sectors[sectorOffset(s,  1,  0)] === 0) ||
                        (sectors[sectorOffset(s,  0, -1)] === 0) ||
                        (sectors[sectorOffset(s,  0,  1)] === 0);
            }
            // ensure not adjacent to another starbase
            if (valid) {
                valid = (sectors[sectorOffset(s, -1,  0)] !== -1) &&
                        (sectors[sectorOffset(s,  1,  0)] !== -1) &&
                        (sectors[sectorOffset(s,  0, -1)] !== -1) &&
                        (sectors[sectorOffset(s,  0,  1)] !== -1);
            }
        } while (!valid);
        sectors[s] = -1;
    }

    /* Start the player's location.  */
    this.px = 8.5;
    this.py = 4.5;
    this.ps = 72;

    /* Initialize the current target to an invalid one.  */
    this._target = 0;

    return this;
};
/* Called when the player destroys the starbase in the current
   sector.  */
Model.prototype.playerDestroyStarbase = function () {
    var sectors = this.sectors;
    var ps = this.ps;
    if (sectors[ps] >= 0) {
        console.write("Internal Error!  " +
            "Destroyed starbase on sector# " + ps + ", which has none."
        ).write("sectors[ps] = " + sectors[ps]);
    } else {
        sectors[ps] = 0;
        // TODO: if the current starbase is the Nyloz target,
        // select a new target.
    }
    return this;
};
/* Called when the player kills a Nyloz ship in the current
   sector.  */
Model.prototype.killNyloz = function () {
    var sectors = this.sectors;
    var ps = this.ps;
    if (sectors[ps] <= 0) {
        console.write("Internal Error!  " +
            "Killed a Nyloz on sector# " + ps + ", which doesn't have any!"
        ).write("sectors[ps] = " + sectors[ps]);
    } else {
        --sectors[ps];
    }
    return this;
};

/*-----------------------------------------------------------------------------
Stardate
-----------------------------------------------------------------------------*/

/* This object is a convenience intended only to generate a string form
   of the current stardate.  */
function Stardate(model) {
    this._m = model;
}
Stardate.prototype.toString = function () {
    var dateMaj = this._m.dateMaj;
    var dateMin = this._m.dateMin;
    var rv = '';
    if (dateMaj >= 1000) {
        return '999.99';
    } else if (dateMaj >= 100) {
        rv = dateMaj.toString();
    } else if (dateMaj >= 10) {
        rv = '0' + dateMaj.toString();
    } else {
        rv = '00' + dateMaj.toString();
    }

    rv += '.';

    if (dateMin >= 10) {
        rv += dateMin.toString();
    } else {
        rv += '0' + dateMin.toString();
    }

    return rv;
};

/*-----------------------------------------------------------------------------
Galactic Chart
-----------------------------------------------------------------------------*/

/* Status of the sub-space radio.  */
var FIXED = 0;
var DAMAGED = 1;
var DESTROYED = 2;

/* A map of the real world.  The map is not the territory.  */
function Chart() {
    var s;
    this._display = false;
    this._pdisplay = false;

    this._state = FIXED;

    /* Set if we already sent a "Starbase destroyed" message.  */
    this._messagedStarbaseDestroyed = false;

    /* DOM nodes.  */
    this._dom = null;
    this._doms = new Array(128);
    for (s = 0; s < 128; ++s) {
        this._doms[s] = null;
    }
    this._pdom = null; /* Player cursor's DOM node.  */
    this._cdom = null; /* Target cursor's DOM node.  */
    /* Flag to determine if DOM nodes need to be refreshed.  */
    this._domRefresh = false;

    /* Control movement of cursor.  */
    this.movex = 0;
    this.movey = 0;
    /* Cursor location.  */
    this._cx = 0.0;
    this._cy = 0.0;

    /* Current known state of the map.  */
    this._map = new Array(128);
    for (s = 0; s < 128; ++s) {
        this._map[s] = 0;
    }

    /* Current scale at which the map is drawn.  */
    this._width = -1.0;
    this._height = -1.0;

    /* Reserve for initialization.  */
    this._m = null;
}
/* Fetch the data from the model.  */
Chart.prototype._updateFromModel = function () {
    var s;
    for (s = 0; s < 128; ++s) {
        this._map[s] = this._m.sectors[s];
    }
    this._domRefresh = true;
};
/* Damage state.  */
Chart.prototype.fix = function () {
    /* Sub-space radio is currently damaged or destroyed, and
       the chart is displayed, then radio is fixed.  Update
       immediately.  */
    if (this._display && this._state !== FIXED) {
        this._updateFromModel();
    }
    this._state = FIXED;
    return this;
};
Chart.prototype.damage = function () {
    this._state = DAMAGED;
    return this;
};
Chart.prototype.destroy = function () {
    this._state = DESTROYED;
    return this;
};
Chart.prototype.colorState = function () {
    if (this._state === FIXED) {
        return 'green';
    } else if (this._state === DAMAGED) {
        return 'yellow';
    } else {
        return 'red';
    }
};
/* Query number of targets.  */
Chart.prototype.targets = function () {
    if (this._state === DESTROYED) {
        return '?';
    }
    var sectors = this._m.sectors;
    var s = sectorOffset(0, Math.floor(this._cx), Math.floor(this._cy));
    if (sectors[s] <= 0) {
        return '0';
    } else {
        return sectors[s].toString();
    }
};
/* Query cost of jump.  */
Chart.prototype.jumpCost = function () {
    var cost = warpCosts(this._m.px, this._m.py, this._cx, this._cy);
    if (cost >= 1000) {
        return cost.toString();
    } else if (cost >= 100) {
        return '0' + cost.toString();
    } else if (cost >= 10) {
        return '00' + cost.toString();
    } else {
        return '000' + cost.toString();
    }
};
/* Called each clock tick.  */
Chart.prototype.update = function (seconds) {
    var s;
    /* Clear the messaging flag.  */
    this._messagedStarbaseDestroyed = false;

    /* If we were just enabled, then update
       from model.  */
    if (this._display && !this._pdisplay && this._state === FIXED) {
        this._updateFromModel();
    }
    /* If we're enabled, move cursor.  */
    this._cx += this.movex * cursorSpeed * seconds;
    if (this._cx >= 16.0) {
        this._cx -= 16.0;
    } else if (this._cx < 0.0) {
        this._cx += 16.0;
    }
    this._cy += this.movey * cursorSpeed * seconds;
    if (this._cy >= 8.0) {
        this._cy -= 8.0;
    } else if (this._cy < 0.0) {
        this._cy += 8.0;
    }

    this._pdisplay = this._display;
    return this;
};
Chart.prototype.render = function () {
    var sdom;
    var vdom;
    var r;
    var c;
    var s;
    var dom;
    var sz;
    var x, y;

    /* Quickly leave when disabled.  */
    if (!this._display) {
        if (this._dom) {
            this._dom.style.display = 'none';
        }
        return this;
    }

    /* Create DOM if needed.  */
    if (!this._dom) {
        this._dom = document.createElement('main');
        this._dom.id = 'chart';
        for (s = 0; s < 128; ++s) {
            sdom = document.createElement('div');
            vdom = document.createElement('span');
            this._doms[s] = vdom;
            sdom.appendChild(vdom);
            this._dom.appendChild(sdom);
        }

        sdom = document.createElement('div');
        this._pdom = sdom;
        sdom.className = 'cursor';
        sdom.innerHTML = '&bull;';
        this._dom.appendChild(sdom);
        sdom = document.createElement('div');
        this._cdom = sdom;
        sdom.className = 'cursor';
        sdom.innerHTML = '&bull;';
        this._dom.appendChild(sdom);

        document.body.appendChild(this._dom);
        /* Force update.  */
        this._domRefresh = true;
        this._height = -1.0;
    }

    /* Show it.  */
    this._dom.style.display = 'block';

    /* Map characteristics.  */
    /* Sector size.  */
    sz = Math.floor(resize.scale / 8);
    /* Upper-left corner.  */
    x = resize.cenx - sz * 8;
    y = resize.ceny - sz * 4;

    /* Update if needed.  */
    if (this._domRefresh ||
        this._width !== resize.width ||
        this._height !== resize.height) {
        // Set font-size.
        this._dom.style.fontSize = Math.floor(resize.scale / 16) + 'px';
        s = 0;
        for (r = 0; r < 8; ++r) {
            for (c = 0; c < 16; ++c) {
                vdom = this._doms[s];
                sdom = vdom.parentNode;
                sdom.style.left = Math.floor(x + sz * c) + 'px';
                sdom.style.top = Math.floor(y + sz * r) + 'px';
                sdom.style.height = sz + 'px';
                sdom.style.width = sz + 'px';
                vdom.innerHTML = this._fillDom(this._map[s]);
                ++s;
            }
        }
    }

    this._pdom.style.left = Math.floor(x + sz * this._m.px) + 'px';
    this._pdom.style.top = Math.floor(y + sz * this._m.py) + 'px';
    this._cdom.style.left = Math.floor(x + sz * this._cx) + 'px';
    this._cdom.style.top = Math.floor(y + sz * this._cy) + 'px';

    this._height = resize.height;
    this._width = resize.width;
    this._domRefresh = false;

    return this;
};
/* Generate the innerHTML of each cell in the Galactic Chart.  */
Chart.prototype._fillDom = function (cellContent) {
    if (cellContent === 0) {
        return '';
    } else if (cellContent < 0) {
        return '&diams;';
    } else switch (cellContent) {
    case 1:
        return '-';
    case 2:
        return (
            '<div style="font-size: 25%; position: static; border: none;">' +
            '&mdash;&nbsp;&nbsp;<br>' +
            '&nbsp;&nbsp;&mdash;' +
            '</div>');
    case 3:
        return (
            '<div style="font-size: 25%; position: static; border: none;">' +
            '&mdash;&nbsp;&nbsp;<br>' +
            '&nbsp;&nbsp;&mdash;<br>' +
            '&mdash;&nbsp;&nbsp;'+
            '</div>');
    case 4:
        return (
            '<div style="font-size: 25%; position: static; border: none;">' +
            '&mdash;&nbsp;&nbsp;<br>' +
            '&nbsp;&nbsp;&mdash;<br>' +
            '&mdash;&nbsp;&nbsp;<br>'+
            '&nbsp;&nbsp;&mdash;' +
            '</div>');
    }
};
/* Display state.  */
Chart.prototype.show = function () {
    this._display = true;
    return this;
};
Chart.prototype.hide = function () {
    this._display = false;
    return this;
};
Chart.prototype.isShown = function () {
    return this._display;
};
/* Called by the model object if the model changes.
   We only update the map if the galactic chart is
   actually enabled and the chart is fixed.  */
Chart.prototype._modelChange = function () {
    if (this._display && this._state === FIXED) {
        this._updateFromModel();
    }
    return this;
};
/* Called by the model object if a starbase is
   surrounded.  */
Chart.prototype._starbaseSurrounded = function () {
    if (this._state !== DESTROYED) {
        console.write(
            "<font color=#ff0000><b>STARBASE SURROUNDED</b></font>"
        );
    }
};
/* Called when a starbase is destroyed by Nyloz,
   triggered by the 'nylozKillStarbase' signal.  */
Chart.prototype.nylozKillStarbase = function (s) {
    if (this._state !== DESTROYED && !this._messagedStarbaseDestroyed) {
        this._messageStarbaseDestroyed = true;
        console.write(
            "<font color=#ff0000><b>STARBASE DESTROYED</b></font>"
        );
    }
};
/* Called at the beginning of each game, after the model
   has initialized.  */
Chart.prototype.newGame = function () {
    var s;
    this._state = FIXED;
    /* Copy map from model.  */
    for (s = 0; s < 128; ++s) {
        this._map[s] = this._m.sectors[s];
    }
    this._domRefresh = true;
    this._display = false;
    this._cx = this._m.px;
    this._cy = this._m.py;
    return this;
};
/* Called when the menu is entered.  */
Chart.prototype.mainMenu = function () {
    this._display = false;
    return this;
};
/* Get and set the current target position.  */
Chart.prototype.getTargetPosition = function (ar2d) {
    ar2d[0] = this._cx;
    ar2d[1] = this._cy;
    return this;
};
Chart.prototype.setTargetPosition = function (ar2d) {
    this._cx = ar2d[0];
    this._cy = ar2d[1];
    return this;
};

/*-----------------------------------------------------------------------------
Galaxy API
-----------------------------------------------------------------------------*/

function Galaxy() {
    /* Initialize chart, stardate, and model.  */
    this.chart = new Chart();
    this._m = new Model();
    this.stardate = new Stardate(this._m);
    /* Tie them.  */
    this.chart._m = this._m;
    this._m.chart = this.chart;

    /* Set up signals.  */
    signal('update', this.update.bind(this));
    signal('render', this.render.bind(this));
    signal('newGame', this.newGame.bind(this));
    signal('mainMenu', this.mainMenu.bind(this));
    signal('playerDestroyStarbase', this.playerDestroyStarbase.bind(this));
    signal('nylozKillStarbase', this.nylozKillStarbase.bind(this));
    signal('killNyloz', this.killNyloz.bind(this));

    signal('fix', this.chart.fix.bind(this.chart));
}
Galaxy.prototype.update = function (seconds) {
    this._m.update(seconds);
    this.chart.update(seconds);
    return this;
};
Galaxy.prototype.render = function () {
    this.chart.render();
    return this;
};
Galaxy.prototype.newGame = function (difficulty) {
    this._m.newGame(difficulty);
    this.chart.newGame(difficulty);
    return this;
};
Galaxy.prototype.mainMenu = function () {
    this.chart.mainMenu();
    return this;
};
Galaxy.prototype.playerDestroyStarbase = function () {
    this._m.playerDestroyStarbase();
    return this;
};
Galaxy.prototype.nylozKillStarbase = function (s) {
    this.chart.nylozKillStarbase(s);
    return this;
};
Galaxy.prototype.killNyloz = function () {
    this._m.killNyloz();
    return this;
};
Galaxy.prototype.getPlayerPosition = function (ar2d) {
    ar2d[0] = this._m.px;
    ar2d[1] = this._m.py;
    return this;
};
Galaxy.prototype.setPlayerPosition = function (ar2d) {
    this._m.px = ar2d[0];
    this._m.py = ar2d[1];
    this._m.ps = sectorOffset(0, ar2d[0], ar2d[1]);
    return this;
};
Galaxy.prototype.getPlayerSectorContents = function () {
    var rv = this._m.sectors[this._m.ps];
    if (rv < 0) {
        rv = -1;
    }
    return rv;
};
Galaxy.prototype.getPlayerSector = function () {
    return this._m.ps;
};
Galaxy.prototype.sectorOffset = sectorOffset;

return new Galaxy();
});
