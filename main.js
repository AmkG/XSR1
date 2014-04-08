/* main.js - main source.  */
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
define(function (require) {

var field = require('field');
var resize = require('resize');
var console = require('console');
var keys = require('keys');
var menu = require('menu');
var engines = require('engines');
var panel = require('panel');
var vars = require('vars');
var label = require('label');
var shield = require('shield');
var signal = require('signal');

var update;

var difficulty = '';

function stopDefault(e) {
    e = e || window.event;
    e.preventDefault();
    e.stopPropagation();
}

function realMain() {
    // register mousedown on event capture.
    window.addEventListener('mousedown', stopDefault, true);

    resize.initialize();
    keys.initialize();
    menu.initialize();
    engines.initialize();

    setInterval(updateAll, 40);
    enterMainMenu();
}

var menuItems = ['NOVICE', 'PILOT', 'WARRIOR', 'COMMANDER', 'HELP'];
if (typeof process !== 'undefined') {
    menuItems.push('EXIT');
}

function enterMainMenu() {
    console
    .clear()
    .writeWait('XSR1, an Atari Star Raiders Clone')
    .writeWait('Copyright &copy; 2014 Alan Manuel K. Gloria')
    .writeWait('License GPLv3+: GNU GPL version 3 or later')
    .writeWait('This game is free software: ' +
        'you are free to change and redistribute it.'
    )
    .writeWait('There is NO WARRANTY, ' +
        'to the extent permitted by law.'
    )
    .writeWait('&nbsp;')
    .writeWait('Written By Alan Manuel K. Gloria')
    ;
    menu.show(menuItems);

    field.viewFront().generateStars();

    engines.initialize().setSpeed(6);

    panel.hide();

    vars.clear();

    label('XSR1');

    shield.disable();

    update = mainMenuUpdate;
}
/* Update state.  */
function mainMenuUpdate(seconds) {
    var opt;
    console.update(seconds);
    keys.update();
    engines.update(seconds);
    field.update(seconds);

    opt = menu.update();
    if (opt !== '') {
        switch(opt) {
        case 'EXIT':
            process.exit(0);
            break;
        case 'HELP':
            window.location.href = 'help.html';
            return;
        default:
            enterGameplay(opt);
            return;
        }
    }
}

function enterGameplay(ndifficulty) {
    fixAll();

    difficulty = ndifficulty;
    update = gameplayUpdate;

    console.clear().write('Greetings XSR1.');
    panel.show();
    vars.clear();
    label('');
}
function gameplayUpdate(seconds) {
    signal.update(seconds);

    // Life support energy consumption.
    vars.energy.consume(0.25 * seconds);

    // Player controls.
    playerControl();
}

function enterPause() {
    update = pauseUpdate;
    console.write('Game Paused.');
    menu.show(['RESUME GAME', 'EXIT TO MAIN MENU']);
}
function pauseUpdate(seconds) {
    var opt;
    console.update(seconds);
    keys.update();
    opt = menu.update();
    if (opt !== '') {
        if (opt === 'RESUME GAME') {
            update = gameplayUpdate;
            console.write('Game Resumed.');
        } else {
            enterMainMenu();
        }
    }
}

/* Fix all problems of the ship.  */
function fixAll() {
    engines.fix();
    shield.fix();
}

/* Player control.  */
function playerControl() {
    var yaw = 0;
    var pitch = 0;
    if (keys.left) {
        --yaw;
    }
    if (keys.right) {
        ++yaw;
    }
    if (keys.down) {
        --pitch;
    }
    if (keys.up) {
        ++pitch;
    }
    field.pitch = pitch;
    field.yaw = yaw;

    switch (keys.key) {
    case '\e':
    case 'p':
    case 'P':
        enterPause();
        break;
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
        engines.setSpeed(parseInt(keys.key));
        break;
    case 'a':
    case 'A':
        label('AFT VIEW');
        panel.show();
        field.viewAft();
        break;
    case 'f':
    case 'F':
        label('');
        panel.show();
        field.viewFront();
        break;
    case 's':
    case 'S':
        if (shield.isEnabled()) {
            console.write('Shields Disabled.');
            shield.disable();
        } else {
            console.write('Shields Enabled.');
            shield.enable();
        }
        break;
    }
}

/* Render.  */
function allRender() {
    signal.render();
}

function updateAll() {
    update(0.040);
    allRender();
    //requestAnimationFrame(allRender);
}

/*-----------------------------------------------------------------------------
Initialization
-----------------------------------------------------------------------------*/

function main() {
    function nullFun() { }

    function onDOMContentLoaded() {
        document.removeEventListener('DOMContentLoaded', onDOMContentLoaded, false);
        window.removeEventListener('load', onDOMContentLoaded, false);
        document.onreadystatechange = nullFun;
        realMain();
    }
    function onreadystatechange() {
        if (document.readyState === 'complete') {
            onDOMContentLoaded();
        }
    }

    if (document.readyState === 'complete') {
        realMain();
    } else {
        document.addEventListener('DOMContentLoaded', onDOMContentLoaded, false);
        window.addEventListener('load', onDOMContentLoaded, false);
        document.onreadystatechange = onreadystatechange;
    }

}

return main;
});
