bin_PROGRAMS = xsr1-gtk

nobase_dist_pkgdata_DATA = \
computer.js \
console.js \
COPYING \
COPYING.html \
damageControl.js \
engines.js \
extern/COPYING \
extern/es5-sham.min.js \
extern/es5-shim.min.js \
extern-nw.js \
extern/require.js \
field.js \
galaxy.js \
game.css \
gameOver.js \
help.css \
help.html \
help-preload.css \
hyperwarp.js \
images/computer-cursor.png \
images/computer-lockon.png \
images/crosshair-aft.png \
images/crosshair-fore.png \
images/galchart.png \
images/lrs.png \
images/nyloz-basestar.png \
images/nyloz-cruiser.png \
images/nyloz-fighter.png \
images/repair-bot-only.png \
images/starbase-destroyed.png \
images/starbase-only.png \
images/starbase-saved.png \
images/starbase-surrounded.png \
images/XSR1.png \
index.html \
keys.js \
label.js \
loop.js \
lrs.js \
main.js \
menu.js \
numStarbases.js \
panel.js \
photons.js \
pilots.js \
playerControl.js \
resize.js \
sector.js \
shield.js \
signal.js \
tutorial.js \
vars.js \
viewControl.js \
warpCosts.js

applicationsdir = $(datadir)/applications
applications_DATA = xsr1-gtk.desktop
dist_noinst_DATA = xsr1-gtk.desktop.in
CLEANFILES = $(applications_DATA)

xsr1-gtk.desktop : xsr1-gtk.desktop.in Makefile config.status
	sed -e 's@\@bindir\@@$(bindir)@' -e 's@\@pkgdatadir\@@$(pkgdatadir)@' < $(srcdir)/xsr1-gtk.desktop.in > $@

AM_CPPFLAGS = -DPKGDATADIR='"$(pkgdatadir)"'
AM_CFLAGS = -Wall -Werror $(WEBKIT2GTK4_CFLAGS)
LDADD = $(WEBKIT2GTK4_LIBS)
