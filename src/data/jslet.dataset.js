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

/**
 * @class Dataset
 * 
 * @param {String} name dataset's name that must be unique in jslet.data.dataModule variable.
 */
jslet.data.Dataset = function (name) {
    var Z = this;
    Z._dsname = null; //Dataset name
    Z._dataList; //Array of data records
    Z._datasetListener = null; //Dataset event listener object, like: function(eventType/*jslet.data.DatasetEvent*/) {}

    Z._fields = []; //Array of jslet.data.Field
    Z._normalFields = []; //Array of jslet.data.Field except group field
    Z._recno = -1;
    Z._filteredRecnoArray = null;

    Z._unitConvertFactor = 1;
    Z._unitName = null;

    Z._isAborted = false;
    Z._insertedDelta = []; //Array of record
    Z._updatedDelta = []; //Array of record
    Z._deletedDelta = []; //Array of record

    Z._status = 0; // dataset status, optional values: 0:browse;1:created;2:updated;3:deleted;
    Z._subDatasetFields; //Array of dataset field object

    Z._filter = '';
    Z._innerFilter; //inner variable
    Z._findCondition;
    Z._innerFindCondition; //inner variable

    Z._innerFormularFields; //inner variable

    Z._filtered = false;
    Z._bof = false;
    Z._eof = false;
    Z._igoreEvent = false;
    Z._logChanged = true;

    Z._modiObject = null;
    Z._lockCount = 0;

    Z._indexFields = '';
    Z._innerIndexFields = null;
    var finnerIndexDataset = null;

    Z._convertDestFields = null;
    Z._innerConvertDestFields = null;

    Z._masterDataset = null;
    Z._detailDatasets = null; // array

    Z._datasetField = null; //jslet.data.Field 

    Z._linkedControls = []; //Array of DBControl except DBLabel
    Z._linkedLabels = []; //Array of DBLabel
    Z._silence = 0;
    Z._keyField;
    Z._codeField;
    Z._nameField;
    Z._parentField;
    Z._selectField;
    
    Z._contextRule = null;
    Z._contextRuleEnabled = false;

    Z._dataProvider = jslet.data.DataProvider ? new jslet.data.DataProvider() : null;

    Z._condition; //String query parameters 
    Z._queryUrl; //String

    Z._pageSize = 0;
    Z._pageNo = 1;
    Z._pageCount = 0;
    Z._errorFields = null; //Invalid field name, value and invalid message when editing
    
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
    Z.onCheckSelectable = null;
    
    Z.name(name);
}

jslet.data.Dataset.prototype = new function () {

    /**
    * Clone this dataset's structure and return new dataset object..
    * 
    * @param {String} newDsName New dataset's name.
    * @param {Array of String} fieldNames a list of field names which will be cloned to new dataset.
    * @return {jslet.data.Dataset} Cloned dataset object
    */
    this.clone = function (newDsName, fieldNames) {
        var Z = this;
        if (!newDsName) {
            newDsName = Z._dsname + '_copy';
        }
        var result = new jslet.data.Dataset(newDsName);
        result._datasetListener = Z._datasetListener;

        result._unitConvertFactor = Z._unitConvertFactor;
        result._unitName = Z._unitName;

        result._filter = Z._filter;
        result._filtered = Z._filtered;
        result._logChanged = Z._logChanged;
        result._indexFields = Z._indexFields;
        result._keyField = Z._keyField;
        result._codeField = Z._codeField;
        result._nameField = Z._nameField;
        result._parentField = Z._parentField;
        result._selectField = Z._selectField;
        result._contextRule = Z._contextRule;
        var fldObj, fldName;
        for(var i = 0, cnt = Z._fields.length; i < cnt; i++) {
        	fldObj = Z._fields[i];
        	if (fieldNames) {
        		fldName = fldObj.name();
        		if (fieldNames.indexOf(fldName) < 0) {
        			continue;
        		}
        	}
        	result.addField(fldObj.clone(result));
        }
        return result
    }

    /**
     * Add specified fields of source dataset into this dataset.
     * 
     * @param {jslet.data.Dataset} srcDataset New dataset's name.
     * @param {Array of String} fieldNames a list of field names which will be copied to this dataset.
     */
    this.addFieldFromDataset = function(srcDataset, fieldNames) {
        var fldObj, fldName, srcFields = srcDataset.getFields();
        for(var i = 0, cnt = srcFields.length; i < cnt; i++) {
        	fldObj = srcFields[i];
        	if (fieldNames) {
        		fldName = fldObj.name();
        		if (fieldNames.indexOf(fldName) < 0) {
        			continue;
        		}
        	}
        	this.addField(fldObj.clone(this));
        }
    }
    
    /**
     * Set or get page size.
     * 
     * @param {int} pageSize.
     * @return {Integer or this}
     */
    this.pageSize = function(pageSize) {
    	if (pageSize === undefined) {
    		return this._pageSize;
    	}
    	
   		this._pageSize = pageSize;
    	return this
    }

    /**
     * Set or get page number.
     * 
     * @param {int} pageNo.
     * @return {Integer or this}
     */
    this.pageNo = function(pageNo) {
    	if (pageNo === undefined) {
    		return this._pageNo;
    	}
    	
    	this._pageNo = pageNo;
    	return this
    }
    
    /**
     * Set or get page count.
     * 
     * @param {int} pageCount.
     * @return {Integer or this}
     */
    this.pageCount = function(pageCount) {
    	if (pageCount === undefined) {
    		return this._pageCount;
    	}
    	
    	this._pageCount = pageCount;
    	return this
    }
    
    this.csrfToken = function(token) {
    	var dataProvider = this.dataProvider();
    	if(!dataProvider) {
    		return;
    	}
    		
    	if (token === undefined) {
    		return dataProvider.csrfToken;
    	}
    	
    	dataProvider.csrfToken = token;
    	return this
    }
    
  /**
  * Set dataset's name.
  * 
  * @param {String} name Dataset's name that must be unique in jslet.data.dataModule variable.
  * @return {String or this}
  */
    this.name = function(name) {
    	if (name === undefined) {
    		return this._dsname;
    	}
    	
        var sn = this._dsname;
        if (sn) {
            jslet.data.dataModule.unset(sn);
        }

        if (name) {
            jslet.data.dataModule.unset(name);
            jslet.data.dataModule.set(name, this);
        }
        this._dsname = name;
        return this
    }
    
    /**
     * Set unit converting factor.
     * 
     * @param {Double} factor When changed this value, the field's display value will be changed by 'fldValue/factor'.
     * @param {String} unitName Unit name that displays after field value.
     * @return {Double or this}
     */
    this.unitConvertFactor = function (factor, unitName) {
        var Z = this;
    	if (arguments.length == 0) {
    		return Z._unitConvertFactor;
    	}
    	
        if (factor > 0) {
            Z._unitConvertFactor = factor;
        }
        else{
            Z._unitConvertFactor = 1;
        }

        Z._unitName = unitName;

        for (var i = 0, cnt = Z._normalFields.length, fldObj; i < cnt; i++) {
        	fldObj = Z._normalFields[i];
            if (fldObj.getType == jslet.data.DataType.NUMBER && fldObj.unitConverted()) {
                Z.refreshControl(new jslet.data.UpdateEvent(
						jslet.data.UpdateEvent.UPDATECOLUMN, {
						    fieldName: fldObj.name()
						}));
            }
        } //end for
        return Z
    }

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
     *   	console.log(eventType);
     *   });
     * </code></pre>
     * 
     * @param {Function} listener Dataset event listener
     * @return {Function or this}
     */
    this.datasetListener = function(listener) {
    	if (arguments.length ==0) {
    		return this._datasetListener;
    	}
    	
    	this._datasetListener = listener;
    	return this
    }

    /**
     * Get dataset fields.
     * @return {Array of jslet.data.Field}
     */
    this.getFields = function () {
        return this._fields;
    }

    /**
     * Get fields except group field
     * @return {Array of jslet.data.Field}
     */
    this.getNormalFields = function() {
    	return this._normalFields;
    }
    
    /**
     * @private
     */
    this.travelField = function(fields, callBackFn) {
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
    			isBreak = this.travelField(fldObj.children(), callBackFn);
    			if (isBreak) {
    				break;
    			}
    		}
    	}
    	return isBreak;
    }
    
    /**
     * @private
     */
    this._cacheNormalFields = function() {
    	var arrFields = this._normalFields = [];
    	this.travelField(this._fields, function(fldObj) {
    		if (fldObj.getType() != jslet.data.DataType.GROUP) {
    			arrFields.push(fldObj);
    		}
    		return false; //Identify if cancel traveling or not
    	});
    }
    
    /**
     * Set or get datasetField object
     * 
     * @param {Field} datasetField.
     * @return {jslet.data.Field or this}
     */
    this.datasetField = function(datasetField) {
    	if (datasetField === undefined) {
    		return this._datasetField;
    	}
    	this._datasetField = datasetField;
    	return this
    }

    /**
    * Add a new field object.
    * 
    * @param {jslet.data.Field} fldObj: field object.
    */
    this.addField = function (fldObj) {
        var Z = this;
        Z._fields.push(fldObj);
        fldObj.dataset(Z);
        if (fldObj.displayOrder() != 0) {
            Z._fields.sort(fldObj.sortByIndex);
        }
        if (fldObj.getType() == jslet.data.DataType.DATASET) {
            if (!Z._subDatasetFields)
                Z._subDatasetFields = [];
            Z._subDatasetFields.push(fldObj);
        }
        Z._cacheNormalFields();
    }

    /**
     * Remove field by field name.
     * 
     * @param {String} fldName: field name.
     */
    this.removeField = function (fldName) {
        var Z = this;
    	var fldObj = Z.getField(fldName);
        if (fldObj) {
            if (fldObj.getType() == jslet.data.DataType.DATASET) {
                var k = Z._subDatasetFields.indexOf(fldObj);
                if (k >= 0) {
                    Z._subDatasetFields.splice(k, 1);
                }
            }
            Z._fields.splice(i, 1);
            fldObj.dataset(null);
            Z._cacheNormalFields();
        }
    }

    /**
     * Get field object by name.
     * 
     * @param {String} fldName: field name.
     * @return jslet.data.Field
     */
    this.getField = function (fldName) {
        if (!fldName || typeof (fldName) != 'string') {
            return null;
        }

        var arrField = fldName.split('.'), fldName1 = arrField[0];
        var fldObj = null;
    	this.travelField(this._fields, function(fldObj1) {
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
            var lkf = fldObj.lookupField();
            if (lkf) {
                var lkds = lkf.lookupDataset();
                if (lkds) {
                    return lkds.getField(arrField.join('.'));
                }
            }
        }
        return null;
    }

    /**
     * Get field object by name.
     * 
     * @param {String} fldName: field name.
     * @return jslet.data.Field
     */
    this.getTopField = function (fldName) {
        if (!fldName || typeof (fldName) != 'string') {
            return null;
        }
        var fldObj = this.getField(fldName);
        if (fldObj != null) {
        	while(true) {
	        	if (fldObj.parent() == null) {
	        		return fldObj;
	        	}
        	}
        	fldObj = fldObj.parent();
        }
        return null;
    }
    
    /**
     * @Private,Sort function.
     * 
     * @param {Object} rec1: dataset record.
     * @param {Object} rec2: dataset record.
     */
    this.sortFunc = function (rec1, rec2) {
        var indexFlds = finnerIndexDataset._innerIndexFields, v1, v2, fname, flag = 1;
        for (var i = 0, cnt = indexFlds.length; i < cnt; i++) {
            fname = indexFlds[i].fieldName;
            v1 = finnerIndexDataset.fieldValueByRec(rec1, fname);
            v2 = finnerIndexDataset.fieldValueByRec(rec2, fname);
            if (v1 == v2) {
                continue;
            }
            if (v1 != null && v2 != null) {
                if (v1 < v2) {
                    flag = -1;
                } else {
                    flag = 1
                }
            } else if (v1 == null && v2 != null) {
                flag = -1;
            } else {
                if (v1 != null && v2 == null) {
                    flag = 1;
                }
            }
            return flag * indexFlds[i].order;
        } //end for
        return 0;
    }

    /**
     * Set index fields, field names separated by comma(',')
     * 
     * @param {String} indFlds: index field name.
     * @return jslet.data.Field
     */
    this.indexFields = function (indFlds) {
        var Z = this;
        if (indFlds === undefined) {
        	return Z._indexFields;
        }
        
        Z._indexFields = indFlds;
        if (!Z._dataList || Z._dataList.length == 0 || !indFlds) {
            return;
        }
        var arrFlds = Z._indexFields.split(','), fname, fldObj, arrFName, indexNameObj, 
        	order = 1;//asce
        Z._innerIndexFields = [];
        for (var i = 0, cnt = arrFlds.length; i < cnt; i++) {
            fname = arrFlds[i];
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

        var currec = Z.getRecord(), flag = Z.isContextRuleEnabled();
        if (flag) {
            Z.disableContextRule();
        }
        Z.disableControls();
        try {
            finnerIndexDataset = Z;
            Z._dataList.sort(Z.sortFunc);
            delete finnerIndexDataset;
            Z._refreshInnerRecno();
            var recCnt = Z.recordCount();
            if (recCnt > 2) {
                var rec;
                for (var i = 0; i < recCnt; i++) {
                    Z.innerSetRecno(i);
                    rec = Z.getRecord();
                    if (rec === currec) {
                        break;
                    }
                }
            }
        } finally {
            if (flag) {
                Z.enableContextRule();
            }
            Z.enableControls();
        }
        return this;
    }

    /**
     * @private
     */
    this._createIndexCfg = function(fname, order) {
        var Z = this
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
            Z._combineIndexCfg(fldObj.name(), order)
        } else {
        	var children = fldObj.children();
        	if (children) {
        		for(var k = 0, childCnt = children.length; k < childCnt; k++) {
        			Z._createIndexCfg(children[k], order);
        		}
        	}
        }
    }
    
    /**
     * @private
     */
    this._combineIndexCfg = function(fldName, order) {
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
    }
    
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
    this.filter = function (filterExpr) {
        var Z = this;
        if (filterExpr === undefined) {
        	return Z._filter;
        }
        
        if (!filterExpr) {
            Z._innerFilter = null;
            Z._filtered = false;
            Z._filter = null;
            Z._filteredRecnoArray = null;
            return;
        }
        Z._filter = filterExpr;
        Z._innerFilter = new jslet.FormulaParser(Z, filterExpr);
        return this;
    }

    /**
     * Set or get filtered flag
     * Only filtered is true, the filter can work
     * 
     * @param {Boolean} afiltered: filter flag.
     * @return {Boolean or this}
     */
    this.filtered = function (afiltered) {
        var Z = this;
        if (afiltered === undefined) {
        	return Z._filtered;
        }
        
        if (afiltered && !Z._filter) {
            Z._filtered = false;
        } else {
            Z._filtered = afiltered;
        }

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
        return this;
    }
    
    /**
     * @private, filter data
     */
    this._filterData = function () {
        var Z = this;
        if (!Z._filtered || !Z._filter
				|| Z._status == jslet.data.DataSetStatus.INSERT
				|| Z._status == jslet.data.DataSetStatus.UPDATE) {
            return true;
        }
        var result = Z._innerFilter.evalExpr();
        return result;
    }

    /**
     * @private
     */
    this._refreshInnerRecno = function () {
        var Z = this;
        if (!Z._dataList || Z._dataList.length == 0) {
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
    }

    /**
     * @private
     */
    this._fireDatasetEvent = function (evtType) {
        var Z = this;
        if (Z._silence || Z._igoreEvent || !Z._datasetListener) {
            return;
        }
        Z._datasetListener.call(Z, evtType);
    }

    /**
     * Get record count
     * 
     * @return {Integer}
     */
    this.recordCount = function () {
        if (this._dataList) {
            if (!this._filteredRecnoArray) {
                return this._dataList.length;
            } else {
                return this._filteredRecnoArray.length;
            }
        }
        return 0;
    }

    /**
     * Set or get record number
     * 
     * @param {Integer}record number
     * @return {Integer or this}
     */
    this.recno = function (recno) {
        var Z = this;
        if (recno === undefined) {
        	return Z._recno;
        }
        
        recno = parseInt(recno);
        if (recno == Z._recno) {
            return;
        }
        if (Z._status != jslet.data.DataSetStatus.BROWSE) {
            Z.confirm();
            if (Z._isAborted) {
                return;
            }
        }
        Z._gotoRecno(this._checkEofBof(recno));
        return this;
    }
    
    /**
     * @private
     */
    this._checkEofBof = function (recno) {
        var Z = this, cnt = Z.recordCount();
        if (cnt == 0) {
            Z._bof = true;
            Z._eof = true;
            return;
        }
        Z._eof = false;
        Z._bof = false;
        if (recno >= cnt) {
            recno = cnt - 1;
            Z._eof = true;
        }
        if (recno < 0) {
            recno = 0;
            Z._bof = true;
        }
        return recno;
    }

    /**
     * @private
     * Set record number(Private)
     * 
     * @param {Integer}recno - record number
     */
    this.innerSetRecno = function (recno) {
        this._recno = this._checkEofBof(recno);
    }

    /**
     * @private
     * Goto specified record number(Private)
     * 
     * @param {Integer}recno - record number
     */
    this._gotoRecno = function (recno) {
        var Z = this;
        if (Z._recno == recno) {
            return false;
        }
        var cnt = Z.recordCount(), k;
        if (cnt > 0) {
            if (recno < cnt || recno >= 0) {
                k = recno;
            } else {
                k = -1;
            }
        } else {
            k = -1;
        }

        if (k < 0) {
            return false;
        }
        if (!Z._silence) {
            Z._isAborted = false;
            Z._fireDatasetEvent(jslet.data.DatasetEvent.BEFORESCROLL);
            if (Z._isAborted) {
                return false;
            }
            if (!Z._lockCount) {
                var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.BEFORESCROLL,
						{
						    recno: Z._recno
						});
                Z._refreshInnerControl(evt);
            }
        }

        var preno = Z._recno;
        Z._recno = k;
        if (Z._subDatasetFields && Z._subDatasetFields.length > 0) {
            var fldObj, subds;
            for (var i = 0, cnt = Z._subDatasetFields.length; i < cnt; i++) {
            	fldObj = Z._subDatasetFields[i];
                subds = fldObj.subDataset();
                if (subds) {
                    subds.confirm();
                    subds.dataList(Z.getFieldValue(fldObj.name()));
                    var indexflds = subds.indexFields();
                    if (indexflds) {
                        subds.indexFields(indexflds);
                    } else {
                        subds.refreshControl(jslet.data.UpdateEvent.updateAllEvent);
                    }
                }
            } //end for
        } //end if
        if (Z._contextRuleEnabled) {
            Z.calcContextRule();
        }

        if (!Z._silence) {
            Z._fireDatasetEvent(jslet.data.DatasetEvent.AFTERSCROLL);
            if (!Z._lockCount) {
                var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.SCROLL, {
                    preRecno: preno,
                    recno: k
                });
                Z._refreshInnerControl(evt);
            }
        }
        return true;
    }

    /**
     * Abort insert/update/delete
     */
    this.abort = function () {
        this._isAborted = true;
    }

    /**
     * @private
     * Move cursor back to startRecno(Private)
     * 
     * @param {Integer}startRecno - record number
     */
    this.moveCursorPrior = function (startRecno) {
        var Z = this;
        if (Z._status != jslet.data.DataSetStatus.BROWSE) {
            Z.confirm();
            if (Z._isAborted)
                return;
        }

        if (Z.recordCount() == 0) {
            Z._bof = true;
            Z._eof = true;
            return;
        }
        if (startRecno < 0) {
            Z._bof = true;
            return;
        }
        Z._eof = false;
        Z._bof = false;
        Z._gotoRecno(startRecno - 1);
    }

    /**
     * @private
     * Move cursor forward to startRecno(Private)
     * 
     * @param {Integer}startRecno - record number
     */
    this.moveCursorNext = function (startRecno) {
        var Z = this;
        if (Z._status != jslet.data.DataSetStatus.BROWSE) {
            Z.confirm();
            if (Z._isAborted) {
                return;
            }
        }
        var recCnt = Z.recordCount();
        if (recCnt == 0) {
            Z._bof = true;
            Z._eof = true;
            return;
        }
        if (startRecno == recCnt - 1) {
            Z._eof = true;
            return;
        }
        Z._bof = false;
        Z._eof = false;
        Z._gotoRecno(startRecno + 1);
    }

    /**
     * Move record cursor by record object
     * 
     * @param {Object}recordObj - record object
     * @return {Boolean} true - Move successfully, false otherwise. 
     */
    this.moveTo = function (recordObj) {
        var Z = this;
        if (Z._status != jslet.data.DataSetStatus.BROWSE) {
            Z.confirm();
            if (Z._isAborted) {
                return;
            }
        }
        if (!Z._dataList || Z._dataList.length == 0) {
            return false;
        }
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
    }

    /**
     * @private
     */
    this.startSilenceMove = function (notLogPos) {
        var Z = this;
        var context = {};
        if (!notLogPos) {
            context.recno = Z._recno;
        } else {
            context.recno = -999;
        }

        Z._silence++;
        return context;
    }

    /**
     * @private
     */
    this.endSilenceMove = function (context) {
        var Z = this;
        if (context.recno != -999 && context.recno != Z._recno) {
            Z._gotoRecno(context.recno);
        }
        Z._silence--;
    }

    /**
     * Check dataset cursor at the last record
     * 
     * @return {Boolean}
     */
    this.isBof = function () {
        return this._bof;
    }

    /**
     * Check dataset cursor at the first record
     * 
     * @return {Boolean}
     */
    this.isEof = function () {
        return this._eof;
    }

    /**
     * Move cursor to first record
     */
    this.first = function () {
        this.moveCursorNext(-1);
    }

    /**
     * Move cursor to last record
     */
    this.next = function () {
        this.moveCursorNext(this._recno);
        return false;
    }

    /**
     * Move cursor to prior record
     */
    this.prior = function () {
        this.moveCursorPrior(this._recno);
        return false;
    }

    /**
     * Move cursor to next record
     */
    this.last = function () {
        this.moveCursorPrior(this.recordCount());
    }

    /**
     * @private
     * Check dataset status and confirm dataset 
     */
    this.checkStatusAndConfirm = function () {
        if (this._status != jslet.data.DataSetStatus.BROWSE) {
            this.confirm();
        }
    }

    /**
     * @private
     * Check dataset status and cancel dataset 
     */
    this.checkStatusByCancel = function () {
        if (this._status != jslet.data.DataSetStatus.BROWSE) {
            this.cancel();
        }
    }

    /**
     * Insert child record by parentId, and move cursor to the newly record.
     * 
     * @param {Object} parentId - key value of parent record
     */
    this.insertChild = function (parentId) {
        var Z = this;
        if (!Z._parentField || !Z.keyField()) {
            throw new Error('parentField and keyField not set,use insertRec() instead!');
        }

        if (!Z._dataList || Z._dataList.length == 0) {
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
    }

    /**
     * Insert sibling record of current record, and move cursor to the newly record.
     */
    this.insertSibling = function () {
        var Z = this;
        if (!Z._parentField || !Z._keyField) {
            throw new Error('parentField and keyField not set,use insertRec() instead!');
        }

        if (!Z._dataList || Z._dataList.length == 0) {
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
    }

    /**
     * Insert record after current record, and move cursor to the newly record.
     */
    this.insertRec = function () {
        this.innerInsert();
    }

    /**
     * Add record after last record, and move cursor to the newly record.
     */
    this.appendRec = function () {
        var Z = this;
        Z._silence++;
        try {
            Z.last();
        } finally {
            Z._silence--;
        }
        Z.insertRec();
    }

    /**
     * @Private
     */
    this.innerInsert = function (beforeInsertFn) {
        var Z = this;
        var mfld = Z._datasetField, mds = null;
        if (mfld) {
            mds = mfld.dataset();
            if (mds.recordCount() == 0) {
                throw new Error(jslet.locale.Dataset.insertMasterFirst);
            }
        }

        if (Z._dataList == null) {
            Z._dataList = [];
        }
        Z._isAborted = false;
        Z.checkStatusAndConfirm();
        if (Z._isAborted) {
            return;
        }

        Z._fireDatasetEvent(jslet.data.DatasetEvent.BEFOREINSERT);
        if (Z._isAborted) {
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
        
        Z._status = jslet.data.DataSetStatus.INSERT;
        Z.calDefaultValue();
        if (beforeInsertFn) {
            beforeInsertFn(Z._modiObject);
        }

        if (mfld && mds) {
            mds.updateRec();
            var subFields = mfld.name();
            if (!mds.setFieldValue(subFields)) {
            	mds.setFieldValue(subFields, Z._dataList);
            }
        }

        Z._isAborted = false;
        Z._fireDatasetEvent(jslet.data.DatasetEvent.AFTERINSERT);
        var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.INSERT, {
            preRecno: preRecno,
            recno: Z.recno(),
            updateAll: Z._recno < Z.recordCount() - 1
        });
        Z.refreshControl(evt);
    }

    /**
     * Insert all records of source dataset into current dataset;
     * Source dataset's structure must be same as current dataset 
     * 
     * @param {Integer}srcDataset - source dataset
     */
    this.insertDataset = function (srcDataset) {
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
    }

    /**
     * Append all records of source dataset into current dataset;
     * Source dataset's structure must be same as current dataset 
     * 
     * @param {Integer}srcDataset - source dataset
     */
    this.appendDataset = function (srcDataset) {
        var Z = this;
        Z._silence++;
        try {
            Z.last();
        } finally {
            Z._silence--;
        }
        Z.insertDataset(srcDataset);
    }

    /**
     * @rivate
     * Calculate default value.
     */
    this.calDefaultValue = function () {
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
    }

    /**
     * Get record object by record number.
     * 
     * @param {Integer} recno Record Number.
     * @return {Object} Dataset record.
     */
    this.getRecord = function (recno) {
        var Z = this, k;
        if (Z.recordCount() == 0) {
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
    }

    /**
     * @private
     */
    this.getRelativeRecord = function (delta) {
        return this.getRecord(this._recno + delta);
    }

    /**
     * @private
     */
    this.isSameAsPrevious = function (fldName) {
        var preRec = this.getRelativeRecord(-1);
        if (!preRec) {
            return false;
        }
        var currRec = this.getRecord();
        return preRec[fldName] == currRec[fldName];
    }

    /**
     * Check the current record has child records or not
     * 
     * @return {Boolean}
     */
    this.hasChildren = function () {
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
    }

    /**
     * Update record and send dataset to update status.
     * You can use cancel() or confirm() method to return browse status.
     */
    this.updateRec = function () {
        var Z = this;
        if (Z._status == jslet.data.DataSetStatus.UPDATE) {
            return;
        }

        if (Z._dataList == null || Z._dataList.length == 0) {
            Z.insertRec();
        } else {
            Z._isAborted = false;
            Z._fireDatasetEvent(jslet.data.DatasetEvent.BEFOREUPDATE);
            if (Z._isAborted) {
                return;
            }

            Z._modiObject = {};
            jQuery.extend(Z._modiObject, Z.getRecord());
            var mfld = Z._datasetField;
            if (mfld && mfld.dataset()) {
                mfld.dataset().updateRec();
            }

            Z._status = jslet.data.DataSetStatus.UPDATE;
            Z._isAborted = false;
            Z._fireDatasetEvent(jslet.data.DatasetEvent.AFTERUPDATE);
        }
    }

    /**
     * Delete record
     */
    this.deleteRec = function () {
        var Z = this;
        var recCnt = Z.recordCount();
        if (recCnt == 0) {
            return;
        }
        if (Z._status == jslet.data.DataSetStatus.INSERT) {
            Z.cancel();
            return;
        }

        Z._silence++;
        try {
            Z.checkStatusByCancel()
        } finally {
            Z._silence--;
        }

        if (Z.hasChildren()) {
            jslet.showInfo(jslet.locale.Dataset.cannotDelParent);
            return;
        }

        Z._isAborted = false;
        Z._fireDatasetEvent(jslet.data.DatasetEvent.BEFOREDELETE);
        if (Z._isAborted) {
            return;
        }
        if (Z._logChanged) {
            var rec = Z.getRecord(), isNew = false;
            for (var i = 0, cnt = Z._insertedDelta.length; i < cnt; i++) {
                if (Z._insertedDelta[i] == rec) {
                    Z._insertedDelta.splice(i, 1);
                    isNew = true;
                    break;
                }
            }
            if (!isNew) {
                for (var i = 0, cnt = Z._updatedDelta.length; i < cnt; i++) {
                    if (Z._updatedDelta[i] == rec) {
                        Z._updatedDelta.splice(i, 1);
                        break;
                    }
                }
                Z._deletedDelta.push(rec);
            }
        }
        var prerecno = Z.recno(), isLast = prerecno == (recCnt - 1), k = Z._recno;
        if (Z._filteredRecnoArray) {
            k = Z._filteredRecnoArray[Z._recno];
            Z._filteredRecnoArray.splice(Z._recno, 1);
        }
        Z._dataList.splice(k, 1);
        var mfld = Z._datasetField;
        if (mfld && mfld.dataset()) {
            mfld.dataset().updateRec();
        }

        Z._status = jslet.data.DataSetStatus.BROWSE;

        var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.DELETE, {
            recno: prerecno
        });
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
        evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.SCROLL, {
            recno: Z._recno
        });
        Z.refreshControl(evt);
    }

    /**
     * @private
     */
    this._innerValidateData = function () {
        var Z = this;
        if (Z._status == jslet.data.DataSetStatus.BROWSE || Z.recordCount() == 0) {
            return;
        }
        var fldObj, v, fldName, maxFld, fmax, vmax;

        for (var i = 0, cnt = Z._normalFields.length; i < cnt; i++) {
        	fldObj = Z._normalFields[i];
            if (!fldObj.enabled() || fldObj.readOnly() || !fldObj.visible()) {
                continue;
            }
            var fldName = fldObj.name(),
            	fldValue = Z.getFieldValue(fldName),
            	invalidMsg;
            if(fldObj.valueStyle() == jslet.data.FieldValueStyle.NORMAL) {
            	invalidMsg = Z.fieldValidator.checkRequired(fldObj, fldValue);
	            invalidMsg = invalidMsg || Z.fieldValidator.checkValue(fldObj, fldValue);
	            if (invalidMsg) {
	            	Z._addErrorField(fldName, fldValue, invalidMsg);
	            } else {
	            	Z._removeErrorField(fldName);
	            }
            } else {
            	invalidMsg = Z.fieldValidator.checkRequired(fldObj, fldValue);
	            if (invalidMsg) {
	            	Z._addErrorField(fldName, fldValue, invalidMsg);
	            	return;
	            } else {
	            	Z._removeErrorField(fldName);
	            }
	            if(fldValue) {
	            	for(var k = 0, len = fldValue.length; k < len; k++) {
	    	            invalidMsg = invalidMsg || Z.fieldValidator.checkValue(fldObj, fldValue);
	    	            if (invalidMsg) {
	    	            	Z._addErrorField(fldName, fldValue, invalidMsg, k);
	    	            } else {
	    	            	Z._removeErrorField(fldName, k);
	    	            }
	            	}
	            }
            }
            
        } //end for
    }

    /**
     * Confirm insert or update
     */
    this.confirm = function (suppressMessage) {
        var Z = this;
        if (Z._silence || Z._status == jslet.data.DataSetStatus.BROWSE) {
            return true;
        }
	    Z._innerValidateData();
	    if (Z._errorFields && Z._errorFields.length > 0) {
	    	if (!suppressMessage) { 
	    		jslet.showInfo(jslet.locale.Dataset.cannotConfirm);
	    	}
		    Z._isAborted = true;
	        var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.UPDATERECORD);
	        Z.refreshControl(evt);
		    return false;
	    }
        Z._isAborted = false;
        Z._fireDatasetEvent(jslet.data.DatasetEvent.BEFORECONFIRM);
        if (Z._isAborted) {
            return false;
        }
        if (Z._status == jslet.data.DataSetStatus.INSERT) {
            if (Z._logChanged) {
                var rec = Z.getRecord();
                Z._insertedDelta.push(rec);
            }
        } else {
            if (Z._logChanged) {
                var rec = Z.getRecord();
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
        Z._status = jslet.data.DataSetStatus.BROWSE;
        
        Z._errorFields = null;;
        
        Z._fireDatasetEvent(jslet.data.DatasetEvent.AFTERCONFIRM);

        var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.UPDATERECORD);
        Z.refreshControl(evt);
        return true;
    }

    /**
     * Cancel insert or update
     */
    this.cancel = function () {
        var Z = this;
        if (Z._status == jslet.data.DataSetStatus.BROWSE) {
            return;
        }
        if (Z.recordCount() == 0) {
            return;
        }
        Z._isAborted = false;
        Z._fireDatasetEvent(jslet.data.DatasetEvent.BEFORECANCEL);
        if (Z._isAborted) {
            return;
        }

        if (Z._status == jslet.data.DataSetStatus.INSERT) {
            var no = Z.recno(), k = Z._recno;
            if (Z._filteredRecnoArray) {
                k = Z._filteredRecnoArray[Z._recno];
                Z._filteredRecnoArray.splice(Z._recno, 1);
            }
            Z._dataList.splice(k, 1);
            Z._errorFields = null;

            var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.DELETE, {
                recno: no
            });
            Z.refreshControl(evt);
            Z._status = jslet.data.DataSetStatus.BROWSE;
            return;
        } else {
            var k = Z._recno;
            if (Z._filteredRecnoArray) {
                k = Z._filteredRecnoArray[Z._recno];
            }
            Z._dataList[k] = Z._modiObject;
            Z._modiObject = null;
        }

        Z._errorFields = null;
        Z._status = jslet.data.DataSetStatus.BROWSE;
        Z._isAborted = false;
        Z._fireDatasetEvent(jslet.data.DatasetEvent.AFTERCANCEL);

        var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.UPDATERECORD);
        Z.refreshControl(evt);
    }

    /**
     * Set or get logChanges
     * if NOT need send changes to Server, can set logChanges to false  
     * 
     * @param {Boolean} logChanged
     */
    this.logChanges = function (logChanged) {
        if (logChanged === undefined) {
        	return Z._logChanged;
        }

        this._logChanged = logChanged;
    }

    /**
     * Disable refreshing controls, you often use it in a batch operation;
     * After batch operating, use enableControls()
     */
    this.disableControls = function () {
        this._lockCount++;
        var fldObj, lkf, lkds;
        for (var i = 0, cnt = this._normalFields.length; i < cnt; i++) {
        	fldObj = this._normalFields[i];
            lkf = fldObj.lookupField();
            if (lkf != null) {
                lkds = lkf.lookupDataset();
                if (lkds != null) {
                    lkds.disableControls();
                }
            }
        }
    }

    /**
     * Enable refreshing controls.
     * 
     * @param {Boolean} refreshCtrl true - Refresh control immediately, false - Otherwise.
     */
    this.enableControls = function (needRefreshCtrl) {
        if (this._lockCount > 0) {
            this._lockCount--;
        }
        if (!needRefreshCtrl) {
            this.refreshControl(jslet.data.UpdateEvent.updateAllEvent);
        }

        var fldObj, lkf, lkds;
        for (var i = 0, cnt = this._normalFields.length; i < cnt; i++) {
        	fldObj = this._normalFields[i];
            lkf = fldObj.lookupField();
            if (lkf != null) {
                lkds = lkf.lookupDataset();
                if (lkds != null) {
                    lkds.enableControls(needRefreshCtrl);
                }
            }
        }
    }

    /**
     * @private
     */
    this._convertDate = function (records) {
        var Z = this;
        if(!records) {
        	records = Z._dataList;
        }
        if (!records || records.length == 0) {
            return;
        }

        var dateFlds = new Array();
        for (var i = 0, cnt = Z._normalFields.length, fldObj; i < cnt; i++) {
        	fldObj = Z._normalFields[i];
            if (fldObj.getType() == jslet.data.DataType.DATE) {
                dateFlds.push(fldObj.name());
            }
        }
        if (dateFlds.length == 0) {
            return;
        }

        var rec, fname, value;
        for (var i = 0, recCnt = records.length; i < recCnt; i++) {
            rec = records[i];
            for (var j = 0, fcnt = dateFlds.length; j < fcnt; j++) {
                fname = dateFlds[j];
                value = rec[fname];
                if (!jslet.isDate(value)) {
                    value = jslet.convertISODate(value);
                    if (value) {
                        rec[fname] = value;
                    } else {
                        throw new Error(jslet.formatString(jslet.locale.Dataset.invalidDateFieldValue,[fldName]));
                    }
                } //end if
            } //end for j
        } //end for i
    }

    /**
     * Get field value of current record
     * 
     * @param {String} fldName - field name
     * @param {Integer or undefined} valueIndex get the specified value if a field has multiple values.
     * 			if valueIndex is not specified, all values(Array of value) will return.
     * @return {Object}
     */
    this.getFieldValue = function (fldName, valueIndex) {
        if (this.recordCount() == 0) {
            return null;
        }

        var currRec = this.getRecord();
        if (!currRec) {
            return null;
        }
        var fldValue = this.fieldValueByRec(currRec, fldName),
        	fldObj = this.getField(fldName);
        if(fldObj.valueStyle() == jslet.data.FieldValueStyle.NORMAL || valueIndex === undefined) {
        	return fldValue;
        }
        return jslet.getArrayValue(fldValue, valueIndex);
    }

    /**
     * Set field value of current record.
     * 
     * @param {String} fldName - field name
     * @param {Object} value - field value
     * @param {Integer or undefined} valueIndex set the specified value if a field has multiple values.
     * 			if valueIndex is not specified, Array of value will be set.
     * @return {this}
     */
    this.setFieldValue = function (fldName, value, valueIndex) {
        var Z = this,
        	currRec = Z.getRecord(),
        	fldObj = Z.getField(fldName);
        if(Z._status == jslet.data.DataSetStatus.BROWSE) {
        	Z.updateRec();
        }
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
        if (Z.onFieldChange) {
        	Z.onFieldChange.call(Z, fldName, value, valueIndex);
        }
        //calc other fields' range to use context rule
        if (!Z._silence && Z._contextRuleEnabled && value) {
            Z.calcContextRule(fldName);
        }
        var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.UPDATERECORD, {
            fieldName: fldName
        });
        Z.refreshControl(evt);
        Z.updateFormula();
        return this;
    }

    /**
     * @rivate
     */
    this.removeInnerFormularFields = function (fldName) {
        if (this._innerFormularFields) {
            this._innerFormularFields.remove(fldName);
        }
    }

    /**
     * Get field value of specified record
     * 
     * @param {Object} dataRec - specified record
     * @param {String} fldName - field name
     * @return {Object} field value
     */
    this.fieldValueByRec = function (dataRec, fldName) {
        var Z = this;
        if (Z.recordCount() == 0) {
            return null;
        }

        if (!dataRec) {
            dataRec = Z.getRecord();
        }

        var k = fldName.indexOf('.'), subfldName, fldObj;
        if (k > 0) {
            subfldName = fldName.substr(0, k);
            fldObj = Z.getField(subfldName);
            if (!fldObj) {
                throw new Error(jslet.formatString(jslet.locale.Dataset.fieldNotFound,[subfldName]));
            }
            var lkf = fldObj.lookupField();
            if (!lkf) {
                throw new Error(jslet.formatString(jslet.locale.Dataset.lookupFieldNotFound, [subfldName]));
            }
            var value = dataRec[subfldName], lkds = lkf.lookupDataset();
            if (lkds.findByField(lkds.keyField(), value)) {
                return lkds.getFieldValue(fldName.substr(k + 1));
            } else {
                throw new Error(jslet.formatString(jslet.locale.Dataset.valueNotFound,
							[lkds.name(),lkds.keyField(), value]));
            }
        } else {
        	fldObj = Z.getField(fldName);
            if (!fldObj) {
                throw new Error(jslet.formatString(jslet.locale.Dataset.fieldNotFound, [fldName]));
            }
            var formula = fldObj.formula();
            if (!formula) {
                var value = dataRec[fldName];
                if (value != undefined) {
                    return value;
                } else {
                    return null;
                }
            } else {
                if (Z._innerFormularFields == null) {
                    Z._innerFormularFields = new jslet.SimpleMap();
                }
                var evaluator = Z._innerFormularFields.get(fldName);
                if (evaluator == null) {
                    evaluator = new jslet.FormulaParser(this, formula);
                    Z._innerFormularFields.set(fldName, evaluator);
                }
                return evaluator.evalExpr(dataRec);
            }
        }
    }

    /**
     * Add a field with invalid value
     * 
     * @param {String} fldName Field name.
     * @param {String} inputText Invalid value user inputed.
     * @param {String} invalidMsg Invalid message.
     */
    this._addErrorField = function(fldName, inputText, invalidMsg, valueIndex) {
    	var Z = this;
    	if (!Z._errorFields) {
    		Z._errorFields = [];
    	}
        var errObj = {fieldName: fldName, inputText: inputText, invalidMsg: invalidMsg};
        if(valueIndex !== undefined) {
        	errObj.valueIndex = valueIdnex;
        }
        var oldErrObj;
        for(var i = 0, len = Z._errorFields.length; i < len; i++) {
        	oldErrObj = Z._errorFields[i];
        	if(fldName == oldErrObj.fieldName) {
        		Z._errorFields[i] = errObj;
        		return;
        	}
        }
        Z._errorFields.push(errObj);
    }

    /**
     * Get an invalid field by field name.
     * 
     * @param {String} fieldName Field name.
     * @param {Object} An object like {inputText: inputText, invalidMsg: invalidMsg}.
     */
    this.getErrorField = function(fldName, valueIndex) {
    	var Z = this;
        if (!Z._errorFields) {
        	return null;
        }
        var errObj;
        for(var i = 0, len = Z._errorFields.length; i < len; i++) {
        	errObj = Z._errorFields[i];
        	if(fldName == errObj.fieldName) {
        		if(valueIndex !== undefined && valueIndex != errObj.valueIndex) {
        			continue;
        		}
        		return errObj;
        	}
        }
        
        return null;       
    }
    
    /**
     * Remove an invalid field by field name.
     * 
     * @param {String} fieldName Field name.
     */
    this._removeErrorField = function(fldName, valueIndex) {
    	var Z = this;
        if (!Z._errorFields) {
        	return;
        }
        
        var errObj, k = -1;
        for(var i = 0, len = Z._errorFields.length; i < len; i++) {
        	errObj = Z._errorFields[i];
        	if(fldName == errObj.fieldName) {
        		if(valueIndex !== undefined && valueIndex != errObj.valueIndex) {
        			continue;
        		}
        		k = i;
        		break;
        	}
        }
        
        if(k >= 0) {
        	Z._errorFields.splice(k, 1);
        }
    }
    
    /**
     * Get field display text 
     * 
     * @param {String} fldName Field name
     * @param {Boolean} isEditing In edit mode or not, if in edit mode, return 'Input Text', else return 'Display Text'
     * @param {Integer} valueIndex identify which item will get if the field has multiple values.
     * @return {String} 
     */
    this.getFieldText = function (fldName, isEditing, valueIndex) {
        var Z = this;
        if (Z.recordCount() == 0) {
            return '';
        }
        var currRec = Z.getRecord(), 
        	k = fldName.indexOf('.'), 
        	fldName, fldObj, lkf, lkds, value;
        if (k > 0) { //Field chain
            fldName = fldName.substr(0, k);
            fldObj = Z.getField(fldName);
            if (!fldObj) {
                throw new Error(jslet.formatString(jslet.locale.Dataset.fieldNotFound, [fldName]));
            }
            lkf = fldObj.lookupField();
            if (!lkf) {
                throw new Error(jslet.formatString(jslet.locale.Dataset.lookupFieldNotFound, [fldName]));
            }
            value = currRec[fldName];
            if (value == null || value == undefined) {
                return '';
            }
            lkds = lkf.lookupDataset();
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
            throw new Error(jslet.formatString(jslet.locale.Dataset.lookupFieldNotFound, [fldName]));
        }
        if (fldObj.getType() == jslet.data.DataType.DATASET) {
            return '[dataset]';
        }
        var errFldObj = Z.getErrorField(fldName, valueIndex);
        if (errFldObj) {
        	return errFldObj.inputText;
        }
        var valueStyle = fldObj.valueStyle();
        if(valueStyle == jslet.data.FieldValueStyle.BETWEEN && valueIndex === undefined)
        {
        	var result = [],
        		minVal = Z.getFieldText(fldName, isEditing, 0),
        		maxVal = Z.getFieldText(fldName, isEditing, 1);
        	result.push(minVal);
        	if(isEditing) {
        		result.push(fldObj.valueSeparator());
        	} else {
        		result.push(jslet.locale.Dataset.betweenLabel);
        	}
        	result.push(maxVal);
        	return result.join('');
        }
        
        if(valueStyle == jslet.data.FieldValueStyle.MULTIPLE && valueIndex === undefined)
        {
        	var arrValues = Z.getFieldValue(fldName), 
	    		len = 0,
	    		result = [];
	    	if(arrValues && jslet.isArray(arrValues)) {
	    		len = arrValues.length - 1;
	    	}
	    	
	    	for(var i = 0; i <= len; i++) {
	    		result.push(Z.getFieldText(fldName, isEditing, i));
	    		if(i < len) {
	    			result.push(fldObj.valueSeparator());
	    		}
	    	}
	    	return result.join('');
        }
                
        value = Z.getFieldValue(fldName, valueIndex);
        if (value == null || value == undefined) {
            return '';
        }

        var convert = fldObj.customValueConverter() || jslet.data.getValueConverter(fldObj);
        if(!convert) {
        	throw new Error('Can\'t find any field value converter!');
        }
        var text = convert.valueToText.call(Z, fldObj, value, isEditing);

        return text;
    }
    
    /**
     * @private
     */
    this.updateFormula = function () {
        var cnt = this._normalFields.length, fldObj;
        for (var i = 0; i < cnt; i++) {
        	fldObj = this._normalFields[i];
            if (fldObj.formula()) {//update all formular field
                var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.UPDATERECORD,
						{
						    fieldName: fldObj.name()
						});
                this.refreshControl(evt);
            }
        }
    }
    
    this.setFieldValueLength = function(fldObj, valueLength) {
    	if(fldObj.valueStyle() == jslet.data.FieldValueStyle.NORMAL) {
    		return;
    	}
    	var value = this.getFieldValue(fldObj.name());
    	if(jslet.isArray(value)) {
    		value.length = valueLength;
    	}
    }
    
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
    this.setFieldText = function (fldName, inputText, valueIndex) {
    	var Z = this,
    		fldObj = Z.getField(fldName);
        if (fldObj == null) {
            throw new Error(jslet.formatString(jslet.locale.Dataset.fieldNotFound, [fldName]));
        }
        var fType = fldObj.getType();
        if (fType == jslet.data.DataType.DATASET) {
            throw new Error(jslet.formatString(jslet.locale.Dataset.datasetFieldNotBeSetValue, [fldName]));
        }
        
        if(fldObj.valueStyle() !== jslet.data.FieldValueStyle.NORMAL && valueIndex === undefined) {
        	//Set an array value
        	if(!jslet.isArray(inputText)) {
        		inputText = inputText.split(fldObj.valueSeparator());
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
        	Z._addErrorField(fldName, inputText, invalidMsg, valueIndex);
        	return;
        } else {
        	Z._removeErrorField(fldName, valueIndex);
        }
        
        if(!inputText){
            Z.setFieldValue(fldName, null);
            return;
        }
        var convert = fldObj.customValueConverter() || jslet.data.getValueConverter(fldObj);
        if(!convert) {
        	throw new Error('Can\'t find any field value converter!');
        }
        var value = convert.textToValue.call(Z, fldObj, inputText, valueIndex);
        Z.setFieldValue(fldName, value, valueIndex);
    }

    /**
     * Get key value of current record
     * 
     * @return {Object} Key value
     */
    this.keyValue = function () {
        if (!this._keyField || this.recordCount() == 0) {
            return null;
        }
        return this.getFieldValue(this._keyField);
    }

    /**
     * Get parent record key value of current record
     * 
     * @return {Object} Parent record key value.
     */
    this.parentValue = function () {
        if (!this._parentField || this.recordCount() == 0) {
            return null;
        }
        return this.getFieldValue(this._parentField);
    }

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
    this.find = function (condition) {
        var Z = this;
        if (Z.recordCount() == 0) {
            return false;
        }
        if (condition == null) {
            Z._findCondition = null;
            Z._innerFindCondition = null;
            return false;
        }

        if (condition != Z._findCondition) {
            Z._innerFindCondition = new jslet.FormulaParser(this, condition);
        }
        if (Z._innerFindCondition.evalExpr()) {
            return true;
        }
        Z._silence++;
        var foundRecno = -1, oldRecno = Z._recno;
        try {
            Z.first();
            while (!Z._eof) {
                if (Z._innerFindCondition.evalExpr()) {
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
    }

    /**
     * Find record with specified field name and value
     * 
     * @param {String} fldName - field name
     * @param {Object} findingValue - finding value
     * @return {Boolean} 
     */
    this.findByField = function (fldName, findingValue) {
        var Z = this;
        if (Z.recordCount() == 0) {
            return false;
        }

        var value = Z.getFieldValue(fldName);
        if (value == findingValue) {
            return true;
        }

        var foundRecno = -1, oldRecno = Z.recno();
        try {
            var cnt = Z.recordCount();
            for (var i = 0; i < cnt; i++) {
                Z.innerSetRecno(i);
                value = Z.getFieldValue(fldName);
                if (value == findingValue) {
                    foundRecno = Z._recno;
                    break;
                }
            }
        } finally {
            Z.innerSetRecno(oldRecno);
        }
        if (foundRecno >= 0) {// can fire scroll event
            Z._gotoRecno(foundRecno);
            return true;
        }
        return false;
    }

    /**
     * Find record with key value.
     * 
     * @param {Object} keyValue Key value.
     * @return {Boolean}
     */
    this.findByKey = function (keyValue) {
        var keyField = this.keyField();
        if (!keyField) {
            return false;
        }
        this.findByField(keyField, keyValue);
    }

    /**
     * Find record and return specified field value
     * 
     * @param {String} fldName - field name
     * @param {Object} findingValue - finding field value
     * @param {String} returnFieldName - return value field name
     * @return {Object} 
     */
    this.lookup = function (fldName, findingValue, returnFieldName) {
        if (this.findByField(fldName, findingValue)) {
            return this.getFieldValue(returnFieldName);
        } else {
            return null;
        }
    }

    /**
     * Copy dataset's data. Example:
     * <pre><code>
     * var list = dsFoo.copyDataset('[age] &gt 25', true);
     * 
     * </code></pre>
     * 
     * @param {String} condition - specified condition expression
     * @param {Boolean} underCurrentFilter - if true, copy data under dataset's {@link}filter
     * @return {Object[]} Array of records. 
     */
    this.copyDataset = function (condition, underCurrentFilter) {
        var Z = this;
        if (Z.recordCount() == 0) {
            return null;
        }
        var result = [];

        if ((!condition) && (!underCurrentFilter || !Z._filtered)) {
            return Z._dataList.slice(0);
        }

        var foundRecno = -1, oldRecno = Z._recno, oldFiltered = Z._filtered;
        if (!underCurrentFilter) {
            Z._filtered = false;
        }

        Z._silence++;
        try {
            Z.first();
            while (!Z._eof) {
                if (Z._innerFindCondition.evalExpr()) {
                    result.push(Z.getRecord());
                }
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
    }

    /**
     * Set or get 'key' field name
     * 
     * @param {String} keyFldName Key field name.
     * @return {String or this}
     */
    this.keyField = function (keyFldName) {
    	if (keyFldName === undefined) {
    		return this._keyField;
    	}
    	
        this._keyField = keyFldName;
        return this;
    }

    /**
     * Set or get 'code' field name
     * 
     * @param {String} codeFldName Code field name.
     * @return {String or this}
     */
    this.codeField = function (codeFldName) {
    	if (codeFldName === undefined) {
    		return this._codeField;
    	}
    	
        this._codeField = codeFldName;
        return this;
    }
    
    /**
     * Set or get 'name' field name
     * 
     * @param {String} nameFldName Name field name
     * @return {String or this}
     */
    this.nameField = function (nameFldName) {
    	if (nameFldName === undefined) {
    		return this._nameField;
    	}
    	
        this._nameField = nameFldName;
        return this;
    }
    
    /**
     * Set or get 'parent' field name
     * 
     * @param {String} parentFldName Parent field name.
     * @return {String or this}
     */
    this.parentField = function (parentFldName) {
    	if (parentFldName === undefined) {
    		return this._parentField;
    	}
    	
        this._parentField = parentFldName;
        return this;
    }
    
    /**
     * Set or get 'select' field name. "Select field" is a field to store the selected state of a record. 
     * 
     * @param {String} parentFldName Parent field name.
     * @return {String or this}
     */
    this.selectField = function (selectFldName) {
    	if (selectFldName === undefined) {
    		return this._selectField;
    	}
    	
        this._selectField = selectFldName;
        return this;
    }
    
    /**
     * @private
     */
    this._convertFieldValue = function (srcField, srcValues, destFields,
			multiValueSeparator) {
        var Z = this;

        if (arguments.length <= 3) {
            multiValueSeparator = ',';
        }

        if (destFields == null) {
            throw new Error('NOT set destFields in method: ConvertFieldValue');
        }
        var isExpr = destFields.indexOf('[') > -1;
        if (isExpr) {
            if (destFields != Z._convertDestFields) {
                Z._innerConvertDestFields = new jslet.FormulaParser(this,
						destFields);
                Z._convertDestFields = destFields;
            }
        }
        if (typeof (srcValues) != 'string') {
            srcValues += '';
        }
        var values = srcValues.split(multiValueSeparator), valueCnt = values.length - 1;
        if (valueCnt == 0) {
            if (!Z.findByField(srcField, values[0])) {
            	return null;
                //throw new Error(jslet.formatString(jslet.locale.Dataset.valueNotFound,[Z._dsname, srcField, values[0]]));
            }
            if (isExpr) {
                return Z._innerConvertDestFields.evalExpr();
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
                destValue += Z._innerConvertDestFields.evalExpr();
            } else {
                destValue += Z.getFieldValue(destFields);
            }
            if (i != valueCnt) {
                destValue += multiValueSeparator;
            }
        }
        return destValue;
    }

    /**
     * Set or get context rule
     * 
     * @param {jslet.data.ContextRule} contextRule Context rule;
     * @return {jslet.data.ContextRule or this}
     */
    this.contextRule = function (contextRule) {
    	if (contextRule === undefined) {
    		return this._contextRule;
    	}
    	
        this._contextRule = contextRule;
        return this;
    }
    
    /**
     * Disable context rule
     */
    this.disableContextRule = function () {
        this._contextRuleEnabled = false;
        this.restoreContextRule();
    }

    /**
     * Enable context rule, any context rule will be calculated.
     */
    this.enableContextRule = function () {
        this._contextRuleEnabled = true;
        if (this._contextRule) {
            this._contextRule.clearConditionFieldValues();
        }
        this.calcContextRule();
    }

    /**
     * Check context rule enable or not.
     * 
     * @return {Boolean}
     */
    this.isContextRuleEnabled = function () {
        return this._contextRuleEnabled;
    }

    this.restoreContextRule = function () {
        if (this._contextRule) {
            this._contextRule.restoreContextRule();
        }
    }

    /**
     * @private
     */
    this.calcContextRule = function (changedField) {
        if (this._contextRule) {
            this._contextRule.calcContextRule(changedField);
        }
    }

    /**
     * Check current record if it's selectable.
     */
    this.checkSelectable = function () {
    	if(this.recordCount() == 0) {
    		return false;
    	}
    	if(this.onCheckSelectable) {
    		return this.onCheckSelectable.call(this);
    	}
    	return true;
    }
    
    /**
     * Get or set selected state of current record.
     */
    this.selected = function (selected) {
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
    }
    
    /**
     * Select/unselect all records.
     * 
     * @param {Boolean}selected  true - select records, false otherwise.
     * @param {Function)onSelectAll Select event handler.
     *   Pattern: function(dataset, Selected}{}
     *     //dataset: jslet.data.Dataset
     *     //Selected: Boolean
     *     //return: true - allow user to select, false - otherwise.

     * @param {Boolean}noRefresh Refresh controls or not.
     */
    this.selectAll = function (selected, onSelectAll, noRefresh) {
        var Z = this;
        if (Z.recordCount() == 0) {
            return;
        }

        try {
            var oldRecno = Z.recno();
            for (var i = 0, cnt = Z.recordCount(); i < cnt; i++) {
                Z.innerSetRecno(i);

                if (onSelectAll) {
                    var flag = onSelectAll(this, selected);
                    if (flag != undefined && !flag) {
                        continue;
                    }
                }
                Z.selected(selected);
            }
        } finally {
            Z.innerSetRecno(oldRecno);
        }
        if (!noRefresh) {
            var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.SELECTALLCHANGE, {
                selected: selected
            });
            Z.refreshControl(evt);
        }
    }

    /**
     * Select/unselect record by key value.
     * 
     * @param {Boolean} selected true - select records, false otherwise.
     * @param {Object) keyValue Key value.
     * @param {Boolean} noRefresh Refresh controls or not.
     */
    this.selectByKeyValue = function (selected, keyValue, noRefresh) {
        var Z = this;
        try {
            var oldRecno = Z.recno(), cnt = Z.recordCount(), v, changedRecNum;
            for (var i = 0; i < cnt; i++) {
                Z.innerSetRecno(i);
                v = Z.getFieldValue(Z._keyField);
                if (v == keyValue) {
                    Z.selected(selected);
                    changedRecNum = i;
                    break;
                }
            } //end for
        } finally {
            Z.innerSetRecno(oldRecno);
        }
        if (!noRefresh) {
            var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.SELECTCHANGE, {
                selected: selected,
                recno: changedRecNum
            });
            Z.refreshControl(evt);
        }
    }

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
    this.select = function (selected, selectBy) {
        var Z = this;
        if (Z.recordCount() == 0) {
            return;
        }

        var changedRecNum = [];
        if (!selectBy) {
            Z.selected(selected);
            changedRecNum.push(Z.recno());
        } else {
            var arrFlds = selectBy.split(','), arrValues = [], fldCnt = arrFlds.length;
            for (var i = 0; i < fldCnt; i++) {
                arrValues[i] = Z.getFieldValue(arrFlds[i]);
            }
            var v, preRecno = Z.recno(), flag;
            try {
                for (var k = 0, recCnt = Z.recordCount(); k < recCnt; k++) {
                    Z.innerSetRecno(k);
                    flag = 1;
                    for (var i = 0; i < fldCnt; i++) {
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
                Z.innerSetRecno(preRecno);
            }
        }

        var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.SELECTCHANGE, {
            selected: selected,
            recno: changedRecNum
        });
        Z.refreshControl(evt);
    }

    /**
     * Set or get data provider
     * 
     * @param {jslet.data.Provider} provider - data provider
     * @return {jslet.data.Provider or this}
     */
    this.dataProvider = function (provider) {
    	if (provider === undefined) {
    		return this._dataProvider;
    	}
        this._dataProvider = provider;
        return this;
    }
    
    /**
     * @private
     */
    this._checkDataProvider = function () {
        if (!this._dataProvider) {
            alert('DataProvider is NOT set,can\'t connect to server!');
            return false;
        }
        return true;
    }

    /**
     * Get inserted records, use this method to get inserted records that need apply to server.
     * 
     * @return {Array of Object} 
     */
    this.insertedRecords = function () {
        this.checkStatusAndConfirm();
        return this._insertedDelta;
    }

    /**
     * Get updated records, use this method to get updated records that need apply to server.
     * 
     * @return {Array of Object}
     */
    this.updatedRecords = function () {
        this.checkStatusAndConfirm();
        return this._updatedDelta;
    }

    /**
     * Get deleted records, use this method to get deleted records that need apply to server.
     * 
     * @return {Array of Object}
     */
    this.deletedRecords = function () {
        return this._deletedDelta;
    }
    
    /**
     * Get selected records
     * 
     * @return {Object[]} Array of records
     */
    this.selectedRecords = function () {
    	var Z = this;
        if (Z._dataList == null || Z._dataList.length == 0) {
            return null;
        }

        var preRecno = Z.recno(), result = [];
        try {
            for (var k = 0, recCnt = Z.recordCount(); k < recCnt; k++) {
                Z.innerSetRecno(k);
                if(Z.selected()) {
                	result.push(Z.getRecord());
                }
            }
        } finally {
            Z.innerSetRecno(preRecno);
        }
        
        return result;
    }

    /**
     * Get key values of selected records.
     * 
     * @return {Object[]} Array of selected record key values
     */
    this.selectedKeyValues = function () {
        var oldRecno = this.recno(), result = [];
        try {
            for (var i = 0, cnt = this.recordCount(); i < cnt; i++) {
                this.innerSetRecno(i);
                if (this.selected()) {
                    result.push(this.getFieldValue(this._keyField));
                }
            }
        } finally {
            this.innerSetRecno(oldRecno);
        }
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    /**
     * Retrieve data from server. Example:
     * <pre><code>
     * var condition = {name:'Bob', age:25};
     * dsEmployee.applyQuery('../getemployee.do', condition);
     * </code></pre>
     * @param {String} url url
     * @param {Object} condition Condition.
     */
    this.applyQuery = function (url, condition) {
		this._queryUrl = url;
        this._condition = condition;
        this.applyRefresh();
    }

    this._doQuerySuccess = function(result) {
    	var Z = this;
        if (!result) {
        	Z.dataList(null);
        	return;
        }

        if (result.result === undefined) {
            Z.dataList(result);
        } else {
            var keys = Object.keys(result), dsName, ds;
            for (var i = 0, cnt = keys.length; i < cnt; i++) {
                dsName = keys[i];
                if (dsName == 'result') {
                    continue;
                }
                ds = jslet.data.dataModule.get(dsName);
                if (ds) {
                    ds.dataList(result[dsName]);
                }
            }
            Z.dataList(result.result);
            if (result.pageNo) {
                Z._pageNo = result.pageNo;
            }
            if (result.pageCount) {
                Z._pageCount = result.pageCount;
            }

            Z.refreshControl(new jslet.data.UpdateEvent(
					jslet.data.UpdateEvent.PAGECHANGE, null));
            if(Z.onApplySuccess) {
            	Z.onApplySuccess("query");
            }
        }
    }
    
    this._doApplyError = function(actionName, errorMessage) {
    	if(this.onApplyError) {
    		this.onApplyError(actionName, errorMessage);
    	} else {
    		jslet.showException(errorMessage);
    	}
    }
    
    /**
     * Send request to refresh with current condition.
     */
    this.applyRefresh = function () {
        var Z = this;
        if (!Z._checkDataProvider() || !Z._queryUrl) {
            return;
        }

        Z._dataProvider.applyQuery(Z, Z._queryUrl, Z._condition, Z._pageNo,
				Z._pageSize, Z._doQuerySuccess, Z._doApplyError);
    }

    this._setChangedState = function(flag, chgRecs, pendingRecs) {
        if (chgRecs && chgRecs.length > 0) {
            for (var i = 0, cnt = chgRecs.length; i < cnt; i++) {
                rec = chgRecs[i];
                rec[jslet.global.changeStateField] = flag + i;
                pendingRecs.push(rec);
            }
        }
    }
    
    this._clearChangeState = function(chgedRecs) {
    	if(!chgedRecs) {
    		return;
    	}
    	var rec;
    	for(var i = 0, len = chgedRecs.length; i < len; i++) {
    		rec = chgedRecs[i];
            delete rec[jslet.global.changeStateField];    		
    	}
    }
    
    this._doSaveSuccess = function(result) {
        if (!result) {
            return;
        }
        this._convertDate(result);
        var Z = this, state, rec, c, oldRecs, oldRec;
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
       			} //end for k
        	}
        } //end for i
        
        Z._clearChangeState(Z.insertedRecords());
        Z._clearChangeState(Z.updatedRecords());
        Z._insertedDelta = [];
        Z._updatedDelta = [];
        Z._deletedDelta = [];
        
        Z.refreshControl(jslet.data.UpdateEvent.updateAllEvent); 	
    }
    
    /**
     * Send changed data to server. 
     * If save successfully, return the changed data and refresh client data automatically.
     * 
     * Cause key value is probably generated at server side(like sequence), we need an extra field which store an unique value to update the key value,
     * this extra field is named '_s_', its value will start a letter 'i', 'u' or 'd', and follow a sequence number, like: i1, i2, u1, u2, d1, d3,....
     * You don't care about it in client side, it is generated by Jslet automatically.
     * 
     * At server side, you can use the leading letter to distinguish which action will be sent to DB('i' for insert, 'u' for update and 'd' for delete)
     * If the records need be changed in server(like sequence key or other calculated fields), you should return them back.Notice:
     * you need not to change this value of extra field: '_s_', just return it. Example:
     * <pre><code>
     * dsFoo.insertRec();
     * dsFoo.setFieldValue('name','Bob');
     * dsFoo.setFieldValue('code','A01');
     * dsFoo.confirm();
     * 
     * dsFoo.applyChanges('../foo_save.do');
     * </code></pre>
     * 
     * @param {String} url Url
     */
    this.applyChanges = function(url) {
        var Z = this;
        if (!Z._checkDataProvider()) {
            return;
        }
        var changedRecs = [];
        Z._setChangedState('i', Z.insertedRecords(), changedRecs);
        Z._setChangedState('u', Z.updatedRecords(), changedRecs);
        Z._setChangedState('d', Z.deletedRecords(), changedRecs);

        if (!changedRecs || changedRecs.length == 0) {
        	return;
        }
        Z._dataProvider.applyChanges(Z, url, changedRecs, Z._doSaveSuccess, Z._doApplyError);
    }
    
    this._doApplySelectedSuccess = function(result, callBackOption) {
        if (!result || result.length == 0) {
            return;
        }
        var deleteOnSuccess = false;
        if(callBackOption && callBackOption.deleteOnSuccess) {
        	deleteOnSuccess = true;
        }
        
        var Z = this, arrRecs = Z.selectedRecords();
        if(deleteOnSuccess) {
	        for(var i = arrRecs.length, k; i >= 0; i--) {
	        	rec = arrRecs[i];
	        	k = Z._dataList.indexOf(rec);
	        	Z._dataList.splice(k, 1);
	        }
        } else {
        	var newRec;
            this._convertDate(result);
	        for(var i = arrRecs.length - 1; i >= 0; i--) {
	        	rec = arrRecs[i];
	        	for(var k = 0, len = result.length; k < len; k++)
	        	{
	        		newRec = result[k];
	        		if(rec[jslet.global.changeStateField] == newRec[jslet.global.changeStateField]) {
		        		for(var propName in newRec) {
		        			rec[propName] = newRec[propName];
		        		}
		        		//clear change state flag
		        		delete rec[jslet.global.changeStateField];
		        		//clear selected flag
		        		var selFld = this._selectField || jslet.global.selectStateField;
		        		delete rec[selFld];
		        		break;
	        		}
	        	} //end for k
	        }//end for i
        }
        Z.refreshControl(jslet.data.UpdateEvent.updateAllEvent);
    }
    
    /**
     * Send selected data to server whether or not the records have been changed. 
     * Under some special scenarios, we need send user selected record to server to process. 
     * Sever side need not send back the processed records. Example:
     * 
     * <pre><code>
     * //Audit the selected records, if successful, delete the selected records.
     * dsFoo.applySelected('../foo_audit.do', true);
     * 
     * </code></pre>
     * @param {String} url Url
     * @param {Boolean} deleteOnSuccess If processing successfully at server side, delete the selected record or not.
     */
    this.applySelected = function (url, deleteOnSuccess) {
        var Z = this;
        if (!Z._checkDataProvider()) {
            return;
        }
        var changedRecs = [];
        Z._setChangedState('s', Z.selectedRecords(), changedRecs);
        var arrRecs = Z.selectedRecords();
        if (!changedRecs || changedRecs.length == 0) {
            return;
        }
        Z._dataProvider.applySelected(Z, url, changedRecs, Z._doApplySelectedSuccess, Z._doApplyError, deleteOnSuccess);
    }

    /**
     * @private
     */
    this._informInvalid = function (fieldName, invalidMsg) {
        for (var i = 0, cnt = this._linkedControls.length, ctrl; i < cnt; i++) {
            ctrl = this._linkedControls[i];
            if (!ctrl.field || ctrl.field != fieldName) {
                continue;
            }
            if (ctrl.renderInvalid) {
                ctrl.renderInvalid(invalidMsg);
            }
        }
    }

    /**
     * @private
     */
    this._refreshInnerControl = function (updateEvt) {
    	if (jslet.data.UpdateEvent.updateAllEvent == updateEvt || updateEvt.eventType == jslet.data.UpdateEvent.METACHANGE) {
            for (var i = 0, cnt = this._linkedLabels.length, ctrl; i < cnt; i++) {
                ctrl = this._linkedLabels[i];
                if (ctrl.refreshControl) {
                    ctrl.refreshControl(updateEvt);
                }
            }
    	}

        for (var i = 0, cnt = this._linkedControls.length, ctrl; i < cnt; i++) {
            ctrl = this._linkedControls[i];
            if (ctrl.refreshControl) {
                ctrl.refreshControl(updateEvt);
            }
        }
    }

    /**
     * Focus on the edit control that link specified field name.
     * 
     * @param {String} fldName Field name
     */
    this.focusEditControl = function (fldName) {
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
    }

    /**
     * @private 
     */
    this.refreshControl = function (updateEvt) {
        if (this._lockCount) {
            return;
        }

        if (!updateEvt) {
            updateEvt = jslet.data.UpdateEvent.updateAllEvent;
        }
        if (updateEvt.eventType == jslet.data.UpdateEvent.UPDATEALL) {
            var flag = this.isContextRuleEnabled();
            if (flag) {
                this.disableContextRule();
            }
            try {
                this._refreshInnerControl(updateEvt);
            } finally {
                if (flag) {
                    this.enableContextRule();
                }
            }
        } else {
            this._refreshInnerControl(updateEvt);
        }
    }

    /**
     * @private 
     */
    this.renderOptions = function (fldName) {
        var refreshField = (fldName != undefined), ctrl;
        for (var i = 0, cnt = this._linkedControls.length; i < cnt; i++) {
            ctrl = this._linkedControls[i];
            if (ctrl.renderOptions == undefined
					|| (refreshField && ctrl.field != fldName)) {
                continue;
            }
            ctrl.renderOptions();
            if (this._lockCount) {
                continue;
            }
            ctrl.refreshControl(jslet.data.UpdateEvent.updateAllEvent);
        } //end for
    }

    /**
     * @private 
     */
    this.addLinkedControl = function (linkedControl) {
    	if (linkedControl.isLabel) {
    		this._linkedLabels.push(linkedControl);
    	} else {
    		this._linkedControls.push(linkedControl);
    	}
    }

    /**
     * @private 
     */
    this.removeLinkedControl = function (linkedControl) {
    	var arrCtrls = linkedControl.isLabel ? this._linkedLabels : this._linkedControls;
    	
        var k = arrCtrls.indexOf(linkedControl);
        if (k >= 0) {
        	arrCtrls.splice(k, 1);
        }
    }

    /**
     * Export data with CSV format
     * 
     * @param {String}includeFieldLabel - export with field labels, can be null  
     * @param {Boolean}dispValue - true: export display value of field, false: export actual value of field 
     * @param {Boolean}onlySelected - export selected records or not.
     * @return {String} Csv Text. 
     */
    this.exportCsv = function(includeFieldLabel, dispValue, onlySelected) {
    	var Z= this, fldSeperator = ',', surround='"';
    	var context = Z.startSilenceMove();
    	try{
    		Z.first();
    		var result = [], arrRec, fldCnt = Z._normalFields.length, fldObj, fldName, value;
    		if (includeFieldLabel) {
				arrRec = [];
				for(var i = 0; i < fldCnt; i++) {
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
    			for(var i = 0; i < fldCnt; i++) {
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
    }

    /**
     * Set or get raw data list
     * 
     * @param {Object[]} datalst - raw data list
     */
    this.dataList = function (datalst) {
        var Z = this;
        if (datalst === undefined) {
        	return Z._dataList;
        }
        
        Z._dataList = datalst;
        Z._convertDate();
        Z._insertedDelta.length = 0;
        Z._updatedDelta.length = 0;
        Z._deletedDelta.length = 0;
        Z._status = jslet.data.DataSetStatus.BROWSE;
        Z.filter(null);
        Z.indexFields(Z.indexFields());
        Z.first();
        Z.refreshControl(jslet.data.UpdateEvent.updateAllEvent);
        return this;
    }
    
    /**
     * Return dataset data with field text, field text is formatted or calculated field value.
     * You can use them to do your special processing like: use them in jquery template.
     */
    this.textList = function() {
        var Z = this,
        	oldRecno = Z.recno(), 
        	result = [],
        	fldCnt = Z._normalFields.length,
        	fldObj, fldName, textValue, textRec;
        try {
            for (var i = 0, cnt = Z.recordCount(); i < cnt; i++) {
                Z.innerSetRecno(i);
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
            this.innerSetRecno(oldRecno);
        }
    }
    
    this.destroy = function () {
        var Z = this;
        Z._masterDataset = null;
        Z._detailDatasets.length = 0;
        Z._fields.length = 0;
        Z._linkedControls.length = 0;
        Z._innerFilter = null;
        Z._innerFindCondition = null;
        Z._innerIndexFields = null;
    }
    
}               
// end Dataset

/**
 * Create Enum Dataset. Example:
 * <pre><code>
 * var dsGender = jslet.data.createEnumDataset('gender', 'F:Female,M:Male');
 * //Or use this
 * //var dsGender = jslet.data.createEnumDataset('gender', {'F':'Female','M':'Male'});
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
jslet.data.createEnumDataset = function(dsName, enumStrOrObject) {
	var dsObj = new jslet.data.Dataset(dsName);
	dsObj.addField(jslet.data.createStringField('code', 10));
	dsObj.addField(jslet.data.createStringField('name', 20));

	dsObj.keyField('code');
	dsObj.codeField('code');
	dsObj.nameField('name');
	var dataList = [];
	if(jslet.isString(enumStrOrObject)) {
		var recs = enumStrOrObject.split(','), recstr;
		for (var i = 0, cnt = recs.length; i < cnt; i++) {
			recstr = recs[i];
			rec = recstr.split(':');
	
			dataList[dataList.length] = {
				'code' : rec[0],
				'name' : rec[1]
			};
		}
	} else {
		for(var key in enumStrOrObject) {
			dataList[dataList.length] = {
					'code' : key,
					'name' : enumStrOrObject[key]
				};
		}
	}
	dsObj.dataList(dataList);
	return dsObj;
}

/**
 * Create dataset by field config. Example:
 * <pre><code>
 *   var fldCfg = [{
 *       name: 'deptid',
 *       type: 'S',
 *       length: 10,
 *       label: 'ID'
 *   }, {
 *       name: 'name',
 *       type: 'S',
 *       length: 20,
 *       label: 'Dept. Name'
 *   }];
 *   var dsDepartment = jslet.data.createDataset('department', fldCfg, 'deptid',
            'deptid', 'name');
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
jslet.data.createDataset = function(dsName, fieldConfig, keyField,
		codeField, nameField, parentField) {
	var dsObj = new jslet.data.Dataset(dsName),fldObj;
	for (var i = 0, cnt = fieldConfig.length; i < cnt; i++) {
		fldObj = jslet.data.createField(fieldConfig[i]);
		dsObj.addField(fldObj);
	}

	if (keyField) {
		dsObj.keyField(keyField);
	}
	if (codeField) {
		dsObj.codeField(codeField);
	}
	if (nameField) {
		dsObj.nameField(nameField);
	}
	if (parentField) {
		dsObj.parentField(parentField);
	}
	return dsObj;
}
