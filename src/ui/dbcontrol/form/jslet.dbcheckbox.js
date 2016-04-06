/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
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
"use strict";
jslet.ui.DBCheckBox = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.isCheckBox = true;
		Z.allProperties = 'styleClass,dataset,field,beforeClick';
		Z._beforeClick = null;
		
		Z._skipRefresh = false;
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
		var jqEl = jQuery(Z.el);
		if(!jqEl.hasClass('jl-dbcheck')) {
			jqEl.addClass('jl-dbcheck');
		}
		jqEl.on('click', Z._doClick);
		jqEl.focus(function(event) {
			jslet.ui.focusManager.activeDataset(Z._dataset.name()).activeField(Z._field).activeValueIndex(Z._valueIndex);
		});
		jqEl.blur(function(event) {
			jslet.ui.focusManager.activeDataset(null).activeField(null).activeValueIndex(null);
		});
		jqEl.addClass('checkbox-inline');
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
			var disabled = fldObj.disabled() || fldObj.readOnly();
			jslet.ui.setEditableStyle(Z.el, disabled, disabled, false, fldObj.required());
			Z.setTabIndex();
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
		if(Z._skipRefresh) {
			return;
		}
		var fldObj = Z._dataset.getField(Z._field),
			value = Z.getValue();
		if (value) {
			Z.el.checked = true;
		} else {
			Z.el.checked = false;
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
		var fldObj = Z._dataset.getField(Z._field),
			value = Z.el.checked;
		Z._keep_silence_ = true;
		try {
			Z._dataset.setFieldValue(Z._field, value, Z._valueIndex);
		} finally {
			Z._keep_silence_ = false;
		}
	}, // end updateToDataset
	
	/**
	 * @override
	 */
	destroy: function($super){
		jQuery(this.el).off();
		$super();
	}
});

jslet.ui.register('DBCheckBox', jslet.ui.DBCheckBox);
jslet.ui.DBCheckBox.htmlTemplate = '<input type="checkbox"></input>';

