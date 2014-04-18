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
define( ['resize','engines','vars','signal','shield','galaxy','photons','lrs'],
function (resize , engines , vars , signal , shield , galaxy , photons , lrs) {
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
    /* Which panel shown?  _gchart is false if the
       normal panel is shown, true if the Galactic
       Chart panel is shown.  */
    this._gchart = false;
    /* Main DOM nodes.  */
    this._dom = null; // normal ship panel
    this._dom2 = null; // galactic chart panel
    /* Individual DOM text nodes.  */
    this._v = null;
    this._k = null;
    this._e = null;
    this._t = null;
    this._y = null;
    this._x = null;
    this._z = null;
    this._warpenergy = null;
    this._targets = null;
    this._dc_p = null;
    this._dc_e = null;
    this._dc_s = null;
    this._dc_c = null;
    this._dc_l = null;
    this._dc_r = null;
    this._stardate = null;

    signal('render', this.render.bind(this));
    signal('mainMenu', this.hide.bind(this));
    signal('newGame', this.newGame.bind(this));
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
            this._createPanelDoms();
        }
        if (!this._gchart) {
            this._dom.style.display = 'block';
            this._dom2.style.display = 'none';
            this._dom.style.fontSize = Math.floor(resize.height / 14) + 'px';

            this._v.innerHTML = engines;
            this._k.innerHTML = vars.kills;
            this._e.innerHTML = vars.energy;
            // TODO: refresh other panel data.
        } else {
            this._dom2.style.display = 'block';
            this._dom.style.display = 'none';
            this._dom2.style.fontSize = Math.floor(resize.height / 14) + 'px';

            this._warpenergy.innerHTML = galaxy.chart.jumpCost();
            // TODO: chart targets value.
            this._dc_p.style.color = photons.colorState();
            this._dc_e.style.color = engines.colorState();
            this._dc_s.style.color = shield.colorState();
            // TODO: this._dc_c.style.color
            this._dc_l.style.color = lrs.colorState();
            this._dc_r.style.color = galaxy.chart.colorState();
            this._stardate.innerHTML = galaxy.stardate.toString();
        }
    } else {
        if (this._dom) {
            this._dom.style.display = 'none';
            this._dom2.style.display = 'none';
        }
    }

    return this;
};
Panel.prototype._createPanelDoms = function () {
    var self = this;
    var main;
    var line0;
    var line1;
    var line2;
    var span;

    /* Normal ship panel.  */

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

    /* Galactic Chart panel.  */
    function makeDC(line, prop, html) {
        var valuedom;
        valuedom = document.createElement('span');
        valuedom.id = 'panel' + prop + '_content';
        valuedom.innerHTML = html;
        self[prop] = valuedom;
        line.appendChild(valuedom);
    }

    line0 = document.createElement('div');
    span = document.createElement('span');
    span.id = 'panel_warpenergy_label';
    span.innerHTML = 'WARP ENERGY:';
    line0.appendChild(span);
    span = document.createElement('span');
    this._warpenergy = span;
    span.id = 'panel_warpenergy_value';
    span.innerHTML = '0000';
    line0.appendChild(span);

    line1 = document.createElement('div');
    span = document.createElement('span');
    span.id = 'panel_targets_label';
    span.innerHTML = 'TARGETS:';
    line1.appendChild(span);
    span = document.createElement('span');
    this._targets = span;
    span.id = 'panel_targets_content';
    span.innerHTML = '0';
    line1.appendChild(span);

    span = document.createElement('span');
    span.id = 'panel_dc_label';
    span.innerHTML = '&nbsp;DC:';
    line1.appendChild(span);
    makeDC(line1, '_dc_p', 'P');
    makeDC(line1, '_dc_e', 'E');
    makeDC(line1, '_dc_s', 'S');
    makeDC(line1, '_dc_c', 'C');
    makeDC(line1, '_dc_l', 'L');
    makeDC(line1, '_dc_r', 'R');

    line2 = document.createElement('div');
    span = document.createElement('span');
    span.id = 'panel_stardate_label';
    span.innerHTML = 'STAR DATE:';
    line2.appendChild(span);
    span = document.createElement('span');
    this._stardate = span;
    span.id = 'panel_stardate_content';
    span.innerHTML = '000.00';
    line2.appendChild(span);

    main = document.createElement('main');
    this._dom2 = main;
    main.id = 'panel2';
    main.appendChild(line0);
    main.appendChild(line1);
    main.appendChild(line2);
    document.body.appendChild(main);

    return this;
};
Panel.prototype.setGalacticChartPanel = function () {
    this._gchart = true;
    return this;
}
Panel.prototype.setNormalPanel = function () {
    this._gchart = false;
    return this;
}
Panel.prototype.newGame = function () {
    return this.setNormalPanel().show();
};

return new Panel();
});
