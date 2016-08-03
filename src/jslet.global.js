/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

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

if (!jslet.rootUri) {
    var ohead = window.document.getElementsByTagName('head')[0], 
        uri = ohead.lastChild.src;
    if(uri) {
	    uri = uri.substring(0, uri.lastIndexOf('/') + 1);
	    jslet.rootUri = uri;
    }
}
jslet.global = {
	version: '3.0.0',
	
	//Used in jslet.data.Dataset_applyChanges
	changeStateField: 'rs',
	
	//Used in jslet.data.Dataset_selected
	selectStateField: '_sel_',
	
	auditLogField: 'al',
	
	//Value separator
	valueSeparator: ',',
	
	defaultRecordClass: null,
	
	defaultFocusKeyCode: 9,
	
	defaultCharWidth: 12,
	
	debugMode: true
};

/**
 * Global server error handler
 * 
 * @param {String} errCode, error code
 * @param {String} errMsg,  error message
 * 
 * @return {Boolean} Identify if handler catch this error, if catched, the rest handler will not process it.
 */
jslet.global.serverErrorHandler = function(errCode, errMsg) {
	return false;
};

/**
 * Global event handler for jQuery.ajax, you can set settings here.
 * 
 * @param {Plan Object} settings jQuery.ajax settings.
 * 
 * @return {Plan Object} jQuery.ajax settings, @see http://api.jquery.com/jQuery.ajax/.
 * 			Attension: 
 * 			the following attributes can not be set: type, contentType, mimeType, dataType, data, context.
 */
jslet.global.beforeSubmit = function(settings) {
	return settings;
};

jslet.global.afterInstall = function(container) {};

jslet.global.importDialog = {
	onQuerySchema: null,
	onSubmitSchema: null
};

jslet.global.exportDialog = {
		onQuerySchema: null,
		onSubmitSchema: null
}

