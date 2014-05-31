/* shield.js - Handles shield.  */
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
define(['vars', 'signal'], function (vars, signal) {
"use strict";

var flashTime = 0.2;

var FIXED = 0;
var DAMAGED = 1;
var DESTROYED = 2;

function createShieldDom() {
    var rv = document.createElement('main');
    rv.id = 'shield';
    document.documentElement.appendChild(rv);
    return rv;
}

function Shield() {
    this._enabled = false;
    this._on = false;
    this._status = FIXED;

    this._flashTime = 0.0;
    this._isFlash = false;

    this._dom = null;
    this._shown = false;
    this._flashing = false;

    signal('update', this.update.bind(this));
    signal('render', this.render.bind(this));
    signal('mainMenu', this._onMainMenu.bind(this));
    signal('newGame', this._onNewGame.bind(this));
    signal('fix', this.fix.bind(this));
}

Shield.prototype.damage = function () {
    this._status = DAMAGED;
    return this;
};
Shield.prototype.destroy = function () {
    this._status = DESTROYED;
    return this;
};
Shield.prototype.fix = function () {
    this._status = FIXED;
    return this;
};
Shield.prototype.colorState = function () {
    if (this._status === FIXED) {
        return 'green';
    } else if (this._status === DAMAGED) {
        return 'yellow';
    } else {
        return 'red';
    }
};

Shield.prototype.enable = function () {
    this._enabled = true;
    return this;
};
Shield.prototype.disable = function () {
    this._enabled = false;
    return this;
};
Shield.prototype.isEnabled = function () {
    return this._enabled;
};

Shield.prototype.flash = function () {
    this._flashTime = flashTime;
    return this;
};

/* Return true if the shield protects the player from
   complete destruction, false otherwise.  */
Shield.prototype.protectionCheck = function () {
    return this._on;
};

Shield.prototype.update = function (seconds) {
    if (this._enabled && this._status !== DESTROYED) {
        vars.energy.consume(2 * seconds);
    }

    if (this._status === FIXED) {
        this._on = this._enabled;
    } else if (this._status === DAMAGED) {
        if (this._enabled) {
            this._on = (Math.random() > 0.5);
        } else {
            this._on = false;
        }
    } else if (this._status === DESTROYED) {
        this._on = false;
    }
    if (this._flashTime > 0.0) {
        this._flashTime -= seconds;
        if (this._flashTime <= 0.0) {
            this._flashTime = 0.0;
        }
    }
    this._isFlash = (this._flashTime > 0.0);
    return this;
};
Shield.prototype.render = function () {
    if (this._on !== this._shown) {
        this._shown = this._on;
        if (this._on) {
            if (!this._dom) {
                this._dom = createShieldDom();
            }
            this._dom.style.display = 'block';
        } else {
            if (this._dom) {
                this._dom.style.display = 'none';
            }
        }
    }
    if (this._isFlash !== this._flashing) {
        this._flashing = this._isFlash;
        if (!this._dom) {
            this._dom = createShieldDom();
        }
        if (this._isFlash) {
            this._dom.style.backgroundColor = 'white';
        } else {
            this._dom.style.backgroundColor = 'blue';
        }
    }
    return this;
};
Shield.prototype._onMainMenu = function () {
    this._on = false;
    this._enabled = false;
    return this;
};
Shield.prototype._onNewGame = function () {
    this.fix();
    this.disable();
    this._flashTime = 0.0;
    this._isFlash = false;
    return this;
};

return new Shield();
});
