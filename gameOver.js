/* gameOver.js - Handles game-ending states.  */
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
define(function(require) {

var computer = require('computer');
var console = require('console');
var engines = require('engines');
var field = require('field');
var galaxy = require('galaxy');
var panel = require('panel');
var shield = require('shield');
var signal = require('signal');
var viewControl = require('viewControl');

/* Figure out the player's rank.  */
function getRank() {
    // TODO: implement scoring and ranking.
    return "(ranking not yet implemented)";
}

/* Inform all units about the player's failure or victory.  */
function toAll(happened, posthumous) {
    console .
    writeWait("IRATAN MISSION CONTROL TO ALL UNITS:") .
    writeWait("Star Raider 7 " + happened) .
    writeWait(posthumous ? "Posthumous rank is:" : "Rank is:") .
    writeWait("&nbsp; &nbsp; &nbsp; " + getRank()) .
    writeWait("&nbsp").writeWait("&nbsp").writeWait("&nbsp") .
    writeWait("(Press [ESC] to return to main menu)");
}

/* Handle ship destruction.  */
function shipDestroy() {
    viewControl.fore();
    panel.hide();
    shield.disable();
    computer.attack.disable();
    computer.instruments.autotrackDisable();
    engines.fix().setSpeed(0);

    field.explosion(0.0, 0.0, 0.0);
}

/* Handle being killed by Nyloz.  */
function deathByNyloz() {
    shipDestroy();
    toAll("destroyed by Nyloz fire.", true);
    gameOver();
}

function gameOver() {
    signal.raise('gameOver');
}

/* TODO: other game over conditions.  */
signal('nylozKillPlayer', deathByNyloz);

return gameOver;
});
