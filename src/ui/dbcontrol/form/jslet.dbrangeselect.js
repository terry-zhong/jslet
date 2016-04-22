/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBRangeSelect. 
 * Display a select which options produce with 'beginItem' and 'endItem'. Example:
 * <pre><code>
 * var jsletParam = {type:"DBRangeSelect",dataset:"employee",field:"age",beginItem:10,endItem:100,step:5};
 * 
 * //1. Declaring:
 * &lt;select data-jslet='type:"DBRangeSelect",dataset:"employee",field:"age",beginItem:10,endItem:100,step:5' />
 * or
 * &lt;select data-jslet='jsletParam' />
 * 
 *  //2. Binding
 * &lt;select id="ctrlId"  />
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
jslet.ui.DBRangeSelect = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,beginItem,endItem,step';
		if (!Z.requiredProperties) {
			Z.requiredProperties = 'field,beginItem,endItem,step';
		}

		/**
		 * {Integer} Begin item 
		 */
		Z._beginItem = 0;
		/**
		 * {Integer} End item
		 */
		Z._endItem = 10;
		/**
		 * {Integer} Step
		 */
		Z._step = 1;
		
		$super(el, params);
	},

	beginItem: function(beginItem) {
		if(beginItem === undefined) {
			return this._beginItem;
		}
		jslet.Checker.test('DBRangeSelect.beginItem', beginItem).isNumber();
		this._beginItem = parseInt(beginItem);
	},

	endItem: function(endItem) {
		if(endItem === undefined) {
			return this._endItem;
		}
		jslet.Checker.test('DBRangeSelect.endItem', endItem).isNumber();
		this._endItem = parseInt(endItem);
	},

	step: function(step) {
		if(step === undefined) {
			return this._step;
		}
		jslet.Checker.test('DBRangeSelect.step', step).isNumber();
		this._step = parseInt(step);
	},

	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return (el.tagName.toLowerCase() == 'select');
	},

	/**
	 * @override
	 */
	bind: function () {
		var Z = this,
			fldObj = Z._dataset.getField(Z._field),
			valueStyle = fldObj.valueStyle();
		
		if(Z.el.multiple && valueStyle != jslet.data.FieldValueStyle.MULTIPLE) {
			fldObj.valueStyle(jslet.data.FieldValueStyle.MULTIPLE);
		} else if(valueStyle == jslet.data.FieldValueStyle.MULTIPLE && !Z.el.multiple) {
			Z.el.multiple = "multiple";	
		}
		Z.renderAll();
		var jqEl = jQuery(Z.el);
		jqEl.on('change', Z._doChanged);// end observe
		jqEl.focus(function(event) {
			jslet.ui.focusManager.activeDataset(Z._dataset.name()).activeField(Z._field).activeValueIndex(Z._valueIndex);
		});
		jqEl.blur(function(event) {
			jslet.ui.focusManager.activeDataset(null).activeField(null).activeValueIndex(null);
		});
		if(Z.el.multiple) {
			jqEl.on('click', 'option', function () {
				Z._currOption = this;
			});// end observe
		}
		jqEl.addClass('form-control');//Bootstrap class
	}, // end bind

	_doChanged: function (event) {
		var Z = this.jslet;
		if(Z.el.multiple) {
			if(Z.inProcessing) {
				Z.inProcessing = false;
			}
			var fldObj = Z._dataset.getField(Z._field),
				limitCount = fldObj.valueCountLimit();
			if(limitCount) {
				var values = Z.getValue(),
					count = 1;
				if(jslet.isArray(values)) {
					count = values.length;
				}
				if (count >= limitCount) {
					jslet.showInfo(jslet.formatMessage(jslet.locale.DBCheckBoxGroup.invalidCheckedCount,
							[''	+ limitCount]));
					
					window.setTimeout(function(){
						if(Z._currOption) {
							Z.inProcessing = true;
							Z._currOption.selected = false;
						}
					}, 10);
					return;
				}
			}
		}
		this.jslet.updateToDataset();
	},
		
	renderOptions: function () {
		var Z = this,
			arrhtm = [];
		
		var fldObj = Z._dataset.getField(Z._field);
		if (!fldObj.required()){
			arrhtm.push('<option value="_null_">');
			arrhtm.push(fldObj.nullText());
			arrhtm.push('</option>');
		}

		for (var i = Z._beginItem; i <= Z._endItem; i += Z._step) {
			arrhtm.push('<option value="');
			arrhtm.push(i);
			arrhtm.push('">');
			arrhtm.push(i);
			arrhtm.push('</option>');
		}
		jQuery(Z.el).html(arrhtm.join(''));
	}, // end renderOptions

	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName){
		$super(metaName);
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if(!metaName || metaName == "disabled" || metaName == "readOnly") {
			var disabled = fldObj.disabled() || fldObj.readOnly();
			Z.el.disabled = disabled;
			jslet.ui.setEditableStyle(Z.el, disabled, disabled, true, fldObj.required());
		}
		if(!metaName || metaName == 'tabIndex') {
			Z.setTabIndex();
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

		if (!Z.el.multiple) {
			var value = Z.getValue();
			if (value !== null) {
				Z.el.value = value;
			} else {
				Z.el.value = null;
			}
		} else {
			var arrValue = Z.getValue(),
				optCnt = Z.el.options.length, opt, selected, i;
			Z._keep_silence_ = true;
			try {
				for (i = 0; i < optCnt; i++) {
					opt = Z.el.options[i];
					if (opt) {
						opt.selected = false;
					}
				}

				var j, vcnt = arrValue.length - 1;
				for (i = 0; i < optCnt; i++) {
					opt = Z.el.options[i];
					for (j = vcnt; j >= 0; j--) {
						selected = (arrValue[j] == opt.value);
						if (selected) {
							opt.selected = selected;
						}
					} // end for j
				} // end for i
			} finally {
				Z._keep_silence_ = false;
			}
		}
	},
	
	focus: function() {
		this.el.focus();
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		this.renderOptions();
		this.refreshControl(jslet.data.RefreshEvent.updateAllEvent(), true);
	},

	updateToDataset: function () {
		var Z = this;
		if (Z._keep_silence_) {
			return;
		}
		var value,
			isMulti = Z.el.multiple;
		if (!isMulti) {
			value = Z.el.value;
			var fldObj = Z._dataset.getField(Z._field);
			if (value == '_null_' && !fldObj.required()) {
				value = null;
			}
		} else {
			var opts = jQuery(Z.el).find('option'),
				optCnt = opts.length - 1, opt;
			value = [];
			for (var i = 0; i <= optCnt; i++) {
				opt = opts[i];
				if (opt.selected) {
					value.push(opt.value);
				}
			}
		}
		Z._keep_silence_ = true;
		try {
			if (!isMulti) {
				Z._dataset.setFieldValue(Z._field, value, Z._valueIndex);
			} else {
				Z._dataset.setFieldValue(Z._field, value);
			}
		} finally {
			Z._keep_silence_ = false;
		}
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		jQuery(this.el).off();
		$super();
	}
});

jslet.ui.register('DBRangeSelect', jslet.ui.DBRangeSelect);
jslet.ui.DBRangeSelect.htmlTemplate = '<select></select>';
