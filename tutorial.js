/* tutorial.js - Handles tutorial mode.  */
/**
 *
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2014, 2015  Alan Manuel K. Gloria
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
var field = require('field');
var galaxy = require('galaxy');
var hyperwarp = require('hyperwarp');
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

// temporary array for 3d points
var ar3d = [0.1, 0.1, 0.1];

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
    "Your [0] to [9] keys control your Engines speed.",
    "&nbsp;"
];
teachEngines.checkAbort = startNode.checkAbort;
teachEngines.checkNext = function () {
    return teachEngines0;
};

var teachEngines0 = (function () {
var i = 0;
var teachEngines = new Array(10);
for (i = 0; i < 10; ++i) {
    teachEngines[i] = new Node();
    if (i === 0) {
        teachEngines[i].text = [
            "Now press [0] to stop your Engines.",
            "You'll see your velocity or 'V:' go to '00'."
        ];
    } else if (i === 1) {
        teachEngines[i].text = [
            "Good!  Press [1] to run at the slowest speed setting."
        ];
    } else if (i === 2) {
        teachEngines[i].text = [
            "At speed [1] and [2], you are moving at very slow speed.",
            "Although your velocity or 'V:' is '00', you're still moving.",
            "Watch the stars closely!",
            "Now press [2] to go to the next speed setting."
        ];
    } else if (i === 3) {
        teachEngines[i].text = [
            "Good!  Notice the stars are moving very slightly faster.",
            "For fine control, use [1] and [2] speed settings.",
            "Now press [3] to go to the next speed setting."
        ];
    } else {
        teachEngines[i].text = [
            "Good!  Press [" + i + "] to go to the next speed setting."
        ];
    }
    teachEngines[i].nag = "Press [" + i + "] to change your Engines speed.";
    teachEngines[i].checkAbort = startNode.checkAbort;
    teachEngines[i].checkNext = (function (i) {
        return function () {
            if (engines.getSetSpeed() === i && engines.atTargetSpeed()) {
                if (i < 9) {
                    return teachEngines[i + 1];
                } else {
                    return returnToNormalEngines;
                }
            }
            return null;
        };
    })(i);
}
return teachEngines[0];
})();

var returnToNormalEngines = new Node();
returnToNormalEngines.text = [
    "Good!  Now you know how to control your Engines.",
    "The normal cruise speed is [6], which is at 12 metrons per second",
    "It is the most energy-efficient speed setting.",
    "Now press [6] to return to the cruise speed."
];
returnToNormalEngines.nag = "Press [6] to return to the cruise speed.";
returnToNormalEngines.checkAbort = startNode.checkAbort;
returnToNormalEngines.checkNext = function () {
    if (engines.getSetSpeed() === 6 && engines.atTargetSpeed()) {
        return teachTurning;
    }
    return null;
};

var teachTurning = new Node();
teachTurning.text = [
    "Good!  Now let's take your ship for a spin!",
    "Use the arrow keys [&larr;] and [&rarr;] to turn your ship."
];
teachTurning.nag = "Press [&larr;] and [&rarr;] to turn.";
teachTurning.checkAbort = startNode.checkAbort;
teachTurning.checkNext = function () {
    if (field.yaw !== 0) {
        return discussTurning;
    }
    return null;
};

var discussTurning = new Node();
discussTurning.text = [
    "Good!  Now you know how to turn your ship around.",
    "This is of course vital when chasing and hunting down the Nyloz!",
    "&nbsp;"
];
discussTurning.checkAbort = startNode.checkAbort;
discussTurning.checkNext = function () {
    return teachDiveClimb;
};

var teachDiveClimb = new Node();
teachDiveClimb.text = [
    "Now use the arrow keys [&uarr;] and [&darr;] " +
        "to make your ship dive and climb."
];
teachDiveClimb.nag = "Press [&uarr;] and [&darr;] to dive and climb.";
teachDiveClimb.checkAbort = startNode.checkAbort;
teachDiveClimb.checkNext = function () {
    if (field.pitch !== 0) {
        return discussDiveClimb;
    }
    return null;
};

var discussDiveClimb = new Node();
discussDiveClimb.text = [
    "Good!  Notice how [&uarr;] makes you dive (your ship's nose goes down).",
    "And notice how [&darr;] makes you climb (your ship's nose goes up).",
    "&nbsp;"
];
discussDiveClimb.checkAbort = startNode.checkAbort;
discussDiveClimb.checkNext = function () {
    return teachAftFore;
};

var teachAftFore = new Node();
teachAftFore.text = [
    "Let's start learning about your [A]ft and [F]ore views.",
    "Press [A] to switch to Aft View."
];
teachAftFore.nag = "Press [A] to switch to Aft View.";
teachAftFore.checkAbort = startNode.checkAbort;
teachAftFore.checkNext = function () {
    if (field.display && field.currentView === 'aft') {
        return turningAft;
    }
    return null;
};

var turningAft = new Node();
turningAft.text = [
    "Notice how the stars streak away from you in Aft View.",
    "The Aft View is like a 'rear-view mirror'.",
    "&nbsp;",
    "At high levels, the Nyloz can attack you from behind!",
    "Good STAR COMMANDER CLASS 1 pilots " +
        "can quickly dispatch such sneaky foes.",
    "&nbsp;",
    "Now try using the arrow keys [&uarr;] [&darr;] [&larr;] [&rarr;]."
];
turningAft.nag =
    "Press the arrow keys [&uarr;] [&darr;] [&larr;] [&rarr;] while in Aft.";
turningAft.checkAbort = startNode.checkAbort;
turningAft.checkNext = function () {
    if (field.display && field.currentView === 'aft' &&
        (field.pitch !== 0 || field.yaw !== 0)) {
        return discussTurningAft;
    }
    return null;
};

var discussTurningAft = new Node();
discussTurningAft.text = [
    "Good!  Notice how the direction keys seem to work 'in reverse'.",
    "That's because the Aft view is like a rear-view mirror.",
    "Always be aware of which view you're in!",
    "&nbsp;",
    "To go back to Fore view, press [F]."
];
discussTurningAft.nag = "Press [F] to return to Fore view.";
discussTurningAft.checkAbort = startNode.checkAbort;
discussTurningAft.checkNext = function () {
    if (field.display && field.currentView === 'front') {
        return teachGalacticChart;
    }
    return null;
};

var teachGalacticChart = new Node();
teachGalacticChart.text = [
   "Good!",
   "Right now, you're traveling through normal space.",
   "It's impossible to travel to other sectors this way.",
   "We need to use the [G]alactic Chart to see other sectors.",
   "Press [G] to bring up the [G]alactic Chart."
];
teachGalacticChart.nag =
   "Press [G] to bring up the Galactic Chart.";
teachGalacticChart.checkAbort = startNode.checkAbort;
teachGalacticChart.checkNext = function () {
    if (galaxy.chart.isShown()) {
        return moveCursorInChart;
    }
    return null;
};

var moveCursorInChart = new Node();
moveCursorInChart.text = [
    "Good!  The Galaxy is divided into sectors, as you can see on the chart.",
    "Notice that some sectors have a &diams; while some have lines.",
    "&nbsp;",
    "The &diams; are allied starbases.",
    "You can dock at starbases to repair and recharge your ship.",
    "&nbsp;",
    "The lines are Nyloz ships.",
    "Sectors with 2 lines have 2 Nyloz ships, 3 lines means 3 ships, " +
        "and so on.",
    "&nbsp;",
    "We'll teach you how to get to them later!",
    "For now, move the yellow cursor using your arrow keys."
];
moveCursorInChart.nag =
    "Use the arrow keys [&uarr;] [&darr;] [&larr;] [&rarr;] " +
        "to move the cursor in the Galactic Chart.";
moveCursorInChart.checkAbort = startNode.checkAbort;
moveCursorInChart.checkNext = function () {
    if (galaxy.chart.movex !== 0 || galaxy.chart.movey !== 0) {
        return discussChart;
    }
    return null;
};

discussChart = new Node();
discussChart.text = [
    "As you can see, there are really two yellow cursors.",
    "The one you can move around is your hyperwarp target.",
    "The one that stays still is your current sector location.",
    "&nbsp;",
    "Your 'TARGETS:' indicator specifies the number of enemies in a sector.",
    "The Nyloz will continually try to surround allied starbases.",
    "If an allied starbase is surrounded too long, it will be destroyed!",
    "For now, the Nyloz have agreed not to move during the tutorial.",
    "The Nyloz will never move from or into the sector you're in.",
    "&nbsp;",
    "Notice the 'STAR DATE:' indicator.",
    "It indicates how long it has been since your mission started.",
    "&nbsp;",
    "Finally, notice the 'DC:' or Damage Control indicator.",
    "It indicates the status of each ship component.",
    "Green means OK, yellow means damaged, red means destroyed.",
    "The components are 'P'hotons, 'E'ngines, 'S'hield, 'C'omputer, " +
        "'L'ong-range scan, and 'R'adio.",
    "Components can get damaged if you are hit by Nyloz photons.",
    "To fix damaged or destroyed components, dock at a starbase.",
    "&nbsp;",
    "Let's try docking!",
    "Point your hyperwarp target at a &diams; sector."
];
discussChart.nag =
    "Point your hyperwarp target at a starbase &diams; sector.";
discussChart.checkAbort = startNode.checkAbort;
discussChart.checkNext = function () {
    if (galaxy.chart.isTargetStarbase()) {
        return prepareTeachHyperwarp;
    }
    return null;
};

var prepareTeachHyperwarp = new Node();
prepareTeachHyperwarp.text = [
    "Okay!  Don't move it away!  Switch to [F]ore view."
];
prepareTeachHyperwarp.nag =
    "Press [F] to switch to [F]ore view.";
prepareTeachHyperwarp.checkAbort = startNode.checkAbort;
prepareTeachHyperwarp.checkNext = function () {
    if (field.display && field.currentView === 'front') {
        return teachHyperwarp;
    }
    return null;
};

var teachHyperwarp = new Node();
teachHyperwarp.text = [
    "Now press [H] to engage your hyperwarp engines!"
];
teachHyperwarp.nag = "Press [H] to engage hyperwarp.";
teachHyperwarp.checkAbort = function () {
    if (engines.isHyperwarp()) {
        return waitHyperwarp;
    }
    return null;
};

var waitHyperwarp = new Node();
waitHyperwarp.text = [
    "Whee!!  Keep the cursor centered!"
];
waitHyperwarp.checkAbort = function () {
    if (hyperwarp.inHyperspace()) {
        return inHyperspace;
    } else if (!engines.isHyperwarp()){
        return retryHyperwarp;
    }
    return null;
};

// If the player disengages from hyperwarp.
var retryHyperwarp = new Node();
retryHyperwarp.text = [
    "Oops!  Don't cancel hyperwarp!",
    "Pressing [H] multiple times or pressing an engine key aborts hyperwarp.",
    "Press [H] <em>now</em> to re-engage hyperwarp engines."
];
retryHyperwarp.nag = teachHyperwarp.nag;
retryHyperwarp.checkAbort = teachHyperwarp.checkAbort;

var inHyperspace = new Node();
inHyperspace.checkAbort = function () {
    if (!hyperwarp.inHyperspace() && field.speed == 0) {
        if (galaxy.getPlayerSectorContents() <= -1) {
            if (computer.attack.isEnabled()) {
                return teachDocking;
            } else {
                return enableComputerBeforeTeachDocking;
            }
        } else {
            return derailed;
        }
    }
    return null;
};

var enableComputerBeforeTeachDocking = new Node();
enableComputerBeforeTeachDocking.text = [
    "You need the Attack Computer to help locate starbases.  Turn it on."
];
enableComputerBeforeTeachDocking.nag =
   "Press [C] to turn on the Attack Computer.";
enableComputerBeforeTeachDocking.checkAbort = function () {
    if (galaxy.getPlayerSectorContents() > -1) {
        return derailed;
    }
    return null;
};
enableComputerBeforeTeachDocking.checkNext = function () {
    if (computer.attack.isEnabled()) {
        return teachDocking;
    }
    return null;
};

var teachDocking = new Node();
teachDocking.text = [
    "Okay!  You're in a sector with a starbase.",
    "Notice that your Attack Computer is indicating a direction.",
    "Turn in that direction to turn towards the starbase.",
    "Keep your Engines at [0] for now!"
];
teachDocking.nag =
    "Follow the Attack Computer direction to center the starbase.";
teachDocking.checkAbort = function () {
    if (galaxy.getPlayerSectorContents() > -1) {
        return derailed;
    }
    if (field.speed !== 0.0) {
        return teachDockingEnsure0;
    }
    return null;
};
teachDocking.checkNext = function () {
    field.getBogeyPosition(0, ar3d);
    if ((Math.abs(ar3d[0]) < 5) && (Math.abs(ar3d[1]) < 5) &&
        ar3d[2] >= 0.0) {
        return teachLRS;
    }
    return null;
};

var teachDockingEnsure0 = new Node();
teachDockingEnsure0.text = [
    "Hold your horses!  Press [0] to keep your Engines at full stop."
];
teachDockingEnsure0.nag =
    "Press [0] to keep your Engines at full stop.";
teachDockingEnsure0.checkAbort = function () {
    if (galaxy.getPlayerSectorContents() > -1) {
        return derailed;
    }
    return null;
};
teachDockingEnsure0.checkNext = function () {
    if (field.speed === 0.0) {
        return teachDocking;
    }
    return null;
};

var teachLRS = new Node();
teachLRS.text = [
    "Good!  Now's a good time to teach you about the LRS.",
    "The Long-Range Scan gives you " +
        "a &quot;bird&apos;s eye view&quot; of your ship.",
    "It's a backup navigation aid.",
    "Press [L] to enable your Long-Range Scan."
];
teachLRS.nag =
    "Press [L] to enable your Long-Range Scan.";
teachLRS.checkAbort = function () {
    if (galaxy.getPlayerSectorContents() > -1) {
        return derailed;
    }
    return null;
};
teachLRS.checkNext = function () {
    if (field.display && field.currentView === 'lrs') {
        return dockWithStarbase;
    }
    return null;
};

var dockWithStarbase = new Node();
dockWithStarbase.text = ['Tutorial TODO.'];
dockWithStarbase.terminal = true;

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
