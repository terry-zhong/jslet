/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * Cookie Utils
 */
"use strict";
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
		return window.unescape(document.cookie.substring(len, end));
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
		document.cookie = name + '=' + window.escape(value) +
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
		if (jslet.getCookie(name)) document.cookie = name + '=' +
			((path) ? ';path=' + path : '') +
			((domain) ? ';domain=' + domain : '') +
			';expires=Thu, 01-Jan-1970 00:00:01 GMT';
	};
}