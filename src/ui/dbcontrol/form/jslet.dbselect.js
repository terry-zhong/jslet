﻿/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBSelect. Example:
 * <pre><code>
 * var jsletParam = {type:"DBSelect",dataset:"employee",field:"department"};
 * 
 * //1. Declaring:
 * &lt;select data-jslet='type:"DBSelect",dataset:"employee",field:"department"' />
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
jslet.ui.DBSelect = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'dataset,field,groupField,lookupDataset';
		/**
		 * {String} Group field name, you can use this to group options.
		 * Detail to see html optgroup element.
		 */
		Z._groupField = null;
		
		/**
		 * {String or jslet.data.Dataset} It will use this dataset to render Select Options.
		 */
		Z._lookupDataset = null;
		
		$super(el, params);
	},

	groupField: function(groupField) {
		if(groupField === undefined) {
			return this._groupField;
		}
		groupField = jQuery.trim(groupField);
		jslet.Checker.test('DBSelect.groupField', groupField).isString();
		this._groupField = groupField;
	},
	
	lookupDataset: function(lookupDataset) {
		if(lookupDataset === undefined) {
			return this._lookupDataset;
		}

		if (jslet.isString(lookupDataset)) {
			lookupDataset = jslet.data.dataModule.get(jQuery.trim(lookupDataset));
		}
		
		jslet.Checker.test('DBSelect.lookupDataset', lookupDataset).isClass(jslet.data.Dataset.className);
		this._lookupDataset = lookupDataset;
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

		jQuery(Z.el).on('change', Z._doChanged);
		if(Z.el.multiple) {
			jQuery(Z.el).on('click', 'option', Z._doCheckLimitCount);
		}
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
				var values = Z._dataset.getFieldValue(Z._field),
					count = 1;
				if(jslet.isArray(values)) {
					count = values.length;
				}
				if (count >= limitCount) {
					jslet.showException(jslet.formatString(jslet.locale.DBCheckBoxGroup.invalidCheckedCount,
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
	
	_doCheckLimitCount: function(event) {
		var Z = event.delegateTarget.jslet;
		Z._currOption = this;
	},
	
	/**
	 * @override
	 */
	doLookupChanged: function () {
		var Z = this,
			fldObj = Z._dataset.getField(Z._field),
			lkf = fldObj.lookup();
		if(Z._lookupDataset) {
			lkf = new jslet.data.FieldLookup();
			lkf.dataset(Z._lookupDataset);
		} else {
			if (!lkf) {
				return;
			}
		}
		var lkds = lkf.dataset(),
			oldRecno = lkds.recno(),
			groupIsLookup = false,
			groupLookup, groupFldObj, extraIndex;

		try {
			if (Z._groupField) {
				groupFldObj = lkds.getField(Z._groupField);
				if (groupFldObj === null) {
					throw 'NOT found field: ' + Z._groupField + ' in ' + lkds.name();
				}
				groupLookup = groupFldObj.lookup();
				groupIsLookup = (groupLookup !== null);
				if (groupIsLookup) {
					extraIndex = Z._groupField + '.' + groupLookup.codeField();
				} else {
					extraIndex = Z._groupField;
				}
				var indfld = lkds.indexFields();
				if (indfld) {
					lkds.indexFields(extraIndex + ';' + indfld);
				} else {
					lkds.indexFields(extraIndex);
				}
			}
			var preGroupValue, groupValue, groupDisplayValue, content = [];

			if (!Z.el.multiple && !fldObj.required() && fldObj.nullText()){
				content.push('<option value="_null_">');
				content.push(fldObj.nullText());
				content.push('</option>');
			}
			for (var i = 0, cnt = lkds.recordCount(); i < cnt; i++) {
				lkds.innerSetRecno(i);
				if (Z._groupField) {
					groupValue = lkds.getFieldValue(Z._groupField);
					if (groupValue != preGroupValue) {

						if (preGroupValue !== null) {
							content.push('</optgroup>');
						}
						if (groupIsLookup) {
							if (!groupLookup.dataset()
											.findByField(
													groupLookup
															.keyField(),
													groupValue)) {
								throw 'Not found: [' + groupValue + '] in Dataset: [' +
									groupLookup.dataset().name() +
									']field: [' + groupLookup.keyField() + ']';
							}
							groupDisplayValue = groupLookup.getCurrentDisplayValue();
						} else
							groupDisplayValue = groupValue;

						content.push('<optgroup label="');
						content.push(groupDisplayValue);
						content.push('">');
						preGroupValue = groupValue;
					}
				}
				content.push('<option value="');
				content.push(lkds.getFieldValue(lkf.keyField()));
				content.push('">');
				content.push(lkf.getCurrentDisplayValue());
				content.push('</option>');
			} // end while
			if (preGroupValue !== null) {
				content.push('</optgroup>');
			}
			jQuery(Z.el).html(content.join(''));
		} finally {
			lkds.innerSetRecno(oldRecno);
		}
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
			jslet.ui.setEditableStyle(Z.el, disabled, disabled, true);
		}
		if(metaName == 'message') {
			Z.renderInvalid();
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
		var fldObj = Z._dataset.getField(Z._field);
		if(fldObj.message(Z._valueIndex)) { 
			return;
		}
		try {
			var optCnt = Z.el.options.length, 
				opt, i;
			for (i = 0; i < optCnt; i++) {
				opt = Z.el.options[i];
				if (opt) {
					opt.selected = false;
				}
			}
			
			if (!Z.el.multiple) {
				var value = Z._dataset.getFieldValue(Z._field, Z._valueIndex);
				if (value === null){
					if (!fldObj.required() && fldObj.nullText()) {
						value = '_null_';
					}
				}
				Z.el.value = value;
			} else {
				var arrValue = Z._dataset.getFieldValue(Z._field);
				if(arrValue === null || arrValue.length === 0) {
					return;
				}
					
				var vcnt = arrValue.length - 1, selected;
				Z._keep_silence_ = true;
				try {
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
		} catch (e) {
			jslet.showException(e);
		}
	},
 
	focus: function() {
		this.el.focus();
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		this.refreshControl(jslet.data.RefreshEvent.updateAllEvent(), true);
	}, // end renderAll

	updateToDataset: function () {
		var Z = this;
		if (Z._keep_silence_) {
			return;
		}
		var opt, value,
			isMulti = Z.el.multiple;
		if (!isMulti) {
			value = Z.el.value;
			if (!value) {
				opt = Z.el.options[Z.el.selectedIndex];
				value = opt.innerHTML;
			}
		} else {
			var opts = jQuery(Z.el).find('option'),
				optCnt = opts.length - 1;
			value = [];
			for (var i = 0; i <= optCnt; i++) {
				opt = opts[i];
				if (opt.selected) {
					value.push(opt.value ? opt.value : opt.innerHTML);
				}
			}
		}

		Z._keep_silence_ = true;
		try {
			if (!isMulti) {
				var fldObj = Z._dataset.getField(Z._field);
				if (value == '_null_' && !fldObj.required() && fldObj.nullText()) {
					value = null;
				}
				Z._dataset.setFieldValue(Z._field, value, Z._valueIndex);
			} else {
				Z._dataset.setFieldValue(Z._field, value);
			}
		} catch (e) {
			jslet.showException(e);
		} finally {
			Z._keep_silence_ = false;
		}
	}, // end updateToDataset
	
	/**
	 * @override
	 */
	destroy: function($super){
		this._currOption = null;
		jQuery(this.el).off();
		$super();
	}
});

jslet.ui.register('DBSelect', jslet.ui.DBSelect);
jslet.ui.DBSelect.htmlTemplate = '<select></select>';