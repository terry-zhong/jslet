/* ========================================================================
 * Jslet framework: jslet.provider.js
 *
 * Copyright (c) 2014 Jslet Group(https://github.com/jslet/jslet/)
 * Licensed under MIT (https://github.com/jslet/jslet/LICENSE.txt)
 * ======================================================================== */

if (!jslet.data) {
	jslet.data = {};
}

/**
 * @static
 * @private
 * 
 */
jslet.data.ApplyAction = {QUERY: 'query', SAVE: 'save', SELECTED: 'selected'};

/**
 * @class jslet.data.DataProvider
 * 
 * @required
 */
jslet.data.DataProvider = function() {
	
	/**
	 * @param dataset jslet.data.Dataset;
	 * @param url String the request url;
	 * @param reqData String the request data which need to send to server.
	 */
	this.sendRequest = function(dataset, url, reqData) {
		var headers = {};
		if(dataset.csrfToken) {
			headers.csrfToken = dataset.csrfToken;
		}
		var settings = {
			async : true, 
			type: 'POST', 
			contentType: 'application/json', 
			mimeType: 'application/json',
			dataType: 'json',
			headers: headers,
			data : reqData,
			context: dataset
		};
		
		var defer = jQuery.Deferred();
		jQuery.ajax(url, settings)
		.done(function(data, textStatus, jqXHR) {
			if(data) {
				if(data.csrfToken) {
					this.csrfToken = data.csrfToken;
				}
				var errorCode = data.errorCode;
				if (errorCode) {
					defer.reject(data, this);
					return;
				}
			}
			defer.resolve(data, this);
		})
		.fail(function( jqXHR, textStatus, errorThrown ) {
			var data = {errorCode: textStatus, errorMessage: errorThrown};
			defer.reject(data, this);
		})
		.always(function(dataOrJqXHR, textStatus, jqXHRorErrorThrown) {
			if(jQuery.isFunction(dataOrJqXHR.done)) { //fail
				defer.always({errorCode: textStatus, errorMessage: jqXHRorErrorThrown}, this);
			} else {
				defer.always(dataOrJqXHR, this);
			}
		});
		return defer.promise();
	};
};
