﻿/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBError. 
 * Display dataset error.
 * 
 * Example:
 * <pre><code>
 *  var jsletParam = {type:"DBError",dataset:"employee"};
 *  
 * //1. Declaring:
 *  &lt;div data-jslet='type:"DBError",dataset:"employee"' />
 *  or
 *  &lt;div data-jslet='jsletParam' />
 *  
 *  //2. Binding
 *  &lt;div id="ctrlId"  />
 *  //Js snippet
 *  var el = document.getElementById('ctrlId');
 *  jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *  jslet.ui.createControl(jsletParam, document.body);
 *  
 * </code></pre>
 */
"use strict";
jslet.ui.DBError = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		this.allProperties = 'styleClass,dataset';
		$super(el, params);
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
		var Z = this,
			jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-errorpanel')) {
			jqEl.addClass('jl-errorpanel');
		}

		Z.renderAll();
	},

	/**
	 * @override
	 */
	refreshControl: function (evt) {
		if (evt && evt.eventType == jslet.data.RefreshEvent.ERROR) {
			this.el.innerHTML = evt.message || '';
		}
	}, // end refreshControl

	/**
	 * @override
	 */
	renderAll: function () {
		this.refreshControl();
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this;
				
		$super();
	}

});

jslet.ui.register('DBError', jslet.ui.DBError);
jslet.ui.DBError.htmlTemplate = '<div></div>';
