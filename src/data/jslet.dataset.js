/* ========================================================================
 * Jslet framework: jslet.dataset.js
 *
 * Copyright (c) 2014 Jslet Group(https://github.com/jslet/jslet/)
 * Licensed under MIT (https://github.com/jslet/jslet/LICENSE.txt)
 * ======================================================================== */

jslet.data.dataModule = new jslet.SimpleMap();
jslet.data.getDataset = function (dsName) {
    return jslet.data.dataModule.get(dsName);
};

/**
 * @class Dataset
 * 
 * @param {String} name dataset's name that must be unique in jslet.data.dataModule variable.
 */
jslet.data.Dataset = function (name) {
	jslet.Checker.test('Dataset.name', name).isString();
	name = jQuery.trim(name);
	jslet.Checker.test('Dataset.name', name).required();
	
	var Z = this;
	Z._name = null; //Dataset name
	Z._recordClass = null; //Record class, used for serialized/deserialize
	Z._dataList = null; //Array of data records
	
	Z._datasetListener = null; //Dataset event listener object, like: function(eventType/*jslet.data.DatasetEvent*/) {}

	Z._fields = []; //Array of jslet.data.Field
	Z._normalFields = []; //Array of jslet.data.Field except group field
	Z._recno = -1;
	Z._filteredRecnoArray = null;

	Z._unitConvertFactor = 1;
	Z._unitName = null;

	Z._aborted = false;
	Z._insertedDelta = []; //Array of record
	Z._updatedDelta = []; //Array of record
	Z._deletedDelta = []; //Array of record

	Z._status = 0; // dataset status, optional values: 0:browse;1:created;2:updated;3:deleted;
	Z._subDatasetFields = null; //Array of dataset field object

	Z._filter = null;
	Z._filtered = false;
	Z._innerFilter = null; //inner variable
	Z._findCondition = null;
	Z._innerFindCondition = null; //inner variable

	Z._innerFormularFields = null; //inner variable

	Z._bof = false;
	Z._eof = false;
	Z._igoreEvent = false;
	Z._logChanged = true;

	Z._modiObject = null;
	Z._lockCount = 0;

	Z._indexFields = '';
	Z._innerIndexFields = null;

	Z._convertDestFields = null;
	Z._innerConvertDestFields = null;

	Z._masterDataset = null;
	Z._detailDatasets = null; // array

	Z._datasetField = null; //jslet.data.Field 

	Z._linkedControls = []; //Array of DBControl except DBLabel
	Z._linkedLabels = []; //Array of DBLabel
	Z._silence = 0;
	Z._keyField = null;
	Z._codeField = null;
	Z._nameField = null;
	Z._parentField = null;
	Z._selectField = null;
	
	Z._contextRules = null;
	Z._contextRuleEngine = null;
	Z._contextRuleEnabled = false;

	Z._dataProvider = jslet.data.DataProvider ? new jslet.data.DataProvider() : null;

	Z._queryCriteria = null; //String query parameters 
	Z._queryUrl = null; //String query URL 
	Z._submitUrl = null; //String submit URL
	Z._pageSize = 500;
	Z._pageNo = 0;  
	Z._pageCount = 0;
	//The following attributes are used for private.
	Z._ignoreFilter = false;
	Z._ignoreFilterRecno = 0;
	
	Z.fieldValidator = new jslet.data.FieldValidator();
	
	/**
	 * Fired after field value changed.
	 * Pattern:
	 *   function(fieldName, fldValue) {}
	 *   //fieldName: String, field name;
	 *   //fldValue: Object, field value.
	 */
	Z.onFieldChange = null;  
	
	/**
	 * Fired when check a record if it's selectable or not.
	 * Pattern:
	 *   function() {}
	 *   //return: Boolean, true - record can be selected, false - otherwise.
	 */
	Z._onCheckSelectable = null;
	Z._autoShowError = false;
	Z._autoRefreshHostDataset = false;
	
	var dsName = this._name;
	if (dsName) {
		jslet.data.dataModule.unset(dsName);
	}
	jslet.data.dataModule.unset(name);
	jslet.data.dataModule.set(name, this);
	this._name = name;
};
jslet.data.Dataset.className = 'jslet.data.Dataset';

jslet.data.Dataset.prototype = {

	className: jslet.data.Dataset.className,
	/**
	* Set dataset's name.
	* 
	* @param {String} name Dataset's name that must be unique in jslet.data.dataModule variable.
	* @return {String or this}
	*/
	name: function() {
		if(arguments.length >0) {
			throw new Error("Can't change dataset name! Use new jslet.data.Dataset('dsName') instead!");
		}
		return this._name;
	},
		
	/**
	* Set dataset's name.
	* 
	* @param {String} name Dataset's name that must be unique in jslet.data.dataModule variable.
	* @return {String or this}
	*/
	recordClass: function(clazz) {
		var Z = this;
		if (clazz === undefined) {
			return Z._recordClass;
		}
		jslet.Checker.test('Dataset.recordClass', clazz).isString();
		Z._recordClass = clazz ? clazz.trim() : null;
		return this;
	},
		
	/**
	* Clone this dataset's structure and return new dataset object..
	* 
	* @param {String} newDsName New dataset's name.
	* @param {Array of String} fieldNames a list of field names which will be cloned to new dataset.
	* @return {jslet.data.Dataset} Cloned dataset object
	*/
	clone: function (newDsName, fieldNames) {
		var Z = this;
		if (!newDsName) {
			newDsName = Z._name + '_clone';
		}
		var result = new jslet.data.Dataset(newDsName);
		result._datasetListener = Z._datasetListener;

		result._unitConvertFactor = Z._unitConvertFactor;
		result._unitName = Z._unitName;

		result._filter = Z._filter;
		result._filtered = Z._filtered;
		result._logChanged = Z._logChanged;
		result._indexFields = Z._indexFields;
		var keyFldName = Z._keyField,
			codeFldName = Z._codeField,
			nameFldName = Z._nameField,
			parentFldName = Z._parentField,
			selectFldName = Z._selectField;
		if (fieldNames) {
			keyFldName = keyFldName && fieldNames.indexOf(keyFldName) >= 0 ? keyFldName: null;
			codeFldName = codeFldName && fieldNames.indexOf(codeFldName) >= 0 ? codeFldName: null;
			nameFldName = nameFldName && fieldNames.indexOf(nameFldName) >= 0 ? nameFldName: null;
			parentFldName = parentFldName && fieldNames.indexOf(parentFldName) >= 0 ? parentFldName: null;
			selectFldName = selectFldName && fieldNames.indexOf(selectFldName) >= 0 ? selectFldName: null;
		}
		result._keyField = keyFldName;
		result._codeField = codeFldName;
		result._nameField = nameFldName;
		result._parentField = parentFldName;
		result._selectField = selectFldName;

		result._contextRules = Z._contextRules;
		var fldObj, fldName;
		for(var i = 0, cnt = Z._fields.length; i < cnt; i++) {
			fldObj = Z._fields[i];
			fldName = fldObj.name();
			if (fieldNames) {
				if (fieldNames.indexOf(fldName) < 0) {
					continue;
				}
			}
			result.addField(fldObj.clone(fldName, result));
		}
		return result;
	},

	/**
	 * Add specified fields of source dataset into this dataset.
	 * 
	 * @param {jslet.data.Dataset} srcDataset New dataset's name.
	 * @param {Array of String} fieldNames a list of field names which will be copied to this dataset.
	 */
	addFieldFromDataset: function(srcDataset, fieldNames) {
		jslet.Checker.test('Dataset.addFieldFromDataset#srcDataset', srcDataset).required().isClass(jslet.data.Dataset.className);
		jslet.Checker.test('Dataset.addFieldFromDataset#fieldNames', fieldNames).isArray();
		var fldObj, fldName, 
			srcFields = srcDataset.getFields();
		for(var i = 0, cnt = srcFields.length; i < cnt; i++) {
			fldObj = srcFields[i];
			fldName = fldObj.name();
			if (fieldNames) {
				if (fieldNames.indexOf(fldName) < 0) {
					continue;
				}
			}
			this.addField(fldObj.clone(fldName, this));
		}
	},
	
	/**
	 * Set or get page size.
	 * 
	 * @param {Integer} pageSize.
	 * @return {Integer or this}
	 */
	pageSize: function(pageSize) {
		if (pageSize === undefined) {
			return this._pageSize;
		}
		
		jslet.Checker.test('Dataset.pageSize#pageSize', pageSize).isGTZero();
		this._pageSize = pageSize;
		return this;
	},

	/**
	 * Set or get page number.
	 * 
	 * @param {Integer} pageNo.
	 * @return {Integer or this}
	 */
	pageNo: function(pageNo) {
		if (pageNo === undefined) {
			return this._pageNo;
		}
		
		jslet.Checker.test('Dataset.pageNo#pageNo', pageNo).isGTZero();
		this._pageNo = pageNo;
		return this;
	},
	
	/**
	 * Get page count.
	 * 
	 * @return {Integer}
	 */
	pageCount: function() {
		return this._pageCount;
	},
	
	/**
	 * Alert the error message when confirm or apply to server.
	 * 
	 * @param {boolean} autoShowError.
	 * @return {boolean or this}
	 */
	autoShowError: function(autoShowError) {
		if (autoShowError === undefined) {
			return this._autoShowError;
		}
		
		this._autoShowError = autoShowError ? true: false;
		return this;
	},
	
	/**
	 * Update the host dataset or not if this dataset is a lookup dataset and its data has changed.
	 * If true, all datasets which host this dataset as a lookup dataset will be refreshed.
	 * 
	 * @param {boolean} flag.
	 * @return {boolean or this}
	 */
	autoRefreshHostDataset: function(flag) {
		if(flag === undefined) {
			return this._autoRefreshHostDataset;
		}
		this._autoRefreshHostDataset = flag ? true: false;
		return this;
	},
	
	/**
	 * Set unit converting factor.
	 * 
	 * @param {Double} factor When changed this value, the field's display value will be changed by 'fldValue/factor'.
	 * @param {String} unitName Unit name that displays after field value.
	 * @return {Double or this}
	 */
	unitConvertFactor: function (factor, unitName) {
		var Z = this;
		if (arguments.length === 0) {
			return Z._unitConvertFactor;
		}
		
		jslet.Checker.test('Dataset.unitConvertFactor#factor', factor).isGTZero();
		jslet.Checker.test('Dataset.unitConvertFactor#unitName', unitName).isString();
		if (factor > 0) {
			Z._unitConvertFactor = factor;
		}
		else{
			Z._unitConvertFactor = 1;
		}

		Z._unitName = unitName;
		for (var i = 0, cnt = Z._normalFields.length, fldObj; i < cnt; i++) {
			fldObj = Z._normalFields[i];
			if (fldObj.getType() == jslet.data.DataType.NUMBER && fldObj.unitConverted()) {
				var fldName = fldObj.name();
				jslet.data.FieldValueCache.clearAll(Z, fldName);
				var evt = jslet.data.RefreshEvent.updateColumnEvent(fldName);
				Z.refreshControl(evt);
			}
		} //end for
		return Z;
	},

	/**
	 * Set or get dataset event listener.
	 * Pattern:
	 * function(eventType, dataset) {}
	 * //eventType: jslet.data.DatasetEvent
	 * //dataset: jslet.data.Dataset
	 * 
	 * Example:
	 * <pre><code>
	 *   dsFoo.datasetListener(function(eventType, dataset) {
	 *		console.log(eventType);
	 *   });
	 * </code></pre>
	 * 
	 * @param {Function} listener Dataset event listener
	 * @return {Function or this}
	 */
	datasetListener: function(listener) {
		if (arguments.length === 0) {
			return this._datasetListener;
		}
		
		jslet.Checker.test('Dataset.datasetListener#listener', listener).isFunction();
		this._datasetListener = listener;
		return this;
	},
	
	onCheckSelectable: function(onCheckSelectable) {
		if (onCheckSelectable === undefined) {
			return this._onCheckSelectable;
		}
		
		jslet.Checker.test('Dataset.onCheckSelectable', onCheckSelectable).isFunction();
		this._onCheckSelectable = onCheckSelectable;
		return this;
	},
	
	
	/**
	 * Get dataset fields.
	 * @return {Array of jslet.data.Field}
	 */
	getFields: function () {
		return this._fields;
	},

	/**
	 * Get fields except group field
	 * @return {Array of jslet.data.Field}
	 */
	getNormalFields: function() {
		return this._normalFields;
	},
	
	/**
	 * Set the specified fields to be visible, others to be hidden.
	 * 
	 * Example:
	 * <pre><code>
	 *   dsFoo.setVisibleFields(['field1', 'field3']);
	 * </code></pre>
	 * 
	 * @param {String[]} fieldNameArray array of field name
	 */
	setVisibleFields: function(fieldNameArray) {
		jslet.Checker.test('Dataset.setVisibleFields#fieldNameArray', fieldNameArray).isArray();
		this._travelField(this._fields, function(fldObj) {
			fldObj.visible(false);
			return false; //Identify if cancel traveling or not
		});
		if(!fieldNameArray) {
			return;
		}
		for(var i = 0, len = fieldNameArray.length; i < len; i++) {
			var fldName = jQuery.trim(fieldNameArray[i]);
			var fldObj = this.getField(fldName);
			if(fldObj) {
				fldObj.visible(true);
			}
		}
	},
	
	/**
	 * @private
	 */
	_travelField: function(fields, callBackFn) {
		if (!callBackFn || !fields) {
			return;
		}
		var isBreak = false;
		for(var i = 0, len = fields.length; i < len; i++) {
			var fldObj = fields[i];
			isBreak = callBackFn(fldObj);
			if (isBreak) {
				break;
			}
			
			if (fldObj.getType() == jslet.data.DataType.GROUP) {
				isBreak = this._travelField(fldObj.children(), callBackFn);
				if (isBreak) {
					break;
				}
			}
		}
		return isBreak;
	},
	
	/**
	 * @private
	 */
	_cacheNormalFields: function() {
		var arrFields = this._normalFields = [];
		this._travelField(this._fields, function(fldObj) {
			if (fldObj.getType() != jslet.data.DataType.GROUP) {
				arrFields.push(fldObj);
			}
			return false; //Identify if cancel traveling or not
		});
	},
	
	/**
	 * Set or get datasetField object, use internally.
	 * 
	 * @param {Field} datasetField, "dataset field" in master dataset.
	 * @return {jslet.data.Field or this}
	 */
	datasetField: function(fldObj) {
		if (fldObj === undefined) {
			return this._datasetField;
		}
		jslet.Checker.test('Dataset.datasetField#fldObj', fldObj).isClass(jslet.data.Field.className);
		this._datasetField = fldObj;
		return this;
	},

	/**
	* Add a new field object.
	* 
	* @param {jslet.data.Field} fldObj: field object.
	*/
	addField: function (fldObj) {
		jslet.Checker.test('Dataset.addField#fldObj', fldObj).required().isClass(jslet.data.Field.className);
		var Z = this;
		Z._fields.push(fldObj);
		fldObj.dataset(Z);
		if (fldObj.displayOrder() !== 0) {
			Z._fields.sort(fldObj.sortByIndex);
		}
		if (fldObj.getType() == jslet.data.DataType.DATASET) {
			if (!Z._subDatasetFields)
				Z._subDatasetFields = [];
			Z._subDatasetFields.push(fldObj);
		}
		Z._cacheNormalFields();
		return Z;
	},

	/**
	 * Remove field by field name.
	 * 
	 * @param {String} fldName: field name.
	 */
	removeField: function (fldName) {
		jslet.Checker.test('Dataset.removeField#fldName', fldName).required().isString();
		fldName = jQuery.trim(fldName);
		var Z = this,
			fldObj = Z.getField(fldName);
		if (fldObj) {
			if (fldObj.getType() == jslet.data.DataType.DATASET) {
				var k = Z._subDatasetFields.indexOf(fldObj);
				if (k >= 0) {
					Z._subDatasetFields.splice(k, 1);
				}
			}
			var i = Z._fields.indexOf(fldObj);
			Z._fields.splice(i, 1);
			fldObj.dataset(null);
			Z._cacheNormalFields();
			jslet.data.FieldValueCache.clearAll(Z, fldName);
		}
		return Z;
	},

	/**
	 * Get field object by name.
	 * 
	 * @param {String} fldName: field name.
	 * @return jslet.data.Field
	 */
	getField: function (fldName) {
		jslet.Checker.test('Dataset.getField#fldName', fldName).isString().required();
		fldName = jQuery.trim(fldName);

		var arrField = fldName.split('.'), fldName1 = arrField[0];
		var fldObj = null;
		this._travelField(this._fields, function(fldObj1) {
			var cancelTravel = false;
			if (fldObj1.name() == fldName1) {
				fldObj = fldObj1;
				cancelTravel = true;
			}
			return cancelTravel; //Identify if cancel traveling or not
		});

		if (!fldObj) {
			return null;
		}
		
		if (arrField.length == 1) {
			return fldObj;
		}
		else {
			arrField.splice(0, 1);
			var lkf = fldObj.lookup();
			if (lkf) {
				var lkds = lkf.dataset();
				if (lkds) {
					return lkds.getField(arrField.join('.'));
				}
			}
		}
		return null;
	},

	/**
	 * Get field object by name.
	 * 
	 * @param {String} fldName: field name.
	 * @return jslet.data.Field
	 */
	getTopField: function (fldName) {
		jslet.Checker.test('Dataset.getField#fldName', fldName).isString().required();
		fldName = jQuery.trim(fldName);
		
		var fldObj = this.getField(fldName);
		if (fldObj) {
			while(true) {
				if (fldObj.parent() === null) {
					return fldObj;
				}
				fldObj = fldObj.parent();
			}
		}
		return null;
	},
	
	/**
	 * @Private,Sort function.
	 * 
	 * @param {Object} rec1: dataset record.
	 * @param {Object} rec2: dataset record.
	 */
	sortFunc: function (rec1, rec2) {
		var dsObj = jslet.temp.sortDataset;
		
		var indexFlds = dsObj._innerIndexFields, v1, v2, fname, flag = 1;
		for (var i = 0, cnt = indexFlds.length; i < cnt; i++) {
			fname = indexFlds[i].fieldName;
			v1 = dsObj.fieldValueByRec(rec1, fname);
			v2 = dsObj.fieldValueByRec(rec2, fname);
			if (v1 == v2) {
				continue;
			}
			if (v1 !== null && v2 !== null) {
				if (v1 < v2) {
					flag = -1;
				} else {
					flag = 1;
				}
			} else if (v1 === null && v2 !== null) {
				flag = -1;
			} else {
				if (v1 !== null && v2 === null) {
					flag = 1;
				}
			}
			return flag * indexFlds[i].order;
		} //end for
		return 0;
	},

	/**
	 * Set index fields, field names separated by comma(',')
	 * 
	 * @param {String} indFlds: index field name.
	 * @return jslet.data.Field
	 */
	indexFields: function (indFlds) {
		var Z = this;
		if (indFlds === undefined) {
			return Z._indexFields;
		}
		
		jslet.Checker.test('Dataset.indexFields#indFlds', indFlds).isString();
		indFlds = jQuery.trim(indFlds);
		Z._indexFields = indFlds;
		if (!Z._dataList || Z._dataList.length === 0 || !indFlds) {
			return;
		}
		var arrFlds = Z._indexFields.split(','), 
		fname, fldObj, arrFName, indexNameObj, i, 
			order = 1;//asce
		Z._innerIndexFields = [];
		for (i = 0, cnt = arrFlds.length; i < cnt; i++) {
			fname = jQuery.trim(arrFlds[i]);
			arrFName = fname.split(' ');
			if (arrFName.length == 1) {
				order = 1;
			} else if (arrFName[1].toLowerCase() == 'asce') {
				order = 1; //asce
			} else {
				order = -1; //desc
			}
			fname = arrFName[0];
			Z._createIndexCfg(fname, order);
		} //end for

		var currRec = Z.getRecord(), 
		flag = Z.isContextRuleEnabled();
		if (flag) {
			Z.disableContextRule();
		}
		Z.disableControls();
		jslet.temp.sortDataset = Z;
		try {
			Z._dataList.sort(Z.sortFunc);
			Z._refreshInnerRecno();
		} finally {
			jslet.temp.sortDataset = null;
			Z.moveToRecord(currRec);
			if (flag) {
				Z.enableContextRule();
			}
			Z.enableControls();
		}
		return this;
	},

	/**
	 * @private
	 */
	_createIndexCfg: function(fname, order) {
		var Z = this,
			fldObj = fname;
		if(jslet.isString(fname)) {
			fldObj = Z.getField(fname);
		}
		if (!fldObj) {
			return;
		}
		if(fldObj.dataset() !== Z) {
			Z._combineIndexCfg(fname, order);
			return;
		}
		if (fldObj.getType() != jslet.data.DataType.GROUP) {
			Z._combineIndexCfg(fldObj.name(), order);
		} else {
			var children = fldObj.children();
			if (children) {
				for(var k = 0, childCnt = children.length; k < childCnt; k++) {
					Z._createIndexCfg(children[k], order);
				}
			}
		}
	},
	
	/**
	 * @private
	 */
	_combineIndexCfg: function(fldName, order) {
		for(var i = 0, len = this._innerIndexFields.length; i < len; i++) {
			if (this._innerIndexFields[i].fieldName == fldName) {
				this._innerIndexFields.splice(i,1);//remove duplicated field
			}
		}
		var indexNameObj = {
				fieldName: fldName,
				order: order
			};
		this._innerIndexFields.push(indexNameObj);
	},
	
	/**
	 * Set or get dataset filter expression
	 * Filter can work depending on property: filtered, filtered must be true.
	 * <pre><code>
	 *   dsFoo.filter('[name] like "Bob%"');
	 *   dsFoo.filter('[age] > 20');
	 * </code></pre>
	 * 
	 * @param {String} filterExpr: filter expression.
	 * @return {String or this}
	 */
	filter: function (filterExpr) {
		var Z = this;
		if (filterExpr === undefined) {
			return Z._filter;
		}
		
		jslet.Checker.test('dataset.filter#filterExpr', filterExpr).isString();
		filterExpr = jQuery.trim(filterExpr);
		var oldFilter = Z._filter;
		if (!filterExpr) {
			Z._innerFilter = null;
			Z._filtered = false;
			Z._filter = null;
			Z._filteredRecnoArray = null;
		} else {
			Z._filter = filterExpr;
			if(oldFilter == Z._filter) {
				return this;
			} else {
				Z._innerFilter = new jslet.Expression(Z, filterExpr);
			}
		}
		Z._doFilterChanged();
		return this;
	},

	/**
	 * Set or get filtered flag
	 * Only filtered is true, the filter can work
	 * 
	 * @param {Boolean} afiltered: filter flag.
	 * @return {Boolean or this}
	 */
	filtered: function (afiltered) {
		var Z = this;
		if (afiltered === undefined) {
			return Z._filtered;
		}
		
		var oldFilter = Z._filter, oldFiltered = Z._filtered;
		if (afiltered && !Z._filter) {
			Z._filtered = false;
		} else {
			Z._filtered = afiltered ? true: false;
		}

		if(oldFilter == Z._filter && oldFiltered == Z._filtered) {
			return this;
		}
		this._doFilterChanged();
		return this;
	},
	
	_doFilterChanged: function() {
		var Z = this;
		Z.disableControls();
		try {
			if (!Z._filtered) {
				Z._filteredRecnoArray = null;
			} else {
				Z._refreshInnerRecno();
			}
			Z.first();
		}
		finally {
			Z.enableControls();
		}
		Z.refreshHostDataset();

		return this;
	},
	
	/**
	 * @private, filter data
	 */
	_filterData: function () {
		var Z = this;
		if (!Z._filtered || !Z._filter || 
				Z._status == jslet.data.DataSetStatus.INSERT || 
				Z._status == jslet.data.DataSetStatus.UPDATE) {
			return true;
		}
		var result = Z._innerFilter.eval();
		return result;
	},

	/**
	 * @private
	 */
	_refreshInnerRecno: function () {
		var Z = this;
		if (!Z._dataList || Z._dataList.length === 0) {
			Z._filteredRecnoArray = null;
			return;
		}
		Z._filteredRecnoArray = null;
		var tempRecno = [];
		for (var i = 0, cnt = Z._dataList.length; i < cnt; i++) {
			Z._recno = i;
			if (Z._filterData()) {
				tempRecno.push(i);
			}
		}
		Z._filteredRecnoArray = tempRecno;
	},

	/**
	 * @private
	 */
	_fireDatasetEvent: function (evtType) {
		var Z = this;
		if (Z._silence || Z._igoreEvent || !Z._datasetListener) {
			return;
		}
		Z._datasetListener.call(Z, evtType);
	},

	/**
	 * Get record count
	 * 
	 * @return {Integer}
	 */
	recordCount: function () {
		if (this._dataList) {
			if (!this._filteredRecnoArray) {
				return this._dataList.length;
			} else {
				return this._filteredRecnoArray.length;
			}
		}
		return 0;
	},

	hasRecord: function () {
		return this.recordCount() > 0;
	},
	
	/**
	 * Set or get record number
	 * 
	 * @param {Integer}record number
	 * @return {Integer or this}
	 */
	recno: function (recno) {
		var Z = this;
		if (recno === undefined) {
			return Z._recno;
		}
		jslet.Checker.test('dataset.recno#recno', recno).isGTEZero();
		recno = parseInt(recno);
		if(!Z.hasRecord()) {
			Z._bof = Z._eof = true;
			return this;
		}
		
		if (recno == Z._recno) {
			return this;
		}
		if (Z._status != jslet.data.DataSetStatus.BROWSE) {
			Z.confirm();
			if (Z._aborted) {
				return this;
			}
		}
		Z._gotoRecno(recno);
		Z._bof = Z._eof = false;
		return this;
	},
	
	/**
	 * @private
	 * Set record number(Private)
	 * 
	 * @param {Integer}recno - record number
	 */
	recnoSilence: function (recno) {
		this._recno = recno;
	},

	/**
	 * @private
	 * Goto specified record number(Private)
	 * 
	 * @param {Integer}recno - record number
	 */
	_gotoRecno: function (recno) {
		var Z = this;
		var recCnt = Z.recordCount();
		if(recCnt == 0) {
			return false;
		}
		if (recno >= recCnt) {
			recno = recCnt - 1;
		} else if (recno < 0) {
			recno = 0;
		}
		
		if (Z._recno == recno) {
			return false;
		}
		var evt;
		if (!Z._silence) {
			Z._aborted = false;
			Z._fireDatasetEvent(jslet.data.DatasetEvent.BEFORESCROLL);
			if (Z._aborted) {
				return false;
			}
			if (!Z._lockCount) {
				evt = jslet.data.RefreshEvent.beforeScrollEvent(Z._recno);
				jslet.debounce(Z.refreshControl, 100).call(Z, evt);
			}
		}

		var preno = Z._recno;
		Z._recno = recno;
		
		if (Z._subDatasetFields && Z._subDatasetFields.length > 0) {
			var fldObj, subds;
			for (var i = 0, len = Z._subDatasetFields.length; i < len; i++) {
				fldObj = Z._subDatasetFields[i];
				subds = fldObj.subDataset();
				if (subds) {
					subds.confirm();
					subds.dataList(Z.getFieldValue(fldObj.name()));
					var indexflds = subds.indexFields();
					if (indexflds) {
						subds.indexFields(indexflds);
					} else {
						subds.refreshControl();
					}
				}
			} //end for
		} //end if
		if (Z._contextRuleEnabled) {
			this.calcContextRule();
		}

		if (!Z._silence) {
			Z._fireDatasetEvent(jslet.data.DatasetEvent.AFTERSCROLL);
			if (!Z._lockCount) {
				evt = jslet.data.RefreshEvent.scrollEvent(Z._recno, preno);
				jslet.debounce(Z.refreshControl, 100).call(Z, evt);
			}
		}
		return true;
	},

	/**
	 * Abort insert/update/delete action before insert/update/delete.
	 * 
	 */
	abort: function () {
		this._aborted = true;
	},

	/**
	 * Get aborted status.
	 * 
	 * @return {Boolean}
	 */
	aborted: function() {
		return this._aborted;
	},
	
	/**
	 * @private
	 * Move cursor back to startRecno(Private)
	 * 
	 * @param {Integer}startRecno - record number
	 */
	_moveCursor: function (recno) {
		var Z = this;
		if (Z._status != jslet.data.DataSetStatus.BROWSE) {
			Z.confirm();
			if (Z._aborted) {
				return;
			}
		}

		Z._gotoRecno(recno);
	},

	/**
	 * Move record cursor by record object
	 * 
	 * @param {Object}recordObj - record object
	 * @return {Boolean} true - Move successfully, false otherwise. 
	 */
	moveToRecord: function (recordObj) {
		var Z = this;
		if (Z._status != jslet.data.DataSetStatus.BROWSE) {
			Z.confirm();
			if (Z._aborted) {
				return;
			}
		}
		if (!Z._dataList || Z._dataList.length === 0) {
			return false;
		}
		jslet.Checker.test('dataset.moveToRecord#recordObj', recordObj).required().isObject();
		var k = Z._dataList.indexOf(recordObj);
		if (k < 0) {
			return false;
		}
		if (Z._filteredRecnoArray) {
			k = Z._filteredRecnoArray.indexOf(k);
			if (k < 0) {
				return false;
			}
		}
		Z._gotoRecno(k);
		return true;
	},

	/**
	 * @private
	 */
	startSilenceMove: function (notLogPos) {
		var Z = this;
		var context = {};
		if (!notLogPos) {
			context.recno = Z._recno;
		} else {
			context.recno = -999;
		}

		Z._silence++;
		return context;
	},

	/**
	 * @private
	 */
	endSilenceMove: function (context) {
		var Z = this;
		if (context.recno != -999 && context.recno != Z._recno) {
			Z._gotoRecno(context.recno);
		}
		Z._silence--;
	},

	/**
	 * Check dataset cursor at the last record
	 * 
	 * @return {Boolean}
	 */
	isBof: function () {
		return this._bof;
	},

	/**
	 * Check dataset cursor at the first record
	 * 
	 * @return {Boolean}
	 */
	isEof: function () {
		return this._eof;
	},

	/**
	 * Move cursor to first record
	 */
	first: function () {
		var Z = this;
		if(!Z.hasRecord()) {
			Z._bof = Z._eof = true;
			return;
		}
		Z._moveCursor(0);
		Z._bof = Z._eof = false;
	},

	/**
	 * Move cursor to last record
	 */
	next: function () {
		var Z = this;
		var recCnt = Z.recordCount();
		if(recCnt === 0) {
			Z._bof = Z._eof = true;
			return;
		}
		if(Z._recno == recCnt - 1) {
			Z._bof = false;
			Z._eof = true;
			return;
		}
		Z._bof = Z._eof = false;
		Z._moveCursor(Z._recno + 1);
	},

	/**
	 * Move cursor to prior record
	 */
	prior: function () {
		var Z = this;
		if(!Z.hasRecord()) {
			Z._bof = Z._eof = true;
			return;
		}
		if(Z._recno === 0) {
			Z._bof = true;
			Z._eof = false;
			return;
		}
		Z._bof = Z._eof = false;
		Z._moveCursor(Z._recno - 1);
	},

	/**
	 * Move cursor to next record
	 */
	last: function () {
		var Z = this;
		if(!Z.hasRecord()) {
			Z._bof = Z._eof = true;
			return;
		}
		Z._bof = Z._eof = false;
		Z._moveCursor(Z.recordCount() - 1);
		Z._bof = Z._eof = false;
	},

	/**
	 * @private
	 * Check dataset status and confirm dataset 
	 */
	_checkStatusAndConfirm: function () {
		if (this._status != jslet.data.DataSetStatus.BROWSE) {
			this.confirm();
		}
	},

	/**
	 * @private
	 * Check dataset status and cancel dataset 
	 */
	checkStatusByCancel: function () {
		if (this._status != jslet.data.DataSetStatus.BROWSE) {
			this.cancel();
		}
	},

	/**
	 * Insert child record by parentId, and move cursor to the newly record.
	 * 
	 * @param {Object} parentId - key value of parent record
	 */
	insertChild: function (parentId) {
		var Z = this;
		if (!Z._parentField || !Z.keyField()) {
			throw new Error('parentField and keyField not set,use insertRecord() instead!');
		}

		if (!Z._dataList || Z._dataList.length === 0) {
			Z.innerInsert();
			return;
		}

		var context = Z.startSilenceMove(true);
		try {
			Z.getRecord()._expanded_ = true;
			if (parentId) {
				if (!Z.findByKey(parentId)) {
					return;
				}
			} else {
				parentId = Z.keyValue();
			}

			var pfldname = Z.parentField(), parentParentId = Z.getFieldValue(pfldname);
			while (true) {
				Z.next();
				if (Z.isEof()) {
					break;
				}
				if (parentParentId == Z.getFieldValue(pfldname)) {
					Z.prior();
					break;
				}
			}
		} finally {
			Z.endSilenceMove(context);
		}

		Z.innerInsert(function (newRec) {
			newRec[Z._parentField] = parentId;
		});
	},

	/**
	 * Insert sibling record of current record, and move cursor to the newly record.
	 */
	insertSibling: function () {
		var Z = this;
		if (!Z._parentField || !Z._keyField) {
			throw new Error('parentField and keyField not set,use insertRecord() instead!');
		}

		if (!Z._dataList || Z._dataList.length === 0) {
			Z.innerInsert();
			return;
		}

		var parentId = Z.getFieldValue(Z.parentField()),
			context = Z.startSilenceMove(true),
			found = false,
			parentKeys = [],
			currPKey, prePKey = Z.keyValue();
		try {
			Z.next();
			while (!Z.isEof()) {
				currPKey = Z.parentValue();
				if(currPKey == prePKey) {
					parentKeys.push(prePKey);
					lastPKey = prePKey;
				} else {
					if(lastPKey != currPKey) {
						if(parentKeys.indexOf(currPKey) < 0) {
							Z.prior();
							found = true;
							break;
						}
					}
				}
				prePKey = currPKey;
				Z.next();
			}
			if (!found) {
				Z.last();
			}
		} finally {
			Z.endSilenceMove(context);
		}

		Z.innerInsert(function (newRec) {
			newRec[Z._parentField] = parentId;
		});
	},

	/**
	 * Insert record after current record, and move cursor to the newly record.
	 */
	insertRecord: function () {
		this.innerInsert();
	},

	/**
	 * Add record after last record, and move cursor to the newly record.
	 */
	appendRecord: function () {
		var Z = this;
		Z._silence++;
		try {
			Z.last();
		} finally {
			Z._silence--;
		}
		Z.insertRecord();
	},

	/**
	 * @private
	 */
	status: function(status) {
		this._status = status;
		return this;
	},
	
	/**
	 * @private
	 */
	changedStatus: function(status) {
		var record = this.getRecord(),
			cacheObj = record[jslet.data.FieldValueCache.CACHENAME];
		
		if(status === undefined) {
			if(!cacheObj) {
				return jslet.data.DataSetStatus.BROWSE;
			}
			return cacheObj._data_status_;
		}
		var oldValue = -1;
		if(!cacheObj) {
			cacheObj = {};
			record[jslet.data.FieldValueCache.CACHENAME] = cacheObj;
		} else {
			oldValue = cacheObj._data_status_;
		}
		if(oldValue != status) {
			if(this._contextRuleEngine) {
				this._contextRuleEngine.evalStatus();
			}
		}
		cacheObj._data_status_ = status;
	},
	
	/**
	 * @Private
	 */
	innerInsert: function (beforeInsertFn) {
		var Z = this;
		var mfld = Z._datasetField, mds = null;
		if (mfld) {
			mds = mfld.dataset();
			if (mds.recordCount() === 0) {
				throw new Error(jslet.locale.Dataset.insertMasterFirst);
			}
		}

		if (Z._dataList === null) {
			Z._dataList = [];
		}
		Z._aborted = false;
		Z._checkStatusAndConfirm();
		if (Z._aborted) {
			return;
		}

		Z._fireDatasetEvent(jslet.data.DatasetEvent.BEFOREINSERT);
		if (Z._aborted) {
			return;
		}

		var preRecno = Z.recno(), k;
		if (this.recordCount() > 0) {
			k = Z._dataList.indexOf(this.getRecord()) + 1;
		} else {
			k = Z._dataList.length;
		}

		Z._modiObject = {};
		Z._dataList.splice(k, 0, Z._modiObject);

		if (Z._filteredRecnoArray) {
			for (var i = Z._filteredRecnoArray.length; i >= 0; i--) {
				Z._filteredRecnoArray[i] += 1;
				if (Z._filteredRecnoArray[i] == k) {
					Z._filteredRecnoArray.splice(i, 0, k);
					Z._recno = i;
					break;
				}
			}
		} else {
			Z._recno = k;
		}
		
		Z.status(jslet.data.DataSetStatus.INSERT);
		Z.changedStatus(jslet.data.DataSetStatus.INSERT);
		Z.calDefaultValue();
		if (beforeInsertFn) {
			beforeInsertFn(Z._modiObject);
		}

		if (mfld && mds) {
			mds.editRecord();
			var subFields = mfld.name();
			if (!mds.setFieldValue(subFields)) {
				mds.setFieldValue(subFields, Z._dataList);
			}
		}

		Z._aborted = false;
		Z._fireDatasetEvent(jslet.data.DatasetEvent.AFTERINSERT);
		var evt = jslet.data.RefreshEvent.insertEvent(preRecno, Z.recno(), Z._recno < Z.recordCount() - 1);
		Z.refreshControl(evt);
	},

	/**
	 * Insert all records of source dataset into current dataset;
	 * Source dataset's structure must be same as current dataset 
	 * 
	 * @param {Integer}srcDataset - source dataset
	 */
	insertDataset: function (srcDataset) {
		Z.filtered(false);
		var k;
		if (this.recordCount() > 0) {
			k = Z._dataList.indexOf(this.getRecord()) + 1;
		} else {
			k = Z._dataList.length;
		}

		var context = srcDataset.startSilenceMove(true), rec;
		try {
			srcDataset.first();
			while (!srcDataset.isEof()) {
				rec = srcDataset.getRecord();
				Z._dataList.splice(k++, 0, rec);
				srcDataset.next();
			}
		} finally {
			srcDataset.endSilenceMove(context);
		}
	},

	/**
	 * Append all records of source dataset into current dataset;
	 * Source dataset's structure must be same as current dataset 
	 * 
	 * @param {Integer}srcDataset - source dataset
	 */
	appendDataset: function (srcDataset) {
		var Z = this;
		Z._silence++;
		try {
			Z.last();
		} finally {
			Z._silence--;
		}
		Z.insertDataset(srcDataset);
	},

	/**
	 * @rivate
	 * Calculate default value.
	 */
	calDefaultValue: function () {
		var Z = this, fldObj, expr, value, fname;
		for (var i = 0, fldcnt = Z._normalFields.length; i < fldcnt; i++) {
			fldObj = Z._normalFields[i];
			fname = fldObj.name();
			if (fldObj.getType() == jslet.data.DataType.DATASET) {
				var subds = fldObj.subDataset();
				Z.setFieldValue(fname, null);
				continue;
			}
			value = fldObj.defaultValue();
			if (!value) {
				expr = fldObj.defaultExpr();
				if (!expr) {
					continue;
				}
				value = window.eval(expr);
				Z.setFieldValue(fname, value);
			} else {
				Z.setFieldValue(fname, value);
			}
		}
	},

	/**
	 * Get record object by record number.
	 * 
	 * @param {Integer} recno Record Number.
	 * @return {Object} Dataset record.
	 */
	getRecord: function (recno) {
		var Z = this, k;
		if(!Z._dataList || Z._dataList.length === 0) {
			return null;
		}
		//Used to convert field value for performance purpose. 
		if(Z._ignoreFilter) {
			return Z._dataList[Z._ignoreFilterRecno || 0];
		}
		
		if (Z.recordCount() === 0) {
			return null;
		}
		if (recno === undefined) {
			recno = Z._recno >= 0 ? Z._recno : 0;
		} else {
			if (recno < 0 || recno >= Z.recordCount()) {
				return null;
			}
		}
		
		if (Z._filteredRecnoArray) {
			k = Z._filteredRecnoArray[recno];
		} else {
			k = recno;
		}

		return Z._dataList[k];
	},

	/**
	 * @private
	 */
	getRelativeRecord: function (delta) {
		return this.getRecord(this._recno + delta);
	},

	/**
	 * @private
	 */
	isSameAsPrevious: function (fldName) {
		var preRec = this.getRelativeRecord(-1);
		if (!preRec) {
			return false;
		}
		var currRec = this.getRecord();
		return preRec[fldName] == currRec[fldName];
	},

	/**
	 * Check the current record has child records or not
	 * 
	 * @return {Boolean}
	 */
	hasChildren: function () {
		var Z = this;
		if (!Z._parentField) {
			return false;
		}
		var context = Z.startSilenceMove();
		var keyValue = Z.keyValue();
		try {
			Z.next();
			if (!Z.isEof()) {
				var pValue = Z.parentValue();
				if (pValue == keyValue) {
					return true;
				}
			}
			return false;
		} finally {
			Z.endSilenceMove(context);
		}
	},

	/**
	 * Update record and send dataset to update status.
	 * You can use cancel() or confirm() method to return browse status.
	 */
	editRecord: function () {
		var Z = this;
		if (Z._status == jslet.data.DataSetStatus.UPDATE ||
			Z._status == jslet.data.DataSetStatus.INSERT) {
			return;
		}

		if (Z._dataList === null || Z._dataList.length === 0) {
			Z.insertRecord();
		} else {
			Z._aborted = false;
			Z._fireDatasetEvent(jslet.data.DatasetEvent.BEFOREUPDATE);
			if (Z._aborted) {
				return;
			}

			Z._modiObject = {};
			jQuery.extend(Z._modiObject, Z.getRecord());
			var mfld = Z._datasetField;
			if (mfld && mfld.dataset()) {
				mfld.dataset().editRecord();
			}

			Z.status(jslet.data.DataSetStatus.UPDATE);
			Z.changedStatus(jslet.data.DataSetStatus.UPDATE);
						
			Z._aborted = false;
			Z._fireDatasetEvent(jslet.data.DatasetEvent.AFTERUPDATE);
		}
	},

	/**
	 * Delete record
	 */
	deleteRecord: function () {
		var Z = this;
		var recCnt = Z.recordCount();
		if (recCnt === 0) {
			return;
		}
		if (Z._status == jslet.data.DataSetStatus.INSERT) {
			Z.cancel();
			return;
		}

		Z._silence++;
		try {
			Z.checkStatusByCancel();
		} finally {
			Z._silence--;
		}

		if (Z.hasChildren()) {
			jslet.showInfo(jslet.locale.Dataset.cannotDelParent);
			return;
		}

		Z._aborted = false;
		Z._fireDatasetEvent(jslet.data.DatasetEvent.BEFOREDELETE);
		if (Z._aborted) {
			return;
		}
		if (Z._logChanged) {
			var rec = Z.getRecord(), isNew = false, i, cnt;
			cnt = Z._insertedDelta.length;
			for (i = 0; i < cnt; i++) {
				if (Z._insertedDelta[i] == rec) {
					Z._insertedDelta.splice(i, 1);
					isNew = true;
					break;
				}
			}
			if (!isNew) {
				cnt = Z._updatedDelta.length;
				for (i = 0; i < cnt; i++) {
					if (Z._updatedDelta[i] == rec) {
						Z._updatedDelta.splice(i, 1);
						break;
					}
				}
				Z._deletedDelta.push(rec);
			}
		}
		var preRecno = Z.recno(), 
			isLast = preRecno == (recCnt - 1), 
			k = Z._recno;
		if (Z._filteredRecnoArray) {
			k = Z._filteredRecnoArray[Z._recno];
			Z._filteredRecnoArray.splice(Z._recno, 1);
		}
		Z.changedStatus(jslet.data.DataSetStatus.DELETE);
		Z._dataList.splice(k, 1);
		var mfld = Z._datasetField;
		if (mfld && mfld.dataset()) {
			mfld.dataset().editRecord();
		}

		Z.status(jslet.data.DataSetStatus.BROWSE);
		
		var evt = jslet.data.RefreshEvent.deleteEvent(preRecno);
		Z.refreshControl(evt);

		if (isLast) {
			Z._silence++;
			try {
				Z.prior();
			} finally {
				Z._silence--;
			}
		}
		if (Z.isBof() && Z.isEof()) {
			return;
		}
		evt = jslet.data.RefreshEvent.scrollEvent(Z._recno);

		Z.refreshControl(evt);
	},

	/**
	 * @private
	 */
	_innerValidateData: function () {
		var Z = this;
		if (Z._status == jslet.data.DataSetStatus.BROWSE || Z.recordCount() === 0) {
			return;
		}
		var fldObj, v, fldName, maxFld, fmax, vmax, fldValue, invalidMsg;

		for (var i = 0, cnt = Z._normalFields.length; i < cnt; i++) {
			fldObj = Z._normalFields[i];
			if (fldObj.disabled() || fldObj.readOnly() || !fldObj.visible()) {
				continue;
			}
			fldName = fldObj.name();
			fldValue = Z.getFieldValue(fldName);
			if(fldObj.valueStyle() == jslet.data.FieldValueStyle.NORMAL) {
				if(!fldObj.message()) {
					invalidMsg = Z.fieldValidator.checkRequired(fldObj, fldValue);
					invalidMsg = invalidMsg || Z.fieldValidator.checkValue(fldObj, fldValue);
					if (invalidMsg) {
						fldObj.message(invalidMsg);
					}
				}
			} else {
				invalidMsg = Z.fieldValidator.checkRequired(fldObj, fldValue);
				if (invalidMsg) {
					fldObj.message(invalidMsg);
					return;
				}
				if(fldValue) {
					for(var k = 0, len = fldValue.length; k < len; k++) {
						if(!fldObj.message(k)) {
							invalidMsg = invalidMsg || Z.fieldValidator.checkValue(fldObj, fldValue);
							if (invalidMsg) {
								fldObj.message(invalidMsg, k);
							}
						}
					} //end for k
				}
			}
			
		} //end for i
	},

	/**
	 * @private
	 */
	errorMessage: function(errMessage) {
		var evt = jslet.data.RefreshEvent.errorEvent(errMessage || '');
		this.refreshControl(evt);
	},
	
	/**
	 * Confirm insert or update
	 */
	confirm: function () {
		var Z = this;
		if (Z._silence || Z._status == jslet.data.DataSetStatus.BROWSE) {
			return true;
		}
		Z._innerValidateData();
		var evt;
		if (Z.hasFieldErrorMessage()) {
			if (Z._autoShowError) { 
				jslet.showInfo(jslet.locale.Dataset.cannotConfirm);
			}
			Z._aborted = true;
			evt = jslet.data.RefreshEvent.updateRecordEvent();
			Z.refreshControl(evt);
			Z.errorMessage(jslet.locale.Dataset.cannotConfirm);			
			return false;
		}
		Z.errorMessage();
		Z._aborted = false;
		Z._fireDatasetEvent(jslet.data.DatasetEvent.BEFORECONFIRM);
		if (Z._aborted) {
			return false;
		}
		var rec;
		if (Z._status == jslet.data.DataSetStatus.INSERT) {
			if (Z._logChanged) {
				rec = Z.getRecord();
				Z._insertedDelta.push(rec);
			}
		} else {
			if (Z._logChanged) {
				rec = Z.getRecord();
				if (Z._insertedDelta.indexOf(rec) < 0 ) {
					var k = Z._updatedDelta.indexOf(rec);
					if (k < 0) {
						Z._updatedDelta.push(rec);
					} else {
						Z._updatedDelta[k] = rec;
					}
				}
			}
		}
		Z._modiObject = null;
		Z.status(jslet.data.DataSetStatus.BROWSE);
		
		Z.clearFieldErrorMessage();
		Z._fireDatasetEvent(jslet.data.DatasetEvent.AFTERCONFIRM);

		evt = jslet.data.RefreshEvent.updateRecordEvent();
		Z.refreshControl(evt);
		return true;
	},

	/**
	 * Cancel insert or update
	 */
	cancel: function () {
		var Z = this;
		if (Z._status == jslet.data.DataSetStatus.BROWSE) {
			return;
		}
		if (Z.recordCount() === 0) {
			return;
		}
		Z._aborted = false;
		Z._fireDatasetEvent(jslet.data.DatasetEvent.BEFORECANCEL);
		if (Z._aborted) {
			return;
		}

		Z.clearFieldErrorMessage();
		var evt, k = Z._recno;
		if (Z._status == jslet.data.DataSetStatus.INSERT) {
			var no = Z.recno();
			if (Z._filteredRecnoArray) {
				k = Z._filteredRecnoArray[Z._recno];
				Z._filteredRecnoArray.splice(Z._recno, 1);
			}
			Z._dataList.splice(k, 1);
			if(no >= Z.recordCount()) {
				Z._recno = Z.recordCount() - 1;
			}
			evt = jslet.data.RefreshEvent.deleteEvent(no);
			Z.refreshControl(evt);
			Z.status(jslet.data.DataSetStatus.BROWSE);
			Z.changedStatus(jslet.data.DataSetStatus.BROWSE);
			return;
		} else {
			if (Z._filteredRecnoArray) {
				k = Z._filteredRecnoArray[Z._recno];
			}
			Z._dataList[k] = Z._modiObject;
			Z._modiObject = null;
		}

		Z.status(jslet.data.DataSetStatus.BROWSE);
		Z.changedStatus(jslet.data.DataSetStatus.BROWSE);
		Z._aborted = false;
		Z._fireDatasetEvent(jslet.data.DatasetEvent.AFTERCANCEL);

		evt = jslet.data.RefreshEvent.updateRecordEvent();
		Z.refreshControl(evt);
	},

	/**
	 * Set or get logChanges
	 * if NOT need send changes to Server, can set logChanges to false  
	 * 
	 * @param {Boolean} logChanged
	 */
	logChanges: function (logChanged) {
		if (logChanged === undefined) {
			return Z._logChanged;
		}

		this._logChanged = logChanged;
	},

	/**
	 * Disable refreshing controls, you often use it in a batch operation;
	 * After batch operating, use enableControls()
	 */
	disableControls: function () {
		this._lockCount++;
		var fldObj, lkf, lkds;
		for (var i = 0, cnt = this._normalFields.length; i < cnt; i++) {
			fldObj = this._normalFields[i];
			lkf = fldObj.lookup();
			if (lkf !== null) {
				lkds = lkf.dataset();
				if (lkds !== null) {
					lkds.disableControls();
				}
			}
		}
	},

	/**
	 * Enable refreshing controls.
	 * 
	 * @param {Boolean} refreshCtrl true - Refresh control immediately, false - Otherwise.
	 */
	enableControls: function (needRefreshCtrl) {
		if (this._lockCount > 0) {
			this._lockCount--;
		}
		if (!needRefreshCtrl) {
			this.refreshControl();
		}

		var fldObj, lkf, lkds;
		for (var i = 0, cnt = this._normalFields.length; i < cnt; i++) {
			fldObj = this._normalFields[i];
			lkf = fldObj.lookup();
			if (lkf !== null) {
				lkds = lkf.dataset();
				if (lkds !== null) {
					lkds.enableControls(needRefreshCtrl);
				}
			}
		}
	},

	/**
	 * Get field value of current record
	 * 
	 * @param {String} fldName - field name
	 * @param {Integer or undefined} valueIndex get the specified value if a field has multiple values.
	 *		if valueIndex is not specified, all values(Array of value) will return.
	 * @return {Object}
	 */
	getFieldValue: function (fldName, valueIndex) {
		if (this.recordCount() === 0) {
			return null;
		}

		var currRec = this.getRecord();
		if (!currRec) {
			return null;
		}
		return this.fieldValueByRec(currRec, fldName, valueIndex);
	},

	/**
	 * Set field value of current record.
	 * 
	 * @param {String} fldName - field name
	 * @param {Object} value - field value
	 * @param {Integer or undefined} valueIndex set the specified value if a field has multiple values.
	 *		if valueIndex is not specified, Array of value will be set.
	 * @return {this}
	 */
	setFieldValue: function (fldName, value, valueIndex) {
		var Z = this,
			fldObj = Z.getField(fldName);
		if(Z._status == jslet.data.DataSetStatus.BROWSE) {
			Z.editRecord();
		}
		var currRec = Z.getRecord();
		if(fldObj.valueStyle() == jslet.data.FieldValueStyle.NORMAL || valueIndex === undefined) {
			currRec[fldName] = value;
			if (fldObj.getType() == jslet.data.DataType.DATASET) {//dataset field
				var subds = fldObj.subDataset();
				subds.dataList(value);
				return this;
			}
		} else {
			var arrValue = currRec[fldName];
			if(!arrValue || !jslet.isArray(arrValue)) {
				arrValue = [];
				currRec[fldName] = arrValue;
			}
			var len = arrValue.length;
			if(valueIndex < len) {
				arrValue[valueIndex] = value;
			} else {
				for(var i = len; i < valueIndex; i++) {
					arrValue.push(null);
				}
				arrValue.push(value);
			}
		}
		fldObj.message(null, valueIndex);
		if (Z.onFieldChange) {
			Z.onFieldChange.call(Z, fldName, value, valueIndex);
		}
		//calc other fields' range to use context rule
		if (!Z._silence && Z._contextRuleEnabled && value) {
			Z.calcContextRule(fldName);
		}
		jslet.data.FieldValueCache.clear(Z.getRecord(), fldName);
		var evt = jslet.data.RefreshEvent.updateRecordEvent(fldName);
		Z.refreshControl(evt);
		Z.updateFormula();
		return this;
	},

	/**
	 * @rivate
	 */
	removeInnerFormularFields: function (fldName) {
		if (this._innerFormularFields) {
			this._innerFormularFields.remove(fldName);
		}
	},

	/**
	 * Get field value of specified record
	 * 
	 * @param {Object} dataRec - specified record
	 * @param {String} fldName - field name
	 * @return {Object} field value
	 */
	fieldValueByRec: function (dataRec, fldName, valueIndex) {
		var Z = this;
		if (Z.recordCount() === 0) {
			return null;
		}

		if (!dataRec) {
			dataRec = Z.getRecord();
		}

		var k = fldName.indexOf('.'), 
			subfldName, fldValue = null,
			fldObj = Z.getField(fldName),
			value, lkds;
		if (!fldObj) {
			throw new Error(jslet.formatString(jslet.locale.Dataset.fieldNotFound, [fldName]));
		}
		if (k > 0) {
			subfldName = fldName.substr(0, k);
			fldObj = Z.getField(subfldName);
			var lkf = fldObj.lookup();
			if (!lkf) {
				throw new Error(jslet.formatString(jslet.locale.Dataset.lookupNotFound, [subfldName]));
			}
			value = dataRec[subfldName];
			lkds = lkf.dataset();
			if (lkds.findByField(lkds.keyField(), value)) {
				fldValue = lkds.getFieldValue(fldName.substr(k + 1));
			} else {
				throw new Error(jslet.formatString(jslet.locale.Dataset.valueNotFound,
							[lkds.name(),lkds.keyField(), value]));
			}
		} else {
			var formula = fldObj.formula();
			if (!formula) {
				value = dataRec[fldName];
				fldValue = value !== undefined ? value :null;
			} else {
				if (Z._innerFormularFields === null) {
					Z._innerFormularFields = new jslet.SimpleMap();
				}
				var evaluator = Z._innerFormularFields.get(fldName);
				if (evaluator === null) {
					evaluator = new jslet.Expression(this, formula);
					Z._innerFormularFields.set(fldName, evaluator);
				}
				evaluator.context.dataRec = dataRec;
				fldValue = evaluator.eval();
			}
		}

		if(fldObj.valueStyle() == jslet.data.FieldValueStyle.NORMAL || valueIndex === undefined) {
			return fldValue;
		}
		return jslet.getArrayValue(fldValue, valueIndex);
	},

	hasFieldErrorMessage: function() {
		var fields = this.getNormalFields();
		for(var i = 0, len = fields.length; i < len; i++) {
			if(fields[i].message()) {
				return true;
			}
		}
		return false;
	},
	
	clearFieldErrorMessage: function() {
		var fields = this.getNormalFields();
		for(var i = 0, len = fields.length; i < len; i++) {
			fields[i].message(null);
		}
	},
	
	/**
	 * Get field display text 
	 * 
	 * @param {String} fldName Field name
	 * @param {Boolean} isEditing In edit mode or not, if in edit mode, return 'Input Text', else return 'Display Text'
	 * @param {Integer} valueIndex identify which item will get if the field has multiple values.
	 * @return {String} 
	 */
	getFieldText: function (fldName, isEditing, valueIndex) {
		var Z = this;
		if (Z.recordCount() === 0) {
			return '';
		}
		var currRec = Z.getRecord(), 
			k = fldName.indexOf('.'), 
			fldObj, lkf, lkds, value;
		if (k > 0) { //Field chain
			fldName = fldName.substr(0, k);
			fldObj = Z.getField(fldName);
			if (!fldObj) {
				throw new Error(jslet.formatString(jslet.locale.Dataset.fieldNotFound, [fldName]));
			}
			lkf = fldObj.lookup();
			if (!lkf) {
				throw new Error(jslet.formatString(jslet.locale.Dataset.lookupNotFound, [fldName]));
			}
			value = currRec[fldName];
			if (value === null || value === undefined) {
				return '';
			}
			lkds = lkf.dataset();
			if (lkds.findByField(lkds.keyField(), value)) {
				fldName = fldName.substr(k + 1);
				if (fldName.indexOf('.') > 0) {
					return lkds.getFieldValue(fldName);
				} else {
					return lkds.getFieldText(fldName, isEditing, valueIndex);
				}
			} else {
				throw new Error(jslet.formatString(jslet.locale.Dataset.valueNotFound,
						[lkds.name(), lkds.keyField(), value]));
			}
		}
		//Not field chain
		fldObj = Z.getField(fldName);
		if (!fldObj) {
			throw new Error(jslet.formatString(jslet.locale.Dataset.lookupNotFound, [fldName]));
		}
		if (fldObj.getType() == jslet.data.DataType.DATASET) {
			return '[dataset]';
		}
		var valueStyle = fldObj.valueStyle(),
			result = [];
		if(valueStyle == jslet.data.FieldValueStyle.BETWEEN && valueIndex === undefined)
		{
			var minVal = Z.getFieldText(fldName, isEditing, 0),
				maxVal = Z.getFieldText(fldName, isEditing, 1);
			if(!isEditing && !minVal && !maxVal){
				return '';
			}
			result.push(minVal);
			if(isEditing) {
				result.push(jslet.global.valueSeparator);
			} else {
				result.push(jslet.locale.Dataset.betweenLabel);
			}
			result.push(maxVal);
			return result.join('');
		}
		
		if(valueStyle == jslet.data.FieldValueStyle.MULTIPLE && valueIndex === undefined)
		{
			var arrValues = Z.getFieldValue(fldName), 
				len = 0;
			if(arrValues && jslet.isArray(arrValues)) {
				len = arrValues.length - 1;
			}
			
			for(var i = 0; i <= len; i++) {
				result.push(Z.getFieldText(fldName, isEditing, i));
				if(i < len) {
					result.push(jslet.global.valueSeparator);
				}
			}
			return result.join('');
		}
		//Get cached display value if exists.
		if(!isEditing) {
			var cacheValue = jslet.data.FieldValueCache.get(Z.getRecord(), fldName, valueIndex);
			if(cacheValue !== undefined) {
				return cacheValue;
			}
		}
		value = Z.getFieldValue(fldName, valueIndex);
		if (value === null || value === undefined) {
			return '';
		}

		var convert = fldObj.customValueConverter() || jslet.data.getValueConverter(fldObj);
		if(!convert) {
			throw new Error('Can\'t find any field value converter!');
		}
		var text = convert.valueToText.call(Z, fldObj, value, isEditing);
		//Put display value into cache
		if(!isEditing) {
			jslet.data.FieldValueCache.put(Z.getRecord(), fldName, text, valueIndex);
		}
		return text;
	},
	
	/**
	 * @private
	 */
	updateFormula: function () {
		var cnt = this._normalFields.length, 
			fldObj,
			currRec = this.getRecord();
		for (var i = 0; i < cnt; i++) {
			fldObj = this._normalFields[i];
			var fldName = fldObj.name();
			if (fldObj.formula()) {//update all formular field
				jslet.data.FieldValueCache.clear(currRec, fldName);
				var evt = jslet.data.RefreshEvent.updateRecordEvent(fldName);
				this.refreshControl(evt);
			}
		}
	},
	
	setFieldValueLength: function(fldObj, valueLength) {
		if(fldObj.valueStyle() == jslet.data.FieldValueStyle.NORMAL) {
			return;
		}
		var value = this.getFieldValue(fldObj.name());
		if(jslet.isArray(value)) {
			value.length = valueLength;
		}
	},
	
	/**
	 * Set field value by input value. There are two forms to use:
	 *   1. setFieldText(fldName, inputText, valueIndex)
	 *   2. setFieldText(fldName, inputText, keyValue, displayValue, valueIndex)
	 *   
	 * @param {String} fldName - field name
	 * @param {String} inputText - String value inputed by user
	 * @param {Object} keyValue - key value
	 * @param {String} displayValue - display value
	 * @param {Integer} valueIndex identify which item will set if the field has multiple values.
	 */
	setFieldText: function (fldName, inputText, valueIndex) {
		var Z = this,
			fldObj = Z.getField(fldName);
		if (fldObj === null) {
			throw new Error(jslet.formatString(jslet.locale.Dataset.fieldNotFound, [fldName]));
		}
		var fType = fldObj.getType();
		if (fType == jslet.data.DataType.DATASET) {
			throw new Error(jslet.formatString(jslet.locale.Dataset.datasetFieldNotBeSetValue, [fldName]));
		}
		
		if(fldObj.valueStyle() !== jslet.data.FieldValueStyle.NORMAL && valueIndex === undefined) {
			//Set an array value
			if(!jslet.isArray(inputText)) {
				inputText = inputText.split(jslet.global.valueSeparator);
			}
			var len = inputText.length;
			for(var k = 0; k < len; k++ ) {
				Z.setFieldText(fldName, inputText[k], k);
			}
			Z.setFieldValueLength(fldObj, len);
			return;
		}
		var invalidMsg = Z.fieldValidator.checkInputText(fldObj, inputText);
		if (invalidMsg) {
			fldObj.message(invalidMsg, valueIndex);
			return;
		}
		
		if(!inputText){
			Z.setFieldValue(fldName, null, valueIndex);
			return;
		}
		var convert = fldObj.customValueConverter() || jslet.data.getValueConverter(fldObj);
		if(!convert) {
			throw new Error('Can\'t find any field value converter!');
		}
		var value = convert.textToValue.call(Z, fldObj, inputText, valueIndex);
		Z.setFieldValue(fldName, value, valueIndex);
	},

	/**
	 * Get key value of current record
	 * 
	 * @return {Object} Key value
	 */
	keyValue: function () {
		if (!this._keyField || this.recordCount() === 0) {
			return null;
		}
		return this.getFieldValue(this._keyField);
	},

	/**
	 * Get parent record key value of current record
	 * 
	 * @return {Object} Parent record key value.
	 */
	parentValue: function () {
		if (!this._parentField || this.recordCount() === 0) {
			return null;
		}
		return this.getFieldValue(this._parentField);
	},

	/**
	 * Find record with specified condition
	 * if found, then move cursor to that record
	 * <pre><code>
	 *   dsFoo.find('[name] like "Bob%"');
	 *   dsFoo.find('[age] > 20');
	 * </code></pre>
	 * @param {String} condition condition expression.
	 * @return {Boolean} 
	 */
	find: function (condition) {
		var Z = this;
		if (Z.recordCount() === 0) {
			return false;
		}
		if (condition === null) {
			Z._findCondition = null;
			Z._innerFindCondition = null;
			return false;
		}

		if (condition != Z._findCondition) {
			Z._innerFindCondition = new jslet.Expression(this, condition);
		}
		if (Z._innerFindCondition.eval()) {
			return true;
		}
		Z._silence++;
		var foundRecno = -1, oldRecno = Z._recno;
		try {
			Z.first();
			while (!Z.isEof()) {
				if (Z._innerFindCondition.eval()) {
					foundRecno = Z._recno;
					break;
				}
				Z.next();
			}
		} finally {
			Z._silence--;
			Z._recno = oldRecno;
		}
		if (foundRecno >= 0) {// can fire scroll event
			Z._gotoRecno(foundRecno);
			return true;
		}
		return false;
	},

	/**
	 * Find record with specified field name and value
	 * 
	 * @param {String} fldName - field name
	 * @param {Object} findingValue - finding value
	 * @return {Boolean} 
	 */
	findByField: function (fldName, findingValue) {
		var Z = this;
		
		var value, i;
		if(Z._ignoreFilter) {
			if(!Z._dataList || Z._dataList.length === 0) {
				return false;
			}
			var len = Z._dataList.length;
			for(i = 0; i < len; i++) {
				value = Z.fieldValueByRec(Z._dataList[i], fldName);
				if (value == findingValue) {
					Z._ignoreFilterRecno = i;
					return true;
				}
			}
			
		}
		if (Z.recordCount() === 0) {
			return false;
		}

		value = Z.getFieldValue(fldName);
		if (value == findingValue) {
			return true;
		}

		var foundRecno = -1, oldRecno = Z.recno();
		try {
			var cnt = Z.recordCount();
			for (i = 0; i < cnt; i++) {
				Z.recnoSilence(i);
				value = Z.getFieldValue(fldName);
				if (value == findingValue) {
					foundRecno = Z._recno;
					break;
				}
			}
		} finally {
			Z.recnoSilence(oldRecno);
		}
		if (foundRecno >= 0) {// can fire scroll event
			Z._gotoRecno(foundRecno);
			return true;
		}
		return false;
	},

	/**
	 * Find record with key value.
	 * 
	 * @param {Object} keyValue Key value.
	 * @return {Boolean}
	 */
	findByKey: function (keyValue) {
		var keyField = this.keyField();
		if (!keyField) {
			return false;
		}
		return this.findByField(keyField, keyValue);
	},

	/**
	 * Find record and return specified field value
	 * 
	 * @param {String} fldName - field name
	 * @param {Object} findingValue - finding field value
	 * @param {String} returnFieldName - return value field name
	 * @return {Object} 
	 */
	lookup: function (fldName, findingValue, returnFieldName) {
		if (this.findByField(fldName, findingValue)) {
			return this.getFieldValue(returnFieldName);
		} else {
			return null;
		}
	},

	lookupByKey: function(keyValue, returnFldName) {
		if (this.findByKey(keyValue)) {
			return this.getFieldValue(returnFldName);
		} else {
			return null;
		}
	},
	
	/**
	 * Copy dataset's data. Example:
	 * <pre><code>
	 * var list = dsFoo.copyDataset(true);
	 * 
	 * </code></pre>
	 * 
	 * @param {Boolean} underCurrentFilter - if true, copy data under dataset's {@link}filter
	 * @return {Object[]} Array of records. 
	 */
	copyDataset: function (underCurrentFilter) {
		var Z = this;
		if (Z.recordCount() === 0) {
			return null;
		}
		var result = [];

		if ((!underCurrentFilter || !Z._filtered)) {
			return Z._dataList.slice(0);
		}

		var foundRecno = -1, oldRecno = Z._recno, oldFiltered = Z._filtered;
		if (!underCurrentFilter) {
			Z._filtered = false;
		}

		Z._silence++;
		try {
			Z.first();
			while (!Z.isEof()) {
				result.push(Z.getRecord());
				Z.next();
			}
		} finally {
			Z._silence--;
			Z._recno = oldRecno;
			if (!underCurrentFilter) {
				Z._filtered = oldFiltered;
			}
		}
		return result;
	},

	/**
	 * Set or get 'key' field name
	 * 
	 * @param {String} keyFldName Key field name.
	 * @return {String or this}
	 */
	keyField: function (keyFldName) {
		if (keyFldName === undefined) {
			return this._keyField;
		}
		jslet.Checker.test('Dataset.keyField', keyFldName).isString();
		this._keyField = jQuery.trim(keyFldName);
		return this;
	},

	/**
	 * Set or get 'code' field name
	 * 
	 * @param {String} codeFldName Code field name.
	 * @return {String or this}
	 */
	codeField: function (codeFldName) {
		if (codeFldName === undefined) {
			return this._codeField;
		}
		
		jslet.Checker.test('Dataset.codeField', codeFldName).isString();
		this._codeField = jQuery.trim(codeFldName);
		return this;
	},
	
	/**
	 * Set or get 'name' field name
	 * 
	 * @param {String} nameFldName Name field name
	 * @return {String or this}
	 */
	nameField: function (nameFldName) {
		if (nameFldName === undefined) {
			return this._nameField;
		}
		
		jslet.Checker.test('Dataset.nameField', nameFldName).isString();
		this._nameField = jQuery.trim(nameFldName);
		return this;
	},

	/**
	 * Set or get 'parent' field name
	 * 
	 * @param {String} parentFldName Parent field name.
	 * @return {String or this}
	 */
	parentField: function (parentFldName) {
		if (parentFldName === undefined) {
			return this._parentField;
		}
		
		jslet.Checker.test('Dataset.parentField', parentFldName).isString();
		this._parentField = jQuery.trim(parentFldName);
		return this;
	},
	
	/**
	 * Set or get 'select' field name. "Select field" is a field to store the selected state of a record. 
	 * 
	 * @param {String} parentFldName Parent field name.
	 * @return {String or this}
	 */
	selectField: function (selectFldName) {
		if (selectFldName === undefined) {
			return this._selectField;
		}
		
		jslet.Checker.test('Dataset.selectField', selectFldName).isString();
		this._selectField = jQuery.trim(selectFldName);
		return this;
	},
	
	/**
	 * @private
	 */
	_convertFieldValue: function (srcField, srcValues, destFields) {
		var Z = this;

		if (destFields === null) {
			throw new Error('NOT set destFields in method: ConvertFieldValue');
		}
		var isExpr = destFields.indexOf('[') > -1;
		if (isExpr) {
			if (destFields != Z._convertDestFields) {
				Z._innerConvertDestFields = new jslet.Expression(this,
						destFields);
				Z._convertDestFields = destFields;
			}
		}
		if (typeof (srcValues) != 'string') {
			srcValues += '';
		}
		var separator = jslet.global.valueSeparator;
		var values = srcValues.split(separator), valueCnt = values.length - 1;
		Z._ignoreFilter = true;
		try {
			if (valueCnt === 0) {
				if (!Z.findByField(srcField, values[0])) {
					return null;
					//throw new Error(jslet.formatString(jslet.locale.Dataset.valueNotFound,[Z._name, srcField, values[0]]));
				}
				if (isExpr) {
					return Z._innerConvertDestFields.eval();
				} else {
					return Z.getFieldValue(destFields);
				}
			}
	
			var fldcnt, destValue = '';
			for (var i = 0; i <= valueCnt; i++) {
				if (!Z.findByField(srcField, values[i])) {
					return null;
				}
				if (isExpr) {
					destValue += Z._innerConvertDestFields.eval();
				} else {
					destValue += Z.getFieldValue(destFields);
				}
				if (i != valueCnt) {
					destValue += separator;
				}
			}
			return destValue;
		} finally {
			Z._ignoreFilter = false;
		}
	},

	/**
	 * Set or get context rule
	 * 
	 * @param {jslet.data.ContextRule[]} contextRule Context rule;
	 * @return {jslet.data.ContextRule[] or this}
	 */
	contextRules: function (rules) {
		if (rules === undefined) {
			return this._contextRules;
		}
		jslet.Checker.test('Dataset.contextRule', rules).isArray();
		if(!rules || rules.length === 0) {
			this._contextRules = null;
			this._contextRuleEngine = null;
		} else {
			var ruleObj;
			for(var i = 0, len = rules.length; i < len; i++) {
				ruleObj = rules[i];
				if(!ruleObj.className || 
						ruleObj.className != jslet.data.ContextRule.className) {
					rules[i] = jslet.data.createContextRule(ruleObj);
				}
			}
			this._contextRules = rules;
			this._contextRuleEngine = new jslet.data.ContextRuleEngine(this);
			this._contextRuleEngine.compile();
		}
		return this;
	},
	
	/**
	 * Disable context rule
	 */
	disableContextRule: function () {
		this._contextRuleEnabled = false;
//		this.restoreContextRule();
	},

	/**
	 * Enable context rule, any context rule will be calculated.
	 */
	enableContextRule: function () {
		this._contextRuleEnabled = true;
		this.calcContextRule();
	},

	/**
	 * Check context rule enable or not.
	 * 
	 * @return {Boolean}
	 */
	isContextRuleEnabled: function () {
		return this._contextRuleEnabled;
	},

	/**
	 * @private
	 */
	calcContextRule: function (changedField) {
		if(this._contextRuleEngine) {
			if(!changedField) {
				this._contextRuleEngine.evalStatus();
			}
			this._contextRuleEngine.evalRule(changedField);
		}
	},

	/**
	 * Check current record if it's selectable.
	 */
	checkSelectable: function () {
		if(this.recordCount() === 0) {
			return false;
		}
		if(this._onCheckSelectable) {
			return this._onCheckSelectable.call(this);
		}
		return true;
	},
	
	/**
	 * Get or set selected state of current record.
	 */
	selected: function (selected) {
		var selFld = this._selectField || jslet.global.selectStateField,
			rec = this.getRecord();
		
		if(selected === undefined) {
			return rec && rec[selFld];
		}
		
		if(rec) {
			if(this.checkSelectable()) {
				rec[selFld] = selected;
			}
		}
		return this;
	},
	
	/**
	 * Select/unselect all records.
	 * 
	 * @param {Boolean}selected  true - select records, false otherwise.
	 * @param {Function)onSelectAll Select event handler.
	 *	Pattern: function(dataset, Selected}{}
	 *	//dataset: jslet.data.Dataset
	 *	//Selected: Boolean
	 *	//return: true - allow user to select, false - otherwise.

	 * @param {Boolean}noRefresh Refresh controls or not.
	 */
	selectAll: function (selected, onSelectAll, noRefresh) {
		var Z = this;
		if (Z.recordCount() === 0) {
			return;
		}

		jslet.Checker.test('Dataset.selectAll#onSelectAll', onSelectAll).isFunction();
		var oldRecno = Z.recno();
		try {
			for (var i = 0, cnt = Z.recordCount(); i < cnt; i++) {
				Z.recnoSilence(i);

				if (onSelectAll) {
					var flag = onSelectAll(this, selected);
					if (flag !== undefined && !flag) {
						continue;
					}
				}
				Z.selected(selected);
			}
		} finally {
			Z.recnoSilence(oldRecno);
		}
		if (!noRefresh) {
			var evt = jslet.data.RefreshEvent.selectAllEvent(selected);
			Z.refreshControl(evt);
		}
	},

	/**
	 * Select/unselect record by key value.
	 * 
	 * @param {Boolean} selected true - select records, false otherwise.
	 * @param {Object) keyValue Key value.
	 * @param {Boolean} noRefresh Refresh controls or not.
	 */
	selectByKeyValue: function (selected, keyValue, noRefresh) {
		var Z = this,
			oldRecno = Z.recno(),
			cnt = Z.recordCount(),
			v, changedRecNum = [];
		try {
			for (var i = 0; i < cnt; i++) {
				Z.recnoSilence(i);
				v = Z.getFieldValue(Z._keyField);
				if (v == keyValue) {
					Z.selected(selected);
					changedRecNum.push(i);
					break;
				}
			} //end for
		} finally {
			Z.recnoSilence(oldRecno);
		}
		if (!noRefresh) {
			var evt = jslet.data.RefreshEvent.selectRecordEvent(changedRecNum, selected);
			Z.refreshControl(evt);
		}
	},

	/**
	 * Select current record or not.
	 * If 'selectBy' is not empty, select all records which value of 'selectBy' field is same as the current record.
	 * <pre><code>
	 * dsEmployee.select(true, 'gender');
	 * //if the 'gender' of current value is female, all female employees will be selected.  
	 * </code></pre>
	 * 
	 * @param {Boolean}selected - true: select records, false:unselect records
	 * @param {String)selectBy - field names, multiple fields concatenated with ',' 
	 */
	select: function (selected, selectBy) {
		var Z = this;
		if (Z.recordCount() === 0) {
			return;
		}

		var changedRecNum = [];
		if (!selectBy) {
			Z.selected(selected);
			changedRecNum.push(Z.recno());
		} else {
			var arrFlds = selectBy.split(','), 
				arrValues = [], i, 
				fldCnt = arrFlds.length;
			for (i = 0; i < fldCnt; i++) {
				arrValues[i] = Z.getFieldValue(arrFlds[i]);
			}
			var v, preRecno = Z.recno(), flag;
			try {
				for (var k = 0, recCnt = Z.recordCount(); k < recCnt; k++) {
					Z.recnoSilence(k);
					flag = 1;
					for (i = 0; i < fldCnt; i++) {
						v = Z.getFieldValue(arrFlds[i]);
						if (v != arrValues[i]) {
							flag = 0;
							break;
						}
					}
					if (flag) {
						Z.selected(selected);
						changedRecNum.push(Z.recno());
					}
				}
			} finally {
				Z.recnoSilence(preRecno);
			}
		}

		var evt = jslet.data.RefreshEvent.selectRecordEvent(changedRecNum, selected);
		Z.refreshControl(evt);
	},

	/**
	 * Set or get data provider
	 * 
	 * @param {jslet.data.Provider} provider - data provider
	 * @return {jslet.data.Provider or this}
	 */
	dataProvider: function (provider) {
		if (provider === undefined) {
			return this._dataProvider;
		}
		this._dataProvider = provider;
		return this;
	},
	
	/**
	 * @private
	 */
	_checkDataProvider: function () {
		if (!this._dataProvider) {
			alert('DataProvider required, use: yourDataset.dataProvider(yourDataProvider);');
			return false;
		}
		return true;
	},

	/**
	 * Get inserted records, use this method to get inserted records that need apply to server.
	 * 
	 * @return {Array of Object} 
	 */
	insertedRecords: function () {
		this._checkStatusAndConfirm();
		return this._insertedDelta;
	},

	/**
	 * Get updated records, use this method to get updated records that need apply to server.
	 * 
	 * @return {Array of Object}
	 */
	updatedRecords: function () {
		this._checkStatusAndConfirm();
		return this._updatedDelta;
	},

	/**
	 * Get deleted records, use this method to get deleted records that need apply to server.
	 * 
	 * @return {Array of Object}
	 */
	deletedRecords: function () {
		return this._deletedDelta;
	},
	
	/**
	 * Get selected records
	 * 
	 * @return {Object[]} Array of records
	 */
	selectedRecords: function () {
		var Z = this;
		if (Z._dataList === null || Z._dataList.length === 0) {
			return null;
		}

		var preRecno = Z.recno(), result = [];
		try {
			for (var k = 0, recCnt = Z.recordCount(); k < recCnt; k++) {
				Z.recnoSilence(k);
				if(Z.selected()) {
					result.push(Z.getRecord());
				}
			}
		} finally {
			Z.recnoSilence(preRecno);
		}
		
		return result;
	},

	/**
	 * Get key values of selected records.
	 * 
	 * @return {Object[]} Array of selected record key values
	 */
	selectedKeyValues: function () {
		var oldRecno = this.recno(), result = [];
		try {
			for (var i = 0, cnt = this.recordCount(); i < cnt; i++) {
				this.recnoSilence(i);
				if (this.selected()) {
					result.push(this.getFieldValue(this._keyField));
				}
			}
		} finally {
			this.recnoSilence(oldRecno);
		}
		if (result.length > 0) {
			return result;
		} else {
			return null;
		}
	},

	queryUrl: function(url) {
		if(url === undefined) {
			return this._queryUrl;
		}
		jslet.Checker.test('Dataset.queryUrl', url).isString();
		this._queryUrl = jQuery.trim(url);
		return this;
	},
	
	/**
	 * Query data from server. Example:
	 * <pre><code>
	 * dsEmployee.queryUrl('../getemployee.do');
	 * var criteria = {name:'Bob', age:25};
	 * dsEmployee.query(condition);
	 * </code></pre>
	 * @param {Object} condition Condition should be a JSON object.
	 */
	query: function (criteria) {
		this._queryCriteria = criteria;
		return this.requery();
	},

	_doQuerySuccess: function(result, dataset) {
		var Z = dataset;
		if (!result) {
			Z.dataList(null);
			return;
		}
		var mainData = result.main;
		if (mainData) {
			Z.dataList(mainData);
		}
		var extraData = result.extraEntities;
		if(extraData) {
			var dsName, ds;
			for (var dsName in extraData) {
				ds = jslet.data.dataModule.get(dsName);
				if (ds) {
					ds.dataList(extraData[dsName]);
				}
			}
		}
		if (result.pageNo) {
			Z._pageNo = result.pageNo;
		}
		if (result.pageCount) {
			Z._pageCount = result.pageCount;
		}

		var evt = jslet.data.RefreshEvent.changePageEvent();
		Z.refreshControl(evt);
	},
	
	_doApplyError: function(result, dataset) {
		var Z = dataset,
			errCode = result.errorCode,
			errMsg = result.errorMessage;
		Z.errorMessage(errCode + " : " + errMsg);
		if(Z._autoShowError) {
			jslet.showException(errCode + " : " + errMsg);
		}
	},
	
	/**
	 * Send request to refresh with current condition.
	 */
	requery: function () {
		var Z = this;
		if (!Z._checkDataProvider()) {
			return;
		}
		if(!this._queryUrl) {
			throw new Error('QueryUrl required! Use: yourDataset.queryUrl(yourUrl)');
		}

		var reqData = {};
		if(Z._pageNo > 0) {
			reqData.pageNo = Z._pageNo;
			reqData.pageSize = Z._pageSize;
		}
		var criteria = Z._queryCriteria;
		if(criteria) {
			if(jslet.isArray(criteria)) {
				reqData.criteria = criteria;
			} else {
				reqData.simpleCriteria = criteria;
			}
		}
		if(Z.csrfToken) {
			reqData.csrfToken = Z.csrfToken;
		}
		var reqData = jslet.data.record2Json(reqData);
		return Z._dataProvider.sendRequest(Z, Z._queryUrl, reqData)
		.done(Z._doQuerySuccess)
		.fail(Z._doApplyError);
	},

	_setChangedState: function(flag, chgRecs, pendingRecs) {
		if (chgRecs && chgRecs.length > 0) {
			var pRec = {};
			var recClazz = this._recordClass;
			if(recClazz) {
				pRec["@type"] = recClazz;
			}
			for (var i = 0, cnt = chgRecs.length; i < cnt; i++) {
				rec = chgRecs[i];
				rec[jslet.global.changeStateField] = flag + i;
				for(var prop in rec) {
					pRec[prop] = rec[prop];
				}
				pendingRecs.push(pRec);
			}
		}
	},
	
	_clearChangeState: function(chgedRecs) {
		if(!chgedRecs) {
			return;
		}
		var rec;
		for(var i = 0, len = chgedRecs.length; i < len; i++) {
			rec = chgedRecs[i];
			delete rec[jslet.global.changeStateField];			
		}
	},
	
	_doSaveSuccess: function(result, dataset) {
		if (!result) {
			return;
		}
		result = result.main;
		var Z = dataset;
		jslet.data.convertDateFieldValue(Z, result);
		var state, rec, c, oldRecs, oldRec;
		for(var i = 0, len = result.length; i < len; i++) {
			rec = result[i];
			state = rec[jslet.global.changeStateField];
			if(!state) {
				continue;
			}
			c = state.charAt(0);
			if(c == 'i' || c == 'u') {
				oldRecs = (c == 'i' ? Z.insertedRecords() : Z.updatedRecords());
				for(var k = 0, cnt = oldRecs.length; k < cnt; k++) {
					oldRec = oldRecs[k];
					if(oldRec[jslet.global.changeStateField] == state) {
						for(var fldName in rec) {
							oldRec[fldName] = rec[fldName];
						}
						break;
					}
					jslet.data.FieldValueCache.removeCache(oldRec);
				} //end for k
			}
		} //end for i
		
		Z._clearChangeState(Z.insertedRecords());
		Z._clearChangeState(Z.updatedRecords());
		Z._insertedDelta = [];
		Z._updatedDelta = [];
		Z._deletedDelta = [];
		
		Z.refreshControl();
		Z.refreshHostDataset();
	},
	
	submitUrl: function(url) {
		if(url === undefined) {
			return this._submitUrl;
		}

		jslet.Checker.test('Dataset.submitUrl', url).isString();
		this._submitUrl = jQuery.trim(url);
		return this;
	},
	
	/**
	 * Submit changed data to server. 
	 * If server side save data successfully and return the changed data, Jslet can refresh the local data automatically.
	 * 
	 * Cause key value is probably generated at server side(like sequence), we need an extra field which store an unique value to update the key value,
	 * this extra field is named '_s_', its value will start a letter 'i', 'u' or 'd', and follow a sequence number, like: i1, i2, u1, u2, d1, d3,....
	 * You don't care about it in client side, it is generated by Jslet automatically.
	 * 
	 * At server side, you can use the leading letter to distinguish which action will be sent to DB('i' for insert, 'u' for update and 'd' for delete)
	 * If the records need be changed in server(like sequence key or other calculated fields), you should return them back.Notice:
	 * you need not to change this value of extra field: '_s_', just return it. Example:
	 * <pre><code>
	 * dsFoo.insertRecord();
	 * dsFoo.setFieldValue('name','Bob');
	 * dsFoo.setFieldValue('code','A01');
	 * dsFoo.confirm();
	 * dsFoo.submitUrl('../foo_save.do');
	 * dsFoo.submit();
	 * </code></pre>
	 * 
	 * @param {String} url Url
	 */
	submit: function(url) {
		var Z = this;
		if (!Z._checkDataProvider()) {
			return;
		}
		if(url) {
			Z._submitUrl = url.trim();
		}
		if(!Z._submitUrl) {
			alert('SubmitUrl required! Use: yourDataset.submitUrl(yourUrl)');
			return;
		}
		var changedRecs = [];
		Z._setChangedState('i', Z.insertedRecords(), changedRecs);
		Z._setChangedState('u', Z.updatedRecords(), changedRecs);
		Z._setChangedState('d', Z.deletedRecords(), changedRecs);

		if (!changedRecs || changedRecs.length === 0) {
			return;
		}
		var reqData = {main: changedRecs};
		if(Z.csrfToken) {
			reqData.csrfToken = Z.csrfToken;
		}
		reqData = jslet.data.record2Json(reqData);
		return Z._dataProvider.sendRequest(Z, Z._submitUrl, reqData)
		.done(Z._doSaveSuccess)
		.fail(Z._doApplyError);
	},
	
	_doSubmitSelectedSuccess: function(result, dataset) {
		result = result.main;
		if (!result || result.length === 0) {
			return;
		}
		var Z = dataset;
		var deleteOnSuccess = Z._deleteOnSuccess_;
		
		var arrRecs = Z.selectedRecords(),
			i, k;
		if(deleteOnSuccess) {
			for(i = arrRecs.length; i >= 0; i--) {
				rec = arrRecs[i];
				k = Z._dataList.indexOf(rec);
				Z._dataList.splice(k, 1);
			}
		} else {
			var newRec, oldRec, len;
			jslet.data.convertDateFieldValue(this, result);
			for(i = arrRecs.length - 1; i >= 0; i--) {
				oldRec = arrRecs[i];
				len = result.length;
				for(k = 0; k < len; k++)
				{
					newRec = result[k];
					if(oldRec[jslet.global.changeStateField] == newRec[jslet.global.changeStateField]) {
						for(var propName in newRec) {
							oldRec[propName] = newRec[propName];
						}
						//clear change state flag
						delete oldRec[jslet.global.changeStateField];
						//clear selected flag
						var selFld = this._selectField || jslet.global.selectStateField;
						delete oldRec[selFld];
						break;
					}
					jslet.data.FieldValueCache.removeCache(oldRec);
				} //end for k
			}//end for i
		}
		Z.refreshControl();
		Z.refreshHostDataset();
	},
	
	/**
	 * Send selected data to server whether or not the records have been changed. 
	 * Under some special scenarios, we need send user selected record to server to process. 
	 * Sever side need not send back the processed records. Example:
	 * 
	 * <pre><code>
	 * //Audit the selected records, if successful, delete the selected records.
	 * dsFoo.submitSelected('../foo_audit.do', true);
	 * 
	 * </code></pre>
	 * @param {String} url Url
	 * @param {Boolean} deleteOnSuccess If processing successfully at server side, delete the selected record or not.
	 */
	submitSelected: function (url, deleteOnSuccess) {
		var Z = this;
		if (!Z._checkDataProvider()) {
			return;
		}
		if(!url) {
			alert('Url required! Use: yourDataset.submitSelected(yourUrl)');
			return;
		}
		var changedRecs = [];
		Z._setChangedState('s', Z.selectedRecords(), changedRecs);
		var arrRecs = Z.selectedRecords();
		if (!changedRecs || changedRecs.length === 0) {
			return;
		}
		Z._deleteOnSuccess_ = deleteOnSuccess;
		var reqData = {main: changedRecs};
		if(Z.csrfToken) {
			reqData.csrfToken = Z.csrfToken;
		}
		reqData = jslet.data.record2Json(reqData);
		return Z._dataProvider.sendRequest(Z, url, reqData)
		.done(Z._doSubmitSelectedSuccess)
		.fail(Z._doApplyError);
	},

	/**
	 * @private
	 */
	_refreshInnerControl: function (updateEvt) {
		var i, cnt, ctrl;
		if (updateEvt.eventType == jslet.data.RefreshEvent.UPDATEALL || 
				updateEvt.eventType == jslet.data.RefreshEvent.CHANGEMETA) {
			cnt = this._linkedLabels.length;
			for (i = 0; i < cnt; i++) {
				ctrl = this._linkedLabels[i];
				if (ctrl.refreshControl) {
					ctrl.refreshControl(updateEvt);
				}
			}
		}
		cnt = this._linkedControls.length;
		for (i = 0; i < cnt; i++) {
			ctrl = this._linkedControls[i];
			if (ctrl.refreshControl) {
				ctrl.refreshControl(updateEvt);
			}
		}
	},

	/**
	 * Focus on the edit control that link specified field name.
	 * 
	 * @param {String} fldName Field name
	 */
	focusEditControl: function (fldName) {
		var ctrl, el;
		for (var i = this._linkedControls.length - 1; i >= 0; i--) {
			ctrl = this._linkedControls[i];
			if (ctrl.field && ctrl.field == fldName) {
				el = ctrl.el;
				if (el.focus) {
					try {
						el.focus();
					} catch (e) {
						//hide exeception
					}
				}
			} //end if
		} //end for
	},

	/**
	 * @private 
	 */
	refreshControl: function (updateEvt) {
		if (this._lockCount) {
			return;
		}

		if (!updateEvt) {
			updateEvt = jslet.data.RefreshEvent.updateAllEvent();
		}
//		if (updateEvt.eventType == jslet.data.RefreshEvent.UPDATEALL) {
//			var flag = this.isContextRuleEnabled();
//			if (flag) {
//				this.disableContextRule();
//			}
//			try {
//				this._refreshInnerControl(updateEvt);
//			} finally {
//				if (flag) {
//					this.enableContextRule();
//				}
//			}
//		} else {
			this._refreshInnerControl(updateEvt);
//		}
	},

	/**
	 * @private 
	 */
	addLinkedControl: function (linkedControl) {
		if (linkedControl.isLabel) {
			this._linkedLabels.push(linkedControl);
		} else {
			this._linkedControls.push(linkedControl);
		}
	},

	/**
	 * @private 
	 */
	removeLinkedControl: function (linkedControl) {
		var arrCtrls = linkedControl.isLabel ? this._linkedLabels : this._linkedControls;
		
		var k = arrCtrls.indexOf(linkedControl);
		if (k >= 0) {
			arrCtrls.splice(k, 1);
		}
	},

	refreshHostDataset: function() {
		if(this._autoRefreshHostDataset) {
			jslet.data.datasetRelationManager.refreshHostDataset(this._name);
		}
	},
	
	handleLookupDatasetChanged: function(fldName) {
		this.refreshControl(jslet.data.RefreshEvent.lookupEvent(fldName));
	},
	
	/**
	 * Export data with CSV format
	 * 
	 * @param {String}includeFieldLabel - export with field labels, can be null  
	 * @param {Boolean}dispValue - true: export display value of field, false: export actual value of field 
	 * @param {Boolean}onlySelected - export selected records or not.
	 * @return {String} Csv Text. 
	 */
	exportCsv: function(includeFieldLabel, dispValue, onlySelected) {
		var Z= this, fldSeperator = ',', surround='"';
		var context = Z.startSilenceMove();
		try{
			Z.first();
			var result = [], 
				arrRec, 
				fldCnt = Z._normalFields.length, 
				fldObj, fldName, value, i;
			if (includeFieldLabel) {
				arrRec = [];
				for(i = 0; i < fldCnt; i++) {
					fldObj = Z._normalFields[i];
					fldName = fldObj.name();
					fldName = surround + fldName + surround;
					arrRec.push(fldName);
				}
				result.push(arrRec.join(fldSeperator));
			}
			while(!Z.isEof()) {
				if (onlySelected && !Z.selected()) {
					Z.next();
					continue;
				}
				arrRec = [];
				for(i = 0; i < fldCnt; i++) {
					fldObj = Z._normalFields[i];
					fldName = fldObj.name();
					if (dispValue) {
						value = Z.getFieldText(fldName);
					} else {
						value = Z.getFieldValue(fldName);
					}
					if (!value) {
						value = '';
					} else {
						value += '';
					}
					value = value.replace(/"/,'');
					value = surround + value + surround;
					arrRec.push(value);
				}
				result.push(arrRec.join(fldSeperator));
				Z.next();
			}
			return result.join('\n');
		}finally{
			Z.endSilenceMove(context);
		}
	},

	/**
	 * Set or get raw data list
	 * 
	 * @param {Object[]} datalst - raw data list
	 */
	dataList: function (datalst) {
		var Z = this;
		if (datalst === undefined) {
			return Z._dataList;
		}
		
		jslet.Checker.test('Dataset.dataList', datalst).isArray();
		Z._dataList = datalst;
		jslet.data.convertDateFieldValue(Z);
		Z._insertedDelta.length = 0;
		Z._updatedDelta.length = 0;
		Z._deletedDelta.length = 0;
		Z.status(jslet.data.DataSetStatus.BROWSE);
		Z.filter(null);
		Z.indexFields(Z.indexFields());
		Z.first();
		Z.refreshControl(jslet.data.RefreshEvent.updateAllEvent);
		Z.refreshHostDataset();
		return this;
	},
	
	/**
	 * Return dataset data with field text, field text is formatted or calculated field value.
	 * You can use them to do your special processing like: use them in jquery template.
	 */
	textList: function() {
		var Z = this,
			oldRecno = Z.recno(), 
			result = [],
			fldCnt = Z._normalFields.length,
			fldObj, fldName, textValue, textRec;
		try {
			for (var i = 0, cnt = Z.recordCount(); i < cnt; i++) {
				Z.recnoSilence(i);
				textRec = {};
				for(var j = 0; j < fldCnt; j++) {
					fldObj = Z._normalFields[j];
					fldName = fldObj.name();
					textValue = Z.getFieldText(fldName);
					textRec[fldName] = textValue;
				}
				result.push(textRec);
			}
			return result;
		} finally {
			this.recnoSilence(oldRecno);
		}
	},
	
	destroy: function () {
		var Z = this;
		Z._masterDataset = null;
		Z._detailDatasets = null;
		Z._fields = null;
		Z._linkedControls = null;
		Z._innerFilter = null;
		Z._innerFindCondition = null;
		Z._innerIndexFields = null;
		Z._innerFormularFields = null;
		
		jslet.data.dataModule.unset(Z._name);
	}
	
};
// end Dataset

/**
 * Create Enum Dataset. Example:
 * <pre><code>
 * var dsGender = jslet.data.createEnumDataset('gender', 'F:Female,M:Male');
 * dsGender.getFieldValue('code');//return 'F'
 * dsGender.getFieldValue('name');//return 'Female'
 * dsGender.next();
 * dsGender.getFieldValue('code');//return 'M'
 * dsGender.getFieldValue('name');//return 'Male'
 * </code></pre>
 * 
 * @param {String} dsName dataset name;  
 * @param {String or Object} enumStrOrObject a string or an object which stores enumeration data; if it's a string, the format must be:<code>:<name>,<code>:<name>
 * @return {jslet.data.Dataset}
 */
jslet.data.createEnumDataset = function(dsName, enumStrOrObj) {
	jslet.Checker.test('createEnumDataset#enumStrOrObj', enumStrOrObj).required();
		
	var dsObj = new jslet.data.Dataset(dsName);
	dsObj.addField(jslet.data.createStringField('code', 10));
	dsObj.addField(jslet.data.createStringField('name', 20));

	dsObj.keyField('code');
	dsObj.codeField('code');
	dsObj.nameField('name');

	var dataList = [];
	if(jslet.isString(enumStrOrObj)) {
		var enumStr = jQuery.trim(enumStrOrObj);
		var recs = enumStr.split(','), recstr;
		for (var i = 0, cnt = recs.length; i < cnt; i++) {
			recstr = jQuery.trim(recs[i]);
			rec = recstr.split(':');
	
			dataList[dataList.length] = {
				'code' : jQuery.trim(rec[0]),
				'name' : jQuery.trim(rec[1])
			};
		}
	} else {
		for(var key in enumStrOrObj) {
			dataList[dataList.length] = {code: key, name: enumStrOrObj[key]};
		}
	}
	dsObj.dataList(dataList);
	dsObj.indexFields('code');
	return dsObj;
};

/**
 * Create dataset with field configurations. Example:
 * <pre><code>
 *   var fldCfg = [{
 *     name: 'deptid',
 *     type: 'S',
 *     length: 10,
 *     label: 'ID'
 *   }, {
 *     name: 'name',
 *     type: 'S',
 *     length: 20,
 *     label: 'Dept. Name'
 *   }];
 *   var dsCfg = {keyField: 'deptid', codeField: 'deptid', nameField: 'name'};
 *   var dsDepartment = jslet.data.createDataset('department', fldCfg, dsCfg);
 * </code></pre>
 * 
 * @param {String} dsName - dataset name
 * @param {jslet.data.Field[]} field configuration
 * @param {String} keyField - key field name
 * @param {String} codeField - code field name
 * @param {String} nameField - name field name
 * @param {String} parentField - parent field name
 * @return {jslet.data.Dataset}
 */
jslet.data.createDataset = function(dsName, fieldConfig, dsCfg) {
	var dsObj = new jslet.data.Dataset(dsName),fldObj;
	for (var i = 0, cnt = fieldConfig.length; i < cnt; i++) {
		fldObj = jslet.data.createField(fieldConfig[i]);
		dsObj.addField(fldObj);
	}
	
	if(dsCfg) {
		if (dsCfg.keyField) {
			dsObj.keyField(dsCfg.keyField);
		}
		if (dsCfg.codeField) {
			dsObj.codeField(dsCfg.codeField);
		}
		if (dsCfg.nameField) {
			dsObj.nameField(dsCfg.nameField);
		}
		if (dsCfg.parentField) {
			dsObj.parentField(dsCfg.parentField);
		}
		if (dsCfg.queryUrl) {
			dsObj.queryUrl(dsCfg.queryUrl);
		}
		if (dsCfg.submitUrl) {
			dsObj.submitUrl(dsCfg.submitUrl);
		}
		if (dsCfg.autoShowError) {
			dsObj.autoShowError(dsCfg.autoShowError);
		}
		if (dsCfg.pageSize) {
			dsObj.pageSize(dsCfg.pageSize);
		}
		if (dsCfg.indexFields) {
			dsObj.indexFields(dsCfg.indexFields);
		}
		if (dsCfg.filter) {
			dsObj.filter(dsCfg.filter);
		}
		if (dsCfg.filtered) {
			dsObj.filtered(dsCfg.filtered);
		}
		if (dsCfg.autoRefreshHostDataset) {
			dsObj.autoRefreshHostDataset(dsCfg.autoRefreshHostDataset);
		}
		
	}
	return dsObj;
};
