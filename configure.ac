#                                               -*- Autoconf -*-
# Process this file with autoconf to produce a configure script.

AC_PREREQ([2.69])
AC_INIT([xsr1], [1.0], [almkglor@gmail.com])
AC_CONFIG_AUX_DIR([auxdir])
AM_INIT_AUTOMAKE([subdir-objects -Wall foreign])
AC_CONFIG_SRCDIR([xsr1-gtk.c])
AC_CONFIG_HEADERS([config.h])

# Checks for programs.
AC_PROG_CC

# Checks for libraries.
PKG_PROG_PKG_CONFIG
PKG_CHECK_MODULES([WEBKIT2GTK4], [webkit2gtk-4.0], [:], [
	AC_MSG_ERROR([dnl
Cannot find webkit2gtk-4.0 via pkg-config:

$WEBKIT2GTK4_PKG_ERRORS

Try installing libwebkit2gtk-4.0-dev for Debian-based distros.
])
])

# Checks for header files.
AC_CHECK_HEADERS([stdlib.h string.h unistd.h])

# Checks for typedefs, structures, and compiler characteristics.
AC_TYPE_SIZE_T

# Checks for library functions.
AC_CHECK_FUNCS([getcwd])

AC_CONFIG_FILES([Makefile])
AC_OUTPUT
