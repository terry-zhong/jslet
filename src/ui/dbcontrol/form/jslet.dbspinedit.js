/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBSpinEdit. 
 * <pre><code>
 * var jsletParam = {type:"DBSpinEdit",dataset:"employee",field:"age", minValue:18, maxValue: 100, step: 5};
 * 
 * //1. Declaring:
 * &lt;div data-jslet='type:"DBSpinEdit",dataset:"employee",field:"age", minValue:18, maxValue: 100, step: 5' />
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
jslet.ui.DBSpinEdit = jslet.Class.create(jslet.ui.DBText, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'dataset,field,step';
		/**
		 * {Integer} Step value.
		 */
		Z._step = 1;
		
		Z.enableInvalidTip = false;

		$super(el, params);
	},

	step: function(step) {
		if(step === undefined) {
			return this._step;
		}
		jslet.Checker.test('DBSpinEdit.step', step).isNumber();
		this._step = step;
	},

	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		var tag = el.tagName.toLowerCase();
		return tag == 'div';
	},

	/**
	 * @override
	 */
	bind: function () {
		var Z = this,
			jqEl = jQuery(Z.el);
		if(!jqEl.hasClass('jl-spinedit')) {
			jqEl.addClass('jl-spinedit');
			jqEl.attr('role', 'spinbutton');
		}
		Z._createControl();
		Z.renderAll();
	}, // end bind

	_createControl: function() {
		var Z = this,
			jqEl = jQuery(Z.el),
			s = '<div class="jl-spinedit-input"><input class="jl-border-box" role="presentation"/></div>' + 
		'<div class="jl-spinedit-upbtn jl-spinedit-upbtn-up jl-unselectable" unselectable="on" ondblclick="return false;"></div>' + 
		'<div class="jl-spinedit-downbtn jl-spinedit-downbtn-up jl-unselectable" ondblclick="return false;" unselectable="on"></div>';

		jqEl.html(s);
		
		var editor = jqEl.find('.jl-border-box')[0],
			upButton = jqEl.find('.jl-spinedit-upbtn-up')[0],
			downButton = jqEl.find('.jl-spinedit-downbtn-up')[0];
		Z.editor = editor;
		jQuery(Z.editor).on("keydown", function(event){
			if(Z._isDisabled()) {
				return;
			}
			var keyCode = event.keyCode;
			if(keyCode == jslet.ui.KeyCode.UP) {
				Z.decValue();
				event.preventDefault();
				return;
			}
			if(keyCode == jslet.ui.KeyCode.DOWN) {
				Z.incValue();
				event.preventDefault();
				return;
			}
		});
		new jslet.ui.DBText(editor, {
			dataset: Z._dataset,
			field: Z._field,
			beforeUpdateToDataset: Z.beforeUpdateToDataset,
			valueIndex: Z._valueIndex
		});

		jQuery(upButton).on('mousedown', function () {
			if(Z._isDisabled()) {
				return;
			}
			this.className = 'jl-spinedit-upbtn jl-spinedit-upbtn-down jl-unselectable';
			Z.editor.blur();
			Z.incValue();
			Z.editor.focus();
		});
		jQuery(upButton).on('mouseup', function () {
			if(Z._isDisabled()) {
				return;
			}
			this.className = 'jl-spinedit-upbtn jl-spinedit-upbtn-up jl-unselectable';
		});
		
		jQuery(downButton).on('mousedown', function () {
			if(Z._isDisabled()) {
				return;
			}
			this.className = 'jl-spinedit-downbtn jl-spinedit-downbtn-down jl-unselectable';
			Z.editor.blur();
			Z.decValue();
			Z.editor.focus();
		});
		jQuery(downButton).on('mouseup', function () {
			if(Z._isDisabled()) {
				return;
			}
			this.className = 'jl-spinedit-downbtn jl-spinedit-downbtn-up jl-unselectable';
		});
	},
	
	_isDisabled: function() {
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		return fldObj.disabled() || fldObj.readOnly();
	},
	
	/**
	 * @override
	 */
	beforeUpdateToDataset: function () {
		var Z = this,
			val = Z.el.value;
		var fldObj = Z._dataset.getField(Z._field),
			range = fldObj.range(),
			minValue = Number.NEGATIVE_INFINITY, 
			maxValue = Number.POSITIVE_INFINITY;
		
		if(range) {
			if(range.min) {
				minValue = parseFloat(range.min);
			}
			if(range.max) {
				maxValue = parseFloat(range.max);
			}
		}
		if (val) {
			val = parseFloat(val);
			if (val) {
				if (val > maxValue)
					val = maxValue;
				else if (val < minValue)
					val = minValue;
				val = String(val);
			}
		}
		jQuery(Z.el).attr('aria-valuenow', val);
		Z.el.value = val;
		return true;
	}, // end beforeUpdateToDataset

	setValueToDataset: function (val) {
		var Z = this;
		if (Z.silence) {
			return;
		}
		Z.silence = true;
		if (val === undefined) {
			val = Z.value;
		}
		try {
			Z._dataset.setFieldValue(Z._field, val, Z._valueIndex);
		} catch (e) {
			jslet.showException(e);
		} finally {
			Z.silence = false;
		}
	}, // end setValueToDataset

	incValue: function () {
		var Z = this,
			val = Z._dataset.getFieldValue(Z._field, Z._valueIndex);
		if (!val) {
			val = 0;
		}
		var maxValue = Z._getRange().maxValue;
		if (val == maxValue) {
			return;
		} else if (val < maxValue) {
			val += Z._step;
		} else {
			val = maxValue;
		}
		if (val > maxValue) {
			value = maxValue;
		}
		jQuery(Z.el).attr('aria-valuenow', val);
		Z.setValueToDataset(val);
	}, // end incValue

	_getRange: function() {
		var Z = this,
			fldObj = Z._dataset.getField(Z._field),
			range = fldObj.range(),
			minValue = Number.NEGATIVE_INFINITY, 
			maxValue = Number.POSITIVE_INFINITY;
		
		if(range) {
			if(range.min) {
				minValue = parseFloat(range.min);
			}
			if(range.max) {
				maxValue = parseFloat(range.max);
			}
		}
		return {minValue: minValue, maxValue: maxValue};
	},
	
	decValue: function () {
		var Z = this,
			val = Z._dataset.getFieldValue(Z._field, Z._valueIndex);
		if (!val) {
			val = 0;
		}
		var minValue = Z._getRange().minValue;
		if (val == minValue) {
			return;
		} else if (val > minValue) {
			val -= Z._step;
		} else {
			val = minValue;
		}
		if (val < minValue)
			val = minValue;
		jQuery(Z.el).attr('aria-valuenow', val);
		Z.setValueToDataset(val);
	}, // end decValue
	
	focus: function() {
		if(Z._isDisabled()) {
			return;
		}
		this.editor.focus();
	},
	
	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName) {
		$super(metaName);
		var Z = this,
			jqEl = jQuery(this.el),
			fldObj = Z._dataset.getField(Z._field);
		
		if(!metaName || metaName == 'disabled' || metaName == 'readOnly') {
			var disabled = fldObj.disabled() || fldObj.readOnly(),
				jqUpBtn = jqEl.find('.jl-spinedit-upbtn'),
				jqDownBtn = jqEl.find('.jl-spinedit-downbtn');
				
			if (disabled) {
				jqUpBtn.addClass('jl-spinedit-upbtn-disabled');
				jqDownBtn.addClass('jl-spinedit-downbtn-disabled');
			} else {
				jqUpBtn.removeClass('jl-spinedit-upbtn-disabled');
				jqDownBtn.removeClass('jl-spinedit-downbtn-disabled');
			}
		}
		if(!metaName || metaName == 'range') {
			range = fldObj.range();
			jqEl.attr('aria-valuemin', range && (range.min || range.min === 0) ? range.min: '');
			jqEl.attr('aria-valuemin', range && (range.max || range.max === 0) ? range.max: '');
		}
	},
	
	/**
	 * @override
	 */
	renderAll: function(){
		this.refreshControl(jslet.data.RefreshEvent.updateAllEvent(), true);
	},
	
	/**
	 * @override
	 */
	destroy: function(){
		var jqEl = jQuery(this.el);
		jQuery(this.editor).off();
		this.editor = null;
		jqEl.find('.jl-upbtn-up').off();
		jqEl.find('.jl-downbtn-up').off();
	}
	
});
jslet.ui.register('DBSpinEdit', jslet.ui.DBSpinEdit);
jslet.ui.DBSpinEdit.htmlTemplate = '<div></div>';

