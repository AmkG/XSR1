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
define(['signal','field'], function (signal,field) {

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
/* Events.  */
Instruments.prototype.newGame = function () {
    this.fix();
    this._targetNum = 0;
    this._target[0] = 0.0;
    this._target[1] = 0.0;
    this._target[2] = 0.0;
    return this;
};
/* Called at each clock tick.  */
Instruments.prototype.update = function (seconds) {
    var othernum;
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
        }
    }
    return this;
};


/*-----------------------------------------------------------------------------
Attack Computer
-----------------------------------------------------------------------------*/

function Attack(instruments) {
    this._fixed = true;
    this._enabled = false;
    this._instruments = instruments;
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
/* Events.  */
Attack.prototype.mainMenu = function () {
    this.fix().disable();
    return this;
};
Attack.prototype.newGame = function () {
    this.fix();
    return this;
};
Attack.prototype.update = function (seconds) {
    // TODO
    return this;
};
Attack.prototype.render = function () {
    // TODO
    return this;
};

/*-----------------------------------------------------------------------------
Computer API
-----------------------------------------------------------------------------*/

function Computer() {
    this.instruments = new Instruments();
    this.attack = new Attack(this.instruments);

    signal('mainMenu', this.mainMenu.bind(this));
    signal('newGame', this.newGame.bind(this));
    signal('update', this.update.bind(this));
    signal('render', this.render.bind(this));
}
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

return new Computer();
});
