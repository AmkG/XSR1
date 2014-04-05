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
define(  ['field', 'resize', 'console', 'keys', 'menu', 'engines'],
function ( field ,  resize ,  console,   keys ,  menu ,  engines) {

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
    .write('XSR1, an Atari Star Raiders Clone')
    .write('Copyright &copy; 2014 Alan Manuel K. Gloria')
    .write('License GPLv3+: GNU GPL version 3 or later')
    .write('This game is free software: ' +
        'you are free to change and redistribute it.'
    )
    .write('There is NO WARRANTY, ' +
        'to the extent permitted by law.'
    )
    .write('&nbsp;')
    .write('Written By Alan Manuel K. Gloria')
    ;
    menu.show(menuItems);

    field.viewFront();

    engines.initialize().setSpeed(6);
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
    difficulty = ndifficulty;
    update = gameplayUpdate;
    console.clear().write('Greetings XSR1.');
}
function gameplayUpdate(seconds) {
    engines.update(seconds);
    field.update(seconds);
    console.update(seconds);
    keys.update();

    navigate();
    playerView();
    switch (keys.key) {
    case '\e':
    case 'p':
    case 'P':
        enterPause();
        break;
    }
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

/* Convert keyboard controls to engine controls.  */
function navigate() {
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

    if ('0' <= keys.key && keys.key <= '9') {
        engines.setSpeed(parseInt(keys.key));
    }
}

/* Switch views.  */
function playerView() {
    if (keys.key === 'a' || keys.key === 'A') {
        field.viewAft();
    } else if (keys.key === 'f' || keys.key === 'F') {
        field.viewFront();
    }
    // TODO: LRS
}

/* Render.  */
function allRender() {
    field.render();
    console.render();
    menu.render();
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
