/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class Expression. Example:
 * <pre><code>
 * var expr = new jslet.Expression(dsEmployee, '[name] == "Bob"');
 * expr.eval();//return true or false
 * 
 * </code></pre>
 * 
 * @param {jselt.data.Dataset} dataset dataset that use to evalute.
 * @param {String} expre Expression
 */
jslet.Expression = function(dataset, expr) {
	this._fields = [];
	this._otherDatasetFields = [];
	this._expr = expr;
	this._parsedExpr = '';
	if (typeof dataset == "string") {
		this._dataset = jslet.data.dataModule.get(dataset);
		if (!this._dataset) {
			throw new Error(jslet.formatString(jslet.locale.Dataset.datasetNotFound, [dsName]));
		}
	}else{
		this._dataset = dataset;
	}
	
	this.context = {mainds: dataset};
	this.parse();
};

jslet.Expression.prototype = {
	_ParserPattern: /\[[_a-zA-Z][\.!\w]*(,\d){0,1}]/gim,
	
	parse: function() {
		
		var start = 0, end, k, 
			dsName, fldName, 
			otherDs, stag, dsObj,
			tmpExpr = [], 
			valueIndex = null;
		this._ParserPattern.lastIndex = 0;
		while ((stag = this._ParserPattern.exec(this._expr)) !== null) {
			fldName = stag[0];

			if (!fldName || fldName.endsWith('(')) {
				continue;
			}

			dsName = null;
			fldName = fldName.substr(1, fldName.length - 2);
			k = fldName.indexOf(',');
			if(k > 0) {
				valueIndex = parseInt(fldName.substr(k + 1));
				if(isNaN(valueIndex)) {
					valueIndex = null;
				}
				fldName = fldName.substr(0, k);
			}
			k = fldName.indexOf('!');
			if (k > 0) {
				dsName = fldName.substr(0, k);
				fldName = fldName.substr(k + 1);
			}

			end = stag.index;
			dsObj = this._dataset;
			if(dsName) {
				otherDs = jslet.data.dataModule.get(dsName);
				if (!otherDs) {
					throw new Error(jslet.formatString(jslet.locale.Dataset.datasetNotFound, [dsName]));
				}
				this.context[dsName] = otherDs;
				dsObj = otherDs;
			}
			if (dsObj.getField(fldName) === null) {
				throw new Error(jslet.formatString(jslet.locale.Dataset.fieldNotFound, [fldName]));
			}

			if (!dsName) {
				tmpExpr.push(this._expr.substring(start, end));
				tmpExpr.push('context.mainds.fieldValueByRec(context.dataRec, "');
				this._fields.push(fldName);
			} else {
				tmpExpr.push(this._expr.substring(start, end));
				tmpExpr.push('context.');
				tmpExpr.push(dsName);
				tmpExpr.push('.getFieldValue("');
				this._otherDatasetFields.push({
							dataset : dsName,
							fieldName : fldName
						});
			}
			tmpExpr.push(fldName);
			tmpExpr.push('"');
			if(valueIndex !== null) {
				tmpExpr.push(',');
				tmpExpr.push(valueIndex);
			}
			tmpExpr.push(')');
			
			start = end + stag[0].length;
		}//end while
		tmpExpr.push(this._expr.substr(start));
		this._parsedExpr = tmpExpr.join('');
	}, //end function

	/**
	 * Get fields included in the expression.
	 * 
	 * @return {Array of String}
	 */
	mainFields: function() {
		return this._fields;
	},

	/**
	 * Get fields of other dataset included in the expression.
	 * Other dataset fields are identified with 'datasetName!fieldName', like: department!deptName
	 * 
	 * @return {Array of Object} the return value like:[{dataset : 'dsName', fieldName: 'fldName'}]
	 */
	otherDatasetFields: function() {
		return this._otherDatasetFields;
	},

	/**
	 * Evaluate the expression.
	 * 
	 * @param {Object} dataRec Data record object, this argument is used in parsedExpr 
	 * @return {Object} The value of Expression.
	 */
	eval: function() {
		var context = this.context;
		context.mainds = this._dataset;
		return eval(this._parsedExpr);
	},
	
	destroy: function() {
		this._dataset = null;
		this._fields = null;
		this._otherDatasetFields = [];
		this._parsedExpr = null;
		this._expr = null;
		this.context = null;
	}

	
};

