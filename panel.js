/* panel.js - Panel display.  */
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
define( ['resize', 'engines', 'vars', 'signal'],
function (resize ,  engines ,  vars ,  signal) {
"use strict";

/*
Panel layout:

V:00  K:00  E:9999  T:0
 Y:+00  X:+00  Z:+014

V is current velocity
K is number of kills
E is energy
T is current selected target
Y is theta, X is psi, Z is R
*/
/*
Panel API:

panel.show()
- show the panel

panel.hide()
- hide the panel

panel.render()
- draw panel on-screen
*/

function Panel() {
    /* Currently shown or not shown?  */
    this._display = false;
    /* Main DOM node.  */
    this._dom = null;
    /* Individual DOM text nodes.  */
    this._v = null;
    this._k = null;
    this._e = null;
    this._t = null;
    this._y = null;
    this._x = null;
    this._z = null;

    signal('render', this.render.bind(this));
    signal('mainMenu', this.hide.bind(this));
    signal('newGame', this.show.bind(this));
}
Panel.prototype.show = function () {
    this._display = true;
    return this;
};
Panel.prototype.hide = function () {
    this._display = false;
    return this;
};
Panel.prototype.render = function () {
    if (this._display) {
        if (!this._dom) {
            this._createPanelDom();
        }
        this._dom.style.display = 'block';
        this._dom.style.fontSize = Math.floor(resize.height / 11) + 'px';

        this._v.innerHTML = engines;
        this._k.innerHTML = vars.kills;
        this._e.innerHTML = vars.energy;

        // TODO: refresh panel data.
    } else {
        if (this._dom) {
            this._dom.style.display = 'none'
        }
    }

    return this;
};
Panel.prototype._createPanelDom = function () {
    var self = this;
    var main;
    var line1;
    var line2;

    function makeEntry(line, prop, label, value) {
        var labeldom;
        var valuedom;

        labeldom = document.createElement('span');
        labeldom.id = 'panel' + prop + '_label';
        labeldom.innerHTML = label;
        line.appendChild(labeldom);

        valuedom = document.createElement('span');
        self[prop] = valuedom;
        valuedom.id = 'panel' + prop + '_content';
        valuedom.innerHTML = value;
        line.appendChild(valuedom);
    }

    line1 = document.createElement('div');
    makeEntry(line1, '_v', 'V:', '00');
    makeEntry(line1, '_k', '&nbsp; K:', '00');
    makeEntry(line1, '_e', '&nbsp; E:', '9999');
    makeEntry(line1, '_t', '&nbsp; T:', '0');

    line2 = document.createElement('div');
    makeEntry(line2, '_y', '&theta;:', '+00');
    makeEntry(line2, '_x', '&nbsp; &Phi;:', '+00');
    makeEntry(line2, '_z', '&nbsp; R:', '+000');

    main = document.createElement('main');
    this._dom = main;
    main.id = 'panel';
    main.appendChild(line1);
    main.appendChild(line2);
    document.body.appendChild(main);

    return this;
};

return new Panel();
});
