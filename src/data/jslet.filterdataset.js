/* ========================================================================
 * Jslet framework: jslet.filterdataset.js
 *
 * Copyright (c) 2014 Jslet Group(https://github.com/jslet/jslet/)
 * Licensed under MIT (https://github.com/jslet/jslet/LICENSE.txt)
 * ======================================================================== */

jslet.data.FilterDataset = function(hostDataset) {
	if(!jslet.data.getDataset('ds_logical_opr_')) {
		jslet.data.createEnumDataset('ds_logical_opr_', {'and': jslet.locale.FilterDataset.and, 'or': jslet.locale.FilterDataset.or});
	}
	
	if(!jslet.data.getDataset('ds_operator_')) {
		var fldCfg = [{name: 'code', type: 'S', length: 10, label:'code'},
	                  {name: 'name', type: 'S', length: 30, label:'name'},
	                  {name: 'range', type: 'S', length: 30, label:'range'}];
		
		var dsOperator = jslet.data.createDataset('ds_operator_', fldCfg, {keyField: 'code', codeField: 'code', nameField: 'name', autoRefreshHostDataset: true});
		dsOperator.dataList([{code: '==', name: '==', range: 'NDSB'},
		                     {code: '!=', name: '!=', range: 'NDS'},
		                     {code: '>', name: '>', range: 'NDS'},
		                     {code: '>=', name: '>=', range: 'NDS'},
		                     {code: '<', name: '<', range: 'NDS'},
		                     {code: '<=', name: '<=', range: 'NDS'},
		                     {code: 'between', name: jslet.locale.FilterDataset.between, range: 'NDS'},
		                     
		                     {code: 'likeany', name: jslet.locale.FilterDataset.likeany, range: 'S'},
		                     {code: 'likefirst', name: jslet.locale.FilterDataset.likefirst, range: 'S'},
		                     {code: 'likelast', name: jslet.locale.FilterDataset.likelast, range: 'S'},
	
		                     {code: 'select', name: jslet.locale.FilterDataset.select, range: 'LH'},
		                     {code: 'selfchildren0', name: jslet.locale.FilterDataset.selfchildren0, range: 'H'},
		                     {code: 'children0', name: jslet.locale.FilterDataset.children0, range: 'H'},
		                     {code: 'selfchildren1', name: jslet.locale.FilterDataset.selfchildren1, range: 'H'},
		                     {code: 'children1', name: jslet.locale.FilterDataset.children1, range: 'H'}
		                     ]);
	}
	this._hostDataset = hostDataset;
	this._filterDataset;
	this._varValues;
}

jslet.data.FilterDataset.prototype = {
	filterDataset: function() {
		var Z = this;
		if(Z._filterDataset) {
			return Z._filterDataset;
		}
		
		var id =  jslet.nextId();
		var fldCfg = [
            {name: 'name', type: 'S', length: 30, label: 'Field Code'}, 
            {name: 'label', type: 'S', length: 50, label: 'Field Name'}, 
            {name: 'dataType', type: 'S', length: 2, label: 'Data Type'}, 
            {name: 'parentName', type: 'S', length: 30, label: 'Parent Field Code'}, 
		];
		var dsFields = jslet.data.createDataset('ds_fields_' + id, fldCfg, 
				{keyField: 'name', codeField: 'name', nameField: 'label', parentField: 'parentName', autoRefreshHostDataset: true});
		
		var fieldLabels = [];
		Z._appendFields(Z._hostDataset, fieldLabels);
		dsFields.dataList(fieldLabels);
		
		var fldCfg = [ 
             {name: 'lParenthesis', type: 'S', length: 10, label: jslet.locale.FilterDataset.lParenthesis, validChars:'('}, 
	         {name: 'hostField', type: 'S', length: 30, label: 'Host Field', visible: false},
	         {name: 'field', type: 'S', length: 200, displayWidth:30, label: jslet.locale.FilterDataset.field, 
	        	 lookup: {dataset: dsFields, onlyLeafLevel: false}, editControl: {type: 'DBComboSelect', textReadOnly: true}, required: true},
	         {name: 'dataType', type: 'S', length: 10, label: jslet.locale.FilterDataset.dataType, visible: false},
	         {name: 'operator', type: 'S',length: 50, displayWidth:20, label: jslet.locale.FilterDataset.operator, 
	        	 lookup: {dataset:"ds_operator_"}, required: true},
	         {name: 'value', type: 'S', length: 200, displayWidth:30, label: jslet.locale.FilterDataset.value},
	         {name: 'valueExpr', type: 'S', length: 30, visible: false},
	         {name: 'valueExprInput', type: 'S', length: 2, label: ' ', readOnly: true, visible: false,
	        	 fixedValue: '<button class="btn btn-defualt btn-xs">...</button>'},
             {name: 'rParenthesis', type: 'S', length: 10, label: jslet.locale.FilterDataset.rParenthesis, validChars:')'}, 
             {name: 'logicalOpr', type: 'S', length: 10, label: jslet.locale.FilterDataset.logicalOpr, 
            	 lookup: {dataset:"ds_logical_opr_"}, required: true, defaultValue: 'and'} 
		];
		var dsFilter = jslet.data.createDataset('dsFilter_' + id, fldCfg);
		var rule1 = {condition: '[field]', rules: [{field: 'value', customized: function(fldObj){
			var fldName = dsFilter.getFieldValue('field');
			var hostFldObj = jslet.data.getDataset(Z._hostDataset).getField(fldName), 
				fldType;
			if(hostFldObj) {
				var lkObj = hostFldObj.lookup();
				if(lkObj) {
					fldType = (lkObj.dataset().parentField()) ? 'H': 'L';
				} else {
					fldType = hostFldObj.getType();
				}
				Z._copyFilterValueMeta(dsFilter, hostFldObj);
			} else {
				fldType = dsFields.getFieldValue('dataType');
				Z._setExtendDateField(dsFilter);
			}
			dsFilter.setFieldValue('dataType', fldType);
			}}
		]};
		
		var rule2 = {
			condition: '[dataType]',
			rules: [{field: 'operator', customized: function(fldObj){
				var fldObj = dsFilter.getField('operator'),
					lkDs = fldObj.lookup().dataset();
				lkDs.filter('[range].indexOf("' + dsFilter.getFieldValue('dataType') + '") >= 0');
				lkDs.filtered(true);
				lkDs.first();
				var firstValue = lkDs.getFieldValue('code');
				dsFilter.setFieldValue('operator', firstValue);
				}}
			]};

		var rule3 = {condition: '[operator]', rules: [{field: 'value', customized: function(fldObj){
			var oldValueStyle = dsFilter.getField('value').valueStyle();
			var operator = dsFilter.getFieldValue('operator');
			var valueStyle = jslet.data.FieldValueStyle.NORMAL;
			if(operator == 'between') {
				valueStyle = jslet.data.FieldValueStyle.BETWEEN;
			} else if(operator == 'select') {
				valueStyle = jslet.data.FieldValueStyle.MULTIPLE;
			}
			if(oldValueStyle != valueStyle) {
				fldObj.valueStyle(valueStyle);
			}
			}}
		]};
		
		dsFilter.contextRules([rule1, rule2, rule3]);
		dsFilter.enableContextRule();
		dsFilter.onFieldChanged(function(fldName, fldValue) {
			if(fldName == 'field' || fldName == 'operator') {
				this.setFieldValue('value', null);
				console.log(fldName);
				this.focusEditControl('value');
			}
		});
		this._filterDataset = dsFilter;
		return dsFilter;

	},
	
	_appendFields: function(hostDataset, fieldLabels, hostFldName, hostFldLabel) {
		var fields = jslet.data.getDataset(hostDataset).getNormalFields(),
			fldObj;
		for(var i = 0, len = fields.length; i < len; i++) {
			fldObj = fields[i];
			//Hidden fields, fixed value fields and dataset fieldS do not need to filter.
			if(!fldObj.visible() || fldObj.fixedValue() || fldObj.getType() === jslet.data.Dataset.DATASET) { 
				continue;
			}
			var fldCode = fldObj.name(),
				fldLabel = fldObj.label(),
				fldDataType = fldObj.getType();
			if(hostFldName) {
				fldCode = hostFldName + '.' + fldCode;
				fldLabel = hostFldLabel + '.' + fldLabel;
			}
			var fldCfg = {name: fldCode, label: fldLabel, dataType: fldDataType};
			if(hostFldName) {
				fldCfg.parentName = hostFldName;
			}
			fieldLabels.push(fldCfg);
			if(fldDataType === jslet.data.DataType.DATE) {
				fieldLabels.push({name: fldCode + '.Y', label: fldLabel + '.' + jslet.locale.FilterDataset.year, dataType: 'N', parentName: fldCode});
				fieldLabels.push({name: fldCode + '.M', label: fldLabel + '.' + jslet.locale.FilterDataset.month, dataType: 'N', parentName: fldCode});
				fieldLabels.push({name: fldCode + '.YM', label: fldLabel + '.' + jslet.locale.FilterDataset.yearMonth, dataType: 'N', parentName: fldCode});
			}
			var lkObj = fldObj.lookup();
			if(lkObj) {
				this._appendFields(lkObj.dataset(), fieldLabels, fldCode, fldLabel);
			}
		}
	},

	_copyFilterValueMeta: function(dsFilter, hostFldObj){
		var fldObj = dsFilter.getField('value');
		
		fldObj.dataType(hostFldObj.dataType());
		fldObj.length(hostFldObj.length());
		fldObj.scale(hostFldObj.scale());
		fldObj.alignment(hostFldObj.alignment());
		fldObj.editMask(hostFldObj.editMask());

		fldObj.displayFormat(hostFldObj.displayFormat());
		fldObj.dateFormat(hostFldObj.dateFormat());
		fldObj.displayControl(hostFldObj.displayControl());
		fldObj.validChars(hostFldObj.validChars());
		if(hostFldObj.lookup()) {
			var hostLkObj = hostFldObj.lookup();
			var lkObj = new jslet.data.FieldLookup();
			lkObj.dataset(hostLkObj.dataset());
			lkObj.keyField(hostLkObj.keyField());
			lkObj.codeField(hostLkObj.codeField());
			lkObj.nameField(hostLkObj.nameField());
			lkObj.displayFields(hostLkObj.displayFields());
			lkObj.parentField(hostLkObj.parentField());
			lkObj.onlyLeafLevel(false);
			fldObj.lookup(lkObj);
			fldObj.editControl('DBComboSelect');
		} else {
			fldObj.lookup(null);
			fldObj.editControl(hostFldObj.editControl());
		}
	},
	
	_setExtendDateField: function(dsFilter) {
		var fldObj = dsFilter.getField('value');
		
		fldObj.dataType(jslet.data.DataType.NUMBER);
		fldObj.length(10);
		fldObj.scale(0);
		fldObj.alignment('right');
		fldObj.editMask(null);

		fldObj.displayFormat(null);
		fldObj.lookup(null);
		fldObj.displayControl(null);
		fldObj.editControl(null);
	},
	
	convertToFilterExpr: function() {
		var Z = this,
			dsFilter = Z._filterDataset;
		if(!dsFilter || dsFilter.recordCount() === 0) {
			return null;
		}
		this.validate();
		var result = '', recno,
			lastRecno = dsFilter.recordCount() - 1;
		
		dsFilter.iterate(function() {
			recno = this.recno();
			var dataType = this.getFieldValue('dataType');
			result += this.getFieldValue('lParenthesis') || '';
			
			result += Z._getFieldFilter(this);
			result += this.getFieldValue('rParenthesis') || '';
			if(recno != lastRecno) {
				result += ' ' + (this.getFieldValue('logicalOpr') == 'or' ?  '||': '&&') + ' ';
			}
			
		});
		console.log('Filter Expr: ' + result)
		return result;
	},
	
	_getFieldFilter: function(dsFilter) {
		var	fldName = dsFilter.getFieldValue('field'),
			dataType = dsFilter.getFieldValue('dataType'),
			operator = dsFilter.getFieldValue('operator'),
			value = dsFilter.getFieldValue('value'),
			valueExpr = dsFilter.getFieldValue('valueExpr'),
			result = '';
		//Boolean value
		if(dataType == 'B') { 
			result =  '[' + fldName + ']';
			if(!value) {
				result =  '!' + result;
			}
			return result;
		}
		var fldNameStr = '[' + fldName + ']';
		//Extend date field
		if(dataType === 'N') {
			if(fldName.endsWith('.Y')) {
				fldNameStr = '[' + fldName.substring(0, fldName.length - 2) + ']';
				fldNameStr = 'jslet.getYear(' + fldNameStr + ')';
			} else	if(fldName.endsWith('.M')) {
				fldNameStr = '[' + fldName.substring(0, fldName.length - 2) + ']';
				fldNameStr = 'jslet.getMonth(' + fldNameStr + ')';
			} else if(fldName.endsWith('.YM')) {
				fldNameStr = '[' + fldName.substring(0, fldName.length - 3) + ']';
				fldNameStr = 'jslet.getYearMonth(' + fldNameStr + ')';
			}
		}
		function getValue(dataType, value) {
			if(dataType === 'D') {
				return 'new Date(' + value.getTime() + ')';
			}
			if(dataType === 'S') {
				return '"' + value + '"';
			}
			return value;
		}
		//Operator: ==, !=, >, >=, <, <=
		if(operator == '==' || operator == '!=' ||
		   operator == '>' || operator == '>=' || 
		   operator == '<' || operator == '<=') {
			result = 'jslet.compareValue(' + fldNameStr + ', ' + getValue(dataType, value) + ')';
			result += operator + '0';
			return result;
		}
		//Operator: between
		if(operator == 'between') {
			var value1 = value[0], value2 = null;
			if(value.length > 1) {
				value2 = value[1];
			}
			if(value1 !== null && value1 !== undefined) {
				result += 'jslet.compareValue(' + fldNameStr + ', ' + getValue(dataType, value1) + ') >=0';
			}
			if(value2 !== null && value2 !== undefined) {
				if(result.length > 0) {
					result += ' && '
				}
				result += 'jslet.compareValue(' + fldNameStr + ', ' + getValue(dataType, value2) + ') <=0';
			}
			return '(' + result + ')';
		}
		//Operator: likeany, likefirst, likelast
		if(operator == 'likeany' || operator == 'likefirst' || operator == 'likelast') {
			result = 'like(' + fldNameStr + ', "';
			if(operator == 'likeany' || operator == 'likelast') {
				result += '%';
			}
			result += value;
			if(operator == 'likeany' || operator == 'likefirst') {
				result += '%';
			}
			result += '")';
			return result;
		}
		//Operator: select
		if(operator == 'select') {
			dataType = this._hostDataset.getField(fldName).getType();
			result = 'inlist(' + fldNameStr ; 
			for(var i = 0, len = value.length; i < len; i++) {
				result += ',' + getValue(dataType, value[i]);
			}
			result += ')';
			return result;
		}
		//Operator: selfchildren0, children0, selfchildren1, children1
		if(operator == 'selfchildren0' || operator == 'children0' || 
			operator == 'selfchildren1' || operator == 'children1') {
			var funcStr = 'inChildren';
			if(operator == 'selfchildren0' || operator == 'selfchildren1') {
				funcStr = 'inChildrenAndSelf';
			} else {
				result = 'inChildren';
			}
			dataType = this._hostDataset.getField(fldName).getType();
			result = funcStr + '("' + fldName + '", ' + getValue(dataType, value) + ',';
			if(operator == 'selfchildren0' || operator == 'children0') {
				result += 'false)';
			} else {
				result += 'true)';
			}
			return result;
		}
		return result;
	},
	
	_getFilterValue: function(dsFilter) {
		return dsFilter.getFieldValue('value');
	},
	
	validate: function() {
		var dsFilter = this._filterDataset,
			parenthesisCount = 0,
			errMsg = null;
		dsFilter.iterate(function() {
			parenthesisCount = (this.getFieldValue('lParenthesis') || '').length - (this.getFieldValue('rParenthesis') || '').length;
			if(!this.getFieldValue('value') && !this.getFieldValue('valueExpr')) {
				errMsg = jslet.locale.FilterDataset.valueRequired;
				return true; //Exists invalidate record, break iterating.
			}
		});
		if(!errMsg && parenthesisCount !== 0) {
			errMsg = jslet.locale.FilterDataset.parenthesisNotMatched;
		}
		if(errMsg) {
			console.error(errMsg);
		}
		return errMsg;
	},
	
	destroy: function() {
		var lkdsField = this._filterDataset.getField('field').lookup().dataset();
		this._filterDataset.destroy();
		lkdsField.destroy();
	}
	
	
}