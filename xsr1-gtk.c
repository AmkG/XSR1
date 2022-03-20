/* xsr1-gtk.c - Wraps XSR1 in a WebKitGtk widget.  */
/* XSR1, a clone of 1979 Atari Star Raiders
 * Copyright (C) 2022  Alan Manuel K. Gloria
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
#ifdef HAVE_CONFIG_H
# include "config.h"
#endif

#include <gtk/gtk.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <webkit2/webkit2.h>

static char const* alloc_getcwd(void) {
	size_t size;
	char *cwd;
	char *ncwd;

	size = 1024;
	cwd = malloc(size);
	if (!cwd)
		return NULL;

	for (;;) {
		ncwd = getcwd(cwd, size);
		if (ncwd)
			return cwd;

		size = size * 2;
		ncwd = realloc(cwd, size);
		if (!ncwd) {
			free((void*) cwd);
			return NULL;
		}
		cwd = ncwd;
	}
}

static char const* index_html = "/index.html";

/* Returns an index.html file in the current directory.  */
static char const* cwd_index_html(void) {
	char const* cwd;
	size_t cwd_len;
	size_t index_html_len;
	char* path;

	cwd = alloc_getcwd();
	if (!cwd)
		return NULL;

	cwd_len = strlen(cwd);
	index_html_len = strlen(index_html);
	path = malloc(cwd_len + index_html_len + 1);
	if (!path) {
		free((void*) cwd);
		return NULL;
	}

	/* Concatenate.  */
	strcpy(path, cwd);
	strcat(path, index_html);

	free((void*) cwd);

	return path;
}

/* Return an index.html file in the PKGDATADIR.  */
static char const* pkgdatadir_index_html(void) {
#if !defined(PKGDATADIR)
	return NULL;
#else
	char* path;
	path = malloc(strlen(PKGDATADIR) + strlen(index_html) + 1);
	if (!path)
		return NULL;

	/* Concatenate.  */
	strcpy(path, PKGDATADIR);
	strcat(path, index_html);

	return path;
#endif
}

/* The first few lines of our index.html.  */
static char const* index_html_start =
"<!DOCTYPE html>\n<html>\n<head>\n<meta charset=utf-8>\n<title>XSR1</title>"
;
/* Checks if the given index.html file is correct.  */
static int is_correct_index_html(char const* path) {
	FILE* fpath = NULL;
	int result;
	size_t index_html_start_len;
	char* starttext = NULL;
	size_t starttext_len;

	result = 0;

	fpath = fopen(path, "r");
	if (!fpath)
		return 0;

	/* Allocate a buffer.  */
	index_html_start_len = strlen(index_html_start);
	starttext = malloc(index_html_start_len);
	if (!starttext)
		goto end;

	/* Read the initial few lines.  If file too short,
	 * fail.  */
	starttext_len = fread(starttext, 1, index_html_start_len, fpath);
	if (starttext_len != index_html_start_len)
		goto end;

	/* Check the initial few lines match.  */
	result = strncmp(starttext, index_html_start,
			 index_html_start_len) == 0;

end:
	if (starttext)
		free((void*) starttext);
	if (fpath)
		fclose(fpath);
	return result;
}

/* Looks for our index.html file.  */
static char const* find_index_html(void) {
	char const* the_index_html;

	/* Check for one in the CWD.  */
	the_index_html = cwd_index_html();
	if (the_index_html) {
		if (is_correct_index_html(the_index_html))
			return the_index_html;
		free((char*) the_index_html);
	}

	/* Check for one in the pkgdatadir.  */
	the_index_html = pkgdatadir_index_html();
	if (the_index_html) {
		if (is_correct_index_html(the_index_html))
			return the_index_html;
		free((char*) the_index_html);
	}

	return NULL;
}

static char const* url_prefix = "file://";
/* Looks for the URL to load into the webkitgtk widget.  */
static char const* find_start_url(void) {
	size_t url_prefix_len;
	char const* index_html;
	size_t index_html_len;
	char* url;

	index_html = find_index_html();
	/* Not found?  */
	if (!index_html)
		return NULL;

	/* Allocate space for the URL.  */
	url_prefix_len = strlen(url_prefix);
	index_html_len = strlen(index_html);
	url = malloc(url_prefix_len + index_html_len + 1);
	if (!url) {
		free((void*) index_html);
		return NULL;
	}

	/* Concatenate URL.  */
	strcpy(url, url_prefix);
	strcat(url, index_html);

	/* Free up the path.  */
	free((void*) index_html);

	return url;
}

/*****************************************************************************/

static void close_window(GtkWidget* _, GtkWidget* __) {
	gtk_main_quit();
}
static gboolean destroy_browser(WebKitWebView* _, GtkWidget* window) {
	gtk_widget_destroy(window);
	return TRUE;
}

int main(int argc, char** argv) {
	int exit_code = 1;
	char const* start_url = NULL;

	gtk_init(&argc, &argv);

	if (argc > 1) {
		if ((0 == strcmp(argv[1], "--version")) ||
		    (0 == strcmp(argv[1], "-V"))) {
#if defined(PACKAGE_VERSION)
			printf("XSR1 %s\n", PACKAGE_VERSION);
#else
			printf("XSR1 Unknown version\n");
#endif
			printf("Copyright (C) 2014,2015,2022 Alan Manuel K. Gloria\n"
			       "This is free software; see the source for copying conditions.  There is NO\n"
			       "warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.\n\n");
			return 0;
		}
		if ((0 == strcmp(argv[1], "--help")) ||
		    (0 == strcmp(argv[1], "-H"))) {
			printf("Usage: xsr1-gtk [--help|--version]\n");
			printf("Report bugs to: <almkglor@gmail.com>\n");
			return 0;
		}
		fprintf(stderr, "%s: Unrecognized option: %s\n",
			argv[0], argv[1]);
		return 1;
	}

	start_url = find_start_url();
	if (!start_url) {
		fprintf(stderr, "%s: Cannot find index.html for XSR1\n",
			argv[0]);
		goto end;
	}

	/* Webkit-GTK.  */
	{
		GtkWidget* window;
		WebKitWebView* browser;

		/* Build the window.  */
		window = gtk_window_new(GTK_WINDOW_TOPLEVEL);
		gtk_window_set_title(GTK_WINDOW(window), "XSR1");
		gtk_window_set_default_size(GTK_WINDOW(window), 800, 600);
		gtk_window_maximize(GTK_WINDOW(window));
		g_signal_connect(window, "destroy", G_CALLBACK(&close_window), NULL);

		/* Build the browser.  */
		browser = WEBKIT_WEB_VIEW(webkit_web_view_new());
		g_signal_connect(browser, "close", G_CALLBACK(&destroy_browser), window);
		webkit_web_view_load_uri(browser, start_url);

		/* Put the browser in the window.  */
		gtk_container_add(GTK_CONTAINER(window), GTK_WIDGET(browser));
		gtk_widget_grab_focus(GTK_WIDGET(browser));

		/* Launch.  */
		gtk_widget_show_all(window);
		gtk_main();
	}

	exit_code = 0;

end:
	if (start_url)
		free((void*) start_url);
	return exit_code;
}
