/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * Cookie Utils
 */
if(!jslet.getCookie){
	/**
	 * Get cookie value with cookie name. Example:
	 * <pre><code>
	 * console.log(jslet.getCookie('name'));
	 * </code></pre>
	 * 
	 * @param {String} name Cookie name
	 * @return {String} Cookie value
	 */
	jslet.getCookie = function(name) {
		var start = document.cookie.indexOf(name + '=');
		var len = start + name.length + 1;
		if ((!start) && (name != document.cookie.substring(0, name.length))) {
			return null;
		}
		if (start == -1){
			return null;
		}
		var end = document.cookie.indexOf(';', len);
		if (end == -1){
			end = document.cookie.length;
		}
		return unescape(document.cookie.substring(len, end));
	};
}

if (!jslet.setCookie){
	/**
	 * Set cookie. Example:
	 * <pre><code>
	 * jslet.setCookie('name', 'value', 1, '/', '.foo.com', true);
	 * </code></pre>
	 * 
	 * @param {String} name Cookie name
	 * @param {String} value Cookie value
	 * @param {String} expires Cookie expires(day)
	 * @param {String} path Cookie path
	 * @param {String} domain Cookie domain
	 * @param {Boolean} secure Cookie secure flag
	 * 
	 */
	jslet.setCookie = function(name, value, expires, path, domain, secure) {
		var today = new Date();
		today.setTime(today.getTime());
		if (expires) {
			expires = expires * 1000 * 60 * 60 * 24;
		}
		var expires_date = new Date(today.getTime() + (expires));
		document.cookie = name + '=' + escape(value) +
			((expires) ? ';expires=' + expires_date.toGMTString() : '') + //expires.toGMTString()
			((path) ? ';path=' + path : '') +
			((domain) ? ';domain=' + domain : '') +
			((secure) ? ';secure' : '');
	};
}
if (!jslet.deleteCookie){
	/**
	 * Delete specified cookie. Example:
	 * <pre><code>
	 * jslet.deleteCookie('name', '/', '.foo.com');
	 * </code></pre>
	 * 
	 * @param {String} name Cookie name
	 * @param {String} name Cookie path
	 * @param {String} name Cookie domain
	 * 
	 */
	jslet.deleteCookie = function(name, path, domain) {
		if (getCookie(name)) document.cookie = name + '=' +
			((path) ? ';path=' + path : '') +
			((domain) ? ';domain=' + domain : '') +
			';expires=Thu, 01-Jan-1970 00:00:01 GMT';
	};
}