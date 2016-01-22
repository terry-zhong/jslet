/* ========================================================================
 * Jslet framework: jslet.dbcomboselect.js
 *
 * Copyright (c) 2014 Jslet Group(https://github.com/jslet/jslet/)
 * Licensed under MIT (https://github.com/jslet/jslet/LICENSE.txt)
 * ======================================================================== */
"use strict";

/**
 * @class DBCombodlg. 
 * Show data on a popup panel, it can display tree style or table style. 
 * Example:
 * <pre><code>
 * var jsletParam = {type:"DBCombodlg",dataset:"employee",field:"department", textReadOnly:true};
 * 
 * //1. Declaring:
 * &lt;div data-jslet='type:"DBCombodlg",dataset:"employee",field:"department", textReadOnly:true' />
 * or
 * &lt;div data-jslet='jsletParam' />
 *  
 *  //2. Binding
 * &lt;div id="ctrlId"  />
 * //Js snippet
 * var el = document.getElementById('ctrlId');
 * jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 * jslet.ui.createControl(jsletParam, document.body);
 * 
 * </code></pre>
 */
jslet.ui.DBList = jslet.Class.create(jslet.ui.DBFieldControl, {
	showStyles: ['auto', 'table', 'tree'],
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,showStyle,correlateCheck';
		
		Z._showStyle = 'auto';
		
		Z._correlateCheck = false;
		
		$super(el, params);
	},

	/**
	 * Get or set panel content style.
	 * 
	 * @param {String} Optional value: auto, table, tree.
	 * @return {String or this}
	 */
	showStyle: function(showStyle) {
		if(showStyle === undefined) {
			return this._showStyle;
		}
		showStyle = jQuery.trim(showStyle);
		var checker = jslet.Checker.test('DBComboSelect.showStyle', showStyle).isString();
		showStyle = showStyle.toLowerCase();
		checker.testValue(showStyle).inArray(this.showStyles);
		this._showStyle = showStyle;
	},
	
	correlateCheck: function(correlateCheck) {
		if(correlateCheck === undefined) {
			return this._correlateCheck;
		}
		this._correlateCheck = correlateCheck;
	},
	
	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return el.tagName.toLowerCase() == 'div';
	},

	/**
	 * @override
	 */
	bind: function () {
		this.renderAll();
	},
	
	renderAll: function() {
		var Z = this,
			jqEl = jQuery(Z.el);
		if(jqEl.hasClass('jl-dblist')) {
			jqEl.addClass('jl-dblist');
		}
		var fldObj = Z._dataset.getField(Z._field),
			lkfld = fldObj.lookup(),
			pfld = lkfld.parentField(),
			showType = Z._showStyle.toLowerCase(),
			lkds = lkfld.dataset(),
			isMulti = fldObj.valueStyle() === jslet.data.FieldValueStyle.MULTIPLE;
		if(showType == 'auto' && pfld) {
			showType = 'tree';
		}
		if (showType == 'tree') {
			var treeparam = { 
				type: 'DBTreeView', 
				dataset: lkds, 
				readOnly: false, 
				displayFields: lkfld.displayFields(), 
				hasCheckBox: isMulti,
				correlateCheck: Z._correlateCheck
			};
			if(isMulti) {
				treeparam.afterCheckBoxClick = function() {
					Z.updateToDataset();
				}
			} else {
				treeparam.onItemClick = function() {
					Z.updateToDataset();
				}
			}
	
			window.setTimeout(function(){
				jslet.ui.createControl(treeparam, Z.el, '100%', '100%');
			}, 1);
		} else {
			var tableparam = { type: 'DBTable', dataset: lkds, readOnly: true, hasSelectCol: isMulti, hasSeqCol: false, hasFindDialog: false, hasFilterDialog: false};
			if(isMulti) {
				tableparam.afterSelect = tableparam.afterSelectAll = function() {
					Z.updateToDataset();
				};
			} else {
				tableparam.onRowClick = function() {
					Z.updateToDataset();
				};
			}
			window.setTimeout(function() {
				jslet.ui.createControl(tableparam, Z.el, '100%', '100%');
			}, 1);
		}
		
	},
	
	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName){
		$super(metaName);
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if(!metaName || metaName == "disabled" || metaName == "readOnly") {
			Z.el.disabled = true;
		} else {
			Z.el.disabled = false;
		}
		
		if(metaName && metaName == 'required') {
			var jqEl = jQuery(Z.el);
			if (fldObj.required()) {
				jqEl.addClass('jl-ctrl-required');
			} else {
				jqEl.removeClass('jl-ctrl-required');
			}
		}
		
		if(!metaName || metaName == 'tabIndex') {
			Z.setTabIndex();
		}
		
	},
	
	updateToDataset: function () {
		var Z = this;
		if (Z._keep_silence_) {
			return true;
		}
		
		var fldObj = Z._dataset.getField(Z._field),
			lkfld = fldObj.lookup(),
			lkds = lkfld.dataset(),
			isMulti = fldObj.valueStyle() === jslet.data.FieldValueStyle.MULTIPLE,
			value;
		if(!isMulti) {
			value = lkds.keyValue();
		} else {
			value = lkds.selectedKeyValues();
		}
		var ctrlRecno = Z.ctrlRecno();
		if(ctrlRecno >= 0) {
			var oldRecno = Z._dataset.recnoSilence();
			Z._dataset.recnoSilence(Z.ctrlRecno());
		}
		try {
			Z._dataset.editRecord();
			Z._keep_silence_ = true;
			try {
				Z._dataset.setFieldValue(Z._field, value, Z._valueIndex);
			} finally {
				Z._keep_silence_ = false;
			}
		} finally {
			if(ctrlRecno >= 0) {
				Z._dataset.recnoSilence(oldRecno);
			}
		}
		Z.refreshControl(jslet.data.RefreshEvent.updateRecordEvent(Z._field));
		return true;
	}, // end updateToDataset
	
	/**
	 * @override
	 */
	doValueChanged: function() {
		var Z = this;
		if (Z._keep_silence_) {
			return;
		}
		var errObj = Z.getFieldError();
		if(errObj && errObj.message) {
			Z.el.value = errObj.inputText || '';
			Z.renderInvalid(errObj);
			return;
		} else {
			Z.renderInvalid(null);
		}
		var fldObj = Z._dataset.getField(Z._field),
			fldValue = fldObj.getValue(),
			lkfld = fldObj.lookup(),
			pfld = lkfld.parentField(),
			lkds = lkfld.dataset(),
			isMulti = fldObj.valueStyle() === jslet.data.FieldValueStyle.MULTIPLE;
		if(!isMulti) {
			lkds.findByKey(fldValue);
		} else {
			
		}
	},

	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this;
		$super();
	}
});

jslet.ui.register('DBList', jslet.ui.DBList);
jslet.ui.DBList.htmlTemplate = '<div></div>';
