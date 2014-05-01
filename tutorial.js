/* tutorial.js - Handles tutorial mode.  */
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
var field = require('field');
var galaxy = require('galaxy');
var shield = require('shield');
var signal = require('signal');

/*-----------------------------------------------------------------------------
Tutorial Node Data Structure
-----------------------------------------------------------------------------*/

function Node() {
    this.text = Node.prototype.text;
    this.nag = Node.prototype.nag;
    this.checkAbort = Node.prototype.checkAbort;
    this.checkNext = Node.prototype.checkNext;
    this.terminal = Node.prototype.terminal;
}
Node.prototype.text = [];
Node.prototype.nag = '';
Node.prototype.checkAbort = function () { return null; };
Node.prototype.checkNext = function () { return null; };
Node.prototype.terminal = false;

/*-----------------------------------------------------------------------------
Tutorial Data
-----------------------------------------------------------------------------*/

var startNode = new Node();
startNode.text = [
    "Welcome to the tutorial!",
    "First things first: turn on your [S]hield and your Attack [C]omputer."
];
startNode.nag =
    "Please press [S] to turn on your Shield, " +
    "[C] to turn on your Attack Computer.";
startNode.checkAbort = function () {
    if (galaxy.getPlayerSector() !== 72) {
        return derailed;
    }
    return null;
};
startNode.checkNext = function () {
    if (shield.isEnabled() && computer.attack.isEnabled()) {
        return shieldComputerDiscuss;
    } else if (shield.isEnabled()) {
        return nagComputer;
    } else if (computer.attack.isEnabled()) {
        return nagShield;
    }
    return null;
};

/* Nag about the shield/computer.  */
var nagComputer = new Node();
nagComputer.text = ["Good, now press [C] to turn on your Attack Computer."];
nagComputer.nag = "Please press [C] to turn on your Attack Computer.";
nagComputer.checkAbort = startNode.checkAbort;
nagComputer.checkNext = function () {
    if (computer.attack.isEnabled()) {
        return shieldComputerDiscuss;
    }
    return null;
};
var nagShield = new Node();
nagShield.text = ["Good, now press [S] to turn on your Attack Computer."];
nagShield.nag = "Please press [S] to turn on your Shield.";
nagShield.checkAbort = startNode.checkAbort;
nagShield.checkNext = function () {
    if (shield.isEnabled()) {
        return shieldComputerDiscuss;
    }
    return null;
};

/* Teach about purpose of shield and computer.  */
var shieldComputerDiscuss = new Node();
shieldComputerDiscuss.text = [
    "Good!  Make sure they are on when fighting the Nyloz!",
    "Your Shield protects your ship from total destruction.",
    "But even with the Shield, " +
        "ship components can be damaged by enemy fire.",
    "The Shield can get damaged!  If that happens, RUN!",
    "&nbsp;",
    "The Attack Computer helps locate enemies and friendly starbases.",
    "It will indicate the direction of your target, " +
        "and provide a targeting cursor.",
    "The Attack Computer can also be damaged by enemy fire.",
    "It's difficult to locate targets without the Attack Computer.",
    "But skilled STAR COMMANDER CLASS 1 pilots must achieve this feat!",
    "&nbsp;",
    "Both these components consume your 'E:' or energy.",
    "You can turn them off while you are safe in an empty sector " +
        "to conserve energy.",
    "&nbsp;",
    "&nbsp;"
];
shieldComputerDiscuss.checkAbort = startNode.checkAbort;
shieldComputerDiscuss.checkNext = function () {
    return teachEngines;
};

/* teach about engines 0->9.  */
var teachEngines = new Node();
teachEngines.text = [
    "Let's start learning about your Engines.",
    "Your Engines let you travel through normal space.",
    "Use your [0] to [9] keys to control your Engines.",
    "Now, turn off your engines using [0]."
];
teachEngines.nag = "Please press [0] to turn off engines.";
teachEngines.checkAbort = startNode.checkAbort;
teachEngines.checkNext = function () {
    if (field.speed === 0) {
        return teachEngines0;
    }
    return null;
};

var teachEngines0 = new Node();
teachEngines0.text = ["Tutorial TODO."];
teachEngines0.terminal = true;

/* The tutorial has been derailed.  */
var derailed = new Node();
derailed.text = [
    "Okay, now you aren't following the tutorial anymore.",
    "I assume you know what you're doing.  Entering NOVICE mode."
];
derailed.terminal = true;

/*-----------------------------------------------------------------------------
Tutorial Handler
-----------------------------------------------------------------------------*/

var msgTime = 3.5;
var nagTime = 9.0;

function Tutorial() {
    this._enabled = false;

    this._node = null;
    this._i = 0;

    // time between messages.
    this._time = 0.0;

    signal('update', this.update.bind(this));
    signal('mainMenu', this.mainMenu.bind(this));
    signal('startTutorial', this.startTutorial.bind(this));
}
Tutorial.prototype.update = function (seconds) {
    var node = this._node;
    var next = null;
    if (!this._enabled) {
        return this;
    }
    // check for transitions.
    next = node.checkAbort();
    if (!next && this._i >= node.text.length) {
        // at terminal
        if (node.terminal) {
            this._enabled = false;
            signal.raise('endTutorial');
            return this;
        }
        next = node.checkNext();
    }
    if (next) {
        this._node = next;
        this._i = 0;
        this._time = 0.0;
        return this;
    }
    // Should we send a message?
    if (this._time <= 0.0) {
        // yep
        if (this._i >= node.text.length) {
            console.write(node.nag);
        } else {
            console.write(node.text[this._i]);
            ++this._i;
        }

        if (this._i >= node.text.length) {
            this._time = nagTime - seconds;
        } else {
            this._time = msgTime - seconds;
        }
    } else {
        this._time -= seconds;
    }
    return this;
};
Tutorial.prototype.mainMenu = function () {
    this._enabled = false;
    this._node = null;
    this._i = 0;
};
Tutorial.prototype.startTutorial = function () {
    this._enabled = true;
    this._node = startNode;
    this._i = 0;
};

return new Tutorial();
});
