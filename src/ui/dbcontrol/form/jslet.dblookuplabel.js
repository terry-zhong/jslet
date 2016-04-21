/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBLookupLabel. 
 * Display field value according to another field and its value.
 * Example:
 * <pre><code>
 * 		var jsletParam = {type:"DBLookupLabel",dataset:"department",lookupField:"deptcode", lookupValue: '0101', returnField: 'name'};
 * 
 * //1. Declaring:
 *	  &lt;label data-jslet='{type:"DBLookupLabel",dataset:"department",lookupField:"deptcode", lookupValue: "0101", returnField: "name"}' />
 *	  or
 *	  &lt;label data-jslet='jsletParam' />
 *	  
 *  //2. Binding
 *	  &lt;label id="ctrlId"  />
 *  	//Js snippet
 * 		var el = document.getElementById('ctrlId');
 *  	jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *  	jslet.ui.createControl(jsletParam, document.body);
 *  	
 * </code></pre>
 */
"use strict";
jslet.ui.DBLookupLabel = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,lookupField,returnField,lookupValue';
		Z.requiredProperties = 'lookupValue,lookupField,returnField';

		/**
		 * {String} Lookup field name.
		 */
		Z.lookupField = null;
		/**
		 * {String} Lookup field value.
		 */
		Z.lookupValue = null;
		/**
		 * {String} Return field name.
		 */
		Z.returnField = null;
		
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
		return el.tagName.toLowerCase() == 'label';
	},

	/**
	 * @override
	 */
	refreshControl: function (evt, isForce) {
		if (evt.eventType != jslet.data.RefreshEvent.UPDATEALL) {
			return;
		}
		if (!isForce) {
			return;
		}
		var Z = this;
		var result = Z.dataset.lookup(Z.lookupField, Z.lookupValue,
				Z.returnField);
		if (result === null) {
			result = 'NOT found: ' + Z.lookupValue;
		}
		Z.el.innerHTML = result;
	},

	/**
	 * @override
	 */
	renderAll: function () {
		this.refreshControl(jslet.data.RefreshEvent.updateAllEvent, true);
	},
	
	/**
	 * @override
	 */
	canFocus: function() {
		return false;
	}
});
jslet.ui.register('DBLookupLabel', jslet.ui.DBLookupLabel);
jslet.ui.DBLookupLabel.htmlTemplate = '<label></label>';

