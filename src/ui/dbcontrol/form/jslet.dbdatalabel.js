﻿/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBDataLabel. 
 * Show field value in a html label. 
 * Example:
 * <pre><code>
 * var jsletParam = {type:"DBDataLabel",dataset:"employee",field:"department"};
 * 
 * //1. Declaring:
 * &lt;label data-jslet='type:"DBDataLabel",dataset:"employee",field:"department"' />
 * or
 * &lt;label data-jslet='jsletParam' />
 *
 *  //2. Binding
 * &lt;label id="ctrlId"  />
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
jslet.ui.DBDataLabel = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		this.allProperties = 'styleClass,dataset,field';
		
		$super(el, params);
	},

	/**
	 * @override
	 */
	bind: function () {
		this.renderAll();
		jQuery(this.el).addClass('form-control-static jl-datalabel jl-lbl-normal');//Bootstrap class
	},

	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return el.tagName.toLowerCase() == 'label';
	},

	doValueChanged: function() {
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		var text = Z.getText();
		Z.el.innerHTML = text;
		Z.el.title = text;
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		this.refreshControl(jslet.data.RefreshEvent.updateAllEvent(), true);
	},
	
	/**
	 * @override
	 */
	canFocus: function() {
		return false;
	}
});

jslet.ui.register('DBDataLabel', jslet.ui.DBDataLabel);
jslet.ui.DBDataLabel.htmlTemplate = '<label></label>';

