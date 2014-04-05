/* menu.js - Handle menus.  */
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
define(['resize', 'keys', 'console'], function (resize, keys, console) {

/*
menu.initialize()
- Initialize the menu system.

opt = menu.update()
- Check for keys and change the menu.
- Returns the empty string if nothing is chosen,
  otherwise returns the string of the item
  selected.
- If an item is selected, the menu is automatically
  hidden.

menu.render()
- Actually update the screen to the current
  state of the menu.

menu.show(['item', 'item2'])
- Display the menu with the given items.
*/

function Option (text) {
    this.text = text;
    this.dom = null;
}

function createMainDom() {
    var rv = document.createElement('main');
    rv.id = 'menu';
    document.body.appendChild(rv);
    return rv;
}
function createOptionDom(parent, text) {
    var rv = document.createElement('div');
    rv.appendChild(document.createTextNode(text));
    parent.appendChild(rv);
    return rv;
}

function Menu() {
    /* Current state.  */
    this._display = false;
    this._selection = -1;
    this._options = [];

    /* For deletion.  */
    this._todelete = [];

    /* Rendered state.  */
    this._dom = null;
}
Menu.prototype.initialize = function () {
    /* Nothing!  */
};
Menu.prototype.update = function () {
    var rv = '';
    if (this._display) {
        switch (keys.key) {
        case 'up':
            this._selection--;
            if (this._selection < 0) {
                this._selection = this._options.length - 1;
            }
            break;
        case 'down':
            this._selection++;
            if (this._selection >= this._options.length) {
                this._selection = 0;
            }
            break;
        case '\n':
        case '\r':
        case ' ':
            rv = this._options[this._selection].text;
            this._clear();
            break;
        }
    }
    return rv;
};
Menu.prototype.show = function (opts) {
    var i;
    var l;
    this._clear();
    l = opts.length;
    if (l !== 0) {
        this._display = true;
        for (i = 0; i < l; ++i) {
            this._options.push(new Option(opts[i]));
        }
    }
    this._selection = 0;
    return this;
};
Menu.prototype.render = function () {
    var i;
    var l;
    var e;

    var y;

    l = this._todelete.length;
    if (l > 0) {
        if (this._dom) {
            for (i = 0; i < l; ++i) {
                if (this._todelete[i].dom) {
                    this._dom.removeChild(this._todelete[i].dom);
                }
            }
        }
        this._todelete.length = 0;
    }

    if (this._display) {
        if (!this._dom) {
            this._dom = createMainDom();
        }
        this._dom.style.display = 'block';
        this._dom.style.fontSize = Math.floor(resize.height / 16) + 'px';

        // Center the menu
        y = resize.ceny - (this._dom.offsetHeight / 2);
        this._dom.style.top = Math.floor(y) + 'px';

        l = this._options.length;
        for (i = 0; i < l; ++i) {
            e = this._options[i];
            if (!e.dom) {
                e.dom = createOptionDom(this._dom, e.text);
            }
            if (this._selection === i) {
                e.dom.className = 'select';
            } else {
                e.dom.className = '';
            }
        }

    } else {
        if (this._dom) {
            this._dom.style.display = 'none';
        }
    }

    return this;
};

Menu.prototype._clear = function () {
    var i;
    var l;
    var tmp;

    this._display = false;
    if (this._options.length !== 0) {
        if (this._todelete.length === 0) {
            tmp = this._options;
            this._options = this._todelete;
            this._todelete = tmp;
        } else {
            l = this._options.length;
            for (i = 0; i < l; ++i) {
                this._todelete.push(this._options[i]);
            }
            this._options.length = 0;
        }
    }
};

return new Menu();
});
