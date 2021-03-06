﻿/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBRadioGroup. 
 * Display a group of radio that user can select one option. Example:
 * <pre><code>
 * var jsletParam = {type:"DBRadioGroup",dataset:"employee",field:"department"};
 * 
 * //1. Declaring:
 * &lt;div data-jslet='type:"DBRadioGroup",dataset:"employee",field:"department"'' />
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
"use strict";
jslet.ui.DBRadioGroup = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,columnCount';
		/**
		 * {Integer} Column count
		 */
		Z._columnCount = 99999;
		
		Z._itemIds = null;
		
		$super(el, params);
	},

	columnCount: function(columnCount) {
		if(columnCount === undefined) {
			return this._columnCount;
		}
		jslet.Checker.test('DBRadioGroup.columnCount', columnCount).isGTEZero();
		this._columnCount = parseInt(columnCount);
	},
	
	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		var tagName = el.tagName.toLowerCase();
		return tagName == 'div';
	},

	/**
	 * @override
	 */
	bind: function () {
		var Z = this;
		Z.renderAll();
		var jqEl = jQuery(Z.el);
		jqEl.on('keydown', function(event) {
			var keyCode = event.which, idx, activeEle, activeId;
			
			if(keyCode === jslet.ui.KeyCode.LEFT) { //Arrow Left
				if(!Z._itemIds || Z._itemIds.length === 0) {
					return;
				}
				activeEle = document.activeElement;
				activeId = activeEle && activeEle.id;
				
				idx = Z._itemIds.indexOf(activeId);
				if(idx === 0) {
					return;
				}
				document.getElementById(Z._itemIds[idx - 1]).focus();
				event.preventDefault();
	       		event.stopImmediatePropagation();
			} else if( keyCode === jslet.ui.KeyCode.RIGHT) { //Arrow Right
				if(!Z._itemIds || Z._itemIds.length === 0) {
					return;
				}
				activeEle = document.activeElement;
				activeId = activeEle && activeEle.id;
				
				idx = Z._itemIds.indexOf(activeId);
				if(idx === Z._itemIds.length - 1) {
					return;
				}
				document.getElementById(Z._itemIds[idx + 1]).focus();
				event.preventDefault();
	       		event.stopImmediatePropagation();
			}
		});
		jqEl.on('click', 'input[type="radio"]', function(event){
			var ctrl = this;
			window.setTimeout(function(){ //Defer firing 'updateToDataset' when this control is in DBTable to make row changed firstly.
				event.delegateTarget.jslet.updateToDataset(ctrl);
			}, 5);
		});
		jqEl.on('focus', 'input[type="radio"]', function (event) {
			jslet.ui.focusManager.activeDataset(Z._dataset.name()).activeField(Z._field).activeValueIndex(Z._valueIndex);
		});
		jqEl.on('blur', 'input[type="radio"]', function (event) {
			jslet.ui.focusManager.activeDataset(null).activeField(null).activeValueIndex(null);
		});
		jqEl.addClass('form-control');
		jqEl.css('height', 'auto');
	},

	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName) {
		$super(metaName);
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if(!metaName || metaName == "disabled" || metaName == "readOnly" || metaName == 'tabIndex') {
			var disabled = fldObj.disabled(),
				readOnly = fldObj.readOnly();
		
			Z.disabled = disabled || readOnly;
			disabled = Z.disabled;
			var radios = jQuery(Z.el).find('input[type="radio"]'),
				required = fldObj.required(),
				radioEle,
				tabIdx = fldObj.tabIndex();
			
			for(var i = 0, cnt = radios.length; i < cnt; i++){
				radioEle = radios[i];
				jslet.ui.setEditableStyle(radioEle, disabled, readOnly, false, required);
				radioEle.tabIndex = tabIdx;
			}
		}
	},
	
	/**
	 * @override
	 */
	doValueChanged: function() {
		var Z = this;
		if (Z._keep_silence_) {
			return;
		}
		var value = Z.getValue(),
			radios = jQuery(Z.el).find('input[type="radio"]'), 
			radio;
		for(var i = 0, cnt = radios.length; i < cnt; i++){
			radio = radios[i];
			radio.checked = (value == jQuery(radio.parentNode).attr('value'));
		}
	},
	
	/**
	 * @override
	 */
	doLookupChanged: function () {
		var Z = this;
		var fldObj = Z._dataset.getField(Z._field), lkf = fldObj.lookup();
		if (!lkf) {
			console.error(jslet.formatMessage(jslet.locale.Dataset.lookupNotFound,
					[fldObj.name()]));
			return;
		}
		var lkds = lkf.dataset(),
			cnt = lkds.recordCount();
		if(cnt === 0) {
			Z.el.innerHTML = jslet.locale.DBRadioGroup.noOptions;
			return;
		}
		var oldRecno = lkds.recno();
		try {
			var template = ['<table cellpadding="0" cellspacing="0">'],
				isNewRow = false, 
				itemId;
			var editFilter = lkf.editFilter();
			Z._innerEditFilterExpr = null;
			var editItemDisabled = lkf.editItemDisabled();
			if(editFilter) {
				Z._innerEditFilterExpr = new jslet.Expression(lkds, editFilter);
			}
			var disableOption = false, k = -1;
			
			Z._itemIds = [];
			for (var i = 0; i < cnt; i++) {
				lkds.recnoSilence(i);
				disableOption = false;
				if(Z._innerEditFilterExpr && !Z._innerEditFilterExpr.eval()) {
					if(!editItemDisabled) {
						continue;
					} else {
						disableOption = true;
					}
				}
				k++;
				isNewRow = (k % Z._columnCount === 0);
				if (isNewRow) {
					if (k > 0) {
						template.push('</tr>');
					}
					template.push('<tr>');
				}
				itemId = jslet.nextId();
				Z._itemIds.push(itemId);
				template.push('<td style="white-space: nowrap;vertical-align:middle" value="');
				template.push(lkds.getFieldValue(lkf.keyField()));
				template.push('"><input name="');
				template.push(Z._field);
				template.push('" type="radio" id="');
				template.push(itemId);
				template.push('" ' + (disableOption? ' disabled': '') + '/><label for="');
				template.push(itemId);
				template.push('">');
				template.push(lkf.getCurrentDisplayValue());
				template.push('</label></td>');
			} // end while
			if (cnt > 0) {
				template.push('</tr>');
			}
			template.push('</table>');
			Z.el.innerHTML = template.join('');
		} finally {
			lkds.recnoSilence(oldRecno);
		}
		Z.doMetaChanged();
	}, // end renderOptions

	updateToDataset: function(currCheckBox) {
		var Z = this;
		if (Z._keep_silence_ || Z.disabled) {
			return;
		}
		Z._keep_silence_ = true;
		try {
			Z._dataset.setFieldValue(Z._field, jQuery(currCheckBox.parentNode).attr('value'));
			currCheckBox.checked = true;
		} finally {
			Z._keep_silence_ = false;
		}
	},
	
	/**
	 * @override
	 */
	innerFocus: function() {
		var itemIds = this._itemIds;
		if (itemIds && itemIds.length > 0) {
			document.getElementById(itemIds[0]).focus();
		}
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this, 
			jqEl = jQuery(Z.el);
		if(!jqEl.hasClass("jl-radiogroup")) {
			jqEl.addClass("jl-radiogroup");
		}
		Z.refreshControl(jslet.data.RefreshEvent.updateAllEvent(), true);
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var jqEl = jQuery(this.el);
		jqEl.off();
		$super();
	}
});

jslet.ui.register('DBRadioGroup', jslet.ui.DBRadioGroup);
jslet.ui.DBRadioGroup.htmlTemplate = '<div></div>';
