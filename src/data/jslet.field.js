/* ========================================================================
 * Jslet framework: jslet.field.js
 *
 * Copyright (c) 2014 Jslet Group(https://github.com/jslet/jslet/)
 * Licensed under MIT (https://github.com/jslet/jslet/LICENSE.txt)
 * ======================================================================== */

/**
 * @class Field 
 * 
 * @param {String} fieldName Field name
 * @param {jslet.data.DataType} dataType Data type of field
 */
jslet.data.Field = function (fieldName, dataType) {
	jslet.Checker.test('Field#fieldName', fieldName).isString();
	fieldName = jQuery.trim(fieldName);
	jslet.Checker.test('Field#fieldName', fieldName).required();
	jslet.Checker.test('Field#dataType', dataType).isString().required();

	var Z = this;
	Z._dataset = null; 
	Z._displayOrder = 0;
	Z._fieldName = fieldName;
	Z._dataType = dataType;
	Z._length = 0;
	Z._scale = 0;
	Z._alignment = 'left';
	Z._defaultExpr = null;
	Z._defaultValue = null;
	Z._label = null;
	Z._tip = null;
	Z._message = null;
	Z._displayWidth = 0;
	Z._editMask = null;
	Z._displayFormat = null;
	Z._dateFormat = null;
	Z._formula = null;
	Z._readOnly = false;
	Z._visible = true;
	Z._disabled = false;
	Z._customValueConverter = null;
	Z._unitConverted = false;
	Z._lookup = null;
	Z._displayControl = null;
	Z._editControl = null;
	Z._subDataset = null;
	Z._urlExpr = null;
	Z._innerUrlExpr = null;
	Z._urlTarget = null;
	Z._valueStyle = jslet.data.FieldValueStyle.NORMAL; //0 - Normal, 1 - Between style value, 2 - Multiple value
	Z._valueCountLimit = 0;
	Z._required = false;
	Z._nullText = jslet.locale.Dataset.nullText;
	Z._range = null;
	Z._regularExpr = null;
	Z._antiXss = true;
	Z._customValidator = null;
	Z._validChars = null; //Array of characters
	Z._dateChar = null;
	Z._dateRegular = null;
	Z._parent = null; //parent field object
	Z._childrenv = null; //child field object, only group field has child field object.
	
	Z.initialize();
};

jslet.data.Field.className = 'jslet.data.Field';

jslet.data.Field.prototype = {
	className: jslet.data.Field.className,
	
	clone: function(fldName, newDataset){
		var Z = this;
		jslet.Checker.test('Field.clone#fldName', fldName).required().isString();
		var result = new jslet.data.Field(fldName, Z._dataType);
		result.dataset(newDataset ? newDataset : this.dataset());
		result.length(Z._length);
		result.scale(Z._scale);
		result.alignment(Z._alignment);
		result.defaultExpr(Z._defaultExpr);
		result.defaultValue(Z._defaultValue);
		result.label(Z._label);
		result.tip(Z._tip);
		result.displayWidth(Z._displayWidth);
		if (Z._editMask) {
			result.editMask(Z._editMask.clone());
		}
		result.displayFormat(Z._displayFormat);
		result.dateFormat(Z._dateFormat);
		result.formula(Z._formula);
		result.readOnly(Z._readOnly);
		result.visible(Z._visible);
		result.disabled(Z._disabled);
		result.unitConverted(Z._unitConverted);
		if (Z._lookup) {
			result.lookup(Z._lookup.clone());
		}
		
		result.displayControl(Z._displayControl);
		result.editControl(Z._editControl);
		result.urlExpr(Z._urlExpr);
		result.urlTarget(Z._urlTarget);
		result.valueStyle(Z._valueStyle);
		result.valueCountLimit(Z._valueCountLimit);
		result.required(Z._required);
		result.nullText(Z._nullText);
		result.range(Z._range);
		if (Z._regularExpr) {
			result.regularExpr(Z._regularExpr);
		}
		result.antiXss(Z._antiXss);
		result.customValidator(Z._customValidator);
		result.customValueConverter(Z._customValueConverter);
		result.validChars(Z._validChars);
		if (Z._parent) {
			result.parent(Z._parent.clone(newDataset));
		}
		if (Z._children && Z._children.length > 0){
			var childFlds = [];
			for(var i = 0, cnt = Z._children.length; i < cnt; i++){
				childFlds.push(Z._children[i].clone(newDataset));
			}
			result.children(childFlds);
		}
		return result;
	},
	
	_clearFieldCache: function() {
		var Z = this;
		if(Z._dataset && Z._fieldName) {
			jslet.data.FieldValueCache.clearAll(Z._dataset, Z._fieldName);
		}
	},
	
	/**
	 * {jslet.data.Dataset}
	 */
	dataset: function (dataset) {
		var Z = this;
		if (dataset === undefined) {
			if(Z._parent) {
				return Z._parent.dataset();
			}
			return Z._dataset;
		}
		
		if(jslet.isString(dataset)) {
			dataset = jslet.data.getDataset(dataset); 
		} else {
			jslet.Checker.test('Field.dataset', dataset).isClass(jslet.data.Dataset.className);
		}
		Z._dataset = dataset;
		Z._clearFieldCache();
		Z.addLookupRelation();
	},
	
	/**
	 * Get or set field name
	 * 
	 * @param {String or undefined} fldName Field name.
	 * @return {String}
	 */
	name: function () {
		if(arguments.length >0) {
			alert("Can't change field name!");
		}
		return this._fieldName;
	},

	/**
	 * Get or set field label.
	 * 
	 * @param {String or undefined} label Field label.
	 * @return {String or this}
	 */
	label: function (label) {
		var Z = this;
		if (label === undefined) {
			return Z._label || Z._fieldName;
		}
		jslet.Checker.test('Field.label', label).isString();
		Z._label = label;
		Z._fireMetaChangedEvent('label');
		return this;
	},

	/**
	 * Get or set field tip.
	 * 
	 * @param {String or undefined} tip Field tip.
	 * @return {String or this}
	 */
	tip: function(tip) {
		var Z = this;
		if (tip === undefined) {
			return Z._tip;
		}
		jslet.Checker.test('Field.tip', tip).isString();
		Z._tip = tip;
		Z._fireMetaChangedEvent('tip');
		return this;
	},
	
	/**
	 * Get or set field tip.
	 * 
	 * @param {String or undefined} message Field message.
	 * @return {String or this}
	 */
	message: function(message, valueIndex) {
		var Z = this,
			argLen = message === undefined && valueIndex === undefined ? 0: (valueIndex === undefined ? 1: 2);
		var result = '', i, len;
		switch(argLen) {
		case 0:  //Get message without 'valueIndex'
			if(!Z._message) {
				return result;
			}
			if(jslet.isArray(Z._message)) {
				len = Z._message.length;
				for(i = 0; i < len; i++) {
					if(i > 0) {
						result += ', ';
					}
					result += jslet.locale.Dataset.value + i + ': ' + Z._message[i];
				}
				return result;
			} else {
				return Z._message;
			}
			break;
		case 1:
			if (jQuery.isNumeric(message)){ //Get message with 'valueIndex'
				if(!Z._message) {
					return result;
				}
				valueIndex = message;
				if(jslet.isArray(Z._message)) {
					if(valueIndex < Z._message.length) {
						result = Z._message[valueIndex];
					}
				} else {
					if(valueIndex === 0) {
						result = Z._message;
					}
				}
				return result;
			} else { //Set message without 'valueIndex'
				if(Z._message == message) {
					return this;
				}
				Z._message = message;
			}
			break;
		case 2:
			if(!Z._message || !jslet.isArray(Z._message)) {
				Z._message = [];
			}
			if(Z._message.length <= valueIndex) {
				Z._message.length = valueIndex + 1;
			}
			Z._message[valueIndex] = message;
			//Check whether the Z._mesage is an empty array, if it's empty, set Z._mesage = null
			var isEmptyArr = true;
			len = Z._message.length;
			for (i = 0; i < len; i++) {
				if(Z._message[i]) {
					isEmptyArr = false;
					break;
				}
			}
			if(isEmptyArr) {
				Z._message = null;
			}			
			break;
		}
		Z._fireMetaChangedEvent('message');
		return this;
	},
	
	/**
	 * Get field data type.
	 * 
	 * @param {jslet.data.DataType}
	 */
	getType: function () {
		return this._dataType;
	},

	/**
	 * Get or set parent field object.
	 * It is ignored if dataType is not jslet.data.DataType.GROUP
	 * 
	 * @param {jslet.data.Field or undefined} parent Parent field object.
	 * @return {jslet.data.Field or this}
	 */
	parent: function (parent) {
		var Z = this;
		if (parent === undefined) {
			return Z._parent;
		}
		jslet.Checker.test('Field.parent', parent).isClass(this.className);
		Z._parent = parent;
		return this;
	},

	/**
	 * Get or set child fields of this field.
	 * It is ignored if dataType is not jslet.data.DataType.GROUP
	 * 
	 * @param {jslet.data.Field[] or undefined} children Child field object.
	 * @return {jslet.data.Field or this}
	 */
	children: function (children) {
		var Z = this;
		if (children === undefined) {
			return Z._children;
		}
		jslet.Checker.test('Field.children', children).isArray();
		for(var i = 0, len = children.length; i < len; i++) {
			jslet.Checker.test('Field.children#childField', children[i]).isClass(this.className);
		}
		Z._children = children;
		return this;
	},
	
	/**
	 * Get or set field display order.
	 * Dataset uses this property to resolve field order.
	 * 
	 * @param {Integer or undefined} index Field display order.
	 * @return {Integer or this}
	 */
	displayOrder: function (displayOrder) {
		var Z = this;
		if (displayOrder === undefined) {
			return Z._displayOrder;
		}
		jslet.Checker.test('Field.displayOrder', displayOrder).isNumber();
		Z._displayOrder = parseInt(displayOrder);
		return this;
	},

	/**
	 * Get or set field stored length.
	 * If it's a database field, it's usually same as the length of database.  
	 * 
	 * @param {Integer or undefined} len Field stored length.
	 * @return {Integer or this}
	 */
	length: function (len) {
		var Z = this;
		if (len === undefined) {
			return Z._length;
		}
		jslet.Checker.test('Field.length', len).isGTEZero();
		Z._length = parseInt(len);
		return this;
	},
	
	/**
	 * Get edit length.
	 * Edit length is used in editor to input data.
	 * 
	 * @return {Integer}
	 */
	getEditLength: function () {
		var Z = this;
		if (Z._lookup) {
			var codeFld = Z._lookup.codeField();
			var lkds = Z._lookup.dataset();
			if (lkds && codeFld) {
				var lkf = lkds.getField(codeFld);
				if (lkf) {
					return lkf.getEditLength();
				}
			}
		}

		return Z._length > 0 ? Z._length : 10;
	},

	/**
	 * Get or set field decimal length.
	 * 
	 * @param {Integer or undefined} scale Field decimal length.
	 * @return {Integer or this}
	 */
	scale: function (scale) {
		var Z = this;
		if (scale === undefined) {
			return Z._scale;
		}
		jslet.Checker.test('Field.scale', scale).isGTEZero();
		Z._scale = parseInt(scale);
		return this;
	},

	/**
	 * Get or set field alignment.
	 * 
	 * @param {String or undefined} alignment Field alignment.
	 * @return {String or this}
	 */
	alignment: function (alignment) {
		var Z = this;
		if (alignment === undefined){
			if (Z._dataType == jslet.data.DataType.NUMBER){
				return 'right';
			}
			return Z._alignment;
		}
		
		jslet.Checker.test('Field.alignment', alignment).isString();
		Z._alignment = jQuery.trim(alignment);
		Z._fireColumnUpdatedEvent();
		return this;
	},

	/**
	 * Get or set the display text if the field value is null.
	 * 
	 * @param {String or undefined} nullText Field null text.
	 * @return {String or this}
	 */
	nullText: function (nullText) {
		var Z = this;
		if (nullText === undefined) {
			return Z._nullText;
		}
		jslet.Checker.test('Field.nullText', nullText).isString();
		nullText = jQuery.trim(nullText);
		Z._nullText = nullText;
		Z._clearFieldCache();
		Z._fireColumnUpdatedEvent();
		return this;
	},

	/**
	 * Get or set field display width.
	 * Display width is usually used in DBTable column.
	 * 
	 * @param {Integer or undefined} displayWidth Field display width.
	 * @return {Integer or this}
	 */
	displayWidth: function (displayWidth) {
		var Z = this;
		if (displayWidth === undefined){
			if (Z._displayWidth <= 0) {
				return Z._length > 0 ? Z._length : 12;
			} else {
				return Z._displayWidth;
			}
		}
		jslet.Checker.test('Field.displayWidth', displayWidth).isGTEZero();
		Z._displayWidth = parseInt(displayWidth);
		return this;
	},
	
	/**
	 * Get or set field default expression.
	 * This expression will be calculated when inserting a record.
	 * 
	 * @param {String or undefined} defaultExpr Field default expression.
	 * @return {String or this}
	 */
	defaultExpr: function (defaultExpr) {
		var Z = this;
		if (defaultExpr === undefined) {
			return Z._defaultExpr;
		}
		jslet.Checker.test('Field.defaultExpr', defaultExpr).isString();
		Z._defaultExpr = defaultExpr;
		return this;
	},

	/**
	 * Get or set field display format.
	 * For number field like: #,##0.00
	 * For date field like: yyyy/MM/dd
	 * 
	 * @param {String or undefined} format Field display format.
	 * @return {String or this}
	 */
	displayFormat: function (format) {
		var Z = this;
		if (format === undefined) {
			if (Z._displayFormat) {
				return Z._displayFormat;
			} else {
				if (Z._dataType == jslet.data.DataType.DATE) {
					return jslet.locale.Date.format;
				} else {
					return Z._displayFormat;
				}
			}
		}
		
		jslet.Checker.test('Field.format', format).isString();
		Z._displayFormat = jQuery.trim(format);
		Z._dateFormat = null;
		Z._dateChar = null;
		Z._dateRegular = null;
		Z._clearFieldCache();		
		Z._fireColumnUpdatedEvent();
		return this;
	},

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
	defaultValue: function (dftValue) {
		var Z = this;
		if (dftValue === undefined) {
			return Z._defaultValue;
		}
		jslet.Checker.test('Field.defaultValuen', Z.dftValue).isDataType(Z._dateType);
		Z._defaultValue = dftValue;
		return this;
	},

	/**
	 * Get or set field is required or not.
	 * 
	 * @param {Boolean or undefined} required Field is required or not.
	 * @return {Boolean or this}
	 */
	required: function (required) {
		var Z = this;
		if (required === undefined) {
			return Z._required;
		}
		Z._required = required ? true: false;
		Z._fireMetaChangedEvent('required');
		return this;
	},
	
	/**
	 * Get or set field edit mask.
	 * 
	 * @param {jslet.data.EditMask or undefined} mask Field edit mask.
	 * @return {jslet.data.EditMask or this}
	 */
	editMask: function (mask) {
		var Z = this;
		if (mask === undefined) {
			return Z._editMask;
		}
		if(mask) {
			if (jslet.isString(mask)) {
				mask = {mask: mask,keepChar:true};
			}
		} else {
			mask = null;
		}
		Z._editMask = mask;
		Z._clearFieldCache();		
		Z._fireMetaChangedEvent('editMask');
		return this;
	},
	
	dateFormat: function(){
		var Z = this;
		if (Z._dateFormat) {
			return Z._dateFormat;
		}
		if (this.getType() != jslet.data.DataType.DATE) {
			return null;
		}
		var displayFmt = this.displayFormat().toUpperCase();
		Z._dateFormat = '';
		var c;
		for(var i = 0, len = displayFmt.length; i < len; i++){
			c = displayFmt.charAt(i);
			if ('YMD'.indexOf(c) < 0) {
				continue;
			}
			if (Z._dateFormat.indexOf(c) < 0) {
				Z._dateFormat += c;
			}
		}
		return Z._dateFormat;
	},
	
	dateSeparator: function(){
		var Z = this;
		if (Z._dateChar) {
			return Z._dateChar;
		}
		if (this.getType() != jslet.data.DataType.DATE) {
			return null;
		}
		var displayFmt = this.displayFormat().toUpperCase();
		for(var i = 0, c, len = displayFmt.length; i < len; i++){
			c = displayFmt.charAt(i);
			if ('YMD'.indexOf(c) < 0){
				Z._dateChar = c;
				return c;
			}
		}
	},
	
	dateRegular: function(){
		var Z = this;
		if (Z._dateRegular) {
			return Z._dateRegular;
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
		result.push('(\\s+\\d{2}:\\d{2}:\\d{2}(\\.\\d{3}){0,1}){0,1}');
		result.push('$');
		Z._dateRegular = {expr: new RegExp(result.join(''), 'gim'), message: jslet.locale.Dataset.invalidDate};
		return Z._dateRegular;
	},
	
	/**
	 * Get or set field formula. Example: 
	 * <pre><code>
	 *  fldObj.formula('[price]*[num]');
	 * </code></pre>
	 * 
	 * @param {String or undefined} formula Field formula.
	 * @return {String or this}
	 */
	formula: function (formula) {
		var Z = this;
		if (formula === undefined) {
			return Z._formula;
		}
		
		jslet.Checker.test('Field.formula', formula).isString();
		Z._formula = jQuery.trim(formula);
		Z._clearFieldCache();		
		if (this.dataset()) {
			this.dataset().removeInnerFormularFields(Z._fieldName);
			Z._fireColumnUpdatedEvent();
		}
		return this;
	},

	/**
	 * Get or set field is visible or not.
	 * 
	 * @param {Boolean or undefined} visible Field is visible or not.
	 * @return {Boolean or this}
	 */
	visible: function (visible) {
		var Z = this;
		if (visible === undefined){
			if (Z._visible){
				var p = this.parent();
				while(p){
					if (!p.visible()) { //if parent is invisible
						return false;
					}
					p = p.parent();
				}
			}
			return Z._visible;
		}
		Z._visible = visible ? true: false;
		Z._fireMetaChangedEvent('visible');
		return this;
	},

	/**
	 * Get or set field is disabled or not.
	 * 
	 * @param {Boolean or undefined} disabled Field is disabled or not.
	 * @return {Boolean or this}
	 */
	disabled: function (disabled) {
		var Z = this;
		if (disabled === undefined) {
			return Z._disabled;
		}
		Z._disabled = disabled ? true: false;
		Z._fireMetaChangedEvent('disabled');
		return this;
	},

	/**
	 * Get or set field is readOnly or not.
	 * 
	 * @param {Boolean or undefined} readOnly Field is readOnly or not.
	 * @return {Boolean or this}
	 */
	readOnly: function (readOnly) {
		var Z = this;
		if (readOnly === undefined){
			if (Z._formula || Z._dataType == jslet.data.DataType.DATASET || Z._dataType == jslet.data.DataType.GROUP) {
				return true;
			}

			return Z._readOnly;
		}
		
		Z._readOnly = readOnly? true: false;
		Z._fireMetaChangedEvent('readOnly');
		return this;
	},
	
	_fireMetaChangedEvent: function(metaName) {
		var ds = this.dataset();
		if (ds) {
			var evt = jslet.data.RefreshEvent.changeMetaEvent(metaName, this._fieldName);
			ds.refreshControl(evt);
		}
	},
	
	_fireColumnUpdatedEvent: function() {
		var ds = this.dataset();
		if (ds) {
			var evt = jslet.data.RefreshEvent.updateColumnEvent(this._fieldName);
			ds.refreshControl(evt);
		}
	},
	
	/**
	 * Get or set if field participates unit converting.
	 * 
	 * @param {Boolean or undefined} unitConverted .
	 * @return {Boolean or this}
	 */
	unitConverted: function (unitConverted) {
		var Z = this;
		if (unitConverted === undefined) {
			return Z._dataType == jslet.data.DataType.NUMBER? Z._unitConverted:false;
		}
		Z._unitConverted = unitConverted ? true : false;
		var ds = this.dataset();
		Z._clearFieldCache();		
		if (Z._dataType == jslet.data.DataType.NUMBER && ds && ds.unitConvertFactor() != 1) {
			Z._fireColumnUpdatedEvent();
		}
		return this;
	},

	/**
	 * Get or set value style of this field. Optional value: 0 - Normal, 1 - Between style, 2 - Multiple value
	 * 
	 * @param {Integer or undefined} mvalueStyle.
	 * @return {Integer or this}
	 */
	valueStyle: function (mvalueStyle) {
		var Z = this;
		if (mvalueStyle === undefined) {
			if(Z._dataType == jslet.data.DataType.DATASET ||  
				Z._dataType == jslet.data.DataType.GROUP) 
				return jslet.data.FieldValueStyle.NORMAL;
			
			return Z._valueStyle;
		}
		
		jslet.Checker.test('Field.valueStyle', mvalueStyle).isNumber().inArray([0,1,2]);
		Z._valueStyle = mvalueStyle;
		Z._clearFieldCache();		
		Z._fireColumnUpdatedEvent();
		return this;
	},

	/**
	 * Get or set allowed count when valueStyle is multiple.
	 * 
	 * @param {String or undefined} count.
	 * @return {String or this}
	 */
	valueCountLimit: function (count) {
		var Z = this;
		if (count === undefined) {
			return Z._valueCountLimit;
		}
		jslet.Checker.test('Field.valueCountLimit', count).isNumber();
		Z._valueCountLimit = parseInt(count);
		return this;
	},

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
	displayControl: function (dispCtrl) {
		var Z = this;
		if (dispCtrl === undefined){
			if (Z._dataType == jslet.data.DataType.BOOLEAN && !Z._displayControl) {
				return {
					type: 'dbcheckbox'
				};
			}
			return Z._displayControl;
		}
		 
		Z._displayControl = (typeof (Z._fieldName) == 'string') ? { type: dispCtrl } : dispCtrl;
		return this;
	},

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
	editControl: function (editCtrl) {
		var Z = this;
		if (editCtrl=== undefined){
			if (Z._editControl) {
				return Z._editControl;
			}

			if (Z._dataType == jslet.data.DataType.BOOLEAN) {
				return {type: 'dbcheckbox'};
			} else if (Z._dataType == jslet.data.DataType.DATE) {
				return {type: 'dbdatepicker'};
			} else {
				return (Z._lookup !== null)? {type: 'dbselect'}:{type: 'dbtext'};
			}
		}
		 
		Z._editControl = (typeof (editCtrl) === 'string') ? { type: editCtrl } : editCtrl;
	},

	/**
	 * {Event} Get customized field text.
	 * Pattern: function(fieldName, value){}
	 *   //fieldName: String, field name;
	 *   //value: Object, field value, the value type depends on field type;
	 *   //return: String, field text;
	 */
	onCustomFormatFieldText: null, // (fieldName, value)

	initialize: function() {
		/**
		 * Set boolean display value.
		 */
		if (this._dataType == jslet.data.DataType.BOOLEAN) {
			this.trueValue = true;
			this.falseValue = false;
		} else {
			if (this._dataType == jslet.data.DataType.NUMBER) {
				this.trueValue = 1;
				this.falseValue = 0;
			} else {
				this.trueValue = 'True';
				this.falseValue = 'False';
			}
		}
	},
	
	addLookupRelation: function() {
		var Z = this;
		if(Z._dataset && Z._lookup && Z._lookup.dataset()) {
			jslet.data.datasetRelationManager.addRelation(Z._dataset.name(), 
					Z._fieldName, Z._lookup.dataset().name());
		}
	},
	
	/**
	 * Get or set lookup field object
	 * 
	 * @param {jslet.data.FieldLookup or undefined} lkFld lookup field Object.
	 * @return {jslet.data.FieldLookup or this}
	 */
	lookup: function (lkFldObj) {
		var Z = this;
		if (lkFldObj === undefined){
			return Z._lookup;
		}
		jslet.Checker.test('Field.lookup', lkFldObj).isClass(jslet.data.FieldLookup.className);		
		
		Z._lookup = lkFldObj;
		lkFldObj.hostField(Z);
		if (Z._alignment != 'left') {
			Z._alignment = 'left';
		}
		this.addLookupRelation();
		Z._clearFieldCache();		
		Z._fireColumnUpdatedEvent();
		return this;
	},

	/**
	 * Set or get sub dataset.
	 * 
	 * @param {jslet.data.Dataset or undefined} subdataset
	 * @return {jslet.data.Dataset or this}
	 */
	subDataset: function (subdataset) {
		var Z = this;
		if (subdataset === undefined) {
			return Z._subDataset;
		}
		jslet.Checker.test('Field.subDataset', subdataset).isClass(jslet.data.Dataset.className);		
		if (Z._subDataset) {
			Z._subDataset.datasetField(null);
		}
		Z._subDataset = subdataset;
		subdataset.datasetField(this);
		return this;
	},

	urlExpr: function (urlExpr) {
		var Z = this;
		if (urlExpr === undefined) {
			return Z._urlExpr;
		}

		jslet.Checker.test('Field.urlExpr', urlExpr).isString();
		Z._urlExpr = jQuery.trim(urlExpr);
		Z._innerUrlExpr = null;
		Z._clearFieldCache();		
		Z._fireColumnUpdatedEvent();
		return this;
	},

	urlTarget: function (target) {
		var Z = this;
		if (target === undefined){
			return !Z._urlTarget ? jslet.data.Field.URLTARGETBLANK : Z._urlTarget;
		}

		jslet.Checker.test('Field.urlTarget', target).isString();
		Z._urlTarget = jQuery.trim(target);
		Z._clearFieldCache();
		Z._fireColumnUpdatedEvent();
	},

	calcUrl: function () {
		var Z = this;
		if (!this.dataset() || !Z._urlExpr) {
			return null;
		}
		if (!Z._innerUrlExpr) {
			Z._innerUrlExpr = new jslet.Expression(this.dataset(), Z._urlExpr);
		}
		return Z._innerUrlExpr.eval();
	},

	/**
	 * Get or set if field need be anti-xss.
	 * If true, field value will be encoded.
	 * 
	 * @param {Boolean or undefined} isXss.
	 * @return {Boolean or this}
	 */
	antiXss: function(isXss){
		var Z = this;
		if (isXss === undefined) {
			return Z._antiXss;
		}
		Z._antiXss = isXss ? true: false;
	},

	/**
	 * Get or set field rang.
	 * Range is an object as: {min: x, max: y}. Example:
	 * <pre><code>
	 *	//For String field
	 *	var range = {min: 'a', max: 'z'};
	 *  //For Date field
	 *	var range = {min: new Date(2000,1,1), max: new Date(2010,12,31)};
	 *  //For Number field
	 *	var range = {min: 0, max: 100};
	 *  fldObj.range(range);
	 * </code></pre>
	 * 
	 * @param {Range or Json String} range Field range;
	 * @return {Range or this}
	 */
	range: function (range) {
		var Z = this;
		if (range === undefined) {
			return Z._range;
		}
		if(range && jslet.isString(range)) {
			range = jslet.JSON.parse(range);
		}
		jslet.Checker.test('Field.range', range).isObject();
		if(range) {
			if(range.min) {
				jslet.Checker.test('Field.range.min', range.min).isDataType(Z._dateType);
			}
			if(range.max) {
				jslet.Checker.test('Field.range.max', range.max).isDataType(Z._dateType);
			}
		}
		Z._range = range;
		return this;
	},

	/**
	 * Get or set regular expression.
	 * You can specify your own validator with regular expression. If regular expression not specified, 
	 * The default regular expression for Date and Number field will be used. Example:
	 * <pre><code>
	 *	fldObj.regularExpr(/(\(\d{3,4}\)|\d{3,4}-|\s)?\d{8}/ig, 'Invalid phone number!');//like: 0755-12345678
	 * </code></pre>
	 * 
	 * @param {String} expr Regular expression;
	 * @param {String} message Message for invalid.
	 * @return {Object} An object like: { expr: expr, message: message }
	 */
	regularExpr: function (expr, message) {
		var Z = this;
		var argLen = arguments.length;
		if (argLen === 0){
			return Z._regularExpr;
		}
		
		if (argLen == 1) {
			Z._regularExpr = expr;
		} else {
			Z._regularExpr = { expr: expr, message: message };
		}
		return this;
	},
	
	
	/**
	 * Get or set customized field value converter.
	 * 
	 * @param {jslet.data.FieldValueConverter} converter converter object, sub class of jslet.data.FieldValueConverter.
	 */
	customValueConverter: function (converter) {
		var Z = this;
		if (converter === undefined) {
			return Z._customValueConverter;
		}
		//jslet.Checker.test('Field.customValueConverter', converter).isClass(jslet.data.FieldValueConverter.className);
		Z._customValueConverter = converter;
		Z._clearFieldCache();
		Z._fireColumnUpdatedEvent();
		return this;
	},

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
	customValidator: function (validator) {
		var Z = this;
		if (validator === undefined) {
			return Z._customValidator;
		}
		jslet.Checker.test('Field.customValidator', validator).isFunction();
		Z._customValidator = validator;
		return this;
	},
	
	/**
	 * Valid characters for this field.
	 */
	validChars: function(chars){
		var Z = this;
		if (chars === undefined){
			if (Z._validChars) {
				return Z._validChars;
			}
			if (Z._dataType == jslet.data.DataType.NUMBER){
				return Z._scale ? '+-0123456789.' : '+-0123456789';
			}
			if (Z._dataType == jslet.data.DataType.DATE){
				return '0123456789' + (this.dateSeparator() ? this.dateSeparator() : '');
			}
		}
		
		Z._validChars = chars;
	},
	
	getValue: function(valueIndex) {
		return this._dataset.getFieldValue(this._fieldName, valueIndex);
	},
	
	setValue: function(value, valueIndex) {
		this._dataset.setFieldValue(this._fieldName, value, valueIndex);
	},

	getTextValue: function(isEditing, valueIndex) {
		return this._dataset.getFieldText(this._fieldName, isEditing, valueIndex);
	},
	
	setTextValue: function(value, valueIndex) {
		this._dataset.setFieldText(this._fieldName, inputText, valueIndex);
	}
	
};

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
	jslet.Checker.test('createField#fieldConfig', fieldConfig).required().isObject();
	var cfg = fieldConfig;
	if (!cfg.name) {
		throw new Error('Property: name required!');
	}
	var dtype = cfg.type;
	if (dtype === null) {
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
	if (cfg.displayOrder !== undefined) {
		fldObj.displayOrder(cfg.displayOrder);
	}
	fldObj.parent(parent);
	if(parent) {
		fldObj.dataset(parent.dataset());
	}
	
	if (cfg.label !== undefined) {
		fldObj.label(cfg.label);
	}
	if (cfg.tip !== undefined) {
		fldObj.tip(cfg.tip);
	}
	if (dtype == jslet.data.DataType.DATASET){
		var subds = cfg.subDataset;
		if (subds) {
			if (typeof (subds) == 'string') {
				subds = jslet.data.dataModule.get(subds);
			}
			fldObj.subDataset(subds);
		}
		fldObj.visible(false);
		return fldObj;
	}
	
	if (cfg.readOnly !== undefined) {
		fldObj.readOnly(cfg.readOnly);
	}
	if (cfg.visible !== undefined) {
		fldObj.visible(cfg.visible);
	}
	if (cfg.disabled !== undefined) {
		fldObj.disabled(cfg.disabled);
	}
	if (dtype == jslet.data.DataType.GROUP){
		if (cfg.children){
			var fldChildren = [], childFldObj;
			for(var i = 0, cnt = cfg.children.length; i < cnt; i++){
				fldChildren.push(jslet.data.createField(cfg.children[i], fldObj));
			}
			fldObj.children(fldChildren);
		}
		fldObj.alignment('center');
		return fldObj;
	}
	if (cfg.length !== undefined) {
		fldObj.length(cfg.length);
	}
	if (cfg.scale !== undefined) {
		fldObj.scale(cfg.scale);
	}
	if (cfg.alignment !== undefined) {//left,right,center
		fldObj.alignment(cfg.alignment);
	}
	if (cfg.defaultExpr !== undefined) {
		fldObj.defaultExpr(cfg.defaultExpr);
	}
	if (cfg.defaultValue !== undefined) {
		fldObj.defaultValue(cfg.defaultValue);
	}
	if (cfg.displayWidth !== undefined) {
		fldObj.displayWidth(cfg.displayWidth);
	}
	if (cfg.editMask !== undefined) {
		fldObj.editMask(cfg.editMask);
	}
	if (cfg.displayFormat !== undefined) {
		fldObj.displayFormat(cfg.displayFormat);
	}
	if (cfg.formula !== undefined) {
		fldObj.formula(cfg.formula);
	}
	if (cfg.required !== undefined) {
		fldObj.required(cfg.required);
	}
	if (cfg.nullText !== undefined) {
		fldObj.nullText(cfg.nullText);
	}
	if (cfg.unitConverted !== undefined) {
		fldObj.unitConverted(cfg.unitConverted);
	}
	var lkfCfg = cfg.lookup;
	if (lkfCfg !== undefined) {
		if (jslet.isString(lkfCfg)) {
			lkfCfg = jslet.JSON.parse(lkfCfg);
		}
		fldObj.lookup(jslet.data.createFieldLookup(lkfCfg));
	}
	if (cfg.editControl !== undefined) {
		fldObj.editControl(cfg.editControl);
	}
	if (cfg.urlExpr !== undefined) {
		fldObj.urlExpr(cfg.urlExpr);
	}
	if (cfg.urlTarget !== undefined) {
		fldObj.urlTarget(cfg.urlTarget);
	}
	if (cfg.valueStyle !== undefined) {
		fldObj.valueStyle(cfg.valueStyle);
	}

	if (cfg.valueCountLimit !== undefined) {
		fldObj.valueCountLimit(cfg.valueCountLimit);
	}
	
	if (cfg.range) {
		fldObj.range(cfg.range);
	}
	if (cfg.customValidator) {
		fldObj.customValidator(cfg.customValidator);
	}
	return fldObj;
};

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
};

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
};

/**
 * Create boolean field object.
 * 
 * @param {String} fldName Field name.
 * @param {jslet.data.Field} parent (Optional)Parent field object. It must be a 'Group' field.
 * @return {jslet.data.Field}
 */
jslet.data.createBooleanField = function(fldName, parent) {
	return new jslet.data.Field(fldName, jslet.data.DataType.BOOLEAN, parent);
};

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
};

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
};

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
};

/**
 * @private
 */
jslet.data.Field.prototype.sortByIndex = function(fldObj1, fldObj2) {
	return fldObj1.displayOrder() - fldObj2.displayOrder();
};

/**
 * @class FieldLookup
 * 
 * A lookup field represents a field value is from another dataset named "Lookup Dataset";
 */
jslet.data.FieldLookup = function() {
	var Z = this;
	Z._hostField = null;//The field which contains this lookup field object.
	Z._dataset = null;
	Z._keyField = null;
	Z._codeField = null;
	Z._nameField = null;
	Z._codeFormat = null;
	Z._displayFields = null;
	Z._innerdisplayFields = null;
	Z._parentField = null;
	Z._onlyLeafLevel = true;
};
jslet.data.FieldLookup.className = 'jslet.data.FieldLookup';

jslet.data.FieldLookup.prototype = {
	className: jslet.data.FieldLookup.className,
	
	clone: function(){
		var Z = this, 
			result = new jslet.data.FieldLookup();
		result.dataset(Z._dataset);
		result.keyField(Z._keyField);
		result.codeField(Z._codeField);
		result.nameField(Z._nameField);
		result.displayFields(Z._displayFields);
		result.parentField(Z._parentField);
		result.onlyLeafLevel(Z._onlyLeafLevel);
		return result;
	},
	
	hostField: function(fldObj) {
		var Z = this;
		if (fldObj === undefined) {
			return Z._hostField;
		}
		jslet.Checker.test('Field.hostField', fldObj).isClass(jslet.data.Field.className);
		Z._hostField = fldObj;
		return this;
	},
	
	/**
	 * Get or set lookup dataset.
	 * 
	 * @param {jslet.data.Dataset or undefined} dataset Lookup dataset.
	 * @return {jslet.data.Dataset or this}
	 */
	dataset: function(lkdataset) {
		var Z = this;
		if (lkdataset === undefined) {
			return Z._dataset;
		}
		Z._dataset = lkdataset;
		return this;
	},

	/**
	 * Get or set key field.
	 * Key field is optional, if it is null, it will use LookupDataset.keyField instead. 
	 * 
	 * @param {String or undefined} keyFldName Key field name.
	 * @return {String or this}
	 */
	keyField: function(keyFldName) {
		var Z = this;
		if (keyFldName === undefined){
			return Z._keyField || Z._dataset.keyField();
		}

		jslet.Checker.test('Field.keyField', keyFldName).isString();
		Z._keyField = jQuery.trim(keyFldName);
		return this;
	},

	/**
	 * Get or set code field.
	 * Code field is optional, if it is null, it will use LookupDataset.codeField instead. 
	 * 
	 * @param {String or undefined} codeFldName Code field name.
	 * @return {String or this}
	 */
	codeField: function(codeFldName) {
		var Z = this;
		if (codeFldName === undefined){
			return Z._codeField || Z._dataset.codeField();
		}

		jslet.Checker.test('Field.codeField', codeFldName).isString();
		Z._codeField = jQuery.trim(codeFldName);
		return this;
	},
	
	codeFormat: function(format) {
		var Z = this;
		if (format === undefined) {
			return Z._codeFormat;
		}

		jslet.Checker.test('Field.codeFormat', format).isString();
		Z._codeFormat = jQuery.trim(format);
		return this;
	},

	/**
	 * Get or set name field.
	 * Name field is optional, if it is null, it will use LookupDataset.nameField instead. 
	 * 
	 * @param {String or undefined} nameFldName Name field name.
	 * @return {String or this}
	 */
	nameField: function(nameFldName) {
		var Z = this;
		if (nameFldName === undefined){
			return Z._nameField || Z._dataset.nameField();
		}

		jslet.Checker.test('Field.nameField', nameFldName).isString();
		Z._nameField = jQuery.trim(nameFldName);
		return this;
	},

	/**
	 * Get or set parent field.
	 * Parent field is optional, if it is null, it will use LookupDataset.parentField instead. 
	 * 
	 * @param {String or undefined} parentFldName Parent field name.
	 * @return {String or this}
	 */
	parentField: function(parentFldName) {
		var Z = this;
		if (parentFldName === undefined){
			return Z._parentField || Z._dataset.parentField();
		}

		jslet.Checker.test('Field.parentField', parentFldName).isString();
		Z._parentField = jQuery.trim(parentFldName);
		return this;
	},

	/**
	 * An expression for display field value. Example:
	 * <pre><code>
	 * lookupFldObj.displayFields('[code]+"-"+[name]'); 
	 * </code></pre>
	 */
	displayFields: function(fieldExpr) {
		var Z = this;
		if (fieldExpr === undefined) {
			return Z._displayFields? Z._displayFields: this.getDefaultDisplayFields();
		}
		jslet.Checker.test('Field.displayFields', fieldExpr).isString();
		fieldExpr = jQuery.trim(fieldExpr);
		if (Z._displayFields != fieldExpr) {
			Z._displayFields = fieldExpr;
			Z._innerdisplayFields = null;
			if(Z._hostField) {
				Z._hostField._clearFieldCache();
			}
		}
		return this;
	},
	
	/**
	 * @private
	 */
	getDefaultDisplayFields: function() {
//		var expr = '[',fldName = this.codeField();
//		if (fldName) {
//			expr += fldName + ']';
//		}
//		fldName = this.nameField();
//
//		if (fldName) {
//			expr += '+"-"+[';
//			expr += fldName + ']';
//		}
//		if (expr === '') {
//			expr = '"Not set displayFields"';
//		}
//		
		var expr = '[' + this.nameField() + ']';
		return expr;
	},

	/**
	 * @private
	 */
	getCurrentDisplayValue: function() {
		var Z = this;
		if (Z._displayFields === null) {
			this.displayFields(this.getDefaultDisplayFields());
		}
		if(!Z._innerdisplayFields) {
			Z._innerdisplayFields = new jslet.Expression(Z._dataset, Z.displayFields());
		}
		
		return Z._innerdisplayFields.eval();
	},

	/**
	 * Identify whether user can select leaf level item if lookup dataset is a tree-style dataset.
	 * 
	 * @param {Boolean or undefined} flag True - Only leaf level item user can selects, false - otherwise.
	 * @return {Boolean or this}
	 */
	onlyLeafLevel: function(flag) {
		var Z = this;
		if (flag === undefined) {
			return Z._onlyLeafLevel;
		}
		Z._onlyLeafLevel = flag ? true: false;
		return this;
	}
};

/**
 * Create lookup field object.
 * 
 * @param {Json Object} param A json object which property names are same as jslet.data.FieldLookup. Example: {dataset: fooDataset, keyField: 'xxx', ...}
 * @return {jslet.data.FieldLookup}
 */
jslet.data.createFieldLookup = function(param) {
	jslet.Checker.test('createFieldLookup#param', param).required().isObject();
	var lkds = param.dataset;
	if (!lkds) {
		throw new Error('Property: dataset required!');
	}
	var lkf = new jslet.data.FieldLookup();

	if (typeof(lkds) == 'string') {
		lkds = jslet.data.dataModule.get(lkds);
	}
	lkf.dataset(lkds);
	if (param.keyField !== undefined) {
		lkf.keyField(param.keyField);
	}
	if (param.codeField !== undefined) {
		lkf.codeField(param.codeField);
	}
	if (param.nameField !== undefined) {
		lkf.nameField(param.nameField);
	}
	if (param.codeFormat !== undefined) {
		lkf.codeFormat(param.codeFormat);
	}
	if (param.displayFields !== undefined) {
		lkf.displayFields(param.displayFields);
	}
	if (param.parentField !== undefined) {
		lkf.parentField(param.parentField);
	}
	if (param.onlyLeafLevel !== undefined) {
		lkf.onlyLeafLevel(param.onlyLeafLevel);
	}
	return lkf;
};

