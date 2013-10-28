/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * keep all dataset object,
 * key for dataset name, value for dataset object
 */

jslet.data.dataModule = new jslet.SimpleMap();
jslet.data.getDataset = function (dsName) {
    return jslet.data.dataModule.get(dsName);
}

jslet.data.DataType = {
	NUMBER: 'N', //Number
	STRING: 'S', //String
	DATE: 'D',  //Date
	TIME: 'T',  //Time
	BOOLEAN: 'B', //Boolean
	DATASET: 'V', //Dataset field
	GROUP: 'G'  //Group Field
};

jslet.data.FieldValueStyle = {
	NORMAL: 0,
	BETWEEN: 1,
	MULTIPLE: 2
};

/**
 * @class 
 */
jslet.data.EditMask = function(mask, keepChar, transform){
	/**
	 * {String} Mask String, rule:
	 *  '#': char set: 0-9 and -, not required
     *  '0': char set: 0-9, required
     *  '9': char set: 0-9, not required
     *  'L': char set: A-Z,a-z, required
     *  'l': char set: A-Z,a-z, not required
     *  'A': char set: 0-9,a-z,A-Z, required
     *  'a': char set: 0-9,a-z,A-Z, not required
     *  'C': char set: any char, required
     *  'c': char set: any char, not required
	 */
	this.mask = mask; 
	/**
	 * {Boolean} keepChar Keep the literal character or not
	 */
	this.keepChar = keepChar !== undefined ? keepChar: true;
	/**
	 * {String} transform Transform character into UpperCase or LowerCase,
	 *  optional value: upper, lower or null.
	 */
	this.transform = transform;
	
	this.clone = function(){
		return new jslet.data.EditMask(this.mask, this.keepChar, this.transform);
	}
}

jslet.data.DatasetEvent = {
	BEFORESCROLL: 'beforeScroll',
	AFTERSCROLL: 'afterScroll',
	
	BEFOREINSERT: 'beforeInsert',
	AFTERINSERT: 'afterInsert',
	
	BEFOREUPDATE: 'beforeUpdate',
	AFTERUPDATE: 'afterUpdate',
	
	BEFOREDELETE: 'beforeDelete',
	AFTERDELETE: 'afterDelete',
	
	BEFORECONFIRM: 'beforeConfirm',
	AFTERCONFIRM: 'afterConfirm',
	
	BEFORECANCEL: 'beforeCancel',
	AFTERCANCEL: 'afterCancel'
}

jslet.data.DataSetStatus = {BROWSE:0, INSERT: 1, UPDATE: 2, DELETE: 3};

jslet.data.UpdateEvent = function(evtType, evtInfo) {
	this.eventType = evtType;
	this.eventInfo = evtInfo;
}

jslet.data.UpdateEvent.SCROLL = 'scroll';// preRecno, recno
jslet.data.UpdateEvent.METACHANGE = 'metachange';// fieldname, metatype(title, readonly,enabled,format)
jslet.data.UpdateEvent.UPDATEALL = 'updateAll';
jslet.data.UpdateEvent.UPDATERECORD = 'updaterecord';// fieldname

jslet.data.UpdateEvent.UPDATECOLUMN = 'updatecolumn';// fieldname

jslet.data.UpdateEvent.SELECTCHANGE = 'selectchange';//
jslet.data.UpdateEvent.SELECTALLCHANGE = 'selectallchange';//
jslet.data.UpdateEvent.INSERT = 'insert';
jslet.data.UpdateEvent.DELETE = 'delete';// recno
jslet.data.UpdateEvent.BEFORESCROLL = 'beforescroll';

jslet.data.UpdateEvent.updateAllEvent = new jslet.data.UpdateEvent(
		jslet.data.UpdateEvent.UPDATEALL, null);

jslet.data.UpdateEvent.PAGECHANGE = 'pagechange';

/**
 * @class Formula parser. Example:
 * <pre><code>
 * var parser = new jslet.FormulaParser(dsEmployee, '[name] == "Bob"');
 * parser.evalExpr();//return true or false
 * 
 * </code></pre>
 * 
 * @param {jselt.data.Dataset} dataset dataset that use to evalute.
 * @param {String} expre Expression
 */
jslet.FormulaParser = function(dataset, expr) {
	this._fields = [];
	this._otherDatasetFields;
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
	
	this.parseExpr();
}

jslet.FormulaParser.prototype = {
	_ParserPattern: /\[\D[\.!\w]*]/gim,
	
	parseExpr: function() {
		
		var start = 0, end, k, dsName, fldName, dsTmp, stag, tmpExpr = [];
		this._ParserPattern.lastIndex = 0;
		while ((stag = this._ParserPattern.exec(this._expr)) != null) {
			fldName = stag[0];

			if (!fldName || fldName.endsWith('(')) {
				continue;
			}

			dsName = null;
			fldName = fldName.substr(1, fldName.length - 2);
			k = fldName.indexOf('!');
			if (k > 0) {
				dsName = fldName.substr(0, k);
				fldName = fldName.substr(k + 1);
			}

			end = stag.index;
			if (dsName == null) {
				dsTmp = this._dataset;
				this._fields.push(fldName);
				tmpExpr.push(this._expr.substring(start, end));
				tmpExpr.push('dataset.fieldValueByRec(dataRec,"');
				tmpExpr.push(fldName);
				tmpExpr.push('")');
			} else {
				dsTmp = jslet.data.dataModule.get(dsName);
				if (!dsTmp) {
					throw new Error(jslet.formatString(jslet.locale.Dataset.datasetNotFound, [dsName]));
				}
				tmpExpr.push(this._expr.substring(start, end));
				tmpExpr.push('jslet.data.dataModule.get("');
				tmpExpr.push(dsName);
				tmpExpr.push('").getFieldValue("');
				tmpExpr.push(fldName);
				tmpExpr.push('")');
				if (!this._otherDatasetFields) {
					this._otherDatasetFields = [];
				}
				this._otherDatasetFields.push({
							dataset : dsName,
							fieldName : fldName
						});
			}
			if (dsTmp.getField(fldName) == null) {
				throw new Error(jslet.formatString(jslet.locale.Dataset.fieldNotFound, [fldName]));
			}

			start = end + stag[0].length;
		}//end while
		tmpExpr.push(this._expr.substr(start));
		this._parsedExpr = tmpExpr.join('');
	}, //end function

	setDataset: function(dataset) {
		this._dataset = dataset;
	},

	/**
	 * Get fields included in the expression.
	 * 
	 * @return {Array of String}
	 */
	getFields: function() {
		return this._fields;
	},

	/**
	 * Get fields of other dataset included in the expression.
	 * Other dataset fields are identified with 'datasetName!fieldName', like: department!deptName
	 * 
	 * @return {Array of Object} the return value like:[{dataset : 'dsName', fieldName: 'fldName'}]
	 */
	getOtherDatasetFields: function() {
		return this._otherDatasetFields;
	},

	/**
	 * Evaluate the expression.
	 * 
	 * @param {Object} dataRec Data record object, this argument is used in parsedExpr 
	 * @return {Object} The value of Expression.
	 */
	evalExpr: function(dataRec) {
		var dataset = this._dataset;
		return eval(this._parsedExpr);
	}
}

jslet.data.FieldValidator = function() {
}

jslet.data.FieldValidator.prototype = {
	
	intRegular: { expr: /^(-)?[1-9]*\d+$/ig},
	
	floatRegular: { expr: /((^-?[1-9])|\d)\d*(\.[0-9]*)?$/ig},

   /**
     * Check the specified character is valid or not.
     * Usually use this when user presses a key down.
     * 
     * @param {String} inputChar Single character
     * @param {Boolean} True for passed, otherwise failed.
     */
    checkInputChar: function (fldObj, inputChar) {
    	var validChars = fldObj.validChars();
    	
    	if (validChars && inputChar) {
    		var c = inputChar.charAt(0);
    		return validChars.indexOf(c) >= 0;
    	}
        return true;
    },
    
    /**
     * Check the specified text is valid or not
     * Usually use this when a field loses focus.
     * 
     * @param {jslet.data.Field} fldObj Field Object
     * @param {String} inputText Input text, it is original text that user inputed. 
     * @return {String} If input text is valid, return null, otherwise return error message.
     */
    checkInputText: function (fldObj, inputText) {
        var result = this.checkRequired(fldObj, inputText);
    	if(result) {
    		return result;
    	}
    	if(inputText === "") {
    		return null;
    	}
        var fldType = fldObj.getType();
        
    	//Check with regular expression
        var regular = fldObj.regularExpr();
        if (!regular) {
            if (fldType == jslet.data.DataType.DATE) {
            	regular = fldObj.dateRegular();
            } else {
                if (fldType == jslet.data.DataType.NUMBER) {
            		if (!this.intRegular.message) {
            			this.intRegular.message = jslet.locale.Dataset.invalidInt;
            			this.floatRegular.message = jslet.locale.Dataset.invalidFloat;
            		}
                    if (!fldObj.scale()) {
                    	regular = this.intRegular;
                    } else {
                    	regular = this.floatRegular;
                    }
                }
            }
        }
        
        if (regular) {
        	var regExpObj = regular.expr;
        	if (typeof regExpObj == 'string') {
	           regExpObj = new RegExp(regular.expr, 'ig');
        	}
        	regExpObj.lastIndex = 0;
	        if (!regExpObj.test(inputText)) {
	            return regular.message;
	        }
        }
        
        var value = inputText;
    	if (!fldObj.lookupField()) {//Not lookup field
    		if (fldType == jslet.data.DataType.NUMBER) {
                if (fldObj.scale() == 0) {
                    value = parseInt(inputText);
                } else {
                    value = parseFloat(inputText);
                }
    		}
    		if (fldType == jslet.data.DataType.DATE) {// Date convert
                value = jslet.parseDate(inputText, fldObj.displayFormat());
    		}
    	}
    	
    	return this.checkValue(fldObj, value);
    },

    /**
     * Check the required field's value is empty or not
     * 
     * @param {jslet.data.Field} fldObj Field Object
     * @param {Object} value field value.
     * @return {String} If input text is valid, return null, otherwise return error message.
     */
    checkRequired: function(fldObj, value) {
    	if (!value || (jslet.isArray(value) && value.length == 0)) {
	        if (fldObj.required()) {
	            return jslet.formatString(jslet.locale.Dataset.fieldValueRequired, [fldObj.label()]);
	        } else {
	        	return null;
	        }
    	}
    	return null;
    },
    
    /**
     * Check the specified field value is valid or not
     * It will check required, range and custom validation
     * 
     * @param {jslet.data.Field} fldObj Field Object
     * @param {Object} value field value. 
     * @return {String} If input text is valid, return null, otherwise return error message.
     */
    checkValue: function(fldObj, value) {
        var fldType = fldObj.getType();
        //Check range
        var fldRange = fldObj.range(),
        	hasLookupField = fldObj.lookupField()? true: false;
        
    	if (hasLookupField) {//lookup field need compare code value of the lookupfield
    		value = fldObj.dataset().getFieldText(fldObj.name(), true);
    	}
    		
        if (fldRange) {
            var strMin = min = fldRange.min, strMax = max = fldRange.max;
            var fmt = fldObj.displayFormat();
            
            if (fldType == jslet.data.DataType.DATE) {
	            if (min) {
	            	strMin = jslet.formatDate(min, fmt);
	            }
	            if (max) {
	            	strMax = jslet.formatDate(max, fmt);
	            }
            }
            
            if (!hasLookupField && fldType == jslet.data.DataType.NUMBER) {
            	strMin = jslet.formatNumber(min, fmt);
            	strMax = jslet.formatNumber(max, fmt);
            }
            
            if (min != undefined && max != undefined && (value < min || value > max)) {
                return jslet.formatString(jslet.locale.Dataset.notInRange, [strMin, strMax]);
            }
            if (min != undefined && max == undefined && value < min) {
                return jslet.formatString(jslet.locale.Dataset.moreThanValue, [strMin]);
            }
            if (min == undefined && max != undefined && value > max) {
                return jslet.formatString(jslet.locale.Dataset.lessThanValue, [strMax]);
            }
        }
        //Customized sort
        if (fldObj.customValidator()) {
            return fldObj.customValidator().call(fldObj.dataset(), fldObj, value);
        }
        
        return null;
    }
}


jslet.data.FieldValueConverter = jslet.Class.create({
	textToValue: function(fldObj, inputText) {
		var value = inputText;
		return value;
	},
	
	valueToText: function(fldObj, value, isEditing) {
		var text = value;
		return text;
	}
});

jslet.data.NumberValueConverter = jslet.Class.create(jslet.data.FieldValueConverter, {
	textToValue: function(fldObj, inputText) {
		var value = 0;
		if (inputText) {
	        if (fldObj.scale() == 0) {
	            value = parseInt(inputText);
	        } else {
	            value = parseFloat(inputText);
	        }
		}
		return value;
	},

	valueToText: function(fldObj, value, isEditing) {
		var Z = this;
        if (fldObj.unitConverted()) {
            value = value / Z._unitConvertFactor;
        }

        if (!isEditing) {
            var rtnText = jslet.formatNumber(value, fldObj.displayFormat());
            if (fldObj.unitConverted() && Z._unitName) {
                rtnText += Z._unitName;
            }
            return rtnText;
        } else {
        	return value;
        }
	}
});

jslet.data.DateValueConverter = jslet.Class.create(jslet.data.FieldValueConverter, {
	textToValue: function(fldObj, inputText) {
		var value = jslet.parseDate(inputText, fldObj.displayFormat());
		return value; 
	},
	
	valueToText: function(fldObj, value, isEditing) {
        if (!(value instanceof Date)) {
            throw new Error(jslet.formatString(jslet.locale.Dataset.invalidDateFieldValue, [fldObj.name()]));
        }

        return value ? jslet.formatDate(value, fldObj.displayFormat()): '';
	}
});

jslet.data.StringValueConverter = jslet.Class.create(jslet.data.FieldValueConverter, {
	textToValue: function(fldObj, inputText) {
		var value = inputText;
	    if (fldObj.antiXss()) {
	    	value = jslet.htmlEncode(value);
	    }
	    return value;
	}
});

jslet.data.BooleanValueConverter = jslet.Class.create(jslet.data.FieldValueConverter, {
	textToValue: function(fldObj, inputText) {
		if(!inputText) {
			return false;
		}
		return inputText.toLowerCase() == 'true';
	},
	
	valueToText: function(fldObj, value, isEditing) {
        return value ? 'true': 'false';
	}
});

jslet.data.LookupValueConverter = jslet.Class.create(jslet.data.FieldValueConverter, {
	textToValue: function(fldObj, inputText, valueIndex) {
		var value = '',
			Z = this,
			lkFld = fldObj.lookupField();
		
        value = lkFld.lookupDataset()._convertFieldValue(
				lkFld.codeField(), inputText, lkFld.keyField());
        if (value === null) {
        	var invalidMsg = jslet.formatString(jslet.locale.Dataset.valueNotFound);
        	Z._addErrorField(fldObj.name(), inputText, invalidMsg, valueIndex);
        	return null;
        }
        return value;
	},
	
	valueToText: function(fldObj, value, isEditing) {
        var lkFldObj = fldObj.lookupField(),
            lkds = lkFldObj.lookupDataset(),
            result;
        if (!isEditing) {
            result = lkds._convertFieldValue(lkFldObj.keyField(), value,
					lkFldObj.displayFields(), fldObj.valueSeparator());
        } else {
            result = lkds._convertFieldValue(lkFldObj.keyField(), value, '['
							+ lkFldObj.codeField() + ']', fldObj.valueSeparator());
        }
        return result;
	}
});

jslet.data._valueConverters = {};
jslet.data._valueConverters[jslet.data.DataType.NUMBER] = new jslet.data.NumberValueConverter();
jslet.data._valueConverters[jslet.data.DataType.STRING] = new jslet.data.StringValueConverter();
jslet.data._valueConverters[jslet.data.DataType.DATE] = new jslet.data.DateValueConverter();
jslet.data._valueConverters[jslet.data.DataType.BOOLEAN] = new jslet.data.BooleanValueConverter();

jslet.data._valueConverters['lookupfield'] = new jslet.data.LookupValueConverter();

/**
 * Get appropriate field value converter.
 * 
 * @param {jslet.data.Field} fldObj field object.
 * 
 * @return {jslet.data.FieldValueConverter} field value converter;
 */
jslet.data.getValueConverter = function(fldObj) {
	if(fldObj.lookupField()) {
		return jslet.data._valueConverters['lookupfield'];
	}
	
	return jslet.data._valueConverters[fldObj.getType()];
}


