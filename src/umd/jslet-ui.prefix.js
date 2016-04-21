/*!
 * Jslet JavaScript framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Group and other contributors
 * Released under the MIT license
 */

/* jshint ignore:start */
"use strict";
(function (root, factory) {
    if (typeof define === 'function') {
    	if(define.amd) {
	        define('jslet-ui', ['jslet-css', 'jslet-data'], factory);
	    } else {
	    	define(function(require, exports, module) {
	    		require('jslet-css');
	    		require('jslet-data');
	    		module.exports = factory();
	    	});
	    }
    } else {
    	factory();
    }
})(this, function () {
/* jshint ignore:end */
