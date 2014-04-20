/* fields.js - Object that handles a 3D field containing stars,
       up to two bogeys, up to two player missiles, and up to
       one enemy missile.  */
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
define(['resize', 'signal'], function (resize, signal) {
"use strict";

var numStars = 24; // number
var starSizeFactor = 4; // pixel factor

var turnSpeed = 0.4; // radians per second

var missileSpeed = 75.0; // metrons per second
var missileLifetime = 1.8; // seconds
var missileSizeFactor = 4; // pixel factor

var speedFactor = 2.5; // multiplier for base speed.
/* Note: Although the original game claims the velocity
   setting is metrons per second, and the range is in
   metrons, checking videos of the original game
   suggests that there is a factor between 2 or 3 applied
   to the velocity.  For instance, moving to a starbase
   at 12.5 (engines key 6) removes about 50 to 60 metrons
   from the range value in about 2 seconds.  */

var actualMissileSpeed = missileSpeed * speedFactor;

/* Observer distance factor.  Not in the original game.
   (or, more properly, 1 in the original game, but not
   added to the z-coordinate)
   However, needed in order to reduce strange visual
   effects of rotation in the original game.
   In the original game, x2d and y2d are just (x3d / z3d)
   and (y3d / z3d), respectively.  With observer distance,
   it's (ez * xrd / (zrd + ez)), ditto with y.  */
var ez = 2.0;

/* LRS maximum distance.  */
var lrsDistance = 400.0;
/* LRS object size.  */
var lrsSizeConst = 0.25 / 25.0;

var lrsLimit = lrsDistance * 2.0;

/* Number of debris elements to emit.  */
var numDebris = 20;
/* Speed of debris.  */
var debrisSpeed = 4.0;
var actualDebrisSpeed = debrisSpeed * speedFactor;
/* Time debris stays on the field.  */
var debrisTime = 5.0;

/* Size of bogeys and missiles.  */
var bogeySize = 1.0;
var missileSize = 0.5;

function nullFun() { }

/* Location class.  */
function Loc() {
    this.display = false;
    this.pos = [0.1, 0.1, 0.1];
    /* DOM object of this item.  */
    this.dom = null;
};

/* Class for enemies, asteroids, starbases, etc.  */
function Bogey() {
    this.loc = new Loc();
    this.vec = [0.0, 0.0, 0.0];
    this.onupdate = nullFun;
    this.oncollideMissile = nullFun;
    this.html = '&middot;';
    this.sizeFactor = starSizeFactor;
}
Bogey.prototype.clear = function () {
    this.loc.display = false;
    this.onupdate = nullFun;
    this.oncollideMissile = nullFun;
    return this;
};
Bogey.prototype.set = function (x, y, z,
                                onupdate, oncollideMissile, html,
                                sizeFactor) {
    var loc = this.loc;
    var pos = loc.pos;
    var vec = this.vec;
    loc.display = true;
    if (loc.dom) {
        loc.dom.innerHTML = html;
    }
    pos[0] = x;
    pos[1] = y;
    pos[2] = z;
    vec[0] = 0.0;
    vec[1] = 0.0;
    vec[2] = 0.0;
    this.onupdate = onupdate;
    this.oncollideMissile = oncollideMissile;
    this.html = html;
    this.sizeFactor = sizeFactor;
    return this;
};

/* Class for missiles.  */
function Missile(direction, enemy) {
    this.loc = new Loc();
    this.direction = direction; // +1.0 or -1.0
    this.lifetime = missileLifetime;
    this.enemy = enemy;
}

/* Class for debris.  */
function Debris() {
    this.loc = new Loc();
    this.vec = [0.0, 0.0, 0.0];
}
Debris.prototype.set = function (x, y, z) {
    var loc = this.loc;
    var pos = loc.pos;
    var vec = this.vec;
    pos[0] = x;
    pos[1] = y;
    pos[2] = z;
    vec[0] = Math.random() * 2 - 1.0;
    vec[1] = Math.random() * 2 - 1.0;
    vec[2] = Math.random() * 2 - 1.0;
    loc.display = true;
    return this;
};

/*-----------------------------------------------------------------------------
Projections
-----------------------------------------------------------------------------*/

/* View constants.  */
var FRONT = 'front';
var AFT = 'aft';
var LRS = 'lrs';

/* Fore-view projection.  */
function fore(pos2d, pos) {
    var z;
    var bz;
    z = pos[2];
    if (z < 0.0) {
        return false;
    }
    bz = ez + z;
    pos2d[0] = (ez * pos[0]) / bz;
    pos2d[1] = (ez * pos[1]) / bz;
    return true;
}
function foreLimit(pos) {
    return pos[2] <= 120.0;
}
function foreSize(loc, sizeFactor) {
    return sizeFactor / loc.pos[2];
}
var foreMin = [-100.1, -100.1, 0.01];
var foreMax = [100.1, 100.1, 140.01];

/* Aft-view projection.  */
function aft(pos2d, pos) {
    var z;
    var bz;
    z = pos[2];
    if (z > 0.0) {
        return false;
    }
    bz = z - ez;
    pos2d[0] = -(ez * pos[0]) / bz;
    pos2d[1] = -(ez * pos[1]) / bz;
    return true;
}
function aftLimit(pos) {
    return pos[2] >= -120.0;
}
function aftSize(loc, sizeFactor) {
    return -sizeFactor / loc.pos[2];
}
var aftMin = [-100.1, -100.1, -140.01];
var aftMax = [100.1, 100.1, -0.01];

/* LRS projection.  */
function lrs(pos2d, pos) {
    if (pos[0] < -lrsLimit || pos[0] > lrsLimit ||
        pos[2] < -lrsLimit || pos[2] > lrsLimit) {
        return false;
    }

    pos2d[0] = pos[0] / lrsDistance;
    pos2d[1] = -pos[2] / lrsDistance;
    return true;
}
function lrsLimitF(pos) {
    return true;
}
function lrsSize(loc, sizeFactor) {
    return lrsSizeConst * sizeFactor;
}
var lrsMin = [-lrsLimit, -lrsLimit, -lrsLimit];
var lrsMax = [lrsLimit, lrsLimit, lrsLimit];

/*-----------------------------------------------------------------------------
Collision check.
-----------------------------------------------------------------------------*/

function collides(pos1, size1, pos2, size2) {
    var ss = size1 + size2;
    var x = Math.abs(pos1[0] - pos2[0]);
    var y = Math.abs(pos1[1] - pos2[1]);
    var z = Math.abs(pos1[2] - pos2[2]);
    return x < ss && y < ss && z < ss;
}

/*-----------------------------------------------------------------------------
Support functions
-----------------------------------------------------------------------------*/

/* Gets a random number between lo and hi.  */
function randomIn(lo, hi) {
    return lo + (hi - lo) * Math.random();
}
/* Creates the DOM for the field and attaches it.  */
function createFieldDom() {
    var rv = document.createElement('main');
    rv.id = 'field';
    document.documentElement.appendChild(rv);
    return rv;
}
/* Creates a DOM for an item and attaches it to the given
   field dom.  */
function createItemDom(fieldDom) {
    var rv = document.createElement('span');
    fieldDom.appendChild(rv);
    return rv;
}

/*-----------------------------------------------------------------------------
Loc projection
-----------------------------------------------------------------------------*/

/* Projects a given Loc item.  */
function project(field, loc, html, className, sizeFactor) {
    var ar2d = field._ar2d;
    var dom;
    var scale;
    var size;
    var maxsize;
    var x;
    var y;

    dom = loc.dom;
    if (!loc.display) {
        if (dom) {
            dom.style.display = 'none';
        }
        return;
    }

    ar2d.display = field._limit(loc.pos);
    if (ar2d.display) {
        ar2d.display = field._project(ar2d.pos, loc.pos);
    }
    if (ar2d.display) {
        // displayed
        if (!dom) {
            dom = loc.dom = createItemDom(field._dom);
            dom.innerHTML = html;
            dom.className = className;
        }
        dom.style.display = 'block';

        scale = resize.scale;
        maxsize = resize.maxsize;

        size = field._size(loc, sizeFactor) * scale;
        if (size < 1) {
            size = 1;
        } else if (size > maxsize) {
            size = maxsize;
        }
        dom.style.fontSize = Math.floor(size) + 'px';

        if (field.mirror) {
            ar2d.pos[1] = -ar2d.pos[1];
        }

        x = ar2d.pos[0] * scale + resize.cenx;
        y = ar2d.pos[1] * scale + resize.ceny;
        dom.style.left = Math.floor(x) + 'px';
        dom.style.top = Math.floor(y) + 'px';

    } else {
        // not displayed
        if (dom) {
            dom.style.display = 'none';
        }
    }
}

/*-----------------------------------------------------------------------------
Loc update
-----------------------------------------------------------------------------*/

/* Compute rotation.  */
function computeRotation(sinRot, cosRot, ar3d, yaw, pitch) {
    if (yaw < 0) {
        ar3d[0] = (cosRot * ar3d[0]) - ((-sinRot) * ar3d[2]);
        ar3d[2] = ((-sinRot) * ar3d[0]) + (cosRot * ar3d[2])
    } else if (yaw > 0) {
        ar3d[0] = (cosRot * ar3d[0]) - (sinRot * ar3d[2]);
        ar3d[2] = (sinRot * ar3d[0]) + (cosRot * ar3d[2])
    }

    if (pitch < 0) {
        ar3d[1] = (cosRot * ar3d[1]) - ((-sinRot) * ar3d[2]);
        ar3d[2] = ((-sinRot) * ar3d[1]) + (cosRot * ar3d[2])
    } else if (pitch > 0) {
        ar3d[1] = (cosRot * ar3d[1]) - (sinRot * ar3d[2]);
        ar3d[2] = (sinRot * ar3d[1]) + (cosRot * ar3d[2])
    }
}
/* Update a Loc.  */
function updateLoc(loc, mov, isRot, sinRot, cosRot, yaw, pitch) {
    var pos = loc.pos;
    pos[2] -= mov;
    if (isRot) {
        computeRotation(sinRot, cosRot, pos, yaw, pitch);
    }
}

/*-----------------------------------------------------------------------------
Field
-----------------------------------------------------------------------------*/

/* Field constructor.  */
function Field() {
    var i;

    this._stars = [];
    this._stars.length = numStars;
    for (i = 0; i < numStars; ++i) {
        this._stars[i] = new Loc();
    }

    this._bogey0 = new Bogey();
    this._bogey1 = new Bogey();

    /* 0, 1: player missiles.  2: enemy missile.  */
    this._missiles = [];
    this._missiles.length = 3;
    this._missiles[0] = new Missile(1.0, false);
    this._missiles[1] = new Missile(1.0, false);
    this._missiles[2] = new Missile(1.0, true);

    /* Debris from explosion.  */
    this._debrisTime = 0.0;
    this._clearDebris = false;
    this._debris = [];
    this._debris.length = numDebris;
    for (i = 0; i < numDebris; ++i) {
        this._debris[i] = new Debris();
    }

    /* DOM container of all field items.  */
    this._dom = null;

    /* Scratch space.  */
    this._ar2d = {display: false, pos: [0.1, 0.1]};

    /* View properties.  */
    this._project = nullFun;
    this._size = null;
    this._min = null;
    this._max = null;

    /* Speed of the player through the field.  */
    this.speed = 0.0;
    /* Rotation of the player.  */
    this.yaw = 0;
    this.pitch = 0;
    /* Display by default.  */
    this.display = true;
    /* Whether to mirror the y axis (Mostly used in LRS damaged state).  */
    this.mirror = false;

    /* Current view.  */
    this.currentView = '';

    /* Register.  */
    signal('update', this.update.bind(this));
    signal('render', this.render.bind(this));
    signal('mainMenu', this.mainMenu.bind(this));

    this.viewFront();
}
Field.prototype.viewFront = function () {
    this._project = fore;
    this._limit = foreLimit;
    this._size = foreSize;
    this._min = foreMin;
    this._max = foreMax;
    if (this.currentView !== FRONT) {
        this.currentView = FRONT;
        this.generateStars();
    }
    return this;
};
Field.prototype.viewAft = function () {
    this._project = aft;
    this._limit = aftLimit;
    this._size = aftSize;
    this._min = aftMin;
    this._max = aftMax;
    if (this.currentView !== AFT) {
        this.currentView = AFT;
        this.generateStars();
    }
    return this;
};
Field.prototype.viewLRS = function () {
    this._project = lrs;
    this._limit = lrsLimitF;
    this._size = lrsSize;
    this._min = lrsMin;
    this._max = lrsMax;
    if (this.currentView !== LRS) {
        this.currentView = LRS;
        this.generateStars();
    }
    return this;
};
/* Compute the 2-d projection of the 3-d point.
   Return false if cannot be projected (for example
   in Fore view but the position is aft).
   Does not write pos, writes to pos2d.  */
Field.prototype.project = function (pos2d, pos) {
    return this._project(pos2d, pos);
};
/* Fire missile.  */
Field.prototype.fireMissile = function (id, x, y, z, dir) {
    var missiles = this._missiles;
    var missile = missiles[id];
    var loc = missile.loc;
    var pos = loc.pos;

    loc.display = true;
    pos[0] = x;
    pos[1] = y;
    pos[2] = z;
    missile.direction = dir;
    missile.lifetime = missileLifetime;

    return this;
};
/* Clear the field of all bogeys and missiles.  */
Field.prototype.clearBogeysAndMissiles = function () {
    var i;
    var missiles = this._missiles;
    this._bogey0.clear();
    this._bogey1.clear();
    for (i = 0; i < 3; ++i) {
        missiles[i].loc.display = false;
        missiles[i].lifetime = 0.0;
    }
    return this;
};
/* Create a bogey in the field, with the behavior function
   onupdate and the collision event oncollide.  */
Field.prototype.setBogey = function (i, x, y, z,
                                     onupdate, oncollide, html,
                                     sizeFactor) {
    var bogey = null;
    if (i === 0) {
        bogey = this._bogey0;
    } else if (i === 1) {
        bogey = this._bogey1;
    }
    bogey.set(x, y, z, onupdate, oncollide, html, sizeFactor);
    return this;
};
/* Remove the indicated bogey from the field.  */
Field.prototype.clearBogey = function (i) {
    var bogey = null;
    if (i === 0) {
        bogey = this._bogey0;
    } else if (i === 1) {
        bogey = this._bogey1;
    }
    bogey.clear()
    return this;
};
/* Get the location of the indicated bogey.  */
Field.prototype.getBogeyPosition = function (i, ar3d) {
    var bogey = null;
    var pos = null;
    if (i === 0) {
        bogey = this._bogey0;
    } else if (i === 1) {
        bogey = this._bogey1;
    }
    pos = bogey.loc.pos;
    ar3d[0] = pos[0];
    ar3d[1] = pos[1];
    ar3d[2] = pos[2];
    return this;
};
/* Determine if the given bogey is valid.  */
Field.prototype.isBogeyValid = function (i) {
    var bogey = null;
    if (i === 0) {
        bogey = this._bogey0;
    } else if (i === 1) {
        bogey = this._bogey1;
    }
    return bogey.loc.display;
}
/* Cause an explosion on the field.  */
Field.prototype.explosion = function (x, y, z) {
    var i;
    var debris = this._debris;
    for (i = 0; i < numDebris; ++i) {
        debris[i].set(x, y, z);
    }
    this._clearDebris = false;
    this._debrisTime = debrisTime;
    return this;
};
/* Re-generate stars on the field.  */
Field.prototype.generateStars = function () {
    var stars = this._stars;
    var min = this._min;
    var max = this._max;
    var pos;
    var i;
    for (i = 0; i < numStars; ++i) {
        stars[i].display = true;
        pos = stars[i].pos;
        pos[0] = randomIn(min[0], max[0]);
        pos[1] = randomIn(min[1], max[1]);
        pos[2] = randomIn(min[2], max[2]);
    }

    return this;
};
Field.prototype.update = function (seconds) {
    var mov = this.speed * seconds * speedFactor;
    var debrismov = 0.0;
    var stars = this._stars;
    var missiles = this._missiles;
    var debris = null;
    var debris1 = null;
    var vec = null;
    var bogey = null;
    var missile = null;
    var loc = null;
    var pos = null;
    var vec = null;
    var min = this._min;
    var max = this._max;
    var i = 0;

    var isRot = false;
    var rot = 0.0;
    var sinRot = 0.0;
    var cosRot = 0.0;

    if (this.yaw !== 0 || this.pitch !== 0) {
        rot = seconds * turnSpeed;
        sinRot = Math.sin(rot);
        cosRot = Math.cos(rot);
        isRot = true;
    }

    /* Update stars.  */
    for (i = 0; i < numStars; ++i) {
        updateLoc(stars[i], mov, isRot, sinRot, cosRot, this.yaw, this.pitch);
        pos = stars[i].pos;

        /* Regenerate star if it goes out of range.  */
        if (pos[2] < min[2]) {
            pos[2] = pos[2] + (max[2] - min[2]);
            pos[0] = randomIn(min[0], max[0]);
            pos[1] = randomIn(min[1], max[1]);
        } else if (pos[2] > max[2]) {
            pos[2] = pos[2] - (max[2] - min[2]);
            pos[0] = randomIn(min[0], max[0]);
            pos[1] = randomIn(min[1], max[1]);
        } else if (pos[0] < min[0]) {
            pos[0] = pos[0] + (max[0] - min[0]);
            pos[1] = randomIn(min[1], max[1]);
            pos[2] = randomIn(min[2], max[2]);
        } else if (pos[0] > max[0]) {
            pos[0] = pos[0] - (max[0] - min[0]);
            pos[1] = randomIn(min[1], max[1]);
            pos[2] = randomIn(min[2], max[2]);
        } else if (pos[1] < min[1]) {
            pos[1] = pos[1] + (max[1] - min[1]);
            pos[0] = randomIn(min[0], max[0]);
            pos[2] = randomIn(min[2], max[2]);
        } else if (pos[1] > max[1]) {
            pos[1] = pos[1] - (max[1] - min[1]);
            pos[0] = randomIn(min[0], max[0]);
            pos[2] = randomIn(min[2], max[2]);
        }
    }

    /* Update bogeys.  */
    bogey = this._bogey0;
    loc = bogey.loc;
    if (loc.display) {
        updateLoc(loc, mov, isRot, sinRot, cosRot, this.yaw, this.pitch);
    }
    bogey = this._bogey1;
    loc = bogey.loc;
    if (loc.display) {
        updateLoc(loc, mov, isRot, sinRot, cosRot, this.yaw, this.pitch);
    }

    for (i = 0; i < 3; ++i) {
        missile = missiles[i];
        loc = missile.loc;
        if (loc.display) {
            updateLoc(loc, mov, isRot, sinRot, cosRot, this.yaw, this.pitch);
            /* Missiles move!  */
            loc.pos[2] += missile.direction * actualMissileSpeed * seconds;
            missile.lifetime -= seconds;
            if (missile.lifetime <= 0.0) {
                missile.lifetime = 0.0;
                loc.display = false;
            }
        }
    }

    /* Debris.  */
    if (this._debrisTime > 0.0) {
        this._debrisTime -= seconds;
        if (this._debrisTime <= 0.0) {
            this._debrisTime = 0.0;
            this._clearDebris = true;
        } else {
            /* Handle debris field.  */
            debris = this._debris;
            debrismov = actualDebrisSpeed * seconds;
            for (i = 0; i < numDebris; ++i) {
                debris1 = debris[i];
                loc = debris1.loc;
                vec = debris1.vec;
                pos = loc.pos;
                updateLoc(loc, mov, isRot, sinRot, cosRot,
                    this.yaw, this.pitch
                );
                /* Radiate out from the center.  */
                pos[0] += vec[0] * debrismov;
                pos[1] += vec[1] * debrismov;
                pos[2] += vec[2] * debrismov;
            }
        }
    }

    /* Bogey behavior.  */
    for (i = 0; i < 2; ++i) {
        if (i === 0) {
            bogey = this._bogey0;
        } else {
	    bogey = this._bogey1;
        }
        loc = bogey.loc;
        if (loc.display) {
            pos = loc.pos;
            vec = bogey.vec;
            bogey.onupdate.call(bogey.onupdate,
                pos, vec, seconds
            );
            pos[0] += vec[0] * speedFactor * seconds;
            pos[1] += vec[1] * speedFactor * seconds;
            pos[2] += vec[2] * speedFactor * seconds;
        }
    }

    /* Missile collision check.  */
    if (missiles[2].loc.display) {
        /* Missile-to-missile.  */
        for (i = 0; i < 2; ++i) {
            missile = missiles[i];
            pos = missile.loc.pos;
            if (missile.loc.display &&
                collides(pos, missileSize,
                    missiles[2].loc.pos, missileSize)) {
                this.explosion(pos[0], pos[1], pos[2]);
                missile.loc.display = false;
                missiles[2].loc.display = false;
                break;
            }
        }
        /* TODO: missile to player.  */
    }
    /* Missile-to-bogey.  */
    for (i = 0; i < 2; ++i) {
        missile = missiles[i];
        loc = missile.loc;
        if (loc.display) {
            pos = loc.pos;
            if (this._bogey0.loc.display &&
                collides(pos, missileSize,
                         this._bogey0.loc.pos, bogeySize)) {
                pos = this._bogey0.loc.pos;
                this.explosion(pos[0], pos[1], pos[2]);
                loc.display = false;
                this._bogey0.oncollideMissile();
            } else if (this._bogey1.loc.display &&
                collides(pos, missileSize,
                         this._bogey1.loc.pos, bogeySize)) {
                pos = this._bogey1.loc.pos;
                this.explosion(pos[0], pos[1], pos[2]);
                loc.display = false;
                this._bogey1.oncollideMissile();
            }
        }
    }
    return this;
};
Field.prototype.render = function () {
    var stars = this._stars;
    var missiles = this._missiles;
    var debris = null;
    var loc = null;
    var item;
    var pos;
    var size;
    var i;

    if (!this.display) {
        if (this._dom) {
            this._dom.style.display = 'none';
        }
        return this;
    }

    if (!this._dom) {
        this._dom = createFieldDom();
    }
    this._dom.style.display = 'block';

    for (i = 0; i < numStars; ++i) {
        project(this, stars[i], '&middot;', 'star', starSizeFactor);
    }
    for (i = 0; i < 3; ++i) {
         // '&#9679;'
         project(this, missiles[i].loc, '&#10042;', 'photon',
             missileSizeFactor
         );
    }
    project(this, this._bogey0.loc, this._bogey0.html, 'bogey',
        this._bogey0.sizeFactor
    );
    project(this, this._bogey1.loc, this._bogey1.html, 'bogey',
        this._bogey1.sizeFactor
    );

    if (this._debrisTime > 0.0) {
        /* Debris shown.  */
        debris = this._debris;
        for (i = 0; i < numDebris; ++i) {
            project(this, debris[i].loc, '&middot;', 'debris', starSizeFactor);
        }
    } else {
        /* No debris.  */
        if (this._clearDebris) {
            /* Just changed state from shown to hidden, so
               clear them all.  */
            debris = this._debris;
            for (i = 0; i < numDebris; ++i) {
                loc = debris[i].loc;
                if (loc.dom) {
                    loc.dom.style.display = 'none';
                }
            }
        }

        this._clearDebris = false;
    }

    return this;
};
Field.prototype.mainMenu = function () {
    var missiles = this._missiles;
    var i;
    /* Clear missiles and bogeys.  */
    for (i = 0; i < 3; ++i) {
        missiles[i].loc.display = false;
    }
    this._bogey0.loc.display = false;
    this._bogey1.loc.display = false;

    this.yaw = 0;
    this.pitch = 0;
    this.display = true;
    this.viewFront();
    this.generateStars();
    return this;
};

return new Field();
});
