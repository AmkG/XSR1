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
define(['signal', 'resize'], function (signal, resize) {
"use strict";

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

    var imul = stdlib.Math.imul;

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

    return {sectorOffset: sectorOffset};
}
var asm = asmModule(window);
var sectorOffset = asm.sectorOffset;


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
            this._enemyMove();
            this.chart._modelChange();
        }
    }
    return this;
};
/* Called at each time that the enemy moves.  */
Model.prototype._enemyMove = function () {
    // TODO
    return this;
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

    /* Position each group size.  */
    for (group = 2; group <= 4; ++group) {
        for (n = 0; n < number; ++n) {
            do {
                s = Math.floor(Math.random() * 128);
            } while (sectors[s] !== 0);
            sectors[s] = group;
        }
    }
    /* Position starbases.  Make sure they're not already
       surrounded and not on a map edge.  */
    for (n = 0; n < number; ++n) {
        do {
            s = Math.floor(Math.random() * 128);
            valid = sectors[s] === 0;
            if (valid) {
                sy = s >>> 4;
                sx = s & 0xF;
                valid = !(sx === 0 || sx === 15 || sy === 0 || sy === 7);
            }
            if (valid) {
                valid = (sectors[sectorOffset(s, -1,  0)] === 0) ||
                        (sectors[sectorOffset(s,  1,  0)] === 0) ||
                        (sectors[sectorOffset(s,  0, -1)] === 0) ||
                        (sectors[sectorOffset(s,  0,  1)] === 0);
            }
        } while (!valid);
        sectors[s] = -1;
    }

    return this;
};
/* Called when the player destroys the starbase in the current
   sector.  */
Model.prototype.playerDestroyStarbase = function () {
    // TODO
    return this;
};

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

    /* DOM nodes.  */
    this._dom = null;
    this._doms = new Array(128);
    for (s = 0; s < 128; ++s) {
        this._doms[s] = null;
    }
    /* Flag to determine if DOM nodes need to be refreshed.  */
    this._domRefresh = false;

    /* Control movement of cursor.  */
    this.movex = 0;
    this.movey = 0;

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
Chart.prototype.update = function (seconds) {
    var s;
    /* If we were just enabled, then update
       from model.  */
    if (this._display && !this._pdisplay && this._state === FIXED) {
        for (s = 0; s < 128; ++s) {
            this._map[s] = this._m.sectors[s];
        }
        this._domRefresh = true;
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
        document.body.appendChild(this._dom);
        /* Force update.  */
        this._domRefresh = true;
        this._height = -1.0;
    }

    /* Show it.  */
    this._dom.style.display = 'block';

    /* Update if needed.  */
    if (this._domRefresh ||
        this._width !== resize.width ||
        this._height !== resize.height) {
        // Set font-size.
        this._dom.style.fontSize = Math.floor(resize.scale / 16) + 'px';
        sz = Math.floor(resize.scale / 8);
        // Set upper-left corner.
        x = resize.cenx - sz * 8;
        y = resize.ceny - sz * 4;
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
    /* TODO */
    return this;
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
    return this;
};
/* Called when the menu is entered.  */
Chart.prototype.mainMenu = function () {
    this._display = false;
    return this;
};

function Galaxy() {
    /* Initialize chart and model.  */
    this.chart = new Chart();
    this._m = new Model();
    /* Tie them.  */
    this.chart._m = this._m;
    this._m.chart = this.chart;

    /* Set up signals.  */
    signal('update', this.update.bind(this));
    signal('render', this.render.bind(this));
    signal('newGame', this.newGame.bind(this));
    signal('mainMenu', this.mainMenu.bind(this));
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

return new Galaxy();
});
