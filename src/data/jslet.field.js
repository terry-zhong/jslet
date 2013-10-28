/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class Field 
 * 
 * @param {String} fieldName Field name
 * @param {jslet.data.DataType} dataType Data type of field
 */
jslet.data.Field = function (fieldName, dataType) {
    var fdataset, 
    fdisplayOrder = 0,
    ffieldName = fieldName,
    fdataType = dataType,
    flength = 0,
    fscale = 0,
    falignment = 'left',
    fdefaultExpr,
    fdefaultValue,
    flabel,
    fdisplayWidth = 0,
    feditMask,
    fdisplayFormat,
    fdateFormat,
	fformula,
    freadOnly = false,
    fvisible = true,
    fenabled = true,
    fcustomValueConverter,
    funitConverted = false,
    flookupField,
    fdisplayControl,
    feditControl,
    fsubDataset,
    furlExpr,
    finnerUrlExpr,
    furlTarget,
    fvalueStyle = jslet.data.FieldValueStyle.NORMAL, //0 - Normal, 1 - Between style value, 2 - Multiple value
    fvalueSeparator = ',',
    fvalueCountLimit = 0,
    frequired = false,
    fnullText,
    frange,
    fregularExpr,
    fantiXss = true,
    fcustomValidator,
    fvalidChars, //Array of characters
    fdateChar = null,
    fdateRegular,
    fparent, //parent field object
    fchildren; //child field object, only group field has child field object.

    this.clone = function(newDataset){
    	var result = new jslet.data.Field(ffieldName, fdataType);
    	result.dataset(newDataset ? newDataset : this.dataset());
    	result.length(flength);
    	result.scale(fscale);
    	result.alignment(falignment);
    	result.defaultExpr(fdefaultExpr);
    	result.defaultValue(fdefaultValue);
    	result.label(flabel);
    	result.displayWidth(fdisplayWidth);
    	if (feditMask) {
    		result.editMask(feditMask.clone());
    	}
    	result.displayFormat(fdisplayFormat);
    	result.dateFormat(fdateFormat);
    	result.formula(fformula);
    	result.readOnly(freadOnly);
    	result.visible(fvisible);
    	result.enabled(fenabled);
    	result.unitConverted(funitConverted);
    	if (flookupField) {
    		result.lookupField(flookupField.clone());
    	}
    	result.onGetLookupField = this.onGetLookupField;
    	
    	result.displayControl(fdisplayControl);
    	result.editControl(feditControl);
    	result.urlExpr(furlExpr);
    	result.urlTarget(furlTarget);
    	result.valueStyle(fvalueStyle);
    	result.valueSeparator(fvalueSeparator);
    	result.valueCountLimit(fvalueCountLimit);
    	result.required(frequired);
    	result.nullText(fnullText);
    	result.range(frange);
    	if (fregularExpr) {
    		result.regularExpr(fregularExpr);
    	}
    	result.antiXss(fantiXss);
    	result.customValidator(fcustomValidator);
    	result.customValueConverter(fcustomValueConverter);
    	result.validChars(fvalidChars);
    	if (fparent) {
    		result.parent(fparent.clone(newDataset));
    	}
    	if (fchildren && fchildren.length > 0){
    		var childFlds = [];
    		for(var i = 0, cnt = fchildren.length; i < cnt; i++){
    			childFlds.push(fchildren[i].clone(newDataset));
    		}
    		result.children(childFlds);
    	}
    	return result;
    }
    
	/**
	 * {jslet.data.Dataset}
	 */
    this.dataset = function (dataset) {
    	if (dataset === undefined) {
    		if(fparent) {
    			return fparent.dataset();
    		}
    		return fdataset;
    	}
    	
    	if(jslet.isString(dataset)) {
    		dataset = jslet.data.getDataset(dataset); 
    	}
    	fdataset = dataset;
    }
    
    /**
     * Get field name
     * 
     * @return {String}
     */
    this.name = function (fldName) {
    	if (fldName === undefined) {
    		return ffieldName;
    	}
    	ffieldName = fldName;
        return this;
    }

    /**
     * Get or set field label.
     * 
     * @param {String or undefined} label Field label.
     * @return {String or this}
     */
    this.label = function (label) {
    	if (label === undefined) {
    		return flabel || ffieldName;
    	}
        flabel = label;
        if (this.dataset()) {
            var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.METACHANGE, {
                displayLabel: flabel,
                required: frequired
            });
            this.dataset().refreshControl(evt);
        }
        return this;
    }

    /**
     * Get field data type
     * 
     * @param {jslet.data.DataType}
     */
    this.getType = function () {
        return fdataType;
    }

    /**
     * Get or set parent field object.
     * It is ignored if dataType is not jslet.data.DataType.GROUP
     * 
     * @param {jslet.data.Field or undefined} parent Parent field object.
     * @return {jslet.data.Field or this}
     */
    this.parent = function (parent) {
    	if (parent === undefined) {
    		return fparent;
    	}
    	fparent = parent;
        return this;
    }

    /**
     * Get or set child fields of this field.
     * It is ignored if dataType is not jslet.data.DataType.GROUP
     * 
     * @param {jslet.data.Field[] or undefined} children Child field object.
     * @return {jslet.data.Field or this}
     */
    this.children = function (children) {
    	if (children === undefined) {
    		return fchildren;
    	}
    	fchildren = children;
        return this;
    }
    
    /**
     * Get or set field display order.
     * Dataset uses this property to resolve field order.
     * 
     * @param {Integer or undefined} index Field display order.
     * @return {Integer or this}
     */
    this.displayOrder = function (displayOrder) {
    	if (displayOrder === undefined) {
    		return fdisplayOrder;
    	}
        fdisplayOrder = parseInt(displayOrder);
        return this;
    }

    /**
     * Get or set field stored length.
     * If it's a database field, it's usually same as the length of database.  
     * 
     * @param {Integer or undefined} len Field stored length.
     * @return {Integer or this}
     */
    this.length = function (len) {
    	if (len === undefined) {
    		return flength;
    	}
        flength = parseInt(len);
        return this;
    }
    
    /**
     * Get edit length.
     * Edit length is used in editor to input data.
     * 
     * @return {Integer}
     */
    this.getEditLength = function () {
        if (flookupField) {
            var codeFld = flookupField.codeField();
            var lkds = flookupField.lookupDataset();
            if (lkds && codeFld) {
                var lkf = lkds.getField(codeFld);
                if (lkf) {
                    return lkf.getEditLength();
                }
            }
        }

        return flength > 0 ? flength : 10;
    }

    /**
     * Get or set field decimal length.
     * 
     * @param {Integer or undefined} scale Field decimal length.
     * @return {Integer or this}
     */
    this.scale = function (scale) {
    	if (scale === undefined) {
    		return fscale;
    	}
        fscale = parseInt(scale);
        return this;
    }

    /**
     * Get or set field alignment.
     * 
     * @param {String or undefined} alignment Field alignment.
     * @return {String or this}
     */
    this.alignment = function (alignment) {
    	if (alignment === undefined){
    		if (fdataType == jslet.data.DataType.NUMBER){
    			return 'right';
    		}
    		return falignment;
    	}
    	
        falignment = alignment;
        if (this.dataset()) {
            var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.UPDATECOLUMN, {
                fieldName: ffieldName
            });
            this.dataset().refreshControl(evt);
        }
        return this;
    }

    /**
     * Get or set the display text if the field value is null.
     * 
     * @param {String or undefined} nullText Field null text.
     * @return {String or this}
     */
    this.nullText = function (nullText) {
    	if (nullText === undefined) {
    		return fnullText;
    	}
        fnullText = nullText;
        return this;
    }

    /**
     * Get or set field display width.
     * Display width is usually used in DBTable column.
     * 
     * @param {Integer or undefined} displayWidth Field display width.
     * @return {Integer or this}
     */
    this.displayWidth = function (displayWidth) {
    	if (displayWidth === undefined){
            if (fdisplayWidth <= 0) {
                return flength > 0 ? flength : 12;
            } else {
                return fdisplayWidth;
            }
    	}
        fdisplayWidth = parseInt(displayWidth);
        return this;
    }
    
    /**
     * Get or set field default expression.
     * This expression will be calculated when inserting a record.
     * 
     * @param {String or undefined} defaultExpr Field default expression.
     * @return {String or this}
     */
    this.defaultExpr = function (defaultExpr) {
    	if (defaultExpr === undefined) {
    		return fdefaultExpr;
    	}
        fdefaultExpr = defaultExpr;
        return this;
    }

    /**
     * Get or set field display format.
     * For number field like: #,##0.00
     * For date field like: yyyy/MM/dd
     * 
     * @param {String or undefined} format Field display format.
     * @return {String or this}
     */
    this.displayFormat = function (format) {
    	if (format === undefined) {
    		if (fdisplayFormat) {
    			return fdisplayFormat;
    		} else {
    			if (fdataType == jslet.data.DataType.DATE) {
    				return jslet.locale.Date.format;
    			} else {
    				return fdisplayFormat;
    			}
    		}
    	}
    	
        fdisplayFormat = format;
        fdateFormat = null;
        fdateChar = null;
        fdateRegular = null;
        
        if (this.dataset()) {
            var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.UPDATECOLUMN, {
                fieldName: ffieldName
            });
            this.dataset().refreshControl(evt);
        }
        return this;
    }

    /**
     * Get or set field default value.
     * The data type of default value must be same as Field's.
     * Example:
     *   Number field: fldObj.defauleValue(100);
     *   Date field: fldObj.defaultValue(new Date());
     *   String field: fldObj.defaultValue('test');
     * 
     * @param {Object or undefined} dftValue Field default value.
     * @return {Object or this}
     */
    this.defaultValue = function (dftValue) {
    	if (dftValue === undefined) {
    		return fdefaultValue;
    	}
        fdefaultValue = dftValue;
        return this;
    }

    /**
     * Get or set field is required or not.
     * 
     * @param {Boolean or undefined} required Field is required or not.
     * @return {Boolean or this}
     */
    this.required = function (required) {
    	if (required === undefined) {
    		return frequired;
    	}
        frequired = required;
        if (this.dataset()) {
            var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.METACHANGE, {
                displayLabel: flabel,
                required: frequired
            });
            this.dataset().refreshControl(evt);
        }
        return this;
    }
    
    /**
     * Get or set field edit mask.
     * 
     * @param {jslet.data.EditMask or undefined} mask Field edit mask.
     * @return {jslet.data.EditMask or this}
     */
    this.editMask = function (mask) {
    	if (mask === undefined) {
    		return feditMask;
    	}
    	var maskObj = mask;
        if (typeof maskObj == 'string') {
            var maskObj = new Function('return ' + maskObj)();
        }
        feditMask = maskObj;
        return this;
    }
    
    this.dateFormat = function(){
    	if (fdateFormat) {
    		return fdateFormat;
    	}
    	if (this.getType() != jslet.data.DataType.DATE) {
    		return null;
    	}
    	var displayFmt = this.displayFormat().toUpperCase();
    	fdateFormat = '';
    	var c;
    	for(var i = 0, len = displayFmt.length; i < len; i++){
    		c = displayFmt.charAt(i);
    		if ('YMD'.indexOf(c) < 0) {
    			continue;
    		}
    		if (fdateFormat.indexOf(c) < 0) {
    			fdateFormat += c;
    		}
    	}
    	return fdateFormat;
    }
    
    this.dateSeparator = function(){
    	if (fdateChar) {
    		return fdateChar;
    	}
    	if (this.getType() != jslet.data.DataType.DATE) {
    		return null;
    	}
    	var displayFmt = this.displayFormat().toUpperCase();
    	for(var i = 0, c, len = displayFmt.length; i < len; i++){
    		c = displayFmt.charAt(i);
    		if ('YMD'.indexOf(c) < 0){
    			fdateChar = c;
    			return c;
    		}
    	}
    }
    
    this.dateRegular = function(){
    	if (fdateRegular) {
    		return fdateRegular;
    	}
    	var dateFmt = this.dateFormat(),
    	    dateSeparator = this.dateSeparator(),
    	    result = ['^'];
    	for(var i = 0, c; i < dateFmt.length; i++){
    		if (i > 0){
    			result.push('\\');
    			result.push(dateSeparator);
    		}
    		c = dateFmt.charAt(i);
    		if (c == 'Y') {
    			result.push('(\\d{4}|\\d{2})');
    		} else if (c == 'M'){
    			result.push('(0?[1-9]|1[012])');
    		} else {
    			result.push('(0?[1-9]|[12][0-9]|3[01])');
    		}
    	}
    	result.push('(\\s+\\d{2}:\\d{2}:\\d{2}(\\.\\d{3}){0,1}){0,1}')
    	result.push('$');
    	fdateRegular = {expr: new RegExp(result.join(''), 'gim'), message: jslet.locale.Dataset.invalidDate};
    	return fdateRegular;
    }
    /**
     * Get or set field formula. Example: 
     * <pre><code>
     *  fldObj.formula('[price]*[num]');
     * </code></pre>
     * 
     * @param {String or undefined} formula Field formula.
     * @return {String or this}
     */
    this.formula = function (formula) {
    	if (formula === undefined) {
    		return fformula;
    	}
        fformula = formula;
        if (this.dataset()) {
            this.dataset().removeInnerFormularFields(ffieldName);
            var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.UPDATECOLUMN, {
                fieldName: ffieldName
            });
            this.dataset().refreshControl(evt);
        }
        return this;
    }

    /**
     * Get or set field is visible or not.
     * 
     * @param {Boolean or undefined} visible Field is visible or not.
     * @return {Boolean or this}
     */
    this.visible = function (visible) {
    	if (visible === undefined){
    		if (fvisible){
    			var p = this.parent();
    			while(p){
    				if (!p.visible()) { //if parent is invisible
    					return false;
    				}
    				p = p.parent();
    			}
    		}
    		return fvisible;
    	}
        fvisible = visible;
        if (this.dataset()) {
            var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.METACHANGE, {
                visible: fvisible
            });
            this.dataset().refreshControl(evt);
        }
        return this;
    }

    /**
     * Get or set field is enabled or not.
     * 
     * @param {Boolean or undefined} enabled Field is enabled or not.
     * @return {Boolean or this}
     */
    this.enabled = function (enabled) {
    	if (enabled === undefined) {
    		return fenabled;
    	}
        fenabled = enabled;
        if (this.dataset()) {
            var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.METACHANGE, {
                enabled: fenabled
            });
            this.dataset().refreshControl(evt);
        }
        return this;
    }

    /**
     * Get or set field is readOnly or not.
     * 
     * @param {Boolean or undefined} readOnly Field is readOnly or not.
     * @return {Boolean or this}
     */
    this.readOnly = function (readOnly) {
    	if (readOnly === undefined){
            if (fformula || fdataType == jslet.data.DataType.DATASET || fdataType == jslet.data.DataType.GROUP) {
                return true;
            }

            return freadOnly;
    	}
    	
        freadOnly = readOnly;
        if (this.dataset()) {
            var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.METACHANGE, {
                readOnly: freadOnly
            });
            this.dataset().refreshControl(evt);
        }
        return this;
    }
    
    /**
     * Get or set if field participates unit converting.
     * 
     * @param {Boolean or undefined} unitConverted .
     * @return {Boolean or this}
     */
    this.unitConverted = function (unitConverted) {
    	if (unitConverted === undefined) {
    		return fdataType == jslet.data.DataType.NUMBER? funitConverted:false;
    	}
        funitConverted = unitConverted;
        var ds = this.dataset();
        if (fdataType == jslet.data.DataType.NUMBER && ds && ds.unitConvertFactor() != 1) {
            var evt = new jslet.data.UpdateEvent(jslet.data.UpdateEvent.UPDATECOLUMN, {
                fieldName: ffieldName
            });
            ds.refreshControl(evt);
        }
        return this;
    }

    /**
     * Get or set value style of this field. Optional value: 0 - Normal, 1 - Between style, 2 - Multiple value
     * 
     * @param {Integer or undefined} mvalueStyle.
     * @return {Integer or this}
     */
    this.valueStyle = function (mvalueStyle) {
    	if (mvalueStyle === undefined) {
    		if(fdataType == jslet.data.DataType.DATASET ||  
    			fdataType == jslet.data.DataType.GROUP) 
    			return jslet.data.FieldValueStyle.NORMAL;
    		
    		return fvalueStyle;
    	}
        fvalueStyle = mvalueStyle;
        return this;
    }

    /**
     * Get or set value separator of this field.
     * 
     * @param {String or undefined} mvalueSeparator.
     * @return {String or this}
     */
    this.valueSeparator = function (separator) {
    	if (separator === undefined) {
    		return fvalueSeparator;
    	}
        fvalueSeparator = separator;
        return this;
    }

    /**
     * Get or set allowed count when valueStyle is multiple.
     * 
     * @param {String or undefined} count.
     * @return {String or this}
     */
    this.valueCountLimit = function (count) {
    	if (count === undefined) {
    		return fvalueCountLimit;
    	}
        fvalueCountLimit = parseInt(count);
        return this;
    }
      
    /**
     * Get or set field display control. It is similar as DBControl configuration.
     * Here you need not set 'dataset' and 'field' property.   
     * Example:
     * <pre><code>
     * //Normal DBControl configuration
     * //var normalCtrlCfg = {type:"DBSpinEdit",dataset:"employee",field:"age",minValue:10,maxValue:100,step:5};
     * 
     * var displayCtrlCfg = {type:"DBSpinEdit",minValue:10,maxValue:100,step:5};
     * fldObj.displayControl(displayCtrlCfg);
     * </code></pre>
     * 
     * @param {DBControl Config or String} dispCtrl If String, it will convert to DBControl Config.
     * @return {DBControl Config or this}
     */
     this.displayControl = function (dispCtrl) {
    	 if (dispCtrl === undefined){
	        if (fdataType == jslet.data.DataType.BOOLEAN && !fdisplayControl) {
	            return {
	                type: 'dbcheckbox'
	            };
	        }
	        return fdisplayControl;
    	 }
    	 
    	 fdisplayControl = (typeof (ffieldName) == 'string') ? { type: dispCtrl } : dispCtrl;
    	 return this;
     }

     /**
      * Get or set field edit control. It is similar as DBControl configuration.
      * Here you need not set 'dataset' and 'field' property.   
      * Example:
      * <pre><code>
      * //Normal DBControl configuration
      * //var normalCtrlCfg = {type:"DBSpinEdit",dataset:"employee",field:"age",minValue:10,maxValue:100,step:5};
      * 
      * var editCtrlCfg = {type:"DBSpinEdit",minValue:10,maxValue:100,step:5};
      * fldObj.displayControl(editCtrlCfg);
      * </code></pre>
      * 
      * @param {DBControl Config or String} editCtrl If String, it will convert to DBControl Config.
      * @return {DBControl Config or this}
      */
     this.editControl = function (editCtrl) {
    	 if (editCtrl=== undefined){
	        if (this.feditControl) {
	            return this.feditControl;
	        }

	        if (fdataType == jslet.data.DataType.BOOLEAN) {
	            return {type: 'dbcheckbox'};
	        } else if (fdataType == jslet.data.DataType.DATE) {
	            return {type: 'dbdatepicker'};
	        } else {
	            return (flookupField != null)? {type: 'dbselect'}:{type: 'dbtext'};
	        }
    	 }
    	 
    	 this.feditControl = (typeof (editCtrl) === 'string') ? { type: editCtrl } : editCtrl;
     }

     /**
      * {Event} Get customized field text.
      * Pattern: function(fieldName, value){}
      *   //fieldName: String, field name;
      *   //value: Object, field value, the value type depends on field type;
      *   //return: String, field text;
      */
    this.onCustomFormatFieldText = null; // (fieldName, value)

    /**
     * Set boolean display value.
     */
    if (fdataType == jslet.data.DataType.BOOLEAN) {
        this.trueValue = true;
        this.falseValue = false;
    } else {
        if (fdataType == jslet.data.DataType.NUMBER) {
            this.trueValue = 1;
            this.falseValue = 0;
        } else {
            this.trueValue = 'True';
            this.falseValue = 'False';
        }
    }

    /**
     * {Event} Fired when get Lookup field object.
     * Pattern: function(lookupFieldObj){}
     *  //lookupFieldObj: jslet.data.LookupField
     */
    this.onGetLookupField = null;

    /**
     * Get or set lookup field object
     * 
     * @param {jslet.data.LookupField or undefined} lkFld lookup field Object.
     * @return {jslet.data.LookupField or this}
     */
    this.lookupField = function (lkFldObj) {
    	if (lkFldObj === undefined){
            if (flookupField == null) {
                return null;
            }
            if (this.onGetLookupField != null && !this._inProcessing) {
                this._inProcessing = true;
                try {
                    this.onGetLookupField.call(this, flookupField);
                    // this.dataset.renderOptions(ffieldName);
                } finally {
                    this._inProcessing = false;
                    delete this._inProcessing;
                }
            }
            return flookupField
    	}
        flookupField = lkFldObj;
        if (falignment != 'left') {
            falignment = 'left';
        }
        return this;
    }

    /**
     * Set or get sub dataset.
     * 
     * @param {jslet.data.Dataset or undefined} subdataset
     * @return {jslet.data.Dataset or this}
     */
    this.subDataset = function (subdataset) {
    	if (subdataset === undefined) {
    		return fsubDataset;
    	}
        if (fsubDataset) {
            fsubDataset.datasetField(null);
        }
        fsubDataset = subdataset;
        subdataset.datasetField(this);
        return this;
    }

    this.urlExpr = function (urlExpr) {
    	if (urlExpr === undefined) {
    		return furlExpr;
    	}
        furlExpr = urlExpr;
        finnerUrlExpr = null;
        return this;
    }

    this.urlTarget = function (target) {
    	if (target === undefined){
           return !furlTarget ? jslet.data.Field.URLTARGETBLANK : furlTarget;
    	}
        furlTarget = target;
    }

    this.calcUrl = function () {
        if (!this.dataset() || !furlExpr) {
            return null;
        }
        if (!finnerUrlExpr) {
            finnerUrlExpr = new jslet.FormulaParser(this.dataset(), furlExpr);
        }
        return finnerUrlExpr.evalExpr();
    }

    /**
     * Get or set if field need be anti-xss.
     * If true, field value will be encoded.
     * 
     * @param {Boolean or undefined} isXss.
     * @return {Boolean or this}
     */
    this.antiXss = function(isXss){
    	if (isXss === undefined) {
    		return fantiXss;
    	}
    	fantiXss = isXss;
    }

    /**
     * Get or set field rang.
     * Range is an object as: {min: x, max: y}. Example:
     * <pre><code>
     * 	//For String field
     *    var range = {min: 'a', max: 'z'};
     *  //For Date field
     *    var range = {min: new Date(2000,1,1), max: new Date(2010,12,31)};
     *  //For Number field
     *    var range = {min: 0, max: 100};
     *  fldObj.range(range);
     * </code></pre>
     * 
     * @param {Range or Json String} range Field range;
     * @return {Range or this}
     */
    this.range = function (range) {
    	if (range === undefined) {
    		return frange;
    	}
        if (typeof (subds) == 'string') {
            frange = new Function('return ' + range);
        } else {
            frange = range;
        }
        return this;
    }

    /**
     * Get or set regular expression.
     * You can specify your own validator with regular expression. If regular expression not specified, 
     * The default regular expression for Date and Number field will be used. Example:
     * <pre><code>
     *     fldObj.regularExpr(/(\(\d{3,4}\)|\d{3,4}-|\s)?\d{8}/ig, 'Invalid phone number!');//like: 0755-12345678
     * </code></pre>
     * 
     * @param {String} expr Regular expression;
     * @param {String} message Message for invalid.
     * @return {Object} An object like: { expr: expr, message: message }
     */
    this.regularExpr = function (expr, message) {
    	var argLen = arguments.length;
    	if (argLen == 0){
            return fregularExpr;
    	}
    	
    	if (argLen == 1) {
    		fregularExpr = expr;
    	} else {
    		fregularExpr = { expr: expr, message: message };
    	}
        return this;
    }
    
    
    /**
     * Get or set customized field value converter.
     * 
     * @param {jslet.data.FieldValueConverter} converter converter object, sub class of jslet.data.FieldValueConverter.
     */
    this.customValueConverter = function (converter) {
    	if (converter === undefined) {
    		return fcustomValueConverter;
    	}
    	fcustomValueConverter = converter;
        return this;
    }

    /**
     * Get or set customized validator.
     * 
     * @param {Function} validator Validator function.
     * Pattern:
     *   function(fieldObj, fldValue){}
     *   //fieldObj: jslet.data.Field, Field object
     *   //fldValue: Object, Field value
     *   //return: String, if validate failed, return error message, otherwise return null; 
     */
    this.customValidator = function (validator) {
    	if (validator === undefined) {
    		return fcustomValidator;
    	}
        fcustomValidator = validator;
        return this;
    }
    
    /**
     * Valid characters for this field.
     */
    this.validChars = function(chars){
    	if (chars === undefined){
    		if (fvalidChars) {
    			return fvalidChars;
    		}
    		if (fdataType == jslet.data.DataType.NUMBER){
    			  return fscale ? '+-0123456789.' : '+-0123456789';
    		}
    		if (fdataType == jslet.data.DataType.DATE){
    			return '0123456789' + (this.dateSeparator() ? this.dateSeparator() : '');
    		}
    	}
    	
    	fvalidChars = chars;
    }
}

jslet.data.Field.URLTARGETBLANK = '_blank';

/**
 * Create field object. Example:
 * <pre><code>
 * var fldObj = jslet.data.createField({name:'field1', type:'N', label: 'field1 label'});
 * </code></pre>
 * 
 * @param {Json Object} fieldConfig A json object which property names are same as jslet.data.Field. Example: {name: 'xx', type: 'N', ...}
 * @param {jslet.data.Field} parent Parent field object. It must be a 'Group' field.
 * @return {jslet.data.Field}
 */
jslet.data.createField = function (fieldConfig, parent) {
    var cfg = fieldConfig;
    if (!cfg.name) {
        throw new Error('Property: name required!');
    }
    var dtype = cfg.type;
    if (dtype == null) {
    	dtype = jslet.data.DataType.STRING;
    } else {
    	dtype = dtype.toUpperCase();
    	if (dtype != jslet.data.DataType.STRING && 
				dtype != jslet.data.DataType.NUMBER && 
				dtype != jslet.data.DataType.DATE && 
				dtype != jslet.data.DataType.BOOLEAN && 
				dtype != jslet.data.DataType.DATASET && 
				dtype != jslet.data.DataType.GROUP)
        dtype = jslet.data.DataType.STRING;
    }
    var fldObj = new jslet.data.Field(cfg.name, dtype);
    if (cfg.displayOrder != undefined) {
        fldObj.displayOrder(cfg.displayOrder);
    }
    fldObj.parent(parent);
    
    if (cfg.label != undefined) {
        fldObj.label(cfg.label);
    }
    if (dtype == jslet.data.DataType.DATASET){
        var subds = cfg.subDataset;
        if (subds) {
            if (typeof (subds) == 'string') {
                subds = jslet.data.dataModule.get(subds);
            }
            fldObj.subDataset(subds)
        }
        fldObj.visible(false);
    	return fldObj;
    }
    
    if (cfg.readOnly != undefined) {
        fldObj.readOnly(cfg.readOnly);
    }
    if (cfg.visible != undefined) {
        fldObj.visible(cfg.visible);
    }
    if (cfg.enabled != undefined) {
        fldObj.enabled(cfg.enabled);
    }
    if(parent) {
    	fldObj.dataset(parent.dataset());
    }
    if (dtype == jslet.data.DataType.GROUP){
        if (cfg.children){
        	var fldChildren = [], childFldObj;
        	for(var i = 0, cnt = cfg.children.length; i < cnt; i++){
        		fldChildren.push(jslet.data.createField(cfg.children[i], fldObj))
        	}
            fldObj.children(fldChildren);
        }
    	fldObj.alignment('center');
    	return fldObj;
    }
    if (cfg.length != undefined) {
        fldObj.length(cfg.length);
    }
    if (cfg.scale != undefined) {
        fldObj.scale(cfg.scale);
    }
    if (cfg.alignment != undefined) {//left,right,center
        fldObj.alignment(cfg.alignment);
    }
    if (cfg.defaultExpr != undefined) {
        fldObj.defaultExpr(cfg.defaultExpr);
	}
    if (cfg.defaultValue != undefined) {
        fldObj.defaultExpr(cfg.defaultValue);
	}
    if (cfg.displayWidth != undefined) {
        fldObj.displayWidth(cfg.displayWidth);
    }
    if (cfg.editMask != undefined) {
        fldObj.editMask(cfg.editMask);
    }
    if (cfg.displayFormat != undefined) {
        fldObj.displayFormat(cfg.displayFormat);
    }
    if (cfg.formula != undefined) {
        fldObj.formula(cfg.formula);
    }
    if (cfg.required != undefined) {
        fldObj.required(cfg.required);
    }
    if (cfg.nullText != undefined) {
        fldObj.nullText(cfg.nullText);
    }
    if (cfg.unitConverted != undefined) {
        fldObj.unitConverted(cfg.unitConverted);
    }
    var lkf = cfg.lookupField;
    if (lkf != undefined) {
        if (typeof lkf == 'string') {
            lkf = new Function('return ' + lkf)();
        }
        fldObj.lookupField(jslet.data.createLookupField(lkf));
    }
    if (cfg.editControl != undefined) {
        fldObj.editControl(cfg.editControl);
    }
    if (cfg.urlExpr != undefined) {
        fldObj.urlExpr(cfg.urlExpr);
    }
    if (cfg.urlTarget != undefined) {
        fldObj.urlTarget(cfg.urlTarget);
    }
    if (cfg.valueStyle != undefined) {
        fldObj.valueStyle(cfg.valueStyle);
    }
    if (cfg.valueSeparator != undefined) {
        fldObj.valueSeparator(cfg.valueSeparator);
    }
    if (cfg.valueCountLimit != undefined) {
        fldObj.valueCountLimit(cfg.valueCountLimit);
    }
    
    if (cfg.range) {
    	fldObj.range(cfg.range);
    }
    if (cfg.customValidator) {
    	fldObj.customValidator(cfg.customValidator);
    }
    return fldObj;
}

/**
 * Create string field object.
 * 
 * @param {String} fldName Field name.
 * @param {Integer} length Field length.
 * @param {jslet.data.Field} parent (Optional)Parent field object. It must be a 'Group' field.
 * @return {jslet.data.Field}
 */
jslet.data.createStringField = function(fldName, length, parent) {
	var fldObj = new jslet.data.Field(fldName, jslet.data.DataType.STRING, parent);
	fldObj.length(length);
	return fldObj;
}

/**
 * Create number field object.
 * 
 * @param {String} fldName Field name.
 * @param {Integer} length Field length.
 * @param {Integer} scale Field scale.
 * @param {jslet.data.Field} parent (Optional)Parent field object. It must be a 'Group' field.
 * @return {jslet.data.Field}
 */
jslet.data.createNumberField = function(fldName, length, scale, parent) {
	var fldObj = new jslet.data.Field(fldName, jslet.data.DataType.NUMBER, parent);
	fldObj.length(length);
	fldObj.scale(scale);
	return fldObj;
}

/**
 * Create boolean field object.
 * 
 * @param {String} fldName Field name.
 * @param {jslet.data.Field} parent (Optional)Parent field object. It must be a 'Group' field.
 * @return {jslet.data.Field}
 */
jslet.data.createBooleanField = function(fldName, parent) {
	return new jslet.data.Field(fldName, jslet.data.DataType.BOOLEAN, parent);
}

/**
 * Create date field object.
 * 
 * @param {String} fldName Field name.
 * @param {jslet.data.Field} parent (Optional)Parent field object. It must be a 'Group' field.
 * @return {jslet.data.Field}
 */
jslet.data.createDateField = function(fldName, parent) {
	var fldObj = new jslet.data.Field(fldName, jslet.data.DataType.DATE, parent);
	return fldObj;
}

/**
 * Create dataset field object.
 * 
 * @param {String} fldName Field name.
 * @param {jslet.data.Dataset} subDataset Detail dataset object.
 * @param {jslet.data.Field} parent (Optional)Parent field object. It must be a 'Group' field.
 * @return {jslet.data.Field}
 */
jslet.data.createDatasetField = function(fldName, subDataset, parent) {
	if (!subDataset) {
		throw new Error('expected property:dataset in DatasetField!');
	}
	if (typeof (subDataset) == 'string') {
	    subDataset = jslet.data.dataModule.get(subDataset);
	}
	var fldObj = new jslet.data.Field(fldName, jslet.data.DataType.DATASET, parent);
	fldObj.subDataset(subDataset);
	fldObj.visible(false);
	return fldObj;
}

/**
 * Create group field object.
 * 
 * @param {String} fldName Field name.
 * @param {String} fldName Field label.
 * @param {jslet.data.Field} parent (Optional)Parent field object. It must be a 'Group' field.
 * @return {jslet.data.Field}
 */
jslet.data.createGroupField = function(fldName, label, parent) {
	var fldObj = new jslet.data.Field(fldName, jslet.data.DataType.GROUP, parent);
	fldObj.label(label);
	return fldObj;
}

/**
 * @private
 */
jslet.data.Field.prototype.sortByIndex = function(fldObj1, fldObj2) {
	return fldObj1.displayOrder() - fldObj2.displayOrder();
}

/**
 * @class LookupField
 * 
 * A lookup field represents a field value is from another dataset named "Lookup Dataset";
 */
jslet.data.LookupField = function() {
    var flookupDataset,
    fkeyField,
    fcodeField,
    fnameField,
    fcodeFormat,
    fdisplayFields,
    finnerdisplayFields,
    fparentField,
    fonlyLeafLevel = true;

    this.clone = function(){
    	var result = new jslet.data.LookupField();
    	result.lookupDataset(flookupDataset);
    	result.keyField(fkeyField);
    	result.codeField(fcodeField);
    	result.nameField(fnameField);
    	result.displayFields(fdisplayFields);
    	result.parentField(fparentField);
    	result.onlyLeafLevel(fonlyLeafLevel);
    	return result;
    }
    
    /**
     * Get or set lookup dataset.
     * 
     * @param {jslet.data.Dataset or undefined} dataset Lookup dataset.
     * @return {jslet.data.Dataset or this}
     */
	this.lookupDataset = function(lkdataset) {
		if (lkdataset === undefined) {
			return flookupDataset;
		}
		flookupDataset = lkdataset;
		return this;
	}

    /**
     * Get or set key field.
     * Key field is optional, if it is null, it will use LookupDataset.keyField instead. 
     * 
     * @param {String or undefined} keyFldName Key field name.
     * @return {String or this}
     */
	this.keyField = function(keyFldName) {
		if (keyFldName === undefined){
			return fkeyField || flookupDataset.keyField();
		}
	    fkeyField = keyFldName;
	    return this;
	}

    /**
     * Get or set code field.
     * Code field is optional, if it is null, it will use LookupDataset.codeField instead. 
     * 
     * @param {String or undefined} codeFldName Code field name.
     * @return {String or this}
     */
	this.codeField = function(codeFldName) {
		if (codeFldName === undefined){
			return fcodeField || flookupDataset.codeField();
		}
		fcodeField = codeFldName;
	    return this;
	}
	
	this.codeFormat = function(format) {
		if (format === undefined) {
			return fcodeFormat;
		}
		fcodeFormat = format;
		return this;
	}

    /**
     * Get or set name field.
     * Name field is optional, if it is null, it will use LookupDataset.nameField instead. 
     * 
     * @param {String or undefined} nameFldName Name field name.
     * @return {String or this}
     */
	this.nameField = function(nameFldName) {
		if (nameFldName === undefined){
			return fnameField || flookupDataset.nameField();
		}
		fnameField = nameFldName;
	    return this;
	}

    /**
     * Get or set parent field.
     * Parent field is optional, if it is null, it will use LookupDataset.parentField instead. 
     * 
     * @param {String or undefined} parentFldName Parent field name.
     * @return {String or this}
     */
	this.parentField = function(parentFldName) {
		if (parentFldName === undefined){
			return fparentField || flookupDataset.parentField();
		}
		fparentField = parentFldName;
	    return this;
	}

	/**
	 * An expression for display field value. Example:
	 * <pre><code>
	 * lookupFldObj.displayFields('[code]+"-"+[name]'); 
	 * </code></pre>
	 */
	this.displayFields = function(fieldExpr) {
		if (fieldExpr === undefined) {
			return !fdisplayFields? this.getDefaultDisplayFields(): fdisplayFields;
		}
		if (fdisplayFields != fieldExpr) {
			fdisplayFields = fieldExpr;
			finnerdisplayFields = new jslet.FormulaParser(flookupDataset,fieldExpr);
		}
		return this;
	}
	
	/**
	 * @private
	 */
	this.getDefaultDisplayFields = function() {
		var expr = '[',fldName = this.codeField();
		if (fldName) {
			expr += fldName + ']';
		}
		fldName = this.nameField();

		if (fldName) {
			expr += '+"-"+[';
			expr += fldName + ']';
		}
		if (expr == '') {
			expr = '"Not set displayFields"';
		}
		return expr;
	}

	/**
	 * @private
	 */
	this.getCurrentDisplayValue = function() {
		if (fdisplayFields == null) {
			this.displayFields(this.getDefaultDisplayFields());
		}
		finnerdisplayFields.setDataset(flookupDataset);
		return finnerdisplayFields.evalExpr();
	}

	/**
	 * Identify whether user can select leaf level item if lookup dataset is a tree-style dataset.
	 * 
	 * @param {Boolean or undefined} flag True - Only leaf level item user can selects, false - otherwise.
	 * @return {Boolean or this}
	 */
	this.onlyLeafLevel = function(flag) {
		if (flag === undefined) {
			return fonlyLeafLevel;
		}
		fonlyLeafLevel = flag;
		return this;
	}
}

/**
 * Create lookup field object.
 * 
 * @param {Json Object} param A json object which property names are same as jslet.data.LookupField. Example: {lookupDataset: fooDataset, keyField: 'xxx', ...}
 * @return {jslet.data.LookupField}
 */
jslet.data.createLookupField = function(param) {
	var lkds = param.lookupDataset;
	if (!lkds) {
		throw new Error('Property: lookupDataset required!');
	}
	var lkf = new jslet.data.LookupField();

	if (typeof(lkds) == 'string') {
		lkds = jslet.data.dataModule.get(lkds);
	}
	lkf.lookupDataset(lkds);
	if (param.keyField != undefined) {
		lkf.keyField(param.keyField);
	}
	if (param.codeField != undefined) {
		lkf.codeField(param.codeField);
	}
	if (param.nameField != undefined) {
		lkf.nameField(param.nameField);
	}
	if (param.codeFormat != undefined) {
		lkf.codeFormat(param.codeFormat);
	}
	if (param.displayFields != undefined) {
		lkf.displayFields(param.displayFields);
	}
	if (param.parentField != undefined) {
		lkf.parentField(param.parentField);
	}
	if (param.onlyLeafLevel != undefined) {
		lkf.onlyLeafLevel(param.onlyLeafLevel);
	}
	return lkf;
}

