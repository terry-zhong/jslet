/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

"use strict";
if (!jslet.data) {
	jslet.data = {};
}

jslet.data.XPorter = function() {
	this._excelXPorter = null;
	
}

jslet.data.XPorter.prototype = {
	excelXPorter: function(xporter) {
		if(xporter === undefined) {
			return this._excelXPorter || jslet.data.XLSXXPorter;
		}
		this._excelXPorter = xporter;
	}
	
};

jslet.data.defaultXPorter = new jslet.data.XPorter();