/* sector.js - Handles actual contents of the sector in normal space.  */
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
define(['signal','galaxy','field'],
function(signal , galaxy , field) {

/*
 * This file manages the player's experience within a sector.
 * It generates starbases and enemy Nyloz craft.
 */

/* Behavior of star bases.  */
function starbaseUpdate() {
    // TODO: if starbase is near enough, initiate docking sequence.
}
function starbaseCollideMissile() {
    field.clearBogey(0);
    signal.raise('playerDestroyStarbase');
}
var starbaseHTML = "&ndash;=&equiv;=&ndash;";

/* Generate a random location that isn't very near
   to the player.  */
function randZ() {
    var abs = 120.0 + Math.random() * 500.0;
    return (Math.random() < 0.5) ? abs : -abs;
}
function randomLocation(ar3d) {
    ar3d[0] = Math.random() * 100.0 - 50.0;
    ar3d[1] = Math.random() * 100.0 - 50.0;
    ar3d[2] = randZ();
}

/* Sector experience manager.  */
function Sector() {
    /* Temporary array.  */
    this._ar3d = [0.0, 0.0, 0.0];

    signal('enterHyperspace', this.enterHyperspace.bind(this));
    signal('enterNormal', this.enterNormal.bind(this));
}
Sector.prototype.enterHyperspace = function () {
    field.clearBogeysAndMissiles();
    return this;
};
Sector.prototype.enterNormal = function () {
    var sector = galaxy.getPlayerSectorContents();
    var ar3d = this._ar3d;
    if (sector === -1) {
        randomLocation(ar3d);
        field.setBogey(0,
            ar3d[0], ar3d[1], ar3d[2],
            starbaseUpdate, starbaseCollideMissile, starbaseHTML
        );
    } else if (sector === 0) {
        field.clearBogeysAndMissiles();
    } else {
        // TODO: create enemy Nyloz craft
    }
};

return new Sector();
});
