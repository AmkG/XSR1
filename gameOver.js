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

/* Difficulty setting.  */
var difficulty = '';

/* Ranking components.  */
var m = 0; // Mission completed/aborted, starship deestroyed.

var mWin = {
    "NOVICE": 80,
    "PILOT": 76,
    "WARRIOR": 60,
    "COMMANDER": 111
};
var mLost = {
    "NOVICE": 60,
    "PILOT": 60,
    "WARRIOR": 50,
    "COMMANDER": 100
};
var mDestroyed = {
    "NOVICE": 40,
    "PILOT": 50,
    "WARRIOR": 40,
    "COMMANDER": 90
};

/* Number of opponents destroyed.  */
var enemiesDestroyed = 0;
var starbasesByPlayer = 0;
var starbasesByNyloz = 0;

/* Amount of energy consumed.  */
var energyConsumed = 0;

function won() {
    m = mWin[difficulty];
}
function lost() {
    m = mLost[difficulty];
}

/* Ranking table.  */
var rankingTable = [
    { rank: 'ROOKIE',           min: 48,    max: 79 },
    { rank: 'NOVICE',           min: 80,    max: 111 },
    { rank: 'ENSIGN',           min: 112,   max: 143 },
    { rank: 'PILOT',            min: 144,   max: 175 },
    { rank: 'ACE',              min: 176,   max: 191 },
    { rank: 'LIEUTENANT',       min: 192,   max: 207 },
    { rank: 'WARRIOR',          min: 208,   max: 223 },
    { rank: 'CAPTAIN',          min: 224,   max: 239 },
    { rank: 'COMMANDER',        min: 240,   max: 271 },
    { rank: 'STAR COMMANDER',   min: 272,   max: 303 }
];
var failRanks = ["GARBAGE SCOW CAPTAIN", "GALACTIC COOK"];

/* Figure out the player's rank.  */
function getRank() {
    var score = 0;
    var rank = '';
    var classN = 0;
    var classD = 0;
    var entry = null;

    var i = 0;
    var l = 0;

    // Generate the string.
    function returnRank() {
        if (classN < 1) {
            classN = 1;
        } else if (classN > 5) {
            classN = 5;
        }
        return rank + " CLASS " + classN.toString();
    }

    // Compute the score.
    score = m + (6 * enemiesDestroyed) - Math.floor(energyConsumed / 256) -
            galaxy.getDateMaj() - (18 * starbasesByNyloz) - (3 * starbasesByPlayer);

    // Is the player a complete failure?
    if (score < rankingTable[0].min) {
        rank = failRanks[Math.floor(Math.random() * failRanks.length)];
        classD = rankingTable[0].min / 5;
        classN = Math.floor(score / classD) + 1;
        return returnRank();
    }

    l = rankingTable.length;
    for (i = 0; i < l; ++i) {
        entry = rankingTable[i];
        if (entry.min <= score && score <= entry.max) {
            rank = entry.rank;
            classD = (entry.max - entry.min) / 5;
            classN = 5 - Math.floor((score - entry.min) / classD);
            return returnRank();
        }
    }

    // If we reached this point, the player is even better
    // than we expected.
    rank = rankingTable[rankingTable.length - 1].rank;
    classN = 5;
    return returnRank();
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

    m = mDestroyed[difficulty];
}

/* Handle being killed by Nyloz.  */
function deathByNyloz() {
    lost();
    shipDestroy();
    toAll("Star Rider 7 destroyed by Nyloz fire.", true);
    gameOver();
}

function gameOver() {
    endedFlag = true;
    signal.raise('gameOver');
}

function newGame(ndifficulty) {
    difficulty = ndifficulty;
    starbasesRemaining = numStarbases[ndifficulty];
    enemiesRemaining = starbasesRemaining * 9;
    endedFlag = false;

    enemiesDestroyed = 0;
    starbasesByPlayer = 0;
    starbasesByNyloz = 0;
    energyConsumed = 0;
}

function nylozKillStarbase() {
    --starbasesRemaining;
    ++starbasesByNyloz;
    enemiesRemaining += 2; // Nyloz create 2 new ships from the debris
    checkStarbases();
}
function playerDestroyStarbase() {
    --starbasesRemaining;
    ++starbasesByPlayer;
    checkStarbases();
}
function checkStarbases() {
    if (starbasesRemaining === 0) {
        lost();
        toAll("Iratan starbases eliminated, Iratan Federation surrenders", false);
        viewControl.fore();
        gameOver();
    }
}
function killNyloz() {
    --enemiesRemaining;
    ++enemiesDestroyed;
    if (enemiesRemaining === 0) {
        won();
        toAll("Nyloz navy eliminated, Nyloz Regime surrenders", false);
        viewControl.fore();
        gameOver();
    }
}

function energyConsume(v) {
    energyConsumed += v;
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
            lost();
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
signal('energyConsume', energyConsume);
signal('update', update);

signal('newGame', newGame);

return gameOver;
});
