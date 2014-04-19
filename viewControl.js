/* viewControl.js - Handles the current view.  */
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
define(['field','lrs','panel','label','galaxy','signal'],
function(field , lrs , panel , label , galaxy , signal) {

var gchart = galaxy.chart;

function aft() {
    label('AFT VIEW');
    panel.show().setNormalPanel();
    field.viewAft();
    field.display = true;
    lrs.hide();
    gchart.hide();
}
function fore() {
    label('');
    panel.show().setNormalPanel();
    field.viewFront();
    field.display = true;
    lrs.hide();
    gchart.hide();
}
function flrs() {
    label('LONG RANGE SCAN');
    panel.show().setNormalPanel();
    lrs.show();
    gchart.hide();
}
function chart() {
    label('GALACTIC CHART');
    panel.show().setGalacticChartPanel();
    field.display = false;
    lrs.hide();
    gchart.show();
}

signal('setViewFront', fore);
signal('setViewAft', aft);

return {
    "aft": aft,
    "fore": fore,
    "lrs": flrs,
    "chart": chart
};
});
