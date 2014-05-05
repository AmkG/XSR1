/* console.js - Handles a nice communication console.  */
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

var brightStep = 0.08;
var betweenLines = 1.5;

/* Represents one console line.  */
function Line(html) {
    this.bright = 1.0;
    this.html = html;
    this.dom = null;
}

/* Creates a container for the console.  */
function makeContainerDom() {
    var rv;
    rv = document.createElement('main');
    rv.id = 'console';
    document.body.appendChild(rv);
    return rv;
}
/* Creates a container for a line.  */
function makeLineDom(parent, html) {
    var rv;
    rv = document.createElement('div');
    rv.innerHTML = html;
    parent.appendChild(rv);
    return rv;
}

/* Computes an brightness value into a CSS opacity.  */
function bright2opacity(bright) {
    return bright.toString();
}

function Console() {
    this._todelete = [];
    this._displayed = [];
    this._toshow = [];
    this._dom = null;
    this._time = 0.0;

    signal('update', this.update.bind(this));
    signal('render', this.render.bind(this));
}
Console.prototype.writeWait = function (html) {
    this._toshow.push(html);
    return this;
};
Console.prototype.write = function (html) {
    this._displayed.push(new Line(html));
    return this;
};
Console.prototype.update = function (seconds) {
    var step = brightStep * seconds;
    var e;
    var i;
    var l;
    /* Fade each of the existing entries.  */
    l = this._displayed.length;
    for (i = 0; i < l; ++i) {
        e = this._displayed[i];
        e.bright -= step;
        if (e.bright < 0.0) {
            e.bright = 0.0;
        }
    }
    /* Can we load a new entry?  */
    if (this._time !== 0.0) {
        this._time -= seconds;
        if (this._time < 0.0) {
            this._time = 0.0;
        }
    } else {
        if (this._toshow.length !== 0) {
            e = this._toshow.shift();
            this._displayed.push(new Line(e));
            this._time = betweenLines;
        }
    }
    return this;
};
Console.prototype.render = function () {
    var i;
    var l;
    var e;

    /* First, remove children that are to be deleted.  */
    if (this._todelete.length > 0) {
        if (this._dom) {
            l = this._todelete.length;
            for (i = 0; i < l; ++i) {
                if (this._todelete[i].dom) {
                    this._dom.removeChild(this._todelete[i].dom);
                }
            }
        }
        this._todelete.length = 0;
    }

    /* Then, update rendering of displayed items.*/
    if (this._displayed.length > 0) {
        if (!this._dom) {
            this._dom = makeContainerDom();
        }
        l = this._displayed.length;
        for (i = 0; i < l; ++i) {
            e = this._displayed[i];
            if (e.bright <= 0.0) {
                if (e.dom) {
                    this._dom.removeChild(e.dom);
                }
                this._displayed.splice(i, 1);
                --i;
                --l;
            } else {
                if (!e.dom) {
                    e.dom = makeLineDom(this._dom, e.html);
                }
                e.dom.style.opacity = bright2opacity(e.bright);
            }
        }
    }
    return this;
};
Console.prototype.clear = function () {
    var i;
    var l;
    var tmp;
    this._toshow.length = 0;
    if (this._displayed.length > 0) {
        if (this._todelete.length === 0) {
            /* For speed, just swap displayed and todelete.  */
            tmp = this._todelete;
            this._todelete = this._displayed;
            this._displayed = tmp;
        } else {
            l = this._displayed.length;
            for (i = 0; i < l; ++i) {
                this._todelete.push(this._displayed[i]);
            }
            this._displayed.length = 0;
        }
    }
    return this;
};

return new Console();
});
