/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

if (!jslet.data)
	jslet.data = {};

jslet.data.ApplyAction = {};
jslet.data.ApplyAction.QUERY = 'query';
jslet.data.ApplyAction.SAVE = 'save';
jslet.data.ApplyAction.SELECTED = 'selected';

jslet.data.DataProvider = function() {
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
	}

	this.applyQuery = function(dataset, url, condition, pageNo, pageSize, successHandler, errorHandler) {
		result = null;
		var strParam = this._combineRequestData(condition);

		if (pageNo && pageNo > 0) {
			if (strParam) {
				strParam += '&';
			} else {
				strParam = '';
			}
			strParam += 'pageNo=' + pageNo + '&pageSize='
					+ String(pageSize > 0 ? pageSize : 200);
		}
		
		sendRequest(dataset, url, strParam, successHandler, errorHandler, jslet.data.ApplyAction.QUERY, {async : true, type: 'GET'});
	}

	this.applyChanges = function(dataset, url, changedRecs, successHandler, errorHandler) {
		var options = {async : false, type: 'POST', contentType: 'application/json', mimeType: 'application/json'};
		sendRequest(dataset, url, jQuery.toJSON(changedRecs), successHandler, errorHandler, jslet.data.ApplyAction.SAVE, options);
	}
	
	this.applySelected = function(dataset, url, selectedData, successHandler, errorHandler, deleteOnSuccess) {
		var reqOptions = {async : false, type: 'POST', contentType: 'application/json', mimeType: 'application/json'};
		var callBackOpt = {deleteOnSuccess: deleteOnSuccess};
		sendRequest(dataset, url, jQuery.toJSON(selectedData), successHandler, errorHandler, jslet.data.ApplyAction.SELECTED, reqOptions, callBackOpt);
	}

	this._combineRequestData = function(data) {
		if(!data) {
			return '';
		}
		var result = data
		if (typeof(condition) != 'string') {
			result = jQuery.toJSON(data);
		}
		return 'jsletdata=' + result;
	}
}
