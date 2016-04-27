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
	        define('jslet-data', ['jslet-locale', 'jquery'], factory);
	    } else {
	    	define(function(require, exports, module) {
	    		var locale = require('jslet-locale');
	    		var jQuery = require('jquery');
	    		module.exports = factory(locale, jQuery);
	    	});
	    }
    } else {
    	factory();
    }
})(this, function (locale, jQuery) {
/* jshint ignore:end */
	if (window.jslet === undefined || jslet === undefined){
		/**
		 * Root object/function of jslet framework. Example:
		 * <pre><code>
		 * var jsletObj = jslet('#tab');
		 * </code></pre>
		 * @param {String} Html tag id, like '#id'
		 * 
		 * @return {Object} jslet object of the specified Html tag
		 */
	    window.jslet = function(id){
	        var ele = jQuery(id)[0];
	        return (ele && ele.jslet) ? ele.jslet : null;
	    };
	}

	jslet.locale = locale;
