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
 * @constructor
 * 
 * @param {jslet.data.Dataset} dataset
 * @required
 */
jslet.data.DataProvider = function(dataset) {
	this.url = '';
	var result = null, errorMsg = null, self = this;
	
	var sendRequest = function(dataset, url, params, successHandler, errorHandler, actionName, reqOptions, callBackOption) {
		result = null;
		var headers = {};
		if(self.csrfToken) {
			headers.csrfToken = self.csrfToken;
		}
		var options = {
				headers: headers,
				data : params,
				success : function(data, textStatus, jqXHR) {
					var text = data, result;
					if (text && typeof(text) == 'string') {
						result = jQuery.parseJSON(text);
					} else {
						result = text;
					}
					errorMsg = result.errorMessage;
					if (errorMsg) {
						errorHandler.call(dataset, actionName, errorMsg);
						return;
					}
					self.csrfToken = jqXHR.getResponseHeader("csrftoken");
					successHandler.call(dataset, result, callBackOption);
				},

				error : function(jqXHR, textStatus, errorThrown) {
					errorHandler.call(dataset, actionName, textStatus + ':' + errorThrown);
				}
			};
		if(reqOptions) {
			for(var prop in reqOptions) {
				options[prop] = reqOptions[prop];
			}
		}
		new jQuery.ajax(url, options);
	};

	this.query = function(dataset, url, condition, pageNo, pageSize, successHandler, errorHandler) {
		result = null;
		var strParam = this._combineRequestData(condition);

		if (pageNo && pageNo > 0) {
			if (strParam) {
				strParam += '&';
			} else {
				strParam = '';
			}
			strParam += 'pageNo=' + pageNo + '&pageSize=' + 
					String(pageSize > 0 ? pageSize : 200);
		}
		
		sendRequest(dataset, url, strParam, successHandler, errorHandler, jslet.data.ApplyAction.QUERY, {async : true, type: 'GET'});
	};

	this.submit = function(dataset, url, changedRecs, successHandler, errorHandler) {
		var options = {async : false, type: 'POST', contentType: 'application/json', mimeType: 'application/json'};
		sendRequest(dataset, url, jslet.data.record2Json(changedRecs, true), successHandler, errorHandler, jslet.data.ApplyAction.SAVE, options);
	};
	
	this.submitSelected = function(dataset, url, selectedData, successHandler, errorHandler, deleteOnSuccess) {
		var reqOptions = {async : false, type: 'POST', contentType: 'application/json', mimeType: 'application/json'};
		var callBackOpt = {deleteOnSuccess: deleteOnSuccess};
		sendRequest(dataset, url, jslet.data.record2Json(selectedData, true), successHandler, errorHandler, jslet.data.ApplyAction.SELECTED, reqOptions, callBackOpt);
	};

	this._combineRequestData = function(data) {
		if(!data) {
			return '';
		}
		var result = data;
		if (!jslet.isString(data)) {
			result = jslet.data.record2Json(data, true);
		}
		return 'jsletdata=' + result;
	};
};
