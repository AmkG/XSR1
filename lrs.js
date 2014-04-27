/* lrs.js - Long range scan handling (except for field display, which is
     the responsibility of field.js).  */
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
define(['signal', 'field', 'resize'], function (signal, field, resize) {

/* States of the LRS.  */
var FIXED = 0;
var DAMAGED = 1;
var DESTROYED = 2;

function LRS() {
    /* Fixedness state.  */
    this._state = FIXED;

    /* DOM for player's ship.  */
    this._dom = null;
    /* Whether or not to display the player's ship.  */
    this._display = false;

    signal('update', this.update.bind(this));
    signal('render', this.render.bind(this));
    signal('newGame', this.newGame.bind(this));
    signal('mainMenu', this.mainMenu.bind(this));
    signal('fix', this.fix.bind(this));
}
/* Damage state.  */
LRS.prototype.fix = function () {
    this._state = FIXED;
    return this;
};
LRS.prototype.damage = function () {
    this._state = DAMAGED;
    return this;
};
LRS.prototype.destroy = function () {
    this._state = DESTROYED;
    return this;
};
LRS.prototype.colorState = function () {
    if (this._state === FIXED) {
        return 'green';
    } else if (this._state === DAMAGED) {
        return 'yellow';
    } else {
        return 'red';
    }
};
/* Show and hide ship.  */
LRS.prototype.show = function () {
    this._display = true;
    if (this._state === DESTROYED) {
        field.display = false;
    } else {
        field.viewLRS();
        field.display = true;
    }
    return this;
};
LRS.prototype.hide = function () {
    this._display = false;
    return this;
};
/* Called at each clock tick.  */
LRS.prototype.update = function (seconds) {
    if (this._display) {
        if (this._state === FIXED) {
            field.mirror = false;
            field.display = true;
        } else if (this._state === DAMAGED) {
            field.display = true;
            field.mirror = Math.random() > 0.5;
        } else {
            field.display = false;
        }
    } else {
        field.mirror = false;
    }
    return this;
};
/* Called to render.  */
LRS.prototype.render = function () {
    if (this._display) {
        if (!this._dom) {
            this._dom = document.createElement('main');
            this._dom.id = 'lrsship';
            this._dom.innerHTML = '&iexcl;\'&iexcl;';
            document.documentElement.appendChild(this._dom);
        }
        this._dom.style.display = 'block';
        this._dom.style.left = Math.floor(resize.cenx) + 'px';
        this._dom.style.top = Math.floor(resize.ceny) + 'px';
    } else {
        if (this._dom) {
            this._dom.style.display = 'none';
        }
    }
    return this;
};
/* At start of game.  */
LRS.prototype.newGame = function () {
    this.fix();
    return this;
};
/* Enter main menu.  */
LRS.prototype.mainMenu = function () {
    this.hide();
    return this;
};

return new LRS();
});
