/* ========================================================================
 * Jslet framework: jslet.datacommon.js
 *
 * Copyright (c) 2014 Jslet Group(https://github.com/jslet/jslet/)
 * Licensed under MIT (https://github.com/jslet/jslet/LICENSE.txt)
 * ======================================================================== */

/**
 * keep all dataset object,
 * key for dataset name, value for dataset object
 */

jslet.data.dataModule = new jslet.SimpleMap();
/**
 * Get dataset object with dataset name.
 * 
 * @param {String} dsName dataset name;
 * @return {jslet.data.Dataset} Dataset object.
 */
jslet.data.getDataset = function (dsName) {
	return jslet.data.dataModule.get(dsName);
};

/**
 * If the relative dataset does not exist, fire this event.
 * In this event, you can create them.
 * 
 * @param {String} dsName Relative dataset name need to be created.
 * @param {Integer} dsCatalog Dataset catalog of relative dataset, optional value:
 * 		0 or undefined - Lookup dataset;
 * 		1 - Sub dataset
 * 
 */
jslet.data.onDatasetRequired = function(dsName, dsCatalog) {
	
};

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
	NORMAL: 0,	//Single value
	BETWEEN: 1, //Between style value
	MULTIPLE: 2 //Multile value
};

/**
 * @class Edit Mask 
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
	this.keepChar = (keepChar !== undefined ? keepChar: true);
	/**
	 * {String} transform Transform character into UpperCase or LowerCase,
	 *  optional value: upper, lower or null.
	 */
	this.transform = transform;
	
	this.clone = function(){
		return new jslet.data.EditMask(this.mask, this.keepChar, this.transform);
	};
};

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
	AFTERCANCEL: 'afterCancel',
	
	BEFORESELECT: 'beforeSelect',
	AFTERSELECT: 'afterSelect'
};

jslet.data.DataSetStatus = {BROWSE:0, INSERT: 1, UPDATE: 2, DELETE: 3};

jslet.data.RefreshEvent = {
	updateRecordEvent: function(fldName) {
		return {eventType: jslet.data.RefreshEvent.UPDATERECORD, fieldName: fldName};
	},
	
	updateColumnEvent: function(fldName) {
		return {eventType: jslet.data.RefreshEvent.UPDATECOLUMN, fieldName: fldName};
	},
	
	updateAllEvent: function() {
		return this._updateAllEvent;
	},
	
	changeMetaEvent: function(metaName, fieldName) {
		return {eventType: jslet.data.RefreshEvent.CHANGEMETA, metaName: metaName, fieldName: fieldName};
	},
	
	beforeScrollEvent: function(recno) {
		return {eventType: jslet.data.RefreshEvent.BEFORESCROLL, recno: recno};
	},
	
	scrollEvent: function(recno, prevRecno) {
		return {eventType: jslet.data.RefreshEvent.SCROLL, prevRecno: prevRecno, recno: recno};
	},
	
	insertEvent: function(prevRecno, recno, needUpdateAll) {
		return {eventType: jslet.data.RefreshEvent.INSERT, prevRecno: prevRecno, recno: recno, updateAll: needUpdateAll};
	},
	
	deleteEvent: function(recno) {
		return {eventType: jslet.data.RefreshEvent.DELETE, recno: recno};
	},
	
	selectRecordEvent: function(recno, selected) {
		return {eventType: jslet.data.RefreshEvent.SELECTRECORD, recno: recno, selected: selected};
	},
	
	selectAllEvent: function(selected) {
		return {eventType: jslet.data.RefreshEvent.SELECTALL, selected: selected};
	},
	
	changePageEvent: function() {
		return this._changePageEvent;
	},
	
	errorEvent: function(errMessage) {
		return {eventType: jslet.data.RefreshEvent.ERROR, message: errMessage};
	},
	
	lookupEvent: function(fieldName) {
		return {eventType: jslet.data.RefreshEvent.UPDATELOOKUP, fieldName: fieldName};
	}
};

jslet.data.RefreshEvent.CHANGEMETA = 'changeMeta';// fieldname, metatype(title, readonly,disabled,format)
jslet.data.RefreshEvent.UPDATEALL = 'updateAll';
jslet.data.RefreshEvent.UPDATERECORD = 'updateRecord';// fieldname
jslet.data.RefreshEvent.UPDATECOLUMN = 'updateColumn';// fieldname
jslet.data.RefreshEvent.BEFORESCROLL = 'beforescroll';
jslet.data.RefreshEvent.SCROLL = 'scroll';// preRecno, recno

jslet.data.RefreshEvent.SELECTRECORD = 'selectRecord';//
jslet.data.RefreshEvent.SELECTALL = 'selectAll';//
jslet.data.RefreshEvent.INSERT = 'insert';
jslet.data.RefreshEvent.DELETE = 'delete';// recno
jslet.data.RefreshEvent.CHANGEPAGE = 'changePage';
jslet.data.RefreshEvent.UPDATELOOKUP = 'updateLookup';

jslet.data.RefreshEvent.ERROR = 'error';

jslet.data.RefreshEvent._updateAllEvent = {eventType: jslet.data.RefreshEvent.UPDATEALL};
jslet.data.RefreshEvent._changePageEvent = {eventType: jslet.data.RefreshEvent.CHANGEPAGE};

/**
 * Field Validator
 */
jslet.data.FieldValidator = function() {
};

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
		if (!fldObj.lookup()) {//Not lookup field
			if (fldType == jslet.data.DataType.NUMBER) {
				if (fldObj.scale() === 0) {
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
		if (fldObj.required()) {
			var valid = true;
			if (value === null || value === undefined) {
				valid = false;
			}
			if(valid && jslet.isString(value) && jQuery.trim(value).length === 0) {
				valid = false;
			}
			if(valid && jslet.isArray(value) && value.length === 0) {
				valid = false;
			}
			if(fldObj.getType() === jslet.data.DataType.BOOLEAN && !value) {
				valid = false;
			}
			if(!valid) {
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
		var fldRange = fldObj.dataRange(),
			hasLookup = fldObj.lookup()? true: false;
		
		if (hasLookup) {//lookup field need compare code value of the Lookup
			value = fldObj.dataset().getFieldText(fldObj.name(), true);
		}
			
		if (fldRange) {
			var min = fldRange.min,
				strMin = min,
				max = fldRange.max,
				strMax = max;
			var fmt = fldObj.displayFormat();
			
			if (fldType == jslet.data.DataType.DATE) {
				if (min) {
					strMin = jslet.formatDate(min, fmt);
				}
				if (max) {
					strMax = jslet.formatDate(max, fmt);
				}
			}
			
			if (!hasLookup && fldType == jslet.data.DataType.NUMBER) {
				strMin = jslet.formatNumber(min, fmt);
				strMax = jslet.formatNumber(max, fmt);
			}
			
			if (min !== undefined && max !== undefined && (value < min || value > max)) {
				return jslet.formatString(jslet.locale.Dataset.notInRange, [strMin, strMax]);
			}
			if (min !== undefined && max === undefined && value < min) {
				return jslet.formatString(jslet.locale.Dataset.moreThanValue, [strMin]);
			}
			if (min === undefined && max !== undefined && value > max) {
				return jslet.formatString(jslet.locale.Dataset.lessThanValue, [strMax]);
			}
		}
		
		//Check unique in local data, if need check at server side, use 'customValidator' instead.
		if(fldObj.unique()) {
			var currDs = fldObj.dataset(),
				dataList = currDs.dataList();
			
			if(value !== null && value !== undefined && dataList && dataList.length > 1) {
				var currRec = currDs.getRecord(), 
					fldName = fldObj.name(),
					rec;
				for(var i = 0, len = dataList.length; i < len; i++) {
					rec = dataList[i];
					if(rec === currRec) {
						continue;
					}
					if(rec[fldName] == value) {
						return jslet.locale.Dataset.notUnique;
					}
				}
			}
		}
		//Customized validation
		if (fldObj.customValidator()) {
			return fldObj.customValidator().call(fldObj.dataset(), fldObj, value);
		}
		
		return null;
	}
};

/*Start of field value converter*/
jslet.data.FieldValueConverter = jslet.Class.create({
	className: 'jslet.data.FieldValueConverter',
	
	textToValue: function(fldObj, inputText) {
		var value = inputText;
		return value;
	},
	
	valueToText: function(fldObj, value, isEditing) {
		var text = value;
		return text;
	}
});
jslet.data.FieldValueConverter.className = 'jslet.data.FieldValueConverter';

jslet.data.NumberValueConverter = jslet.Class.create(jslet.data.FieldValueConverter, {
	textToValue: function(fldObj, inputText) {
		var value = 0;
		if (inputText) {
			if (fldObj.scale() === 0) {
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
			value = value * Z._unitConvertFactor;
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
			lkFldObj = fldObj.lookup();
		
		value = lkFldObj.dataset()._convertFieldValue(
				lkFldObj.codeField(), inputText, lkFldObj.keyField());
		if (value === null) {
			var invalidMsg = jslet.formatString(jslet.locale.Dataset.valueNotFound);
			fldObj.message(invalidMsg, valueIndex);
			return null;
		}
		if(fldObj.valueStyle() === jslet.data.FieldValueStyle.NORMAL) {
			var fieldMap = lkFldObj.returnFieldMap(),
				lookupDs = lkFldObj.dataset();
			mainDs = this;
			if(lookupDs.findByKey(value)) {
				var fldName, lkFldName;
				for(var fldName in fieldMap) {
					lkFldName = fieldMap[fldName];
					mainDs.setFieldValue(fldName, lookupDs.getFieldValue(lkFldName));
				}
			}
		}
		return value;
	},
	
	valueToText: function(fldObj, value, isEditing) {
		var lkFldObj = fldObj.lookup(),
			lkds = lkFldObj.dataset(),
			result;
		if (!isEditing) {
			result = lkds._convertFieldValue(lkFldObj.keyField(), value,
					lkFldObj.displayFields());
		} else {
			result = lkds._convertFieldValue(lkFldObj.keyField(), value, 
					'[' + lkFldObj.codeField() + ']');
		}
		return result;
	}
});

jslet.data._valueConverters = {};
jslet.data._valueConverters[jslet.data.DataType.NUMBER] = new jslet.data.NumberValueConverter();
jslet.data._valueConverters[jslet.data.DataType.STRING] = new jslet.data.StringValueConverter();
jslet.data._valueConverters[jslet.data.DataType.DATE] = new jslet.data.DateValueConverter();
jslet.data._valueConverters[jslet.data.DataType.BOOLEAN] = new jslet.data.BooleanValueConverter();

jslet.data._valueConverters.lookup = new jslet.data.LookupValueConverter();

/**
 * Get appropriate field value converter.
 * 
 * @param {jslet.data.Field} fldObj field object.
 * 
 * @return {jslet.data.FieldValueConverter} field value converter;
 */
jslet.data.getValueConverter = function(fldObj) {
	if(fldObj.lookup()) {
		return jslet.data._valueConverters.lookup;
	}
	
	return jslet.data._valueConverters[fldObj.getType()];
};
/* End of field value converter */

/**
 * Convert dataset record to json.
 * 
 * @param {Array of Object} records Dataset records, required.
 * @param {Array of String} excludeFields Excluded field names,optional.
 * 
 * @return {String} Json String. 
 */
jslet.data.record2Json = function(records, excludeFields) {
	if(!window.JSON || !JSON) {
		alert('Your browser does not support JSON!');
		return;
	}
	if(excludeFields) {
		jslet.Checker.test('record2Json#excludeFields', excludeFields).isArray();		
	}
	
	function record2JsonFilter(key, value) {
		if(key == jslet.data.FieldValueCache.CACHENAME) {
			return undefined;
		}
		if(excludeFields) {
			var fldName;
			for(var i = 0, len = excludeFields.length; i < len; i++) {
				fldName = excludeFields[i];
				if(key == fldName) {
					return undefined;
				}
			}
		}
		return value;		
	}
	
	return JSON.stringify(records, record2JsonFilter);
};

/*Field value cache manager*/
jslet.data.FieldValueCache = {
	CACHENAME: '_cache_',
	
	put: function(record, fieldName, value, valueIndex) {
		if(!record) {
			throw new Error('Record can\'t be null!')
		}
		var cacheObj = record[this.CACHENAME];
		if(!cacheObj) {
			cacheObj = {};
			record[this.CACHENAME] = cacheObj;
		}
		if(valueIndex || valueIndex === 0) {
			var fldCacheObj = cacheObj[fieldName];
			if(!fldCacheObj || !jslet.isObject(fldCacheObj)){
				fldCacheObj = {};
				cacheObj[fieldName] = fldCacheObj;
			}
			fldCacheObj[valueIndex+""] = value;
		} else {
			cacheObj[fieldName] = value;
		}
	},
	
	get: function(record, fieldName, valueIndex) {
		if(!record) {
			return undefined;
		}
		var cacheObj = record[this.CACHENAME];
		if(cacheObj) {
			if(valueIndex || valueIndex === 0) {
				var fldCacheObj = cacheObj[fieldName];
				if(fldCacheObj && jslet.isObject(fldCacheObj)){
					return fldCacheObj[valueIndex+""];
				}
				return undefined;
			} else {
				return cacheObj[fieldName];
			}
		} else {
			return undefined;
		}
	},
	
	clear: function(record, fieldName) {
		if(!record) {
			return;
		}
		var cacheObj = record[this.CACHENAME];
		if(cacheObj) {
			cacheObj[fieldName] = undefined;
		}
	},
	
	clearAll: function(dataset, fieldName) {
		var dataList = dataset.dataList();
		if(!dataList) {
			return;
		}
		var rec, cacheObj;
		for(var i = 0, len = dataList.length; i < len; i++) {
			rec = dataList[i];
			cacheObj = rec[this.CACHENAME];
			if(cacheObj) {
				delete cacheObj[fieldName];
			}
		}
	},
	
	removeCache: function(record) {
		if(record) {
			record[this.CACHENAME] = {};
		}
	},
	
	removeAllCache: function(dataset) {
		var dataList = dataset.dataList();
		if(!dataList) {
			return;
		}
		var rec, cacheObj;
		for(var i = 0, len = dataList.length; i < len; i++) {
			rec = dataList[i];
			delete rec[this.CACHENAME];
		}
	}
};
/*End of field value cache manager*/

jslet.data.DatasetRelationManager = function() {
	var relations= [];
	
	this.addRelation = function(datasetName, fieldName, lookupDatasetName) {
		for(var i = 0, len = relations.length; i < len; i++) {
			var relation = relations[i];
			if(relation.hostDataset == datasetName && 
				relation.hostField == fieldName && 
				relation.lookupDataset == lookupDatasetName) {
				return;
			}
		}
		relations.push({hostDataset: datasetName, hostField: fieldName, lookupDataset: lookupDatasetName});
//		console.log(datasetName + ":" + fieldName + ":" + lookupDatasetName)
	};
	
	this.removeRelation = function(datasetName, fieldName, lookupDatasetName) {
		for(var i = 0, len = relations.length; i < len; i++) {
			var relation = relations[i];
			if(relation.hostDataset == datasetName && 
					relation.hostField == fieldName && 
					relation.lookupDataset == lookupDatasetName) {
				relations.splice(i,1);
			}
		}
	};
	
	this.refreshHostDataset = function(lookupDatasetName) {
		var relation, hostDataset;
		for(var i = 0, len = relations.length; i < len; i++) {
			relation = relations[i];
			if(relation.lookupDataset == lookupDatasetName) {
				hostDataset = jslet.data.getDataset(relation.hostDataset);
				if(hostDataset) {
					hostDataset.handleLookupDatasetChanged(relation.hostField);
				}
			}
		}
	};
};
jslet.data.datasetRelationManager = new jslet.data.DatasetRelationManager();

jslet.data.convertDateFieldValue = function(dataset, records) {
	var Z = dataset;
	if(!records) {
		records = Z.dataList();
	}
	if (!records || records.length === 0) {
		return;
	}

	var dateFlds = [], i,
		fields = Z.getNormalFields(),
		cnt = fields.length, fldObj;
	for (i = 0; i < cnt; i++) {
		fldObj = fields[i];
		if (fldObj.getType() == jslet.data.DataType.DATE) {
			dateFlds.push(fldObj.name());
		}
	}
	if (dateFlds.length === 0) {
		return;
	}

	var rec, fname, value,
		recCnt = records.length;
	for (i = 0; i < recCnt; i++) {
		rec = records[i];
		for (var j = 0, fcnt = dateFlds.length; j < fcnt; j++) {
			fname = dateFlds[j];
			value = rec[fname];
			if (!jslet.isDate(value)) {
				value = jslet.parseDate(value,'yyyy-MM-ddThh:mm:ss');
				if (value) {
					rec[fname] = value;
				} else {
					throw new Error(jslet.formatString(jslet.locale.Dataset.invalidDateFieldValue,[fldName]));
				}
			} //end if
		} //end for j
	} //end for i
}