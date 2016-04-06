/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBPlace. 
 * It's an placeholder for other dbcontrols.
 * Example:
 * <pre><code>
 * var jsletParam = {type:"DBPlace",dataset: "dataset", "field":"fieldName"};
 *
 * //1. Declaring:
 *  &lt;div data-jslet='jsletParam' />
 *
 *  //2. Binding
 *  &lt;div id="ctrlId"  />
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
jslet.ui.DBPlace = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		this.allProperties = 'styleClass,dataset,field,expandChildWidth';
		this.editControl = null;
		this._expandChildWidth = true;
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
		var Z = this;
		Z.renderAll();
	},
	
	expandChildWidth: function(expandChildWidth) {
		if(expandChildWidth === undefined) {
			return this._expandChildWidth;
		}
		this._expandChildWidth? true: false;
	},
	
	/**
	 * @override
	 */
	refreshControl: function (evt) {
		var Z = this,
			evtType = evt.eventType;
		// Meta changed 
		if (evtType == jslet.data.RefreshEvent.CHANGEMETA &&
			Z._field == evt.fieldName && 
			(evt.metaName == 'editControl' || evt.metaName == 'valueStyle')) {
			Z.renderAll();
			return true;
		}
	}, // end refreshControl

	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this;
		Z.removeAllChildControls();
		var	fldObj = Z._dataset.getField(Z._field),
			param = fldObj.editControl();
		if (fldObj.valueStyle() == jslet.data.FieldValueStyle.BETWEEN) {
			param = {
				type: 'DBBetweenEdit'
			};
		}
		param.dataset = Z._dataset;
		param.field = Z._field;
		if(Z._tabIndex || Z._tabIndex === 0) {
			param.tabIndex = Z._tabIndex;
		}
		var dbCtrl = jslet.ui.createControl(param, Z.el);
		if(!Z._expandChildWidth) {
			dbCtrl.el.style.width = '100%';
		}
		Z.addChildControl(dbCtrl);
		dbCtrl.tableId(Z._tableId);
	},
	
	/**
	 * @override
	 */
	canFocus: function() {
		return false;
	}
});

jslet.ui.register('DBPlace', jslet.ui.DBPlace);
jslet.ui.DBPlace.htmlTemplate = '<div></div>';
