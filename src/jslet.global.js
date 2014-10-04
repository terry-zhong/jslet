/* ========================================================================
 * Jslet framework: jslet.global.js
 *
 * Copyright (c) 2014 Jslet Group(https://github.com/jslet/jslet/)
 * Licensed under MIT (https://github.com/jslet/jslet/LICENSE.txt)
 * ======================================================================== */

if (!jslet.rootUri) {
    var ohead = document.getElementsByTagName('head')[0], 
        uri = ohead.lastChild.src;
    uri = uri.substring(0, uri.lastIndexOf('/') + 1);
    jslet.rootUri = uri;
}
jslet.global = {
	version: '3.0.0',
	
	//Used in jslet.data.Dataset_applyChanges
	changeStateField: '_state_',
	
	//Used in jslet.data.Dataset_selected
	selectStateField: '_sel_',
	
	//Value separator
	valueSeparator: ',',
	
	debugMode: true
};
