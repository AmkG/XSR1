/* tutorial.js - Handles tutorial mode.  */
/**
 *
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2014, 2015, 2022  Alan Manuel K. Gloria
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
var damageControl = require('damageControl');
var engines = require('engines');
var field = require('field');
var galaxy = require('galaxy');
var hyperwarp = require('hyperwarp');
var photons = require('photons');
var sector = require('sector');
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
Node.prototype.nag = '&nbsp;';
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
    "First things first: you can press " +
        "[P] <strong>or</strong> [Esc] at any time " +
        "to pause the game.",
    "From the [P]ause menu, you can abort this " +
        "tutorial game and return to the main menu.",
    "Now turn on your [S]hield and your Attack [C]omputer."
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
    "To turn them off, simply press [S] or [C] again.",
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
        return teachPhotons;
    }
    return null;
};

var teachPhotons = new Node();
teachPhotons.text = [
    "Good!  Let's now learn about your weapon.",
    "You have two Photon tubes which you can fire by " +
       "holding down [Space]."
];
teachPhotons.nag = "Press [Space] to fire photon missiles.";
teachPhotons.checkAbort = startNode.checkAbort;
teachPhotons.checkNext = function () {
    if (photons.fire) {
        return teachPhotonsAft;
    }
    return null;
};

var teachPhotonsAft = new Node();
teachPhotonsAft.text = [
    "You can also fire backwards.  Just set to [A]ft view and press [Space]."
];
teachPhotonsAft.nag = "Set to [A]ft view and [Space] to fire photon missiles.";
teachPhotonsAft.checkAbort = startNode.checkAbort;
teachPhotonsAft.checkNext = function () {
    if (field.display && field.currentView === 'aft' &&
        photons.fire) {
        return discussPhotons;
    }
    return null;
};

var discussPhotons = new Node();
discussPhotons.text = [
    "Photon missiles are the sole weapon in this game.",
    "Even enemy Nyloz ships will fire photon missiles at you.",
    "If you are not [S]hielded, just one photon missile hitting you is a game over!",
    "Even if you <strong>are</strong> [S]hielded, " +
        "one photon missile can destroy the Shield and the next will destroy you!",
    "Though the risk of any particular hit destroying the " +
        "[S]hield is low, try to avoid incoming fire as much as you can!",
    "&nbsp;",
    "More importantly, you have allies in this game!",
    "You can shoot them down, and all it takes is one shot to " +
        "destroy an allied starbase.",
    "Obviously, you do <strong>not</strong> want to do that too often!",
    "&nbsp;"
];
discussPhotons.nag = "Ceasefire!  Ceasefire!  Take your finger off [Space]!";
discussPhotons.checkAbort = startNode.checkAbort;
discussPhotons.checkNext = function () {
    if (!photons.fire) {
        return teachGalacticChart;
    }
    return null;
};

var teachGalacticChart = new Node();
teachGalacticChart.text = [
   "Let's discuss strategy!",
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
    "It's a backup navigation aid, for use in case your " +
        "attack computer is destroyed!",
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
        return teachLRSLeftRight;
    }
    return null;
};

var teachLRSLeftRight = new Node();
teachLRSLeftRight.text = [
    "Now try out how turning with [&larr;] and [&rarr;] " +
        "looks like in the LRS."
];
teachLRSLeftRight.nag =
    "Press [&larr;] and [&rarr;] to turn while in the LRS."
teachLRSLeftRight.checkAbort = teachLRS.checkAbort;
teachLRSLeftRight.checkNext = function () {
    if (field.display && field.currentView === 'lrs' &&
        field.yaw !== 0) {
        return teachLRSUpDown;
    }
    return null;
};

var teachLRSUpDown = new Node();
teachLRSUpDown.text = [
    "Good!  Notice how the stars moved while turning " +
        "in the LRS screen.",
    "Now use the [&uarr;] and [&darr;] arrows to " +
        "dive and climb, while still in the LRS."
];
teachLRSUpDown.nag =
    "Press [&uarr;] and [&darr;] to dive and climb while in the LRS.";
teachLRSUpDown.checkAbort = teachLRS.checkAbort;
teachLRSUpDown.checkNext = function () {
    if (field.display && field.currentView === 'lrs' &&
        field.pitch !== 0) {
        return teachLRSLast;
    }
    return null;
};

var teachLRSLast = new Node();
teachLRSLast.text = [
    "Good!  Notice how the stars moved while diving and " +
        "climbing in the LRS screen.",
    "It is important to be familiar with using the LRS.",
    "Take some time now to be comfortable with navigating via LRS.",
    "Your Attack Computer is better for locating targets, but " +
        "enemy fire can damage it!",
    "If your Attack Computer is destroyed, you have to use the LRS.",
    "The LRS can also be damaged!",
    "If the LRS is damaged but not completely destroyed, " +
        "it will glitch and show both an inverted and correct image.",
    "&nbsp;",
    "&nbsp;"
];
teachLRSLast.checkAbort = teachLRS.checkAbort;
teachLRSLast.checkNext = function () {
    return dockWithStarbase;
};

/* Keep track of signals.  */
var playerDestroyedStarbase = false;
var fixed = false;
var killedNyloz = false;
function resetFlags() {
    playerDestroyedStarbase = false;
    fixed = false;
    killedNyloz = false;
}
signal('newGame', resetFlags);
signal('startTutorial', resetFlags);
signal('playerDestroyStarbase', function () {
    playerDestroyedStarbase = true;
});
signal('fix', function () {
    fixed = true;
});
signal('killNyloz', function () {
    killedNyloz = true;
});

var dockWithStarbase = new Node();
dockWithStarbase.checkAbort = function () {
    if (playerDestroyedStarbase) {
        playerDestroyedStarbase = false;
        return retryStarbaseDocking;
    }
    return teachLRS.checkAbort();
};
dockWithStarbase.checkNext = function () {
    /* Check the state and dispatch to the correct tutorial node.  */
    if (!(field.display && field.currentView === 'front')) {
        return dockWithStarbaseFore;
    }
    if (!(computer.attack.isEnabled())) {
        return dockWithStarbaseComputer;
    }
    field.getBogeyPosition(0, ar3d);
    if (!((Math.abs(ar3d[0]) < 5) && (Math.abs(ar3d[1]) < 5) &&
          ar3d[2] >= 0.0)) {
        return dockWithStarbaseAim;
    }
    if (!(sector.starbase.docked)) {
        return dockWithStarbaseApproach;
    }
    fixed = false;
    return dockWithStarbaseWaitFix;
};

var retryStarbaseDocking = new Node();
retryStarbaseDocking.text = [
    "Oh no!  You managed to wreck the starbase.  " +
        "Go back to [G]alactic Chart and [H]yperwarp to another &diams;!"
];
retryStarbaseDocking.nag =
    "Open the [G]alactic Chart, find another &diams; starbase, and [H]yperwarp to it.";
retryStarbaseDocking.checkAbort = function () {
    /* Abort if the player went out and started fightning Nyloz.  */
    if (galaxy.getPlayerSectorContents() > 0)
        return derailed;
    return null;
};
retryStarbaseDocking.checkNext = function () {
    if (galaxy.getPlayerSectorContents() <= -1)
        return dockWithStarbase;
    return null;
};

var dockWithStarbaseFore = new Node();
dockWithStarbaseFore.text = [
    "Okay, let's get to the [F]ore view with the [C]omputer on, " +
        "and get us aimed at the starbase!"
];
dockWithStarbaseFore.nag = "Please switch to [F]ore view.";
dockWithStarbaseFore.checkAbort = dockWithStarbase.checkAbort;
dockWithStarbaseFore.checkNext = function () {
    if (field.display && field.currentView === 'front') {
        return dockWithStarbase;
    }
    return null;
};

var dockWithStarbaseComputer = new Node();
dockWithStarbaseComputer.text = [
    "Now turn on the Attack [C]omputer, so it is easier to navigate."
];
dockWithStarbaseComputer.nag = "Please turn on the Attack [C]omputer.";
dockWithStarbaseComputer.checkAbort = dockWithStarbase.checkAbort;
dockWithStarbaseComputer.checkNext = function () {
    if (computer.attack.isEnabled())
        return dockWithStarbase;
    return null;
};

var dockWithStarbaseAim = new Node();
dockWithStarbaseAim.text = [
    "Follow your Attack Computer and aim at the starbase.  Make sure not to shoot it!"
];
dockWithStarbaseAim.nag = "Follow the Attack Computer's direction and aim at the starbase.";
dockWithStarbaseAim.checkAbort = dockWithStarbase.checkAbort;
dockWithStarbaseAim.checkNext = function () {
    field.getBogeyPosition(0, ar3d);
    if ((Math.abs(ar3d[0]) < 5) && (Math.abs(ar3d[1]) < 5) &&
        ar3d[2] >= 0.0) {
        return dockWithStarbase;
    }
    return null;
};

var dockWithStarbaseApproach = new Node();
dockWithStarbaseApproach.text = [
    "Now, we have to approach the starbase to dock with it.",
    "Notice your panel below has an indicator with 'R:' on it.",
    "That is your Range or distance to the target, i.e. the starbase.",
    "You have to <strong><em>stop</em></strong> (i.e. Engines [0]), " +
        "facing the starbase, within 'R: +005' of it.",
    "You have to be completely stopped &mdash; turning will abort docking!",
    "&nbsp;",
    "Right now you are too far from the starbase, so get your " +
        "Engines to [6] or so.",
    "When you are below 'R: +020' or so, approach with lower " +
        "Engines, like [3], [2], or [1].",
    "Then once you have gone to 'R: +005' or less, stop with [0]!"
];
dockWithStarbaseApproach.nag =
    "Approach the starbase within " +
        "'&theta;: &plusmn;00 &Phi;: &plusmn;00 R: +005'" +
        ", then stop ([0]) completely, and do not turn!"
;
dockWithStarbaseApproach.checkAbort = function () {
    var rv = dockWithStarbase.checkAbort();
    if (rv)
        return rv;
    /* Let the player skip the entire discussion if they could
       dock right now, which is why we use checkAbort here.  */
    if (sector.starbase.docked) {
        fixed = false;
        return dockWithStarbaseWaitFix;
    }
    /* If the player manages to overshoot, turn around and try again.  */
    field.getBogeyPosition(0, ar3d);
    if (ar3d[2] < 0.0)
        return dockWithStarbaseOvershot;
    return null;
};

var dockWithStarbaseOvershot = new Node();
dockWithStarbaseOvershot.text = [
    "Oops!  Went past the starbase!  Stop Engines now [0] and try again!"
];
dockWithStarbaseOvershot.checkAbort = dockWithStarbase.checkAbort;
dockWithStarbaseOvershot.checkNext = function () {
    return dockWithStarbase;
};

var dockWithStarbaseWaitFix = new Node();
dockWithStarbaseWaitFix.text = [
    "Great!  Just wait for the " + sector.starbase.bothtml + " repairbot to approach you.",
    "Once it does, it will immediately recharge your 'E:' and repair all components."
];
dockWithStarbaseWaitFix.nag = "";
dockWithStarbaseWaitFix.checkAbort = function () {
    var rv = dockWithStarbase.checkAbort();
    if (rv)
        return rv;
    if (!sector.starbase.docked) {
        return dockWithStarbaseAborted;
    }
    if (fixed) {
        fixed = false;
        return discussDockWithStarbase;
    }
    return null;
};

var dockWithStarbaseAborted = new Node();
dockWithStarbaseAborted.text = [
    "Oops!  Do not move your ship from [0] or " +
       "turn with [&larr;] [&rarr;] [&uarr;] [&darr;].  " +
       "As you just saw, that aborts docking!"
];
dockWithStarbaseAborted.checkAbort = function () {
    return dockWithStarbaseApproach;
};

var discussDockWithStarbase = new Node();
discussDockWithStarbase.text = [
    "Great!  Now you know about docking at starbases!",
    "Remember to dock at starbases to refill your 'E:'nergy meter, " +
         "or if 'DC:' in the Galactic Chart shows damage to your components.",
    "While docking, you do not have to watch the bot in [F]ore view, " +
         "you just have to stay still and not shoot down the starbase.",
    "Wise STAR COMMANDER CLASS 1 pilots will pull up the [G]alactic Chart " +
         "while waiting for repairs.",
    "&nbsp;"
];
discussDockWithStarbase.checkNext = function () {
    return fightNyloz;
};

var fightNyloz = new Node();
fightNyloz.text = [
    "Let's get down to business: fighting the Nyloz!",
    "You win the game by eliminating all Nyloz ships.",
    "The Nyloz are afraid of your awesomeness and won't go to you.  " +
        "Bring the fight them!"
];
fightNyloz.checkNext = function () {
    /* Make sure player has shields and computer enabled before fighting!  */
    if (!(shield.isEnabled() && computer.attack.isEnabled()))
        return fightNylozEnableCS;
    return fightNylozGalactic;
};

var fightNylozEnableCS = new Node();
fightNylozEnableCS.text = [
    "Keep your [S]hields enabled while fightning Nyloz.",
    "And your Attack [C]omputer really helps target them."
];
fightNylozEnableCS.nag =
    "Turn on [S]hields and Attack [C]omputer."
;
fightNylozEnableCS.checkAbort = function () {
    if (shield.isEnabled() && computer.attack.isEnabled())
       return fightNylozGalactic;
    /* Did they go off fighting without Compputer and shields already?  */
    if (galaxy.getPlayerSectorContents() > 0)
        return derailed;
    return null;
};

var fightNylozGalactic = new Node();
fightNylozGalactic.nag =
    "Open the [G]alactic Chart and use [&larr;] [&rarr;] [&uarr;] [&darr;] " +
        "to select a sector with 'Targets:' 2 or more."
;
fightNylozGalactic.checkAbort = function () {
    var targets = galaxy.chart.targets();
    if (targets !== '0')
        return fightNylozHyperwarp;
    return null;
};

var fightNylozHyperwarp = new Node();
fightNylozHyperwarp.text = [
    "Now switch to [F]ore view and [H]yperwarp to the Nyloz!"
];
fightNylozHyperwarp.nag =
    "Switch to [F]ore view and enable [H]yperwarp to fight the Nyloz."
;
fightNylozHyperwarp.checkAbort = function () {
    /* The player might have moved targets to another sector.  */
    var targets = galaxy.chart.targets();
    if (targets === '0')
        return fightNylozGalactic;
    if (engines.isHyperwarp())
        return fightNylozWaitHyperwarp;
    return null;
};

var fightNylozWaitHyperwarp = new Node();
fightNylozWaitHyperwarp.text = [
    "Whee!  Get ready for the Nyloz!"
];
fightNylozWaitHyperwarp.checkAbort = function () {
    if (hyperwarp.inHyperspace())
        return fightNylozInHyperspace;
    else if (!engines.isHyperwarp())
        return fightNylozHyperwarp;
    return null;
};

var fightNylozInHyperspace = new Node();
fightNylozInHyperspace.checkAbort = function () {
    if (!hyperwarp.inHyperspace()) {
        if (galaxy.getPlayerSectorContents() <= 0)
            return fightNylozGalactic;
        return fightNylozCombat;
    }
    return null;
};

var fightNylozCombat = new Node();
fightNylozCombat.text = [
    "The Nyloz are here!  Chase them and shoot them down with your photons!"
];
fightNylozCombat.nag = "Go player go!  You can get them!";
fightNylozCombat.checkAbort = function () {
    if (killedNyloz)
        return tutorialFinished;
    if (damageControl.hasAnyDamage())
        return fightNylozDamaged;
    if (galaxy.getPlayerSectorContents() <= 0)
        return fightNylozGalactic;
    return null;
};

var fightNylozDamaged = new Node();
fightNylozDamaged.text = [
    "Oh no!  Your ships sustained damage.  You should dock at &diams; starbases to get your ship repaired.",
    "You <em>could</em> keep fighting though, if your 'P'hotons are still OK."
];
fightNylozDamaged.nag = "Go player go!  You can get them!";
fightNylozDamaged.checkAbort = function () {
    if (killedNyloz)
        return tutorialFinished;
    if (!damageControl.hasAnyDamage())
        return fightNylozGalactic;
};

var tutorialFinished = new Node();
tutorialFinished.text = [
    "Congrats on your first kill!  See the 'K:' indicator below.  " +
        "Keep shooting down Nyloz ships!",
    "Remember to repair and recharge at &diams; starbases, and have fun!  " +
        "Tutorial out!  You are now in NOVICE mode."
];
tutorialFinished.terminal = true;

/* The tutorial has been derailed.  */
var derailed = new Node();
derailed.text = [
    "Okay, now you aren't following the tutorial anymore.  " +
        "I assume you know what you're doing.",
    "Entering NOVICE mode.  Press [Esc]/[P] to get back to main menu."
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
    signal('gameOver', this.gameOver.bind(this));
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
Tutorial.prototype.gameOver = Tutorial.prototype.mainMenu;
Tutorial.prototype.startTutorial = function () {
    this._enabled = true;
    this._node = startNode;
    this._i = 0;
};

return new Tutorial();
});
