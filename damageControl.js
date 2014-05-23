/* damageControl.js - Handles the player getting hit.  */
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
define(function (require) {

var computer = require('computer');
var console = require('console');
var engines = require('engines');
var galaxy = require('galaxy');
var lrs = require('lrs');
var photons = require('photons');
var shield = require('shield');
var signal = require('signal');
var vars = require('vars');

var attack = computer.attack;
var chart = galaxy.chart;
var energy = vars.energy;

/* Time between damage reports.  */
var reportTime = 20.0;

var damageProbabilities = {
    'NOVICE':       0.125,
    'PILOT':        0.150,
    'WARRIOR':      0.175,
    'COMMANDER':    0.200
};

/* Various damage points.  */
var PHOTONLEFT = 0;
var PHOTONRIGHT = 1;
var PHOTONS = 2;
var ENGINESDAMAGE = 3;
var ENGINESDESTROY = 4;
var SHIELDSDAMAGE = 5;
var SHIELDSDESTROY = 6;
var COMPUTERATTACK = 7;
var COMPUTERINSTRUMENTS = 8;
var COMPUTER = 9;
var LRSDAMAGE = 10;
var LRSDESTROY = 11;
var RADIODAMAGE = 12;
var RADIODESTROY = 13;

var applyDamage = [];
applyDamage[PHOTONLEFT] = photons.damageLeft.bind(photons);
applyDamage[PHOTONRIGHT] = photons.damageRight.bind(photons);
applyDamage[PHOTONS] = function () { photons.damageLeft().damageRight(); };
applyDamage[ENGINESDAMAGE] = engines.damage.bind(engines);
applyDamage[ENGINESDESTROY] = engines.destroy.bind(engines);
applyDamage[SHIELDSDAMAGE] = shield.damage.bind(shield);
applyDamage[SHIELDSDESTROY] = shield.destroy.bind(shield);
applyDamage[COMPUTERATTACK] = computer.attack.destroy.bind(computer.attack);
applyDamage[COMPUTERINSTRUMENTS] = computer.instruments.destroy.bind(
    computer.instruments
);
applyDamage[COMPUTER] = function () {
    computer.attack.destroy();
    computer.instruments.destroy();
};
applyDamage[LRSDAMAGE] = lrs.damage.bind(lrs);
applyDamage[LRSDESTROY] = lrs.destroy.bind(lrs);
applyDamage[RADIODAMAGE] = chart.damage.bind(chart);
applyDamage[RADIODESTROY] = chart.destroy.bind(chart);

var noviceMode = false;

var candidates = [];

/* Deals damage to a component of the starship.  */
function dealDamage() {
    var st = '';
    var rand = 0;

    candidates.length = 0;

    // Photons
    if (photons.canFireLeft()) {
        if (photons.canFireRight()) {
            candidates.push(PHOTONLEFT);
            candidates.push(PHOTONRIGHT);
            candidates.push(PHOTONS);
        } else {
            candidates.push(PHOTONLEFT);
        }
    } else {
        if (photons.canFireRight()) {
            candidates.push(PHOTONRIGHT);
        }
    }
    // Engines
    st = engines.colorState();
    if (st === 'green') {
        candidates.push(ENGINESDAMAGE);
    }
    if (st !== 'red') {
        candidates.push(ENGINESDESTROY);
    }
    // Shield
    st = shield.colorState();
    if (st === 'green' && !noviceMode) {
        candidates.push(SHIELDSDAMAGE);
    }
    if (st !== 'red' && !noviceMode) {
        candidates.push(SHIELDSDESTROY);
    }
    // Computer: As a special case, don't
    // allow computer to be destroyed if
    // LRS is already destroyed.
    if (!computer.attack.isDestroyed()) {
        if (!computer.instruments.isDestroyed()) {
            candidates.push(COMPUTERATTACK);
            candidates.push(COMPUTERINSTRUMENTS);
            if (lrs.colorState() !== 'red') {
                candidates.push(COMPUTER);
            }
        } else {
            if (lrs.colorState() !== 'red') {
	        candidates.push(COMPUTERATTACK);
            }
        }
    } else {
        if (!computer.instruments.isDestroyed()) {
            if (lrs.colorState() !== 'red') {
                candidates.push(COMPUTERINSTRUMENTS);
            }
        }
    }
    // LRS: If the computer is destroyed, don't
    // let the LRS be completely destroyed.
    st = lrs.colorState();
    if (st === 'green') {
        candidates.push(LRSDAMAGE);
    }
    if (st !== 'red' && computer.colorState() !== 'red') {
        candidates.push(LRSDESTROY);
    }
    // Radio
    st = chart.colorState();
    if (st === 'green') {
        candidates.push(RADIODAMAGE);
    }
    if (st !== 'red') {
        candidates.push(RADIODESTROY);
    }

    if (candidates.length === 0) {
        // This can only happen in NOVICE mode, where
        // the shield is "perfect".  However, if all
        // other components are damaged, then the shield
        // can be destroyed.
        if (shield.colorState() === 'green') {
            candidates.push(SHIELDSDAMAGE);
        }
        candidates.push(SHIELDSDESTROY);
    }

    rand = Math.floor(Math.random() * candidates.length);
    applyDamage[candidates[rand]]();
}

/* Components to report on.  */
var components = [
    {component: photons, name: "Photons"},
    {component: engines, name: "Engines"},
    {component: shield, name: "Shield"},
    {component: computer, name: "Computer"},
    {component: lrs, name: "LRS"},
    {component: chart, name: "Radio"}
];

/* Make a damage report.  */
function damageReport() {
    var str = '';
    var st = '';
    var first = true;
    var i = 0;
    var l = components.length;
    for (i = 0; i < l; ++i) {
        st = components[i].component.colorState();
        if (st !== 'green') {
            if (first) {
                first = false;
            } else {
                str += ', ';
            }
            str += components[i].name;
            if (st === 'yellow') {
                str += ' damaged';
            } else {
                str += ' destroyed';
            }
        }
    }
    console.write('DAMAGE REPORT: ' + str);
}

function DC() {
    this._damageProbability = 0.0;
    this._report = false;
    this._reportTime = 0.0;

    signal('nylozHitPlayer', this.nylozHitPlayer.bind(this));
    signal('newGame', this.newGame.bind(this));
    signal('fix', this.fix.bind(this));
    signal('update', this.update.bind(this));
    signal('gameOver', this.gameOver.bind(this));
}
DC.prototype.nylozHitPlayer = function () {
    if (!shield.protectionCheck()) {
        signal.raise('nylozKillPlayer');
        return this;
    }
    shield.flash();
    energy.consume(100);

    if (Math.random() < this._damageProbability) {
        dealDamage();
        this._report = true;
        this._reportTime = reportTime;
        damageReport();
    }

    return this;
};
DC.prototype.newGame = function (difficulty) {
    this._report = false;
    this._reportTime = 0.0;
    this._damageProbability = damageProbabilities[difficulty];
    noviceMode = difficulty === 'NOVICE';
};
DC.prototype.fix = function () {
    this._report = false;
    this._reportTime = 0.0;
};
DC.prototype.update = function (seconds) {
    if (this._report) {
        this._reportTime -= seconds;
        if (this._reportTime <= 0.0) {
            this._reportTime = reportTime;
            damageReport();
        }
    }
};
DC.prototype.gameOver = function () {
    this._report = false;
    this._reportTime = 0.0;
    return this;
};

return new DC();
});
