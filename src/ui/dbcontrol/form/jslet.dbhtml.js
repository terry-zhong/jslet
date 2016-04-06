/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBHtml. 
 * Display html text from one field. 
 * Example:
 * <pre><code>
 * var jsletParam = {type:"DBHtml",dataset:"employee",field:"comment"};
 * 
 * //1. Declaring:
 * &lt;div data-jslet='type:"DBHtml",dataset:"employee",field:"comment"' />
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
jslet.ui.DBHtml = jslet.Class.create(jslet.ui.DBFieldControl, {
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
		jQuery(this.el).addClass('form-control');
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
	doValueChanged: function() {
		var content = this.getText();
		this.el.innerHTML = content;
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

jslet.ui.register('DBHtml', jslet.ui.DBHtml);
jslet.ui.DBHtml.htmlTemplate = '<div style="width:200px;height:200px"></div>';
