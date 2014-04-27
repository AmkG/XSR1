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
var numStarbases = require('numStarbases');
var panel = require('panel');
var shield = require('shield');
var signal = require('signal');
var vars = require('vars');
var viewControl = require('viewControl');

/* Number of starbases remaining.  */
var starbasesRemaining = 0;
/* Number of enemies remaining.  */
var enemiesRemaining = 0;

/* Set when game ended.  */
var endedFlag = false;

/* The message and rank to send.  */
var finalMessage = '';
var finalRank = '';
var finalPosthumous = false;
/* Duration between messages.  */
var durationMessage = 18.0;
/* Remaining duration.  */
var time = 0.0;

/* Figure out the player's rank.  */
function getRank() {
    // TODO: implement scoring and ranking.
    return "(ranking not yet implemented)";
}

/* Inform all units about the player's failure or victory.  */
function toAll(happened, posthumous) {
    finalMessage = happened;
    finalPosthumous = posthumous;
    finalRank = getRank();
    time = 0.0;
}
/* Actually send the message.  */
function sendMessageToAll() {
    console .
    writeWait("IRATAN MISSION CONTROL TO ALL UNITS:") .
    writeWait(finalMessage) .
    writeWait(finalPosthumous ? "Posthumous rank is:" : "Rank is:") .
    writeWait("&nbsp; &nbsp; &nbsp; " + finalRank) .
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
    toAll("Star Rider 7 destroyed by Nyloz fire.", true);
    gameOver();
}

function gameOver() {
    endedFlag = true;
    signal.raise('gameOver');
}

function newGame(difficulty) {
    starbasesRemaining = numStarbases[difficulty];
    enemiesRemaining = starbasesRemaining * 9;
    endedFlag = false;
}

function nylozKillStarbase() {
    --starbasesRemaining;
    enemiesRemaining += 2; // Nyloz create 2 new ships from the debris
    checkStarbases();
}
function playerDestroyStarbase() {
    --starbasesRemaining;
    checkStarbases();
}
function checkStarbases() {
    if (starbasesRemaining === 0) {
        toAll("Iratan starbases eliminated, Iratan Federation surrenders", false);
        viewControl.fore();
        gameOver();
    }
}
function killNyloz() {
    --enemiesRemaining;
    if (enemiesRemaining === 0) {
        toAll("Nyloz navy eliminated, Nyloz Regime surrenders", false);
        viewControl.fore();
        gameOver();
    }
}

function update(seconds) {
    if (endedFlag) {
        time -= seconds;
        if (time <= 0.0) {
            time += durationMessage;
            sendMessageToAll();
        }
    } else {
        if (vars.energy.toString() === '0000') {
            shipDestroy();
            toAll("Star Rider 7 self-destructed due to lack of energy", true);
            gameOver();
        }
    }
}

signal('nylozKillPlayer', deathByNyloz);
signal('nylozKillStarbase', nylozKillStarbase);
signal('playerDestroyStarbase', playerDestroyStarbase);
signal('killNyloz', killNyloz);
signal('update', update);

signal('newGame', newGame);

return gameOver;
});
