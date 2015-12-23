/* pilots.js - Implementation of two Nyloz pilots.  */
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
define(['signal','field'],
function(signal , field ) {

/*-----------------------------------------------------------------------------
Nyloz Engine Speeds
-----------------------------------------------------------------------------*/

var nylozZEngine = 12.6;
var nylozDirEngine = 5.9;
var nylozNudgeEngine = 3.0;

/*-----------------------------------------------------------------------------
Nyloz Ship Types
-----------------------------------------------------------------------------*/
var fighterType = {
    html: '&gt;&bull;&lt;',
    shipSize: 2.5,
    life: 1
};
var cruiserType = {
    html: '/&circ;\\',
    shipSize: 3.0,
    life: 2
};
var basestarType = {
    html: '&laquo;&diams;&raquo;',
    shipSize: 3.0,
    life: 4
};
var shipTypeDistribution = [
    fighterType, fighterType, fighterType, fighterType,
    cruiserType, cruiserType,
    basestarType
];
function randomShipType() {
    return shipTypeDistribution[
        Math.floor(Math.random() * shipTypeDistribution.length)
    ];
}

/*-----------------------------------------------------------------------------
Nyloz Photon Manager
-----------------------------------------------------------------------------*/
/*
 * The Nyloz photon manager ensures that the Nyloz
 * fire alternately as much as possible (to help
 * confuse the player's targeting, since the
 * instruments computer will target the Nyloz
 * ship that fired).
 *
 * It ensures that photons are not "wasted", since
 * only one photon is available, and the Nyloz want
 * to maximize the use of it.
 */

var nylozRefireRate = 0.5;

function PhotonManager() {
    // Array of photon objects that will indicate firing.
    this._registry = [];

    // Time before next missile is considered.
    this._delay = 0.0;

    // Direction of the last missile fired.
    this._dir = 0;

    // Scratch
    this._ar3d = [0.0, 0.0, 0.0];

    signal('enterNormal', this.enterNormal.bind(this));
    signal('update', this.update.bind(this));
}
/* Register a photon object.  */
PhotonManager.prototype.register = function (p) {
    this._registry.push(p);
    return this;
};
PhotonManager.prototype.enterNormal = function () {
    this._delay = 0.0;
    return this;
};
PhotonManager.prototype.update = function (seconds) {
    var registry = this._registry;
    var i = 0;
    var l = 0;
    var sel = null;
    var ar3d = this._ar3d;
    var flag = false;

    this._delay -= seconds;
    if (this._delay <= 0.0) {
        this._delay = 0.0;
        if (!field.isMissileValid(2)) {
            flag = true;
        } else {
            // Has the missile gone past the player?
            field.getMissilePosition(2, ar3d);
            if (ar3d[2] * this._dir > 0.0) {
                // yes, gone past.
                // A missile fired from front is given
                // a direction of -1.  As long as it is
                // in front, the product of its position
                // and its direction is negative.  If it
                // goes past the player, the product is
                // positive.
                flag = true;
            }
        }
    }

    if (flag) {
        l = registry.length;
        for (i = 0; i < l; ++i) {
            if (registry[i].isFiring()) {
                // move it to the back.
                sel = registry[i];
                registry.splice(i, 1);
                registry.push(sel);
                break;
            }
        }
        // Did one of them fire?
        if (sel) {
            // yes
            field.getBogeyPosition(sel.number(), ar3d);
            this._dir = (ar3d[2] < 0.0) ? 1 : -1;
            field.fireMissile(2, ar3d[0], ar3d[1], ar3d[2], this._dir);
            this._delay = nylozRefireRate;
            signal.raise('nylozFirePhoton', sel.number());
        }
    }

    return this;
};

var thePhotonManager = new PhotonManager();

/*-----------------------------------------------------------------------------
Nyloz Ship Photons
-----------------------------------------------------------------------------*/

function Photons(num) {
    this._num = num;
    this._firing = false;

    thePhotonManager.register(this);

    signal('enterHyperspace', this.enterHyperspace.bind(this));
    signal('killNyloz', this.killNyloz.bind(this));
}
Photons.prototype.fire = function () {
    this._firing = true; 
    return this;
};
Photons.prototype.ceasefire = function () {
    this._firing = false;
    return this;
};
Photons.prototype.isFiring = function () {
    return this._firing;
};
Photons.prototype.number = function () {
    return this._num;
};
Photons.prototype.enterHyperspace = function () {
    this._firing = false;
    return this;
};
Photons.prototype.killNyloz = function (num) {
    if (num === this._num) {
        this._firing = false;
    }
    return this;
};

/*-----------------------------------------------------------------------------
Nyloz Ship Engines
-----------------------------------------------------------------------------*/
/*
 * Nyloz have three engines:
 *   One engine only moves in the Z direction
 *     at either away, towards, or no movement
 *     relative to player.
 *   The second engine moves in one of the 6
 *     3-d directions, or no movement.
 *   The third engine is similar to the second
 *     engine, but is much slower.
 *
 * The main "Z" engine runs at speed 12.5
 *   (the "engines 6" speed of the player).
 * The secondary "Direction" engine runs
 *   at speed 7
 * The third "Nudge" engine runs at speed 2.
 */
var NONE = 0;
var XN = 1;
var XP = 2;
var YN = 3;
var YP = 4;
var ZN = 5;
var ZP = 6;
function Engines() {
    this._z = 0;
    this._dir = NONE;
    this._nudge = NONE;
}
Engines.prototype.apply = (function () {

var tb = [];
tb[NONE] = function (vec, mag) {
    vec[0] += 0.0;
    vec[1] += 0.0;
    vec[2] += 0.0;
};
tb[XP] = function (vec, mag) {
    vec[0] += mag;
    vec[1] += 0.0;
    vec[2] += 0.0;
};
tb[XN] = function (vec, mag) {
    vec[0] -= mag;
    vec[1] += 0.0;
    vec[2] += 0.0;
};
tb[YP] = function (vec, mag) {
    vec[0] += 0.0;
    vec[1] += mag;
    vec[2] += 0.0;
};
tb[YN] = function (vec, mag) {
    vec[0] += 0.0;
    vec[1] -= mag;
    vec[2] += 0.0;
};
tb[ZP] = function (vec, mag) {
    vec[0] += 0.0;
    vec[1] += 0.0;
    vec[2] += mag;
};
tb[ZN] = function (vec, mag) {
    vec[0] += 0.0;
    vec[1] += 0.0;
    vec[2] -= mag;
};
function apply(vec) {
    vec[0] = 0.0;
    vec[1] = 0.0;
    vec[2] = 0.0;
    tb[this._dir](vec, nylozDirEngine);
    tb[this._nudge](vec, nylozNudgeEngine);
    vec[2] += this._z * nylozZEngine;
    return this;
}

return apply;
})();
Engines.prototype.setZ = function (z) {
    this._z = z;
    return this;
};
Engines.prototype.getZ = function () {
    return this._z;
};
Engines.prototype.setDir = function (dir) {
    this._dir = dir;
    return this;
};
Engines.prototype.getDir = function (dir) {
    return this._dir;
};
Engines.prototype.setNudge = function (dir) {
    this._nudge = dir;
    return this;
};
Engines.prototype.getNudge = function (dir) {
    return this._nudge;
};

/*-----------------------------------------------------------------------------
Nyloz Pilot Behavior
-----------------------------------------------------------------------------*/

/* Measure distance from the player.  */
/* Should really be sqrt(x*x + y*y + z*z), but that's a little
   expensive.  */
function distance(pos) {
    var x = Math.abs(pos[0]);
    var y = Math.abs(pos[1]);
    var b = (x > y) ? x : y;
    var z = Math.abs(pos[2]);
    return (b > z) ? b : z;
}

/* State identification numbers.  */
var IDLE = 0;
var ESCAPE = 1;
var ATTACK = 2;

function Pilot(num) {
    // Bogey number.
    this._num = num;

    // Ship engines.
    this._engines = new Engines();
    // Ship photons.
    this._photons = new Photons(num);
    // Ship total life.
    this._life = 1;

    // Will the pilot shoot the player from behind?
    // (false on NOVICE and PILOT)
    this._shootFromBehind = true;
    // Does this pilot prefer to attack from behind?
    this._backstabber = false;
    // How often does the pilot think?
    this._thinkCycle = 1.0;
    // How much time before the next decision point?
    this._thinkDelay = 1.0;

    // Current major state of the pilot.
    this._state = IDLE;

    // Scratch space.
    this._ar3d = [0.0, 0.0, 0.0];

    // Create callbacks.
    this._cb_updateBogey = this._updateBogey.bind(this);
    this._cb_collideBogey = this._collideBogey.bind(this);

    // Signals.
    signal('newGame', this.newGame.bind(this));
}
/* Called by the sector manager to instantiate a random Nyloz
   craft outside the normal detection range of the player.  */
Pilot.prototype.create = function () {
    var x = 0.0;
    var y = 0.0;
    var z = 150.0;
    var shipType = null;
    var html = '';
    var shipSize = 2.5;

    // Randomize state of the Nyloz ship.
    this._state = Math.floor(Math.random() * 3);
    this._thinkDelay = Math.random() * this._thinkCycle;
    this._backstabber = Math.random() < 0.5;

    // Randomize location of the Nyloz ship.
    x = Math.random() * 100.0 - 50.0;
    y = Math.random() * 100.0 - 50.0;
    z = Math.random() * 300.0 + 121.0;
    z = (Math.random() < 0.5) ? z : -z;

    // Vary the Nyloz ship
    shipType = randomShipType();
    html = shipType.html;
    shipSize = shipType.shipSize;
    this._life = shipType.life;

    field.setBogey(this._num, x, y, z,
                   this._cb_updateBogey, this._cb_collideBogey, html,
                   shipSize);
    return this;
};
/* Called by the field manager to update the speed of the Nyloz
   craft based on its position and internal state.  */
Pilot.prototype._updateBogey = function (pos, vec, seconds) {
    this._thinkDelay -= seconds;
    if (this._thinkDelay <= 0.0) {
        this._thinkDelay = this._thinkCycle;
        this._think(pos);
    }
    this._engines.apply(vec);
    return this;
};
/* Called at each thought cycle.  */
Pilot.prototype._think = function (pos) {
    var engines = this._engines;
    var photons = this._photons;
    var dist = distance(pos);

    var ax = 0.0, ay = 0.0, az = 0.0;
    var comp = 0;
    var dir = 0;

    if (this._state === IDLE) {
        engines.setZ(0).setDir(NONE);
        photons.ceasefire();
        if (dist <= 140.0 || Math.random() < 0.4) {
            this._state = Math.floor(Math.random() * 3);
        } else if (dist <= 120.0) {
            this._state = ATTACK;
        }
    }
    // No else.  When we move from IDLE to ESCAPE or
    // ATTACK, we want the pilot to react now, not on
    // the next thought cycle.
    if (this._state === ESCAPE) {
        photons.ceasefire();
        if (dist >= 800.0) {
            // far enough away.
            this._state = IDLE;
            engines.setZ(0).setDir(NONE);
        } else if (dist <= 120.0 || Math.random () < 0.15) {
            // player caught up with us, or we got bored
            // escaping, so attack.
            this._state = ATTACK;
        } else {
            // Try to get away.  Set the Z engine to
            // go back if we're behind, go foreward
            // if we're in front.
            engines.setZ((pos[2] < 0.0) ? -1 : 1);

            // If the player is chasing us, go for more
            // Z direction.
            if (pos[2] > 0.0 && field.speed > 20.0) {
                engines.setDir(ZP);
            } else {
                // Otherwise, select X or Y coord and
                // go in the direction which increases
                // our distance.
                if (Math.random() > 0.5) {
                    // X direction.
                    engines.setDir((pos[0] > 0.0) ? XP : XN);
                } else {
                    // Y direction.
                    engines.setDir((pos[1] > 0.0) ? YP : YN);
                }
            }
        }
    }

    // If behind the player, be more aggressive.
    if (pos[2] < 0.0 && this._state !== ATTACK) {
        if (Math.random() < 0.1) {
            this._state = ATTACK;
        }
    }

    if (this._state === ATTACK) {
        /* Fire if we could hit the player.  */
        if (Math.abs(pos[0]) < 5.0 && Math.abs(pos[1]) < 5.0 &&
            (this._shootFromBehind || pos[2] > 0.0)) {
            photons.fire();
        } else {
            photons.ceasefire();
        }

        // Move the ship.
        if (!this._shootFromBehind && pos[2] < 0.0) {
            // Can't shoot from behind, so get in front.
            engines.setZ(1).setDir(ZP);
        } else if (dist > 240.0 && (Math.random() < 0.2)) {
            // Randomly escape or idle
            this._state = (Math.random() < 0.5) ? IDLE : ESCAPE;
            engines.setZ(0).setDir(0);
        } else if (dist > 50.0) {
            // Try to approach.
            engines.setZ(
                pos[2] > 0.0 ? -1 : 1
            );
            if (this._backstabber && pos[2] > 0.0) {
                // Be evasive when backstabbing and approaching from
                // the front.
                // Find whether X or Y is larger, then evade.
                ax = Math.abs(pos[0]);
                ay = Math.abs(pos[1]);
                if (ax > ay) {
                  // Evade in X direction.
                  engines.setDir(pos[0] > 0.0 ? XP : XN);
                } else {
                  // Evade in Y direction.
                  engines.setDir(pos[1] > 0.0 ? YP : YN);
                }
            } else {
                // Find which of X, Y, or Z has largest component.
                ax = Math.abs(pos[0]);
                ay = Math.abs(pos[1]);
                az = Math.abs(pos[2]);
                if (az > ay) {
                    if (ax > az) {
                        comp = 0;
                    } else {
                        comp = 2;
                    }
                } else {
                    if (ax > ay) {
                        comp = 0;
                    } else {
                        comp = 1;
                    }
                }
                if (comp === 0) {
                    engines.setDir(pos[0] > 0.0 ? XN : XP);
                } else if (comp === 1) {
                    engines.setDir(pos[1] > 0.0 ? YN : YP);
                } else {
                    engines.setDir(pos[2] > 0.0 ? ZN : ZP);
                }
            }
        } else {
            // Go with the player unless backstabbing or player
            // is idle.
            if (this._shootFromBehind && this._backstabber &&
                pos[2] > 0.0) {
                engines.setZ(-1);
            } else if (dist < 15.0) {
                /* Don't get too near to the player.  */
                if (this._shootFromBehind && this._backstabber) {
                    engines.setZ(-1);
                } else {
                    engines.setZ(1);
                }
            } else if (field.speed < 12.0) {
                engines.setZ(0);
            } else {
                engines.setZ(1);
            }
            // strafe the player.
            dir = engines.getDir();
            if ((dir === ZP && pos[2] > 10.0) ||
                (dir === ZN && pos[2] < 10.0)) {
                // Was using the Z direction, switch to strafing across.
                if (pos[0] < 0.0) {
                    dir = XP;
                } else {
                    dir = XN;
                }
            } else if (dir === XP && pos[0] > 15.0) {
                dir = XN;
            } else if (dir === XN && pos[0] < -15.0) {
                dir = XP;
            } else if (dir === YP && pos[1] > 15.0) {
                dir = YN;
            } else if (dir === YN && pos[1] < -15.0) {
                dir = YP;
            }

            // be erratic
            if (Math.random() < 0.2) {
                switch (Math.floor(Math.random() * 4)) {
                case 0: dir = XP; break;
                case 1: dir = XN; break;
                case 2: dir = YP; break;
                case 2: dir = YN; break;
                }
            }

            engines.setDir(dir);
        }
    }

    /* Nudge engines manipulation.  Set it to randomly
       go in a direction 90 degrees from the Direction
       engines, or none.  */
    dir = engines.getDir();
    if (dir === NONE) {
        engines.setNudge(NONE);
    } else {
        switch(Math.floor(Math.random() * 5)) {
        case 0: engines.setNudge(NONE); break;
        case 1:
            switch (dir) {
            case XP: case XN:
                engines.setNudge(YP); break;
            default:
                engines.setNudge(XP); break;
            }
            break;
        case 2:
            switch (dir) {
            case XP: case XN:
                engines.setNudge(YN); break;
            default:
                engines.setNudge(XN); break;
            }
            break;
        case 3:
            switch (dir) {
            case ZP: case ZN:
                engines.setNudge(YP); break;
            default:
                engines.setNudge(ZP); break;
            }
            break;
        case 4:
            switch (dir) {
            case ZP: case ZN:
                engines.setNudge(YN); break;
            default:
                engines.setNudge(ZN); break;
            }
            break;
        }
    }

    return this;
};
/* Called by the field manager when a Nyloz ship is hit by
    the player.  */
Pilot.prototype._collideBogey = function () {
    var ar3d = this._ar3d;
    var num = this._num;
    var missilePower = 0;

    field.getBogeyPosition(num, ar3d);
    /* Judge the pleyer missile's power according to the Nyloz's
       distance to the player.  */
    if (ar3d[2] < 25.0) {
        missilePower = 2;
    } else {
        missilePower = 1;
    }

    /* Damage the Nyloz ship.  */
    this._life -= missilePower;
    if (this._life <= 0) {
        field.clearBogey(num);
        signal.raise('killNyloz', num);
        /* Raising killNyloz could re-create this ship, so this
           step should be the last.  */
    }

    return this;
};
/* Called by the game loop at start of the game.  */
Pilot.prototype.newGame = function (difficulty) {
    switch (difficulty) {
    case 'NOVICE':
        this._shootFromBehind = false;
        this._thinkCycle = 0.4;
        break;
    case 'PILOT':
        this._shootFromBehind = false;
        this._thinkCycle = 0.4;
        break;
    case 'WARRIOR':
        this._shootFromBehind = true;
        this._thinkCycle = 0.35;
        break;
    case 'COMMANDER':
        this._shootFromBehind = true;
        this._thinkCycle = 0.3;
        break;
    }

    return this;
};

return [new Pilot(0), new Pilot(1)];
});
