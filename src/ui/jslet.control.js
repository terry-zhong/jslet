/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

"use strict";
if(!jslet.ui) {
	jslet.ui = {};
}

/**
* @class
* Control Class, base class for all control
*/
jslet.ui.Control = jslet.Class.create({
	/**
	 * Constructor method
	 * 
	 * @param {Html Element} el Html element
	 * @param {String or Object} ctrlParams Parameters of this control, 
	 * it would be a JSON string or plan object, like: '{prop1: value1, prop2: value2}';
	 */
	initialize: function (el, ctrlParams) {
		var Z = this;
		Z.el = el;

		Z.allProperties = null;
		ctrlParams = jslet.ui._evalParams(ctrlParams);
		if (Z.isValidTemplateTag	&& !Z.isValidTemplateTag(Z.el)) {
			var ctrlClass = jslet.ui.getControlClass(ctrlParams.type), template;
			if (ctrlClass) {
				template = ctrlClass.htmlTemplate;
			} else {
				template = '';
			}
			throw new Error(jslet.formatMessage(jslet.locale.DBControl.invalidHtmlTag, template));
		}
		Z._styleClass = null;
		
		Z.styleClass = function(styleClass) {
			if(styleClass === undefined) {
				return Z._styleClass;
			}
			Z._styleClass = styleClass;
		};
		
		Z._childControls = null;
		Z.setParams(ctrlParams);
		Z.checkRequiredProperty();
		Z.el.jslet = this;
		Z.beforeBind();
		if(!Z.el.id) {
			Z.el.id = jslet.nextId();
		}
		Z.bind();
		var jqEl = jQuery(Z.el);
		if(Z._styleClass) {
			jqEl.addClass(Z._styleClass);
		}
		Z.afterBind();
	},

	beforeBind: function() {
		
	},
	
	bind: function() {
		
	},
	
	afterBind: function() {
		
	},
	
	/**
	 * @protected
	 */
	setParams: function (ctrlParams) {
		if (!ctrlParams) {
			return;
		}
		var ctrlType = ctrlParams.type;
		this.styleClass(ctrlParams.styleClass);
		
		for(var name in ctrlParams) {
			var prop = this[name];
			if(name == 'type' || name == 'styleClass') {
				continue;
			}
			if(prop && prop.call) {
				prop.call(this, ctrlParams[name]);
			} else {
				throw new Error(ctrlType +  " NOT support control property: " + name);
			}
		}
	},

	/**
	 * @private
	 */
	checkRequiredProperty: function () {
		if (!this.requiredProperties) {
			return;
		}
		var arrProps = this.requiredProperties.split(','),
		cnt = arrProps.length, name;
		for (var i = 0; i < cnt; i++) {
			name = arrProps[i].trim();
			if (!this[name]) {
				throw new Error(jslet.formatMessage(jslet.locale.DBControl.expectedProperty, [name]));
			}
		}//end for
	},
	
	addChildControl: function(childCtrl) {
		var Z = this;
		if(!Z._childControls) {
			Z._childControls = [];
		}
		if(childCtrl) {
			Z._childControls.push(childCtrl);
		}
	},
	
	removeAllChildControls: function() {
		var Z = this, childCtrl;
        if(Z.el) {
            Z.el.innerHTML = '';
        }
		if(!Z._childControls) {
			return;
		}
		for(var i = 0, len = Z._childControls.length; i < len; i++) {
			childCtrl = Z._childControls[i];
			childCtrl.destroy();
		}
		Z._childControls = null;
	},
	
	/**
	 * Destroy method
	 */
	destroy: function(){
		if(this.el) {
			this.el.jslet = null;
			this.el = null;
		}
	}
});

/**
 * @class
 * Base data sensitive control
 */
jslet.ui.DBControl = jslet.Class.create(jslet.ui.Control, {
	
	initialize: function ($super, el, ctrlParams) {
		$super(el, ctrlParams);
	},

	_dataset: undefined,

	dataset: function(dataset) {
		if(dataset === undefined) {
			return this._dataset;
		}

		if (jslet.isString(dataset)) {
			dataset = jslet.data.dataModule.get(jQuery.trim(dataset));
		}
		
		jslet.Checker.test('DBControl.dataset', dataset).required().isClass(jslet.data.Dataset.className);
		this._dataset = dataset;
	},

	/**
	 * @protected
	 */
	setParams: function ($super, ctrlParams) {
		$super(ctrlParams);
		if(!this._dataset) {
			var dsName = this.getDatasetInParentElement();
			this.dataset(dsName);
		}
	},
	
	/**
	 * @override
	 * Call this method before binding parameters to a HTML element, you can rewrite this in your owner control
	 * @param {String or Object} ctrlParams Parameters of this control, it would be a json string or object, like: '{prop1: value1, prop2: value2}';
	 * 
	 */
	beforeBind: function ($super) {
		$super();
		this._dataset.addLinkedControl(this);
	},

	checkRequiredProperty: function($super) {
		jslet.Checker.test('DBControl.dataset', this._dataset).required();
		$super();
	},
	
	/**
	 * Refresh control when data changed.
	 * There are three type changes: meta changed, data changed, lookup data changed.
	 * 
	 * @param {jslet.data.refreshEvent} evt jslet refresh event object;
	 * 
	 * @return {Boolean} if refresh successfully, return true, otherwise false.
	 */
	refreshControl: function (evt) {
		var Z = this, evtType;
		if(evt) {
			evtType = evt.eventType;
		} else {
			evtType = jslet.data.RefreshEvent.UPDATEALL;
		}
		// Meta changed 
		if (evtType == jslet.data.RefreshEvent.CHANGEMETA) {
			var metaName = evt.metaName;
			if(Z._field && Z._field == evt.fieldName) {
				Z.doMetaChanged(metaName);
			} else {
				if(!Z._field && (metaName == 'visible' || metaName == 'editControl')) {
					Z.doMetaChanged(metaName);
				}
			}
			return true;
		}
		//Lookup data changed
		if(evtType == jslet.data.RefreshEvent.UPDATELOOKUP && evt.fieldName == Z._field) {
			Z.doLookupChanged(evt.isMetaChanged);
			return true;
		}

		//Value changed
		if (evtType == jslet.data.RefreshEvent.SCROLL || 
				evtType == jslet.data.RefreshEvent.INSERT ||
				evtType == jslet.data.RefreshEvent.DELETE) {
			Z.doValueChanged();
			return true;
		}
		if((evtType == jslet.data.RefreshEvent.UPDATERECORD ||
			evtType == jslet.data.RefreshEvent.UPDATECOLUMN) && 
			evt.fieldName === undefined || evt && evt.fieldName == Z._field){
			Z.doValueChanged();
			return true;
		}
		if(evtType == jslet.data.RefreshEvent.UPDATEALL) {
			Z.doMetaChanged();
			Z.doLookupChanged();
			Z.doValueChanged();
			return true;
		}
		
		return true;
	}, // end refreshControl
	
	/**
	 * 
	 */
	doMetaChanged: function(metaName){},
	
	doValueChanged: function() {},
	
	doLookupChanged: function() {},
	
	/**
	 * @private
	 */
	getDatasetInParentElement: function () {
		var el = this.el, pEl = null;
		while (true) {
			pEl = jslet.ui.getParentElement(el, 1);
			if (!pEl) {
				break;
			}
			if (pEl.jslet) {
				return pEl.jslet.dataset;
			}
			el = pEl;
		} //end while
		return null;
	},

	destroy: function ($super) {
		this.removeAllChildControls();
		if (this._dataset) {
			this._dataset.removeLinkedControl(this);
		}
		this._dataset = null;
		$super();
	}
});

/**
 * @class
 * Base data sensitive control
 */
jslet.ui.DBFieldControl = jslet.Class.create(jslet.ui.DBControl, {
	initialize: function ($super, el, ctrlParams) {
		$super(el, ctrlParams);
	},

	_field: undefined,
	
	_valueIndex: undefined,
	
	_enableInvalidTip: true,
	
	_tableId: null,
	
	_tabIndex: null,
	
	field: function(fldName) {
		if(fldName === undefined) {
			return this._field;
		}
		
		fldName = jQuery.trim(fldName);
		jslet.Checker.test('DBControl.field', fldName).isString().required();
		var k = fldName.lastIndexOf('#');
		if(k > 0) {
			this._fieldMeta = fldName.substring(k+1);
			fldName = fldName.substring(0, k);
		}
		
		this._field = fldName;
	},
	
	fieldMeta: function() {
		return this._fieldMeta;
	},
	
	valueIndex: function(valueIndex) {
		if(valueIndex === undefined) {
			return this._valueIndex;
		}
		jslet.Checker.test('DBControl.valueIndex', valueIndex).isNumber();
		
		this._valueIndex = parseInt(valueIndex);
	},
	
	tabIndex: function(tabIndex) {
		if(tabIndex === undefined) {
			return this._tabIndex;
		}
		jslet.Checker.test('DBControl.tabIndex', tabIndex).isNumber();
		this._tabIndex = tabIndex;
	},
	
	/**
	 * @override
	 */
	setParams: function ($super, ctrlParams) {
		$super(ctrlParams);
		var value = ctrlParams.valueIndex;
		if (value !== undefined) {
			this.valueIndex(value);
		}
		var tbIdx = ctrlParams.tabIndex;
		if(tbIdx !== undefined) {
			this.tabIndex(tbIdx);
		}
	},
 
	checkRequiredProperty: function($super) {
		$super();
		jslet.Checker.test('DBControl.field', this._field).required();
		this.existField(this._field);
	},

	doMetaChanged: function($super, metaName){
		$super(metaName);
		if(!metaName || metaName == 'tip') {
			var fldObj = this._dataset.getField(this._field);
			if(!fldObj) {
				throw new Error('Field: ' + this._field + ' NOT exist!');
			}
			var tip = fldObj.tip();
			tip = tip ? tip: '';
			this.el.title = tip;
		}
	},
	
	setTabIndex: function() {
		var Z = this,
			tabIdx = Z._tabIndex;
		if(tabIdx !== 0 && !tabIdx) {
			var fldObj = Z._dataset.getField(Z._field);
			if(fldObj) {
				tabIdx = fldObj.tabIndex();
			}
		}
		if(tabIdx === 0 || tabIdx) {
			Z.el.tabIndex = tabIdx;
		}
	},
	
	existField: function(fldName) {
		var fldObj = this._dataset.getField(fldName);
		return fldObj ? true: false;
	},
	
	tableId: function(tableId) {
		if(tableId === undefined) {
			return this._tableId;
		}
		this._tableId = tableId;
	},
	
	getValue: function() {
		return this._dataset.getFieldValue(this._field, this._valueIndex); 
	},
	
	getText: function(isEditing) {
		return this._dataset.getFieldText(this._field, isEditing, this._valueIndex); 
	},
	
	getFieldError: function() {
		return this._dataset.getFieldError(this._field, this._valueIndex);
	},
	
	/**
	 * @protected
	 * Render invalid message and change the control to "invalid" style.
	 * 
	 *  @param {String} errObj error object: {code: xxx, message}, if it's null, clear the 'invalid' style. 
	 */
	renderInvalid: function (errObj) {
		var Z = this;
		if (!Z._field) {
			return;
		}
		if (errObj){
			jQuery(Z.el).parent().addClass('has-error');
			Z.el.title = errObj.message || '';
		} else {
			jQuery(Z.el).parent().removeClass('has-error');
			Z.el.title = '';
		}
	},
 
	/**
	 * @protected
	 * Identify this control can be focused or not.  
	 */
	canFocus: function() {
		return true;
	},
	
	/**
	 * Focus to this control.
	 */
	focus: function() {
		var Z = this;
		if(!Z.canFocus()) {
			return;
		}
		var	fldObj = Z._dataset.getField(Z._field),
			flag = !fldObj || fldObj.disabled() || fldObj.readOnly() || !fldObj.visible();
		if(flag) {
			return;
		}
		if(Z._tableId) {
			jslet('#' + Z._tableId).gotoField(Z._field);
		}
		this.innerFocus();
	},
	
	/**
	 * @protected.
	 */
	innerFocus: function() {
		var Z = this,
			el = Z.el;
		if (el.focus) {
			try {
				el.focus();
				if(Z.selectText) {
					Z.selectText();
				}
				return;
			} catch (e) {
				//Can\'t focus on this control, maybe it\'s disabled!
				console.warn(jslet.locale.Dataset.cannotFocusControl);
			}
		}
	},
	
	/**
	 * @override
	 */
	destroy: function ($super) {
		$super();
		this._field = null;
	}
	
});

/**
* @private
* Convert string parameters to object
* 
* @param {String or Object} ctrlParams Control parameters.
* @return {Object}
*/
jslet.ui._evalParams = function (ctrlParams) {
	jslet.Checker.test('evalParams#ctrlParams', ctrlParams).required();
	if (jslet.isString(ctrlParams)) {
		var p = jQuery.trim(ctrlParams);
		if (!p.startsWith('{') && p.indexOf(':')>0) {
			p = '{' + p +'}';
		}
		try {
			/* jshint ignore:start */
			ctrlParams = new Function('return ' + p)();
			/* jshint ignore:end */
			if(ctrlParams['var']) {
				ctrlParams = ctrlParams['var'];
			}
			return ctrlParams;
		} catch (e) {
			throw new Error(jslet.formatMessage(jslet.locale.DBControl.invalidJsletProp, [ctrlParams]));
		}
	}
	return ctrlParams;
};

/**
* Hold all jslet control's configurations
*/
jslet.ui.controls = new jslet.SimpleMap();

/**
* Register jslet control class.
* <pre><code>
* jslet.ui.register('Accordion', jslet.ui.Accordion);
* </code></pre>
* 
* @param {String} ctrlName Control name.
* @param {jslet.Class} ctrlType Control Class
*/
jslet.ui.register = function (ctrlName, ctrlType) {
	jslet.ui.controls.set(ctrlName.toLowerCase(), ctrlType);
};

/**
* Create jslet control according to control configuration, and add it to parent element.
* 
* @param {String or Object} jsletparam Jslet Parameter
* @param {Html Element} parent Parent html element which created control will be added to.
* @param {Integer} width Control width, unit: px;
* @param {Integer} height Control height, Unit: px; 
* @param {Boolean} hidden Hide control or not;
*  
* @return {jslet control}
*/
jslet.ui.createControl = function (jsletparam, parent, width, height, hidden) {
	var isAuto = false, 
		pnode = parent,
		container = document.createElement('div'),
		ctrlParam = jslet.ui._evalParams(jsletparam),
		controlType = ctrlParam.type;
	if (!controlType) {
		controlType = jslet.ui.controls.DBTEXT;
	}
	var ctrlClass = jslet.ui.controls.get(controlType.toLowerCase());
	if (!ctrlClass) {
		throw new Error('NOT found control type: ' + controlType);
	}
	container.innerHTML = ctrlClass.htmlTemplate;

	var el = container.firstChild;
	container.removeChild(el);
	if(hidden) {
		el.style.display = 'none';
	}	
	if (parent) {
		parent.appendChild(el);
	} else {
		document.body.appendChild(el);
	}
	if (width) {
		if (parseInt(width) == width)
			width = width + 'px';
		el.style.width = width;
	}
	if (height) {
		if (parseInt(height) == height)
			height = height + 'px';
		el.style.height = height;
	}

	return new ctrlClass(el, ctrlParam);
};

/**
 * Get jslet class with class name.
 * 
 * @param {String} name Class name.
 * @return {jslet.Class}
 */
jslet.ui.getControlClass = function (name) {
	return jslet.ui.controls.get(name.toLowerCase());
};

/**
* Bind jslet control to an existing html element.
* 
* @param {Html Element} el Html element
* @param {String or Object} jsletparam Control parameters
*/
jslet.ui.bindControl = function (el, jsletparam) {
	if (!jsletparam)
		jsletparam = jQuery(el).attr('data-jslet');
	if(el.jslet) {
		console.warn('Control has installed! Don\'t install it again!');
		return;
	}
	var ctrlParam = jslet.ui._evalParams(jsletparam);
	var controlType = ctrlParam.type;
	if (!controlType) {
		el.jslet = ctrlParam;
		return;
	}
	var ctrlClass = jslet.ui.controls.get(controlType.toLowerCase());
	if (!ctrlClass) {
		throw new Error('NOT found control type: ' + controlType);
	}
	new ctrlClass(el, ctrlParam);
};

/**
* Unbind jslet control and clear jslet property.
* 
* @param {Html Element} el Html element
*/
jslet.ui.unbindControl = function(el) {
	if (el.jslet && el.jslet.destroy) {
		el.jslet.destroy();
	}
	el.jslet = null;
};

/**
* re-bind jslet control.
* 
* @param {Html Element} el Html element
*/
jslet.ui.rebindControl = function(el) {
	jslet.ui.unbindControl(el);
	jslet.ui.bindControl(el);
};

/**
* Scan the specified html element children and bind jslet control to these html element with 'data-jslet' attribute.
* 
* @param {Html Element} pElement Parent html element which need to be scan, if null, document.body used.
* @param {Function} onJsletReady Call back function after jslet installed.
*/
jslet.ui.install = function (pElement, onJsletReady) {
	if(pElement && (onJsletReady === undefined)) {
		//Match case: jslet.ui.install(onJsletReady);
		if(jQuery.isFunction(pElement)) {
			onJsletReady = pElement;
			pElement = null;
		}
	}
	
	if(!pElement && jslet.locale.isRtl){
		var jqBody = jQuery(document.body);
		if(!jqBody.hasClass('jl-rtl')) {
			jqBody.addClass('jl-rtl');
		}
	}
	var htmlTags;
	if (!pElement){
		pElement = document.body;
	}
	htmlTags = jQuery(pElement).find('*[data-jslet]');

	var cnt = htmlTags.length, el, id, 
		existIds = jslet.existIds;
	if(!existIds) {
		existIds = {};
		jslet.existIds = existIds;
	}
	for (var i = 0; i < cnt; i++) {
		el = htmlTags[i];
		id = el.id;
		if(id) {
			if(existIds[id]) {
				console.warn(jslet.formatMessage(jslet.locale.Control.duplicatedId, [id]));
			} else {
				existIds[id] = 1;
			}
		}
		jslet.ui.bindControl(el);
	}
	if(onJsletReady){
		onJsletReady();
		//jslet.ui.onReady();
	}
	if(jslet.global.afterInstall) {
		jslet.global.afterInstall(pElement);
	}
};

///**
// * {Event} Fired after jslet has installed all controls.
// * Pattern: function(){};
// */
//jslet.ui.onReady = null;

/**
* Scan the specified html element children and unbind jslet control to these html element with 'data-jslet' attribute.
* 
* @param {Html Element} pElement Parent html element which need to be scan, if null, document.body used.
*/
jslet.ui.uninstall = function (pElement) {
	var htmlTags;
	if (!pElement) {
		htmlTags = jQuery('*[data-jslet]');
	} else {
		htmlTags = jQuery(pElement).find('*[data-jslet]');
	}
	var el;
	for(var i =0, cnt = htmlTags.length; i < cnt; i++){
		el = htmlTags[i];
		if (el.jslet && el.jslet.destroy) {
			el.jslet.destroy();
		}
		el.jslet = null;
	}
	if(jslet.ui.menuManager) {
		jQuery(document).off('mousedown', jslet.ui.menuManager.hideAll);
	}
//	jslet.ui.onReady = null;
};
