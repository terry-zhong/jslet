/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBCheckBox. 
 * Example:
 * <pre><code>
 * var jsletParam = {type:"DBCheckBox", dataset:"employee", field:"married"};
 * 
 * //1. Declaring:
 * &lt;input type='checkbox' data-jslet='type:"DBCheckBox",dataset:"employee", field:"married"' />
 * or
 * &lt;div data-jslet='jsletParam' />
 *
 *  //2. Binding
 * &lt;input id="ctrlId" type="checkbox" />
 * //Js snippet
 * var el = document.getElementById('ctrlId');
 * jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 * jslet.ui.createControl(jsletParam, document.body);
 * 
 * </code></pre>
 */

/**
* DBCheckBox
*/
jslet.ui.DBCheckBox = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.isCheckBox = true;
		Z.allProperties = 'dataset,field,beforeClick';
		Z._beforeClick = null;
		$super(el, params);
	},

	beforeClick: function(beforeClick) {
		if(beforeClick === undefined) {
			return this._beforeClick;
		}
		jslet.Checker.test('DBCheckBox.beforeClick', beforeClick).isFunction();
		this._beforeClick = beforeClick;
	},

	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return el.tagName.toLowerCase() == 'input' &&
			el.type.toLowerCase() == 'checkbox';
	},

	/**
	 * @override
	 */
	bind: function () {
		var Z = this;

		Z.renderAll();
		jQuery(Z.el).on('click', Z._doClick);
	}, // end bind

	_doClick: function (event) {
		var Z = this.jslet;
		if (Z._beforeClick) {
			var result = Z._beforeClick.call(Z, Z.el);
			if (!result) {
				return;
			}
		}
		Z.updateToDataset();
	},
	
	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName){
		$super(metaName);
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if(!metaName || metaName == "disabled" || metaName == "readOnly") {
			jslet.ui.setEditableStyle(Z.el, fldObj.disabled(), fldObj.readOnly());
		}
	},
	
	/**
	 * @override
	 */
	doValueChanged: function() {
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		try {
			var value = Z._dataset.getFieldValue(Z._field, Z._valueIndex);
			if (value !== null && value == fldObj.trueValue) {
				Z.el.checked = true;
			} else {
				Z.el.checked = false;
			}
		} catch (e) {
			jslet.showException(e);
		} // end try
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
		var fldObj = Z._dataset.getField(Z._field),
			value;
		if (Z.el.checked) {
			value = fldObj.trueValue;
		} else {
			value = fldObj.falseValue;
		}
		Z._keep_silence_ = true;
		try {
			Z._dataset.setFieldValue(Z._field, value, Z._valueIndex);
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
		jQuery(this.el).off();
	}
});

jslet.ui.register('DBCheckBox', jslet.ui.DBCheckBox);
jslet.ui.DBCheckBox.htmlTemplate = '<input type="checkbox"></input>';

