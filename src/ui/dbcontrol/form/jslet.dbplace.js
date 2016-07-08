/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */
"use strict";

jslet.ui.FieldControlAddon = {
	/**
	 * {String} Field name if the addon is another field, like: 'currency' 
	 */
	field: null,
	/**
	 * {String} Fixed content if the addon is the fixed content, like: 'kg'
	 */
	content: null,
	
	/**
	 * {String} The addon width.
	 */
	width: '10px'
};

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
jslet.ui.DBPlace = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		this.allProperties = 'styleClass,dataset,field,prefix,suffix,expandChildWidth';
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
	 * Prefix of this control. pattern:
	 * prefix([{field: '', content: '', width: 30}]);
	 * 
	 * @param {jslet.ui.FieldControlAddon[] or undefined} prefix - The prefix settings. 
	 */
	prefix: function(prefix) {
		if(prefix === undefined) {
			return this._prefix;
		}
		
		jslet.Checker.test('DBPlace#prefix', prefix).isArray();
		var setting;
		for(var i = 0, len = prefix.length; i < len; i++) {
			setting = prefix[i];
			if(!setting.field && !setting.content) {
				throw new Error('In DBPlace#prefix setting, one of property "field" or "content" is required!');
			}
		}
		if(prefix && prefix.length === 0) {
			prefix = null;
		}
		this._prefix = prefix; 
	},
	
	
	/**
	 * Suffix of this control. pattern:
	 * suffix([{field: '', content: '', width: 30}]);
	 * 
	 * @param {jslet.ui.FieldControlAddon[] or undefined} suffix - The suffix settings. 
	 */
	suffix: function(suffix) {
		if(suffix === undefined) {
			return this._suffix;
		}
		
		jslet.Checker.test('DBPlace#suffix', suffix).isArray();
		jslet.Checker.test('DBPlace#suffix', suffix).isArray();
		var setting;
		for(var i = 0, len = suffix.length; i < len; i++) {
			setting = suffix[i];
			if(!setting.field && !setting.content) {
				throw new Error('In DBPlace#suffix setting, one of property "field" or "content" is required!');
			}
		}
		if(suffix && suffix.length === 0) {
			suffix = null;
		}
		this._suffix = suffix; 
	},
	
	expandChildWidth: function(expandChildWidth) {
		if(expandChildWidth === undefined) {
			return this._expandChildWidth;
		}
		this._expandChildWidth = expandChildWidth? true: false;
		return this;
	},
	
	/**
	 * @override
	 */
	bind: function () {
		var Z = this;
		Z.renderAll();
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
		
		var fldName, i, len,
			hasAddon = Z._prefix || Z._suffix;
		if(!hasAddon) {
			Z._renderEditor(Z._field, Z.el);
			return;
		}
		
		jQuery(Z.el).addClass('jl-comb-editor');
		if(Z._prefix) {
			Z._renderOtherPart(Z.el, Z._prefix);
		}
		var editorEl = Z._renderEditor(Z._field, Z.el);
		jQuery(editorEl).addClass('jl-comb-master');
		
		if(Z._suffix) {
			Z._renderOtherPart(Z.el, Z._suffix);
		}		
	},
	
	_renderEditor: function(fldName, parentEl) {
		var Z = this,
			fldObj = Z._dataset.getField(fldName),
			param = fldObj.editControl();
		if (fldObj.valueStyle() == jslet.data.FieldValueStyle.BETWEEN) {
			param = {
				type: 'DBBetweenEdit'
			};
		}
		param.dataset = Z._dataset;
		param.field = fldName;
		if(Z._tabIndex || Z._tabIndex === 0) {
			param.tabIndex = Z._tabIndex;
		}
		var dbCtrl = jslet.ui.createControl(param, parentEl);
		Z.addChildControl(dbCtrl);
		dbCtrl.tableId(Z._tableId);
		var elId = jslet.nextId();
		dbCtrl.el.id = elId;
		return dbCtrl.el;
	},
	
	_renderOtherPart: function(ctrlDiv, arrPrefixOrSuffix) {
		var fixCfg, editorEl, width, partEl, 
			jqCtrlDiv = jQuery(ctrlDiv);
		for(var i = 0, len = arrPrefixOrSuffix.length; i < len; i++) {
			fixCfg = arrPrefixOrSuffix[i];
			width = fixCfg.width;
			var id = jslet.nextId();
			jqCtrlDiv.append('<span id = "' + id + '"></span>');
			partEl = document.getElementById(id);
			if(fixCfg.field) {
				 this._renderEditor(fixCfg.field, partEl);
			} else if(fixCfg.content) {
				partEl.innerHTML = fixCfg.content;
			} else {
				console.warn('prefix or suffix: field or content is required!');
				continue;
			}
			if(!width) {
				console.warn('Width is empty, use 5% instead!');
				width = '5%';
			}
			jQuery(partEl).addClass('jl-comb-addon');
			
			partEl.style.width = width;
		}
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
