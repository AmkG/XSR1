/* loop.js - main game loop.  */
/**
 *
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2014, 2015, 2022, 2024  Alan Manuel K. Gloria
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
define( ['signal','keys','field','menu','engines','console','label','tutorial'],
function (signal , keys , field , menu , engines , console , label , tutorial) {
"use strict";

/*-----------------------------------------------------------------------------
Main Menu
-----------------------------------------------------------------------------*/

var haveExit = false;

var menuItems = ['TUTORIAL', 'NOVICE', 'PILOT', 'WARRIOR', 'COMMANDER',
    'HELP'];
if (typeof process !== 'undefined' || typeof document.isWebKitGtk !== 'undefined') {
    menuItems.push('EXIT');
    haveExit = true;
}

/* Main menu update.  */
function mainMenuUpdate(seconds) {
    var opt;
    console.update(seconds);
    keys.update();
    engines.update(seconds);
    field.update(seconds);

    /* We do not know when the xsr1-gtk wrapper will actually
     * be able to inject this flag, so also check it in the
     * update.  */
    if (!haveExit && typeof document.isWebKitGtk !== 'undefined') {
        menuItems.push('EXIT');
        menu.show(menuItems);
        haveExit = true;
    }

    opt = menu.update();
    if (opt !== '') {
        switch(opt) {
        case 'EXIT':
            /* Try to exit by node-webkit.  */
            if (typeof process !== 'undefined')
		    process.exit(0);
            /* Try to exit by xsr1-gtk.  */
            document.title = "EXIT";
            window.close();
            break;
        case 'HELP':
            window.location.href = 'help.html';
            loop.enterMainMenu();
            return;
        case 'TUTORIAL':
            loop.enterGameplay('NOVICE');
            signal.raise('startTutorial');
            return;
        default:
            loop.enterGameplay(opt);
            return;
        }
    }
}

/*-----------------------------------------------------------------------------
Gameplay
-----------------------------------------------------------------------------*/

var difficulty = '';

function gameplayUpdate(seconds) {
    signal.update(seconds);
}

/*-----------------------------------------------------------------------------
Pause State
-----------------------------------------------------------------------------*/

var pauseItems = ['RESUME GAME', 'EXIT TO MAIN MENU'];

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
            loop.enterMainMenu();
        }
    }
}

/*-----------------------------------------------------------------------------
Loop
-----------------------------------------------------------------------------*/

var update = null;

/* Function called regularly.  */
function repeat() {
    update(0.020);
    signal.render();
}

/*-----------------------------------------------------------------------------
Export Interface.
-----------------------------------------------------------------------------*/

function loop () {
    loop.enterMainMenu();
    setInterval(repeat, 20);
}
/*
 * down: &#9660;
 * up: &#9650;
 * right: &#9654;
 * left: &#9664;
 */
loop.enterMainMenu = function () {
    console
    .clear()
    .writeWait('XSR1, a clone of 1979 Atari Star Raiders')
    .writeWait('Copyright &copy; 2014, 2015, 2022, 2024 Alan Manuel K. Gloria')
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
    label('XSR1');
    menu.show(menuItems);
    signal.raise('mainMenu');
    update = mainMenuUpdate;
};
loop.enterGameplay = function (ndifficulty) {
    difficulty = ndifficulty;
    signal.raise('newGame', ndifficulty);
    update = gameplayUpdate;
    console.clear().write('Greetings XSR1.');
    label('');
};
loop.enterPause = function () {
    update = pauseUpdate;
    console.write('Game Paused.');
    menu.show(pauseItems);
};

return loop;
});
