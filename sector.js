/* sector.js - Handles actual contents of the sector in normal space.  */
/**
 *
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2014, 2022  Alan Manuel K. Gloria
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
define(['signal','galaxy','field','console','pilots'],
function(signal , galaxy , field , console , pilots) {

/*
 * This file manages the player's experience within a sector.
 * It generates starbases and enemy Nyloz craft.
 */

/*-----------------------------------------------------------------------------
Starbase Behavior
-----------------------------------------------------------------------------*/

function Starbase() {
    this.onupdate = this._onupdate.bind(this);
    this.oncollide = this._oncollide.bind(this);
    this.onbotupdate = this._onbotupdate.bind(this);
    this.onbotcollide = this._onbotcollide.bind(this);
    /* Status if docked or not.  */
    this.docked = false;
    /* Docking sequence completed.  */
    this._finished = false;
    /* Time since repair bot finished docking.  */
    this._bottime = 0.0;
}
Starbase.prototype.html = "&ndash;=&equiv;=&ndash;";
Starbase.prototype.sizeFactor = 3.0;
Starbase.prototype.create = function (x, y, z) {
    this.docked = false;
    this._finished = false;
    field.setBogey(0, x, y, z, this.onupdate, this.oncollide, this.html,
        this.sizeFactor
    );
    return this;
};
/* Behavior of star bases.  */
Starbase.prototype._onupdate = function (pos, vec, seconds) {
    var ndocked = true;
    ndocked = field.speed === 0.0 &&
        (0.0 < pos[2] && pos[2] < 6.0) &&
        (-0.5 < pos[0] && pos[0] < 0.5) &&
        (-0.5 < pos[1] && pos[1] < 0.5) &&
        (field.yaw === 0) &&
        (field.pitch === 0);

    if (!this._finished) {
        /* On initiate of docking.  */
        if (ndocked && !this.docked) {
            console.write('Docking initiated.');
            field.setBogey(1,
                pos[0] + 0.4, pos[1] + 0.4, 5.0,
                this.onbotupdate, this.onbotcollide, this.bothtml,
                this.botsizeFactor
            );
        }
        /* On breaking-off of docking.  */
        if (!ndocked && this.docked) {
            console.write('Docking aborted.');
            field.clearBogey(1);
        }
    }

    vec[0] = 0.0;
    vec[1] = 0.0;
    vec[2] = 0.0;

    this.docked = ndocked;
    return this;
};
/* Reaction to being hit.  */
Starbase.prototype._oncollide = function () {
    field.clearBogey(0);
    signal.raise('playerDestroyStarbase');
    return this;
};
/* Resupply bot.  */
Starbase.prototype.bothtml = "[&deg;]";
Starbase.prototype.botsizeFactor = 0.15;
Starbase.prototype._onbotupdate = function (pos, vec, seconds) {
    vec[0] = 0.0;
    vec[1] = 0.0;
    if (!this._finished) {
        vec[2] = -0.2;
        if (pos[2] <= 0.1) {
            console.write("Repair and recharge completed.");
            signal.raise('fix');
            this._finished = true;
            this._bottime = 0.0;
        }
    } else {
        this._bottime += seconds;
        vec[2] = 0.4;
        if (pos[2] >= 5.0 || this._bottime > 6.0) {
            field.clearBogey(1);
        }
    }
};
Starbase.prototype._onbotcollide = function () {
    field.clearBogey(1);
};

var starbase = new Starbase();

/*-----------------------------------------------------------------------------
Sector Manager
-----------------------------------------------------------------------------*/

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
    /* Number of enemies in the sector.  */
    this._numNyloz = 0;
    /* Recreation information.  When a Nyloz is destroyed in the
       current sector, we need to recreate it (unless the sector
       has no more extra Nyloz).  To encourage the instruments
       computer to switch targets, we must defer recreation for
       an update cycle.  */
    this._recreate = -1;
    this._deferRecreate = false;

    signal('enterHyperspace', this.enterHyperspace.bind(this));
    signal('enterNormal', this.enterNormal.bind(this));
    signal('nylozKillStarbase', this.nylozKillStarbase.bind(this));
    signal('killNyloz', this.killNyloz.bind(this));
    signal('update', this.update.bind(this));
}
Sector.prototype.enterHyperspace = function () {
    field.clearBogeysAndMissiles();
    this._numNyloz = 0;
    this._recreate = -1;
    this._deferRecreate = false;
    return this;
};
Sector.prototype.enterNormal = function () {
    var sector = galaxy.getPlayerSectorContents();
    var ar3d = this._ar3d;

    this._recreate = -1;
    if (sector === -1) {
        randomLocation(ar3d);
        starbase.create(ar3d[0], ar3d[1], ar3d[2]);
    } else if (sector === 0) {
        field.clearBogeysAndMissiles();
    } else {
        console.write("<font color=#ff0000><b>WARNING: Nyloz craft detected.</b></font>");
        this._numNyloz = sector;
        pilots[0].create();
        if (sector > 1) {
            pilots[1].create();
        }
    }
    this._recreate = -1;
    this._deferRecreate = false;
    return this;
};
Sector.prototype.nylozKillStarbase = function (sector) {
    var ar3d = null;
    if (sector === galaxy.getPlayerSector()) {
        // The nyloz destroyed the starbase.  Explode it
        // and recreate the scenario.
        ar3d = this._ar3d;
        field.getBogeyPosition(0, ar3d);
        field.explosion(ar3d[0], ar3d[1], ar3d[2]);
        field.clearBogey(0);
        field.clearBogey(1);
        // By the time this function is called, the galactic
        // model should have 2 enemies in the sector.  Just
        // reuse the existing code.
        this.enterNormal();
    }
    return this;
};
/* When the player kills a Nyloz, update the number of enemies
   currently in the sector and create a replacement if
   necessary.  */
Sector.prototype.killNyloz = function (num) {
    --this._numNyloz;
    if (this._numNyloz > 1) {
        // Only recreate if there are *still* more than
        // 1 ship.
        this._recreate = num;
        this._deferRecreate = true;
    }
};
/* Handle recreation during update.  */
Sector.prototype.update = function () {
    if (this._deferRecreate) {
        this._deferRecreate = false;
        return this;
    }
    if (this._recreate >= 0) {
        pilots[this._recreate].create();
        this._recreate = -1;
    }
    return this;
};

// TODO: asteroids

var sector = new Sector();
sector.starbase = starbase;

return sector;
});
