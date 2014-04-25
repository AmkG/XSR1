/* computer.js - Implements instrument and attack computer.  */
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
define(['signal','field','vars','hyperwarp','resize'],
function(signal , field , vars , hyperwarp , resize) {

/* Terminology:
 * instruments computer - the computer that updates the instruments
 *   panel with the location of the current target.
 * attack computer - the computer that provides the crosshairs and
 *   targeting information, and handles lock-on.
 */

/*-----------------------------------------------------------------------------
Instruments Computer
-----------------------------------------------------------------------------*/

function Instruments() {
    this._fixed = true;
    this._targetNum = 0;
    this._target = [0.0, 0.0, 0.0];
    this._autotrack = false;
}
/* Damage status.  */
Instruments.prototype.fix = function () {
    this._fixed = true;
    return this;
};
Instruments.prototype.destroy = function () {
    this._fixed = false;
    return this;
};
Instruments.prototype.isDestroyed = function () {
    return !this._fixed;
};
/* Panel data.  */
Instruments.prototype.panelT = function () {
    return this._targetNum.toString();
};
Instruments.prototype.panelX = function () {
    return this._encodeCoord(this._target[0] / 10, 2);
};
Instruments.prototype.panelY = function () {
    return this._encodeCoord(this._target[1] / 10, 2);
};
Instruments.prototype.panelZ = function () {
    return this._encodeCoord(this._target[2], 3);
};
Instruments.prototype._encodeCoord = function (v, digs) {
    v = Math.round(v);
    var a = Math.abs(v);
    var s = v < 0 ? "-" : "+";
    var lim = digs === 2 ? 100 : 1000 ;
    var lim1 = digs === 2 ? 10 : 100 ;
    var lim2 = digs === 2 ? 0 : 10 ;
    if (a >= lim) {
        return s + "&infin;";
    } else if (a >= lim1) {
        return s + a.toString();
    } else if (a >= lim2) {
        return s + '0' + a.toString();
    } else {
        return s + '00' + a.toString();
    }
};
/* Auto-tracking.  This is the feature where the computer
   automatically switches between aft and fore view depending
   on the current focused target.  */
Instruments.prototype.isAutotrackEnabled = function () {
    return this._autotrack;
};
Instruments.prototype.autotrackEnable = function () {
    this._autotrack = true;
    return this;
};
Instruments.prototype.autotrackDisable = function () {
    this._autotrack = false;
    return this;
};
/* Target switching.  */
Instruments.prototype.switchTarget = function () {
    if (this._targetNum === 0) {
        this._targetNum = 1;
    } else {
        this._targetNum = 0;
    }
    return this;
};
/* Events.  */
Instruments.prototype.newGame = function () {
    this.fix().autotrackDisable();
    this._targetNum = 0;
    this._target[0] = 0.0;
    this._target[1] = 0.0;
    this._target[2] = 0.0;
    return this;
};
/* Called at each clock tick.  */
Instruments.prototype.update = function (seconds) {
    var othernum;
    /* TODO: switch focus to bogey that is firing.  Probably via
       a signal.  */
    /* TODO: tracking of asteroids (when asteroids are implemented).  */
    if (this._fixed) {
        /* Try to get a valid target.  */
        if (!field.isBogeyValid(this._targetNum)) {
            othernum = this._targetNum === 0 ? 1 : 0;
            if (field.isBogeyValid(othernum)) {
                this._targetNum = othernum;
            }
        }
        /* If the target is valid, track it.  */
        if (field.isBogeyValid(this._targetNum)) {
            field.getBogeyPosition(this._targetNum, this._target);

            /* If auto-tracked, set it.  */
            if (this._autotrack) {
                if (this._target[2] >= 0.0 || hyperwarp.engaged()) {
                    if (field.currentView === 'aft') {
                        /* Why use a signal instead of importing viewControl
                           and calling viewControl.aft()?  Because
                           viewControl depends on panel, and panel depends
                           on computer - which is this module.  Use signals
                           to circle the loop.  */
                        signal.raise('setViewFront');
                    }
                } else {
                    if (field.currentView === 'front') {
                        signal.raise('setViewAft');
                    }
                }
            }
        }
    }
    return this;
};
Instruments.prototype.nylozFirePhoton = function (num) {
    if (this._autotrack) {
        this._targetNum = num;
    }
};


/*-----------------------------------------------------------------------------
Attack Computer
-----------------------------------------------------------------------------*/

var NONE = 0;
var UP = 1;
var DOWN = 2;
var LEFT = 3;
var RIGHT = 4;
var directionCode = [
    '&#9670;', // NONE
    '&#9650;', // UP
    '&#9660;', // DOWN
    '&#9664;', // LEFT
    '&#9654;'  // RIGHT
];

function Attack(instruments) {
    /* Connection to other computer.  */
    this._instruments = instruments;
    /* Status.  */
    this._fixed = true;
    this._enabled = false;

    /* Scratch space.  */
    this._ar3d = [0.0, 0.0];
    /* Position of the cursor.  */
    this._cursor = [0.0, 0.0];
    this._cursorshow = false;
    /* Direction of the indicator.  */
    this._direction = NONE;

    /* Time control for computer animations.  */
    this._timeStep = 0.0;

    /* DOM for overlay.  */
    this._dom = null;
    /* DOM for cursor elements.  */
    this._domCursor = [null, null, null, null, null, null, null, null]; // 8
    /* DOM for direction indicator.  */
    this._domDirection = null;
    /* DOM for fore and aft crosshairs.  */
    this._domCrosshairsHoriz = null;
    this._domCrosshairsVert = null;
}
/* Damage status.  */
Attack.prototype.fix = function () {
    this._fixed = true;
    return this;
};
Attack.prototype.destroy = function () {
    this._fixed = false;
    return this;
};
Attack.prototype.isDestroyed = function () {
    return !this._fixed;
};
/* Enable/Disable status.  */
Attack.prototype.enable = function () {
    this._enabled = true;
    return this;
};
Attack.prototype.disable = function () {
    this._enabled = false;
    return this;
};
Attack.prototype.isEnabled = function () {
    return this._enabled;
};
/* Events.  */
Attack.prototype.mainMenu = function () {
    this.fix().disable();
    return this;
};
Attack.prototype.newGame = function () {
    this.fix();
    this._cursor[0] = 0.0;
    this._cursor[1] = 0.0;
    this._cursorshow = false;
    this._direction = NONE;
    this._timeStep = 0.0;
    return this;
};
Attack.prototype.update = function (seconds) {
    var targetNum = this._instruments._targetNum;
    var ar3d = null;
    var cursor = null;
    var visible = false;
    var x = 0.0;
    var y = 0.0;
    var ax = 0.0;
    var ay = 0.0;
    if (this._enabled) {
        vars.energy.consume(0.5 * seconds);
    }
    if (this._enabled && this._fixed) {
        ar3d = this._ar3d;
        cursor = this._cursor;
        if (!field.isBogeyValid(targetNum)) {
            this._cursorshow = false;
            this._direction = NONE;
        } else {
            field.getBogeyPosition(targetNum, ar3d);
            /* Update cursor position.  */
            this._cursorshow = field.project(cursor, ar3d);
            /* Update direction information.  */
            x = ar3d[0];
            y = ar3d[1];
            ax = Math.abs(x);
            ay = Math.abs(y);
            if (ax > ay) {
                // LEFT-RIGHT axis.
                if (ax < 5.0) {
                    this._direction = NONE;
                } else if (x < 0.0) {
                    this._direction = LEFT;
                } else {
                    this._direction = RIGHT;
                }
            } else {
                if (ay < 5.0) {
                    this._direction = NONE;
                } else if (y < 0.0) {
                    this._direction = UP;
                } else {
                    this._direction = DOWN;
                }
            }
        }
    }
    /* Increment for animation.  */
    this._timeStep += seconds;
    if (this._timeStep > 1.0) {
        this._timeStep -= 1.0;
    }
    return this;
};
Attack.prototype.render = function () {
    var i = 0;
    var piOver4 = 0.0;
    var angle = 0.0;
    var x = 0.0;
    var y = 0.0;
    var dom = null;
    var cursorsize = 0.0;
    var cursorfontsize = '';
    var cx = '';
    var cy = '';
    if (this._enabled && field.display && field.currentView !== 'lrs') {
        if (!this._dom) {
            this._constructDom();
        }
        this._dom.style.display = 'block';

        /* If fixed, show the crosshairs.  */
        if (this._fixed) {
            cx = Math.floor(resize.cenx) + 'px';
            cy = Math.floor(resize.ceny) + 'px';
            dom = this._domCrosshairsHoriz;
            dom.style.display = 'block';
            dom.style.left = cx;
            dom.style.top = cy;
            dom.style.width = Math.floor(resize.maxsize * 2.5) + 'px';
            dom = this._domCrosshairsVert;
            if (field.currentView === 'front') {
                dom.style.display = 'block';
                dom.style.left = cx;
                dom.style.top = cy;
                dom.style.height = Math.floor(resize.maxsize * 1.5) + 'px';
            } else {
                dom.style.display = 'none';
            }
        } else {
            dom = this._domCrosshairsHoriz;
            dom.style.display = 'none';
            dom = this._domCrosshairsVert;
            dom.style.display = 'none';
        }

        /* Cursor indicators.  */
        if (this._cursorshow) {
            // There are 8 cursor indicators, at 45deg each.
            // Since Math.sin and Math.cos accept radians,
            // that amounts to 1/4 pi each.
            piOver4 = Math.PI / 4;
            angle = 4 * piOver4 * this._timeStep;
            x = resize.cenx + this._cursor[0] * resize.scale;
            y = resize.ceny + this._cursor[1] * resize.scale;
            cursorsize = resize.maxsize / 4;
            cursorfontsize = Math.floor(resize.maxsize / 2) + 'px';
            for (i = 0; i < 8; ++i) {
                dom = this._domCursor[i];
                dom.style.display = 'block';
                dom.style.fontSize = cursorfontsize;
                dom.style.left = Math.floor(x +
                    Math.sin(angle) * cursorsize
                ) + 'px';
                dom.style.top = Math.floor(y +
                    Math.cos(angle) * cursorsize
                ) + 'px';

                angle += piOver4;
            }
        } else {
            for (i = 0; i < 8; ++i) {
                this._domCursor[i].style.display = 'none';
            }
        }

        // Direction indicator.
        if (this._fixed) {
            dom = this._domDirection;
            dom.style.display = 'block';
            dom.style.left = Math.floor(resize.cenx) + 'px';
            dom.style.top = Math.floor(resize.ceny) + 'px';
            dom.style.fontSize = Math.floor(resize.maxsize / 4) + 'px';
            dom.innerHTML = directionCode[this._direction];
        } else {
            this._domDirection.style.display = 'none';
        }
    } else {
        if (this._dom) {
            this._dom.style.display = 'none';
        }
    }
    return this;
};
Attack.prototype._constructDom = function () {
    var main = null;
    var cursor = null;
    var dir = null;
    var crossdiv = null;
    var cross0 = null;
    var cross1 = null;
    var i = 0;
    var l = 0;

    this._dom = main = document.createElement('main');
    main.id = 'attackcomputer';

    /* Crosshairs.  */
    /* Horizontal.  */
    this._domCrosshairsHoriz = crossdiv = document.createElement('div');
    crossdiv.className = 'crosshairHoriz';
    cross0 = document.createElement('div');
    cross0.className = 'crosshairHoriz0';
    crossdiv.appendChild(cross0);
    cross1 = document.createElement('div');
    cross1.className = 'crosshairHoriz1';
    crossdiv.appendChild(cross1);
    main.appendChild(crossdiv);
    /* Vertical.  */
    this._domCrosshairsVert = crossdiv = document.createElement('div');
    crossdiv.className = 'crosshairVert';
    cross0 = document.createElement('div');
    cross0.className = 'crosshairVert0';
    crossdiv.appendChild(cross0);
    cross1 = document.createElement('div');
    cross1.className = 'crosshairVert1';
    crossdiv.appendChild(cross1);
    main.appendChild(crossdiv);

    /* Circular cursor indicators.  */
    l = this._domCursor.length;
    for (i = 0; i < l; ++i) {
        this._domCursor[i] = cursor = document.createElement('div');
        cursor.className = 'cursor';
        cursor.innerHTML = '&middot;';
        main.appendChild(cursor);
    }

    /* Direction indicator.  */
    this._domDirection = dir = document.createElement('div');
    dir.className = 'direction';
    main.appendChild(dir);

    document.documentElement.appendChild(main);
    return this;
};

/*-----------------------------------------------------------------------------
Computer API
-----------------------------------------------------------------------------*/

function Computer() {
    this.instruments = new Instruments();
    this.attack = new Attack(this.instruments);

    signal('fix', this.fix.bind(this));
    signal('mainMenu', this.mainMenu.bind(this));
    signal('newGame', this.newGame.bind(this));
    signal('update', this.update.bind(this));
    signal('render', this.render.bind(this));
    signal('nylozFirePhoton', this.nylozFirePhoton.bind(this));
}
Computer.prototype.fix = function () {
    this.attack.fix();
    this.instruments.fix();
    return this;
};
Computer.prototype.mainMenu = function () {
    this.attack.mainMenu();
    return this;
};
Computer.prototype.colorState = function () {
    var ibroken = this.instruments.isDestroyed();
    var abroken = this.attack.isDestroyed();
    if (ibroken) {
        if (abroken) {
            return 'red';
        } else {
            return 'yellow';
        }
    } else {
        if (abroken) {
            return 'yellow';
        } else {
            return 'green';
        }
    }
};
Computer.prototype.newGame = function () {
    this.instruments.newGame();
    this.attack.newGame();
    return this;
};
Computer.prototype.update = function (seconds) {
    this.instruments.update(seconds);
    this.attack.update(seconds);
    return this;
};
Computer.prototype.render = function () {
    this.attack.render();
    return this;
};
Computer.prototype.nylozFirePhoton = function (num) {
    this.instruments.nylozFirePhoton(num);
    return this;
};

return new Computer();
});
