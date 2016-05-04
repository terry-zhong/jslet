/*!
 * Jslet JavaScript framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Group and other contributors
 * Released under the MIT license
 */

/* jshint ignore:start */
"use strict";
(function (root, factory) {
    if (typeof define === 'function') {
    	if(define.amd) {
	        define('jslet-ui', ['jslet-data'], factory);
	    } else {
	    	define(function(require, exports, module) {
	    		require('jslet-css');
	    		require('jslet-data');
	    		module.exports = factory();
	    	});
	    }
    } else {
    	factory();
    }
})(this, function () {
/* jshint ignore:end */

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
* Drag & Drop. A common framework to implement drag & drop. Example:
* <pre><code>
*   //Define a delegate class
*   dndDelegate = {}
*   dndDelegate._doDragStart = function(){}
*   dndDelegate._doDragging = function (oldX, oldY, x, y, deltaX, deltaY) {}
*   dndDelegate._doDragEnd = function (oldX, oldY, x, y, deltaX, deltaY) {}
*   dndDelegate._doDragCancel = function () {}
* 
*   //Initialize jslet.ui.DnD
*   //var dnd = new jslet.ui.DnD();
*   //Or use global jslet.ui.DnD instance to bind 'dndDelegate'
*   jslet.ui.dnd.bindControl(dndDelegate);
*	
*   //After end dragging, you need unbind it
*   jslet.ui.dnd.unbindControl();
* 
* </code></pre>
* 
*/

jslet.ui.DnD = function () {
	var oldX, oldY, x, y, deltaX, deltaY,
		dragDelta = 2, 
		dragged = false, 
		bindedControl, 
		mouseDowned = true,
		self = this;

	this._docMouseDown = function (event) {
		event = jQuery.event.fix( event || window.event );
		mouseDowned = true;
		deltaX = 0;
		deltaY = 0;
		oldX = event.pageX;
		oldY = event.pageY;
		dragged = false;

		if (bindedControl && bindedControl._doMouseDown) {
			bindedControl._doMouseDown(oldX, oldY, x, y, deltaX, deltaY);
		}
	};

	this._docMouseMove = function (event) {
		if (!mouseDowned) {
			return;
		}
		event = jQuery.event.fix( event || window.event );
		
		x = event.pageX;
		y = event.pageY;
		if (!dragged) {
			if (Math.abs(deltaX) > dragDelta || Math.abs(deltaY) > dragDelta) {
				dragged = true;
				oldX = x;
				oldY = y;
				if (bindedControl && bindedControl._doDragStart) {
					bindedControl._doDragStart(oldX, oldY);
				}
				return;
			}
		}
		deltaX = x - oldX;
		deltaY = y - oldY;
		if (dragged) {
			if (bindedControl && bindedControl._doDragging) {
				bindedControl._doDragging(oldX, oldY, x, y, deltaX, deltaY);
			}
		} else {
			if (bindedControl && bindedControl._doMouseMove) {
				bindedControl._doMouseMove(oldX, oldY, x, y, deltaX, deltaY);
			}
			oldX = x;
			oldY = y;
		}
	};

	this._docMouseUp = function (event) {
		mouseDowned = false;
		if (dragged) {
			dragged = false;
			if (bindedControl && bindedControl._doDragEnd) {
				bindedControl._doDragEnd(oldX, oldY, x, y, deltaX, deltaY);
			}
		} else {
			if (bindedControl && bindedControl._doMouseUp) {
				bindedControl._doMouseUp(oldX, oldY, x, y, deltaX, deltaY);
			}
		}
		self.unbindControl();
	};

	this._docKeydown = function (event) {
		event = jQuery.event.fix( event || window.event );
		if (event.which == 27) {//Esc key
			if (dragged) {
				dragged = false;
				if (bindedControl && bindedControl._doDragCancel) {
					bindedControl._doDragCancel();
					self.unbindControl();
				}
			}
		}
	};

	this._docSelectStart = function (event) {
		event = jQuery.event.fix( event || window.event );
		event.preventDefault();

		return false;
	};

	/**
	 * Bind control 
	 * 
	 * @param {Object} ctrl The control need drag & drop, there are four method in it: 
	 *  ctrl._doDragStart = function(){}
	 *  ctrl._doDragging = function(oldX, oldY, x, y, deltaX, deltaY){}
	 *  ctrl._doDragEnd = function(oldX, oldY, x, y, deltaX, deltaY){}
	 *  ctrl._doDragCancel = function(){}
	 *  ctrl_doDragStart = function{}
	 *  
	 */
	this.bindControl = function (ctrl) {
		bindedControl = ctrl;
		var doc = jQuery(document);
		doc.on('mousedown', this._docMouseDown);
		doc.on('mouseup', this._docMouseUp);
		doc.on('mousemove', this._docMouseMove);
		doc.on('selectstart', this._docSelectStart);
		doc.on('keydown', this._docKeydown);
	};

	/**
	 * Unbind the current control
	 */
	this.unbindControl = function () {
		var doc = jQuery(document);
		doc.off('mousedown', this._docMouseDown);
		doc.off('mouseup', this._docMouseUp);
		doc.off('mousemove', this._docMouseMove);
		doc.off('selectstart', this._docSelectStart);
		doc.off('keydown', this._docKeydown);
		
		bindedControl = null;
	};
};

jslet.ui.dnd = new jslet.ui.DnD();


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
 * @class EditMask
 * Create edit mask class and attach to a html text element.Example:
 * <pre><code>
 *  var mask = new jslet.ui.EditMask('L00-000');
 *  var mask.attach(htmlText);
 * </code></pre>
 * 
 * @param {String} mask Mask string, rule:
 *  '#': char set: 0-9 and -, not required, 
 *  '0': char set: 0-9, required,
 *  '9': char set: 0-9, not required,
 *  'L': char set: A-Z,a-z, required,
 *  'l': char set: A-Z,a-z, not required,
 *  'A': char set: 0-9,a-z,A-Z, required,
 *  'a': char set: 0-9,a-z,A-Z, not required,
 *  'C': char set: any char, required
 *  'c': char set: any char, not required
 *
 *@param {Boolean} keepChar Keep the literal character or not
 *@param {String} transform Transform character into UpperCase or LowerCase,
 *  optional value: upper, lower or null.
 */
jslet.ui.EditMask = function () {
	this._mask = null;
	this._keepChar = true;
	this._transform = null;

	this._literalChars = null;
	this._parsedMask = null;
	this._format = null;
	this._target = null;
	this._buffer = null;
};

jslet.ui.EditMask.prototype = {
	maskChars: {
		'#': { regexpr: new RegExp('[0-9\\-]'), required: false }, 
		'0': { regexpr: new RegExp('[0-9]'), required: true },
		'9': { regexpr: new RegExp('[0-9]'), required: false },
		'L': { regexpr: new RegExp('[A-Za-z]'), required: true },
		'l': { regexpr: new RegExp('[A-Za-z]'), required: false },
		'A': { regexpr: new RegExp('[0-9a-zA-Z]'), required: true },
		'a': { regexpr: new RegExp('[0-9a-zA-Z]'), required: false },
		'C': { regexpr: null, required: true },
		'c': { regexpr: null, required: false }
	},
	
	transforms: ['upper','lower'],

	setMask: function(mask, keepChar, transform){
		mask = jQuery.trim(mask);
		jslet.Checker.test('EditMask#mask', mask).isString();
		this._mask = mask;
		this._keepChar = keepChar ? true: false;
		
		this._transform = null;
		if(transform){
			var checker = jslet.Checker.test('EditMask#transform', transform).isString();
			transform = jQuery.trim(transform);
			transform = transform.toLowerCase();
			checker.inArray(this.transforms);
			this._transform = transform;
		}
		this._parseMask();
	},
	
	/**
	 * Attach edit mask to a html text element
	 * 
	 * @param {Html Text Element} target Html text element
	 */
	attach: function (target) {
		jslet.Checker.test('EditMask.attach#target', target).required();
		var Z = this, jqText = jQuery(target);
		Z._target = target;
		jqText.on('keypress.editmask', function (event) {
			if(this.readOnly || !Z._mask) {
				return true;
			}
			var c = event.which;
			if (c === 0) {
				return true;
			}
			if (!Z._doKeypress(c)) {
				event.preventDefault();
			} else {
				return true;
			}
		});
		jqText.on('keydown.editmask', function (event) {
			if(this.readOnly || !Z._mask) {
				return true;
			}
			if (!Z._doKeydown(event.which)) {
				event.preventDefault();
			} else {
				return true;
			}
		});

		jqText.on('blur.editmask', function (event) {
			if(this.readOnly || !Z._mask) {
				return true;
			}
			if (!Z._doBur()) {
				event.preventDefault();
				event.currentTarget.focus();
			} else {
				return true;
			}
		});

		jqText.on('cut.editmask', function (event) {
			if(this.readOnly || !Z._mask) {
				return true;
			}
			Z._doCut(event.originalEvent.clipboardData || window.clipboardData);
			event.preventDefault();
			return false;
		});

		jqText.on('paste.editmask', function (event) {
			if(this.readOnly || !Z._mask) {
				return true;
			}
			if (!Z._doPaste(event.originalEvent.clipboardData || window.clipboardData)) {
				event.preventDefault();
			}
		});
	},

	/**
	 * Detach edit mask from a html text element
	 */
	detach: function(){
		var jqText = jQuery(this._target);
		jqText.off('keypress.editmask');
		jqText.off('keydown.editmask');
		jqText.off('blur.editmask');
		jqText.off('cut.editmask');
		jqText.off('paste.editmask');
		this._target = null; 
	},
	
	setValue: function (value) {
		value = jQuery.trim(value);
		jslet.Checker.test('EditMask.setValue#value', value).isString();
		value = value ? value : '';
		if(!this._mask) {
			this._target.value = value;
			return;
		}
		
		var Z = this;
		Z._clearBuffer(0);
		var prePos = 0, pos, preValuePos = 0, k, i, 
			ch, vch, valuePos = 0, fixedChar, 
			maskLen = Z._parsedMask.length;
		while (true) {
			fixedChar = Z._getFixedCharAndPos(prePos);
			pos = fixedChar.pos;
			ch = fixedChar.ch;
			if (pos < 0) {
				pos = prePos;
			}
			if (ch) {
				valuePos = value.indexOf(ch, preValuePos);
				if (valuePos < 0) {
					valuePos = value.length;
				}
				k = -1;
				for (i = valuePos - 1; i >= preValuePos; i--) {
					vch = value.charAt(i);
					Z._buffer[k + pos] = vch;
					k--;
				}
				preValuePos = valuePos + 1;
			} else {
				k = 0;
				var c, cnt = Z._buffer.length;
				for (i = prePos; i < cnt; i++) {
					c = value.charAt(preValuePos + k);
					if (!c) {
						break;
					}
					Z._buffer[i] = c;
					k++;
				}
				break;
			}
			prePos = pos + 1;
		}
		Z._showValue();
	},
	
	getValue: function(){
		var value = this._target.value;
		if(this._keepChar) {
			return value;
		} else {
			var result = [], maskObj;
			for(var i = 0, cnt = value.length; i< cnt; i++){
				maskObj = this._parsedMask[i];
				if(maskObj.isMask) {
					result.push(value.charAt(i));
				}
			}
			return result.join('');
		}
	},
	
	validateValue: function(){
		var Z = this, len = Z._parsedMask.length, cfg;
		for(var i = 0; i< len; i++){
			cfg = Z._parsedMask[i];
			if(cfg.isMask && Z.maskChars[cfg.ch].required){
				if(Z._buffer[i] == Z._format[i]) {
					return false;
				}
			}
		}
		return true;
	},
	
	_getFixedCharAndPos: function (begin) {
		var Z = this;
		if (!Z._literalChars || Z._literalChars.length === 0) {
			return { pos: 0, ch: null };
		}
		if (!begin) {
			begin = 0;
		}
		var ch, mask;
		for (var i = begin, cnt = Z._parsedMask.length; i < cnt; i++) {
			mask = Z._parsedMask[i];
			if (mask.isMask) {
				continue;
			}
			ch = mask.ch;
			if (Z._literalChars.indexOf(ch) >= 0) {
				return { ch: ch, pos: i };
			}
		}
		return { pos: -1, ch: null };
	},

	_parseMask: function () {
		var Z = this;
		if(!Z._mask) {
			Z._parsedMask = null;
			return;
		}
		Z._parsedMask = [];
		
		Z._format = [];
		var c, prevChar = null, isMask;

		for (var i = 0, cnt = Z._mask.length; i < cnt; i++) {
			c = Z._mask.charAt(i);
			if (c == '\\') {
				prevChar = c;
				continue;
			}
			isMask = false;
			if (Z.maskChars[c] === undefined) {
				if (prevChar) {
					Z._parsedMask.push({ ch: prevChar, isMask: isMask });
				}
				Z._parsedMask.push({ ch: c, isMask: isMask });
			} else {
				isMask = prevChar ? false : true;
				Z._parsedMask.push({ ch: c, isMask: isMask });
			}
			if(Z._keepChar && !isMask){
				if(!Z._literalChars) {
					Z._literalChars = [];
				}
				var notFound = true;
				for(var k = 0, iteralCnt = Z._literalChars.length; k < iteralCnt; k++){
					if(Z._literalChars[k] == c){
						notFound = false;
						break;
					}
				}
				if(notFound) {
					Z._literalChars.push(c);
				}
			}
			prevChar = null;
			Z._format.push(isMask ? '_' : c);
		} //end for

		Z._buffer = Z._format.slice(0);
		if(Z._target) {
			Z._target.value = Z._format.join('');
		}
	},
	
	_validateChar: function (maskChar, inputChar) {
		var maskCfg = this.maskChars[maskChar];
		var regExpr = maskCfg.regexpr;
		if (regExpr) {
			return regExpr.test(inputChar);
		} else {
			return true;
		}
	},

	_getValidPos: function (pos, toLeft) {
		var Z = this, 
			cnt = Z._parsedMask.length, i;
		if (pos >= cnt) {
			return cnt - 1;
		}
		if (!toLeft) {
			for (i = pos; i < cnt; i++) {
				if (Z._parsedMask[i].isMask) {
					return i;
				}
			}
			for (i = pos; i >= 0; i--) {
				if (Z._parsedMask[i].isMask) {
					return i;
				}
			}

		} else {
			for (i = pos; i >= 0; i--) {
				if (Z._parsedMask[i].isMask) {
					return i;
				}
			}
			for (i = pos; i < cnt; i++) {
				if (Z._parsedMask[i].isMask) {
					return i;
				}
			}
		}
		return -1;
	},

	_clearBuffer: function (begin, end) {
		if(!this._buffer) {
			return;
		}
		if (!end) {
			end = this._buffer.length - 1;
		}
		for (var i = begin; i <= end; i++) {
			this._buffer[i] = this._format[i];
		}
	},

	_packEmpty: function (begin, end) {
		var c, k = 0, Z = this, i;
		for (i = begin; i >= 0; i--) {
			c = Z._format[i];
			if (Z._literalChars && Z._literalChars.indexOf(c) >= 0) {
				k = i;
				break;
			}
		}
		begin = k;
		var str = [];
		for (i = begin; i < end; i++) {
			c = Z._buffer[i];
			if (c != Z._format[i]) {
				str.push(c);
			}
		}
		var len = str.length - 1;

		for (i = end - 1; i >= begin; i--) {
			if (len >= 0) {
				Z._buffer[i] = str[len];
				len--;
			} else {
				Z._buffer[i] = Z._format[i];
			}
		}
	},

	_updateBuffer: function (pos, ch) {
		var begin = pos.begin, end = pos.end, Z = this;

		begin = Z._getValidPos(begin);
		if (begin < 0) {
			return -1;
		}
		Z._clearBuffer(begin + 1, end);
		if (Z._literalChars && Z._literalChars.indexOf(ch) >= 0) {
			for (var i = begin, cnt = Z._parsedMask.length; i < cnt; i++) {
				if (Z._parsedMask[i].ch == ch) {
					Z._packEmpty(begin, i);
					return i;
				}
			}
		} else {
			var maskObj = Z._parsedMask[begin];
			if (Z._validateChar(maskObj.ch, ch)) {
				Z._buffer[begin] = ch;
				return begin;
			} else	{
				return -1;
			}
		}
	},

	_moveCursor: function (begin, toLeft) {
		begin = this._getValidPos(begin, toLeft);
		if (begin >= 0) {
			jslet.ui.textutil.setCursorPos(this._target, begin);
		}
	},

	_showValue: function () {
		this._target.value = this._buffer.join('');
	},

	_doKeypress: function (chCode) {
		if (chCode == 13) {
			return true;
		}

		var ch = String.fromCharCode(chCode), Z = this;
		if (Z._transform == 'upper') {
			ch = ch.toUpperCase();
		} else {
			if (Z._transform == 'lower') {
				ch = ch.toLowerCase();
			}
		}
		var pos = jslet.ui.textutil.getCursorPos(Z._target);
		var begin = Z._updateBuffer(pos, ch);
		Z._showValue();
		if (begin >= 0) {
			Z._moveCursor(begin + 1);
		} else {
			Z._moveCursor(pos.begin);
		}

		return false;
	},

	_doKeydown: function (chCode) {
		var Z = this,
			pos = jslet.ui.textutil.getCursorPos(Z._target),
			begin = pos.begin,
			end = pos.end;

		if (chCode == 229) {//IME showing
			var flag = (Z._parsedMask.legnth > begin);
			if (flag) {
				var msk = Z._parsedMask[begin];
				flag = msk.isMask;
				if (flag) {
					var c = msk.ch;
					flag = (c == 'c' || c == 'C');
				}
			}
			if (!flag) {
				window.setTimeout(function () {
					Z._showValue();
					Z._moveCursor(begin);
				}, 50);
			}
		}
		if (chCode == 13) //enter
		{
			return true;
		}

		if (chCode == 8) //backspace
		{
			if (begin == end) {
				begin = Z._getValidPos(--begin, true);
				end = begin;
			}
			Z._clearBuffer(begin, end);
			Z._showValue();
			Z._moveCursor(begin, true);
			return false;
		}

		if (chCode == 27) // Allow to send 'ESC' command
		{
			return false;
		}

		if (chCode == 39) // Move Left
		{
		}

		if (chCode == 46) // delete the selected text
		{
			Z._clearBuffer(begin, end - 1);
			Z._showValue();
			Z._moveCursor(begin);

			return false;
		}
		return true;
	},

	_doBur: function () {
		var mask, c, Z = this;
		for (var i = 0, cnt = Z._parsedMask.length; i < cnt; i++) {
			mask = Z._parsedMask[i];
			if (!mask.isMask) {
				continue;
			}
			c = mask.ch;
			if (Z.maskChars[c].required) {
				if (Z._buffer[i] == Z._format[i]) {
					//jslet.ui.textutil.setCursorPos(Z._target, i);
					//return false;
					return true;
				}
			}
		}
		return true;
	},

	_doCut: function (clipboardData) {
		var Z = this,
			data = jslet.ui.textutil.getSelectedText(Z._target),
			range = jslet.ui.textutil.getCursorPos(Z._target),
			begin = range.begin;
		Z._clearBuffer(begin, range.end - 1);
		Z._showValue();
		Z._moveCursor(begin, true);
		clipboardData.setData('Text', data);
		return false;
	},

	_doPaste: function (clipboardData) {
		var pasteValue = clipboardData.getData('Text');
		if (!pasteValue) {
			return false;
		}
		var pos = jslet.ui.textutil.getCursorPos(this._target), begin = 0, ch;
		pos.end = pos.begin;
		for (var i = 0; i < pasteValue.length; i++) {
			ch = pasteValue.charAt(i);
			begin = this._updateBuffer(pos, ch);
			pos.begin = i;
			pos.end = pos.begin;
		}
		this._showValue();
		if (begin >= 0) {
			this._moveCursor(begin + 1);
		}
		return true;
	}
};//edit mask

/**
 * Util of "Text" control
 */
jslet.ui.textutil = {
	/**
	 * Select text from an Input(Text) element 
	 * 
	 * @param {Html Text Element} txtEl The html text element   
	 * @param {Integer} start Start position.
	 * @param {Integer} end End position.
	 */
	selectText: function(txtEl, start, end){
		var v = txtEl.value;
		if (v.length > 0) {
			start = start === undefined ? 0 : start;
			end = end === undefined ? v.length : end;
 
			if (txtEl.setSelectionRange) {
				txtEl.setSelectionRange(start, end);
			} else if (txtEl.createTextRange) {
				var range = txtEl.createTextRange();
				range.moveStart('character', start);
				range.moveEnd('character', end - v.length);
				range.select();
			}
		}	
	},
	
	/**
	 * Get selected text
	 * 
	 * @param {Html Text Element} textEl Html Text Element
	 * @return {String}  
	 */
	getSelectedText: function (txtEl) {
		if (txtEl.setSelectionRange) {
			var begin = txtEl.selectionStart;
			var end = txtEl.selectionEnd;
			return txtEl.value.substring(begin, end);
		}
		if (document.selection && document.selection.createRange) {
			return document.selection.createRange().text;
		}
	},

	/**
	 * Get cursor postion of html text element
	 * 
	 * @param {Html Text Element} txtEl Html Text Element
	 * @return {Integer}
	 */
	getCursorPos: function(txtEl){
		var result = { begin: 0, end: 0 };

		if (txtEl.setSelectionRange) {
			result.begin = txtEl.selectionStart;
			result.end = txtEl.selectionEnd;
		}
		else if (document.selection && document.selection.createRange) {
			var range = document.selection.createRange();
			result.begin = 0 - range.duplicate().moveStart('character', -100000);
			result.end = result.begin + range.text.length;
		}
		return result;
	},
	
	/**
	 * Set cursor postion of html text element
	 * 
	 * @param {Html Text Element} txtEl Html Text Element
	 * @param {Integer} pos Cusor position
	 */
	setCursorPos: function(txtEl, pos){
		if (txtEl.setSelectionRange) {
			txtEl.focus();
			txtEl.setSelectionRange(pos, pos);
		}
		else if (txtEl.createTextRange) {
			var range = txtEl.createTextRange();
			range.collapse(true);
			range.moveEnd('character', pos);
			range.moveStart('character', pos);
			range.select();
		}	
	}
};

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
 * Control focus manager.
 * 
 * @param containerId {String} container id, if containerid is not specified, container is document.
 */
jslet.ui.FocusManager = function() {
	this._onChangingFocus = null;
	this._focusKeyCode = null;
	this._containerIds = null;
	this._activeDataset = null;
	this._activeField = null;
	this._activeValueIndex = null;
	
	this._initialize();
};

jslet.ui.FocusManager.prototype = {
	/**
	 * Get or set onChangingFocus event handler. 
	 * 
	 * @param onChangingFocus {Function} event handler, pattern:
	 * function doChangingFocus(element, reserve, datasetObj, fieldName, focusingFieldList, valueIndex) {
	 * 		console.log('Changind focus');
	 * }
	 * element - {HTML element} focusing html element;
	 * reserve - {Boolean} if it's focusing prior element, reserve is true, otherwise false;
	 * datasetObj - {jslet.data.Dataset} current dataset object. If the UI control is not jslet UI control, it's null;
	 * fieldName - {String} current field name. If the UI control is not jslet UI field control, it's null;
	 * focusingFieldList - {String[]} focusing field name list. You can use 'focusingFieldList' and 'fieldName' to check the position of field name.  
	 * valueIndex - {Integer} identify the value index of BETWEEN-style or MULTIPLE-style field.
	 * 
	 * focusManager.onChangingFocus(doChangingFocus);
	 * 
	 */
	onChangingFocus: function(onChangingFocus) {
		if(onChangingFocus === undefined) {
			return this._onChangingFocus;
		}
		jslet.Checker.test('FocusManager.onChangingFocus', onChangingFocus).isFunction();
		this._onChangingFocus = onChangingFocus;
	},
	
	/**
	 * Get or set 'focusKeyCode'
	 * 
	 * @param {Integer} focusKeyCode - Key code for changing focus.
	 * 
	 */
	focusKeyCode: function(focusKeyCode) {
		if(focusKeyCode === undefined) {
			return this._focusKeyCode;
		}
		jslet.Checker.test('FocusManager.focusKeyCode', focusKeyCode).isNumber();
		this._focusKeyCode = focusKeyCode;
	},
	
	pushContainer: function(containerId) {
		jslet.Checker.test('FocusManager.pushContainer#containerId', containerId).required().isString();
		if(this._containerIds === null) {
			this._containerIds = [];
		}
		this._containerIds.push(containerId);
	},
	
	popContainer: function(containerId) {
		jslet.Checker.test('FocusManager.pushContainer#containerId', containerId).required().isString();
		if(this._containerIds[this._containerIds.length - 1] == containerId) {
			this._containerIds.pop();
		}
	},
	
	activeDataset: function(dsName) {
		if(dsName === undefined) {
			return this._activeDataset;
		}
		jslet.Checker.test('FocusManager.activeDataset', dsName).isString();
		this._activeDataset = dsName;
		return this;
	},
	
	activeField: function(fldName) {
		if(fldName === undefined) {
			return this._activeField;
		}
		jslet.Checker.test('FocusManager.activeField', fldName).isString();
		this._activeField = fldName;
		return this;
	},
	
	activeValueIndex: function(valueIndex) {
		if(valueIndex === undefined) {
			return this._activeValueIndex;
		}
		jslet.Checker.test('FocusManager.activeValueIndex', valueIndex).isNumber();
		this._activeValueIndex = valueIndex;
		return this;
	},
	
	tabPrev: function() {
		jQuery.tabPrev(this._getContainer(), true, jQuery.proxy(this._doChangingFocus, this));
	},
	
	tabNext: function() {
		jQuery.tabNext(this._getContainer(), true, jQuery.proxy(this._doChangingFocus, this));
	},
	
	_getContainer: function() {
		var Z = this,
			jqContainer;
		if(Z._containerIds && Z._containerIds.length > 0) {
			var containerId = Z._containerIds[Z._containerIds.length - 1];
			jqContainer = jQuery('#' + containerId);
			if(jqContainer.length === 0) {
				throw new Error('Not found container: ' + containerId);
			}
		} else {
			jqContainer = jQuery(document);
		}
		return jqContainer;
	},
	
	_doChangingFocus: function(ele, reverse) {
		var Z = this,
			dsObj = jslet.data.getDataset(Z._activeDataset),
			focusedFlds = dsObj && dsObj.mergedFocusedFields();
		if(Z._onChangingFocus) {
			var cancelFocus = Z._onChangingFocus(ele, reverse, dsObj, Z._activeField, focusedFlds, Z._activeValueIndex);
			if(!cancelFocus) {
				return false;
			}
		}
		if(!Z._activeDataset && !Z._activeField) {
			return true;
		}
		if(!dsObj || !dsObj.focusedFields()) {
			return true;
		}
		var idx = focusedFlds.indexOf(Z._activeField);
		if(idx < 0) {
			return true;
		}
		if(!reverse) {
			if(idx === focusedFlds.length - 1) {
				return true;
			} else {
				dsObj.focusEditControl(focusedFlds[idx + 1]);
			}
		} else {
			if(idx === 0) {
				return true;
			} else {
				dsObj.focusEditControl(focusedFlds[idx - 1]);
			}
		}
		return false;
	},
	
	_initialize: function() {
		function isTabableElement(ele) {
			var tagName = ele.tagName;
			if(tagName == 'TEXTAREA' || tagName == 'A' || tagName == 'BUTTON') {
				return false;
			}
			if(tagName == 'INPUT') {
				var typeAttr = ele.type;
				if(typeAttr == 'button' || typeAttr == 'image' || typeAttr == 'reset' || typeAttr == 'submit' || typeAttr == 'url' || typeAttr == 'file') {
					return false;
				}
			}
			return true;
		}
		
		var Z = this;
		
		function handleHostKeyDown(event) {
			var focusKeyCode = Z._focusKeyCode || jslet.global.defaultFocusKeyCode || 9;
			var keyCode = event.which;
			if(keyCode === focusKeyCode || keyCode === 9) {
				if(keyCode !== 9 && !isTabableElement(event.target)) {
					return;
				}
				
				if(event.shiftKey){
					Z.tabPrev();
				}
				else{
					Z.tabNext();
				}
				event.preventDefault();
	       		event.stopImmediatePropagation();
	       		return false;
			}
		}
		jQuery(document).keydown(handleHostKeyDown);
	}
};

jslet.ui.focusManager = new jslet.ui.FocusManager();

/*!
 * jQuery.tabbable 1.0 - Simple utility for selecting the next / previous ':tabbable' element.
 * https://github.com/marklagendijk/jQuery.tabbable
 *
 * Includes ':tabbable' and ':focusable' selectors from jQuery UI Core
 *
 * Copyright 2013, Mark Lagendijk
 * Released under the MIT license
 *
 */

(function($){
	/**
	 * Focusses the next :focusable element. Elements with tabindex=-1 are focusable, but not tabable.
	 * Does not take into account that the taborder might be different as the :tabbable elements order
	 * (which happens when using tabindexes which are greater than 0).
	 */
	$.focusNext = function(container, isLoop, onChangingFocus){
		selectNextTabbableOrFocusable(':focusable', container, isLoop, onChangingFocus);
	};

	/**
	 * Focusses the previous :focusable element. Elements with tabindex=-1 are focusable, but not tabable.
	 * Does not take into account that the taborder might be different as the :tabbable elements order
	 * (which happens when using tabindexes which are greater than 0).
	 */
	$.focusPrev = function(container, isLoop, onChangingFocus){
		return selectPrevTabbableOrFocusable(':focusable', container, isLoop, onChangingFocus);
	};

	/**
	 * Focusses the next :tabable element.
	 * Does not take into account that the taborder might be different as the :tabbable elements order
	 * (which happens when using tabindexes which are greater than 0).
	 */
	$.tabNext = function(container, isLoop, onChangingFocus){
		return selectNextTabbableOrFocusable(':tabbable', container, isLoop, onChangingFocus);
	};

	/**
	 * Focusses the previous :tabbable element
	 * Does not take into account that the taborder might be different as the :tabbable elements order
	 * (which happens when using tabindexes which are greater than 0).
	 */
	$.tabPrev = function(container, isLoop, onChangingFocus){
		return selectPrevTabbableOrFocusable(':tabbable', container, isLoop, onChangingFocus);
	};

	function selectNextTabbableOrFocusable(selector, container, isLoop, onChangingFocus){
		if(!container) {
			container = document;
		}
		var selectables = jQuery(container).find(selector);
		sortByTabIndex(selectables);
		var current = $(':focus');
		var nextIndex = 0;
		var currEle = null;
		if(current.length === 1){
			currEle = current[0];
			var currentIndex = selectables.index(current);
			if(currentIndex + 1 < selectables.length){
				nextIndex = currentIndex + 1;
			} else {
				if(isLoop) {
					nextIndex = 0;
				}
			}
		}

		var canFocus = true;
		if(onChangingFocus && currEle) {
			canFocus = onChangingFocus(currEle, false);
		}
		if(canFocus) {
			var jqEl = selectables.eq(nextIndex);
			jqEl.focus();
			return jqEl[0];
		} else {
			return currEle;
		}
	}

	function selectPrevTabbableOrFocusable(selector, container, isLoop, onChangingFocus){
		if(!container) {
			container = document;
		}
		var selectables = jQuery(container).find(selector);
		sortByTabIndex(selectables);
		var current = $(':focus');
		var prevIndex = selectables.length - 1;
		var currEle = null;
		if(current.length === 1){
			currEle = current[0];
			var currentIndex = selectables.index(current);
			if(currentIndex > 0){
				prevIndex = currentIndex - 1;
			} else {
				if(isLoop) {
					prevIndex = selectables.length - 1;
				}
			}
		}

		var canFocus = true;
		if(onChangingFocus && currEle) {
			canFocus = onChangingFocus(currEle, true);
		}
		if(canFocus) {
			var jqEl = selectables.eq(prevIndex);
			jqEl.focus();
			return jqEl[0];
		} else {
			return currEle;
		}
	}

	function sortByTabIndex(items) {
		if(!items) {
			return;
		}
		
		var item, item1, k;
		for(var i = 1, len = items.length; i < len; i++) {
			item = items[i];
			k = 0;
			for(var j = i - 1; j >= 0; j--) {
				item1 = items[j];
				if(item1.tabIndex <= item.tabIndex) {
					k = j + 1;
					break;
				}
			} //end for j
			if(i !== k) {
				items.splice(i, 1);
				items.splice(k, 0, item);
			}
		} //end for i
	}
	
	/**
	 * :focusable and :tabbable, both taken from jQuery UI Core
	 */
	$.extend($.expr[ ':' ], {
		data: $.expr.createPseudo ?
			$.expr.createPseudo(function(dataName){
				return function(elem){
					return !!$.data(elem, dataName);
				};
			}) :
			// support: jQuery <1.8
			function(elem, i, match){
				return !!$.data(elem, match[ 3 ]);
			},

		focusable: function(element){
			return focusable(element, !isNaN($.attr(element, 'tabindex')));
		},

		tabbable: function(element){
			var tabIndex = $.attr(element, 'tabindex'),
				isTabIndexNaN = isNaN(tabIndex);
			return ( isTabIndexNaN || tabIndex >= 0 ) && focusable(element, !isTabIndexNaN);
		}
	});

	/**
	 * focussable function, taken from jQuery UI Core
	 * @param element
	 * @returns {*}
	 */
	function focusable(element){
		var map, mapName, img,
			nodeName = element.nodeName.toLowerCase(),
			isTabIndexNotNaN = !isNaN($.attr(element, 'tabindex'));
		if('area' === nodeName){
			map = element.parentNode;
			mapName = map.name;
			if(!element.href || !mapName || map.nodeName.toLowerCase() !== 'map'){
				return false;
			}
			img = $('img[usemap=#' + mapName + ']')[0];
			return !!img && visible(img);
		}
		return ( /input|select|textarea/.test(nodeName) ?
			!element.disabled :
			'a' === nodeName ?
				element.href || isTabIndexNotNaN :
				isTabIndexNotNaN) &&
			// the element and all of its ancestors must be visible
			visible(element);

		function visible(element){
			return $.expr.filters.visible(element) && !$(element).parents().addBack().filter(function(){
				return $.css(this, 'visibility') === 'hidden';
			}).length;
		}
	}
})(jQuery);

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
* Resize event bus, manage all resize event. Example:
* <pre><code>
*	var myCtrlObj = {
*		checkSizeChanged: function(){
*			;
*		}
*	}
*	
*	//Subcribe a message from MessageBus
*	jslet.messageBus.subcribe(myCtrlObj);
*   
*	//Unsubcribe a message from MessageBus
*	jslet.messageBus.unsubcribe(myCtrlObj);
* 
*	//Send a mesasge to MessageBus
*	jslet.messageBus.sendMessage('MyMessage', {x: 10, y:10});
* 
* </code></pre>
* 
*/
"use strict";
jslet.ResizeEventBus = function () {
	
	var handler = null;
	/**
	 * Send a message.
	 * 
	 * @param {Html Element} sender Sender which send resize event.
	 */
	this.resize = function (sender) {
		if (handler){
			window.clearTimeout(handler);
		}
		handler = setTimeout(function(){
			var ctrls, ctrl, jsletCtrl;
			if (sender) {
				ctrls = jQuery(sender).find("*[data-jslet-resizable]");
			} else {
				ctrls = jQuery("*[data-jslet-resizable]");
			}
			if(jslet.ui._activePopup) {
				jslet.ui._activePopup.hide();
			}
			for(var i = 0, cnt = ctrls.length; i < cnt; i++){
				ctrl = ctrls[i];
				if (ctrl){
					jsletCtrl = ctrl.jslet;
					if (jsletCtrl && jsletCtrl.checkSizeChanged){
						jsletCtrl.checkSizeChanged();
					}
				}
			}
			handler = null;
		}, 100);
	};

	/**
	 * Subscribe a control to response a resize event.
	 * 
	 * @param {Object} ctrlObj control object which need subscribe a message, 
	 *	there must be a function: checkSizeChanged in ctrlObj.
	 *	checkSizeChanged: function(){}
	 */
	this.subscribe = function(ctrlObj){
		if (!ctrlObj || !ctrlObj.el) {
			throw new Error("ctrlObj required!");
		}
		jQuery(ctrlObj.el).attr(jslet.ResizeEventBus.RESIZABLE, true);
	};
	
	/**
	 * Unsubscribe a control to response a resize event.
	 * 
	 * @param {Object} ctrlObj control object which need subscribe a message.
	 */
	this.unsubscribe = function(ctrlObj){
		if (!ctrlObj || !ctrlObj.el) {
			throw new Error("ctrlObj required!");
		}
		jQuery(ctrlObj.el).removeAttr(jslet.ResizeEventBus.RESIZABLE);
	};
	
};

jslet.ResizeEventBus.RESIZABLE = "data-jslet-resizable";

jslet.resizeEventBus = new jslet.ResizeEventBus();

jQuery(window).on("resize",function(){
	jslet.resizeEventBus.resize();
});

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

jslet.ui.htmlclass = {};
jslet.ui.GlobalZIndex = 100;

jslet.ui.KeyCode = {
	BACKSPACE: 8, 
	TAB: 9,
	ENTER: 13,
	SHIFT: 16,
	CONTROL: 17,
	ALT: 18,

	CAPSLOCK: 20,
	ESCAPE: 27,
	SPACE: 32,
	PAGEUP: 33,
	PAGEDOWN: 34,
	END: 35,
	HOME: 36,
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	
	INSERT: 45,
	DELETE: 46,

	F1: 112,
	F2: 113,
	F3: 114,
	F4: 115,
	F5: 116,
	F6: 117,
	F7: 118,
	F8: 119,
	F9: 120,
	F10: 121,
	F11: 122,
	F12: 123,

	IME: 229
};

for(var i = 65; i < 90; i++) {
	jslet.ui.KeyCode[String.fromCharCode(i)] = i;
}

/**
* Popup Panel. Example: 
* <pre><code>
* var popPnl = new jslet.ui.PopupPanel();
* popPnl.setContent(document.getElementById('id'));
* popPnl.show(10, 10, 100, 100);
* 
* popPnl.hide(); //or
* popPnl.destroy();
* </code></pre>
*  
*/
jslet.ui.PopupPanel = function () {
	/**
	 * Event handler when hide popup panel: function(){}
	 */
	this.onHidePopup = null;

	this.isShowing = false;
	/**
	 * Private document click handler
	 */
	this.documentClickHandler = function (event) {
		event = jQuery.event.fix( event || window.event );
		var srcEle = event.target;
		if (jslet.ui.isChild(jslet.ui.PopupPanel.excludedElement,srcEle) ||
			jslet.ui.inPopupPanel(srcEle)) {
			return;
		}
		if (jslet.ui._activePopup) {
			jslet.ui._activePopup.hide();
		}
	};

	this._stopMouseEvent = function(event) {
		event.stopImmediatePropagation();
		event.preventDefault();
	};
	
	/**
	 * Private, create popup panel
	 */
	this._createPanel = function () {
		if (!jslet.ui._popupPanel) {
			var p = document.createElement('div');
			p.style.display = 'none';
			p.className = 'jl-popup-panel jl-opaque jl-border-box dropdown-menu';
			p.style.position = 'absolute';
			p.style.zIndex = 99000;
			document.body.appendChild(p);
			
			jQuery(document).on('click', this.documentClickHandler);
//			jQuery(p).on('click', this._stopMouseEvent);
//			jQuery(p).on('mousedown', this._stopMouseEvent);
//			jQuery(p).on('mouseup', this._stopMouseEvent);
			jslet.ui._popupPanel = p;
		}
	};
	
	/**
	 * Show popup panel in specified position with specified size.
	 * 
	 * @param {Integer} left Left position
	 * @param {Integer} top Top position
	 * @param {Integer} width Popup panel width
	 * @param {Integer} height Popup panel height
	 * 
	 */
	this.show = function (left, top, width, height, ajustX, ajustY) {
		this._createPanel();
		left = parseInt(left);
		top = parseInt(top);
		
		if (height) {
			jslet.ui._popupPanel.style.height = parseInt(height) + 'px';
		}
		if (width) {
			jslet.ui._popupPanel.style.width = parseInt(width) + 'px';
		}
		var jqWin = jQuery(window),
			winWidth = jqWin.scrollLeft() + jqWin.width(),
			winHeight = jqWin.scrollTop() + jqWin.height(),
			panel = jQuery(jslet.ui._popupPanel),
			w = panel.outerWidth(),
			h = panel.outerHeight();
		/*
		if (left - obody.scrollLeft + w > obody.clientWidth) {
			left -= w;
		}
		if (top - obody.scrollTop + h > obody.clientHeight) {
			top -= (h + ajustY);
		}
		*/
		if (jslet.locale.isRtl) {
			left -= w;
		}
		if(left + w > winWidth) {
			left += winWidth - left - w - 1;
		}
		if(top + h > winHeight) {
			top -= (h + 2 + ajustY);
		}
		if(left < 0) {
			left = 1;
		}
		if(top < 0) {
			top = 1;
		}
		
		if (top) {
			jslet.ui._popupPanel.style.top = top + 'px';
		}
		if (left) {
			jslet.ui._popupPanel.style.left = left + 'px';
		}
		jslet.ui._popupPanel.style.display = 'block';

		var shadow = jslet.ui._popupShadow;
		if(shadow) {
			shadow.style.width = w + 'px';
			shadow.style.height = h + 'px';
			shadow.style.top = top + 2 + 'px';
			shadow.style.left = left + 2 + 'px';
			shadow.style.display = 'block';
		}
		jslet.ui._activePopup = this;
		this.isShowing = true;
	};

	/**
	 * Set popup panel content.
	 * 
	 * @param {Html Element} content popup panel content
	 * @param {String} content width;
	 * @param {String} cotnent height;
	 */
	this.setContent = function (content, width, height) {
		this._createPanel();
		var oldContent = jslet.ui._popupPanel.childNodes[0];
		if (oldContent) {
			jslet.ui._popupPanel.removeChild(oldContent);
		}
		jslet.ui._popupPanel.appendChild(content);
		content.style.border = 'none';
		if(width) {
			content.style.width = width;
		}
		if(height) {
			content.style.height = height;
		}
	};

	/**
	 * Get popup Panel. You can use this method to customize popup panel.
	 * 
	 * @return {Html Element}
	 * 
	 */
	this.getPopupPanel = function () {
		this._createPanel();
		return jslet.ui._popupPanel;
	};

	/**
	 * Destroy popup panel completely.
	 */
	this.destroy = function () {
		if (!jslet.ui._popupPanel) {
			return;
		}
		this.isShowing = false;
		document.body.removeChild(jslet.ui._popupPanel);
		if(jslet.ui._popupShadow) {
			document.body.removeChild(jslet.ui._popupShadow);
		}
		jQuery(this._popupPanel).off();
		jslet.ui._popupPanel = null;
		jslet.ui._popupShadow = null;
		this.onHidePopup = null;
		jQuery(document).off('click', this.documentClickHandler);
	};

	/**
	 * Hide popup panel, and you can show it again.
	 * 
	 */
	this.hide = function () {
		if (jslet.ui._popupPanel) {
			jslet.ui._popupPanel.style.display = 'none';
			if(jslet.ui._popupShadow) {
				jslet.ui._popupShadow.style.display = 'none';
			}
		}
		if (this.onHidePopup) {
			this.onHidePopup();
		}
		this.isShowing = false;
		delete jslet.ui._activePopup;
	};
};

/**
* Check if a html element is in an active popup or not
* 
* @param {Html Element} htmlElement Checking html element
* 
* @return {Boolean} True - In popup panel, False - Otherwise
*/
jslet.ui.inPopupPanel = function (htmlElement) {
	if (!htmlElement || htmlElement == document) {
		return false;
	}
	if (jQuery(htmlElement).hasClass('jl-popup-panel')) {
		return true;
	} else {
		return jslet.ui.inPopupPanel(htmlElement.parentNode);
	}
};

/**
* Get the specified level parent element. Example:
* <pre><code>
*  //html snippet is: body -> div1 -> div2 ->table
*  jslet.ui.getParentElement(div2); // return div1
*  jslet.ui.getParentElement(div2, 2); //return body 
* </code></pre>
* 
* @param {Html Element} htmlElement html element as start point
* @param {Integer} level level
* 
* @return {Html Element} Parent element, if not found, return null.
*/
jslet.ui.getParentElement = function (htmlElement, level) {
	if (!level) {
		level = 1;
	}
	var flag = htmlElement.parentElement ? true : false,
	result = htmlElement;
	for (var i = 0; i < level; i++) {
		if (flag) {
			result = result.parentElement;
		} else {
			result = result.parentNode;
		}
		if (!result) {
			return null;
		}
	}
	return result;
};

/**
* Find first parent with specified condition. Example:
* <pre><code>
*   //Html snippet: body ->div1 ->div2 -> div3
*	var odiv = jslet.ui.findFirstParent(
*		odiv3, 
*		function (node) {return node.class == 'head';},
*		function (node) {return node.tagName != 'BODY'}
*   );
* </code></pre>
* 
* @param {Html Element} element The start checking html element
* @param {Function} conditionFn Callback function: function(node}{...}, node is html element;
*			if conditionFn return true, break finding and return 'node'
* @param {Function} stopConditionFn Callback function: function(node}{...}, node is html element;
*			if stopConditionFn return true, break finding and return null
* 
* @return {Html Element} Parent element or null
*/
jslet.ui.findFirstParent = function (htmlElement, conditionFn, stopConditionFn) {
	var p = htmlElement;
	if (!p) {
		return null;
	}
	if (!conditionFn) {
		return p.parentNode;
	}
	if (conditionFn(p)) {
		return p;
	} else {
		if (stopConditionFn && stopConditionFn(p.parentNode)) {
			return null;
		}
		return jslet.ui.findFirstParent(p.parentNode, conditionFn, stopConditionFn);
	}
};

/**
 * Find parent element that has 'jslet' property
 * 
 * @param {Html Element} element The start checking html element
 * @return {Html Element} Parent element or null
 */
jslet.ui.findJsletParent = function(element){
	return jslet.ui.findFirstParent(element, function(ele){
		return ele.jslet ? true:false; 
	});
};

/**
 * Check one node is a child of another node or not.
 * 
 * @param {Html Element} parentNode parent node;
 * @param {Html Element} testNode, testing node
 * @return {Boolean} true - 'testNode' is a child of 'parentNode', false - otherwise.
 */
jslet.ui.isChild = function(parentNode, testNode) {
	if(!parentNode || !testNode) {
		return false;
	}
	var p = testNode;
	while(p) {
		if(p == parentNode) {
			return true;
		}
		p = p.parentNode;
	}
	return false;
};

/**
* Text Measurer, measure the display width or height of the given text. Example:
* <pre><code>
*   jslet.ui.textMeasurer.setElement(document.body);
*   try{
		var width = jslet.ui.textMeasurer.getWidth('HellowWorld');
		var height = jslet.ui.textMeasurer.getHeight('HellowWorld');
	}finally{
		jslet.ui.textMeasurer.setElement();
	}
* </code></pre>
* 
*/
jslet.ui.TextMeasurer = function () {
	var rule,felement = document.body,felementWidth;

	var lastText = null;
	
	var createRule = function () {
		if (!rule) {
			rule = document.createElement('div');
			document.body.appendChild(rule);
			rule.style.position = 'absolute';
			rule.style.left = '-9999px';
			rule.style.top = '-9999px';
			rule.style.display = 'none';
			rule.style.margin = '0px';
			rule.style.padding = '0px';
			rule.style.overflow = 'hidden';
		}
		if (!felement) {
			felement = document.body;
		}
	};

	/**
	 * Set html element which to be used as rule. 
	 * 
	 * @param {Html Element} element 
	 */
	this.setElement = function (element) {
		felement = element;
		if (!felement) {
			return;
		}
		createRule();
		rule.style.fontSize = felement.style.fontSize;
		rule.style.fontStyle = felement.style.fontStyle;
		rule.style.fontWeight = felement.style.fontWeight;
		rule.style.fontFamily = felement.style.fontFamily;
		rule.style.lineHeight = felement.style.lineHeight;
		rule.style.textTransform = felement.style.textTransform;
		rule.style.letterSpacing = felement.style.letterSpacing;
	};

	this.setElementWidth = function (width) {
		felementWidth = width;
		if (!felement) {
			return;
		}
		if (width) {
			felement.style.width = width;
		} else {
			felement.style.width = '';
		}
	};

	function updateText(text){
		if (lastText != text) {
			rule.innerHTML = text;
		}
	}
	
	/**
	 * Get the display size of specified text
	 * 
	 * @param {String} text The text to be measured
	 * 
	 * @return {Integer} Display size, unit: px
	 */
	this.getSize = function (text) {
		createRule();
		updateText(text);
		var ruleObj = jQuery(rule);
		return {width:ruleObj.width(),height:ruleObj.height()};
	};

	/**
	 * Get the display width of specified text
	 * 
	 * @param {String} text The text to be measured
	 * 
	 * @return {Integer} Display width, unit: px
	 */
	this.getWidth = function (text) {
		return this.getSize(text).width;
	};

	/**
	 * Get the display height of specified text
	 * 
	 * @param {String} text The text to be measured
	 * 
	 * @return {Integer} Display height, unit: px
	 */
	this.getHeight = function (text) {
		return this.getSize(text).height;
	};
};

jslet.ui.textMeasurer = new jslet.ui.TextMeasurer();

/**
 * Get css property value. Example:
 * <pre><code>
 * var width = jslet.ui.getCssValue('fooClass', 'width'); //Return value like '100px' or '200em'
 * </code></pre>
 * 
 * @param {String} className Css class name.
 * @param {String} styleName style name
 * 
 * @return {String} Css property value.
 */
jslet.ui.getCssValue = function(className, styleName){
	var odiv = document.createElement('div');
	odiv.className = className;
	odiv.style.display = 'none';
	document.body.appendChild(odiv);
	var result = jQuery(odiv).css(styleName);
	
	document.body.removeChild(odiv);
	return result;
};

jslet.ui.setEditableStyle = function(formElement, disabled, readOnly, onlySetStyle, required) {
	if(!onlySetStyle) {
		formElement.disabled = disabled;
		formElement.readOnly = readOnly;
	}
	var jqEl = jQuery(formElement);
	if(disabled || readOnly) {
		if (!jqEl.hasClass('jl-readonly')) {
			jqEl.addClass('jl-readonly');
			jqEl.removeClass('jl-ctrl-required');
		}
	} else {
		jqEl.removeClass('jl-readonly');
		if(required) {
			jqEl.addClass('jl-ctrl-required');
		}
	}
};

/**
 * Get system scroll bar width
 * 
 * @return {Integer} scroll bar width
 */
jslet.scrollbarSize = function() {
	var parent, child, width, height;

	if (width === undefined) {
		parent = jQuery('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo('body');
		child = parent.children();
		width = child.innerWidth() - child.height(99).innerWidth();
		parent.remove();
	}

	return width;
};


/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class Accordion. Example:
 * <pre><code>
 * var jsletParam = {type:"Accordion",selectedIndex:1,items:[{caption:"Caption1"},{caption:"Caption2"}]};
 * //1. Declaring:
 *	&lt;div data-jslet='jsletParam' style="width: 300px; height: 400px;">
 *     &lt;div>content1&lt;/div>
 *     &lt;div>content2&lt;/div>
 *    &lt;/div>
 *  
 *  //2. Binding
 *    &lt;div id='ctrlId'>
 *      &lt;div>content1&lt;/div>
 *      &lt;div>content2&lt;/div>
 *    &lt;/div>
 *    //Js snippet
 *    var el = document.getElementById('ctrlId');
 *    jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *    jslet.ui.createControl(jsletParam, document.body);
 *
 * </code></pre>
 */
"use strict";
jslet.ui.Accordion = jslet.Class.create(jslet.ui.Control, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.el = el;
		Z.allProperties = 'styleClass,selectedIndex,onChanged,items';

		Z._selectedIndex = 0;
		
		Z._onChanged = null;
		
		/**
		 * Array of accordion items,like: [{caption: 'cap1'},{caption: 'cap2'}]
		 */
		Z._items = null;
		
		$super(el, params);
	},

	/**
	 * Selected index.
	 * 
	 * @param {Integer or undefined} index selected index.
	 * @return {this or Integer}
	 */
	selectedIndex: function(index) {
		if(index === undefined) {
			return this._selectedIndex;
		}
		jslet.Checker.test('Accordion.selectedIndex', index).isGTEZero();
		this._selectedIndex = index;
	},
	
	/**
	 * Fired when user changes accordion panel.
	 * Pattern: 
	 *	function(index){}
	 *	//index: Integer
	 *
	 * @param {Function or undefined} onChanged Accordion panel changed event handler.
	 * @return {this or Function}
	 */
	onChanged: function(onChanged) {
		if(onChanged === undefined) {
			return this._onChanged;
		}
		jslet.Checker.test('Accordion.onChanged', onChanged).isFunction();
		this._onChanged = onChanged;
	},
	
	/**
	 * Accordion items.
	 * Pattern:
	 * [{caption:'item1'},...]
	 * 
	 * @param {PlanObject[] or undefined} items
	 * @return {this or PlanObject[]} 
	 */
	items: function(items) {
		if(items === undefined) {
			return this._items;
		}
		jslet.Checker.test('Accordion.items', items).isArray();
		var item;
		for(var i = 0, len = items.length; i < len; i++) {
			item = items[i];
			jslet.Checker.test('Accordion.items.caption', item.caption).isString().required();
		}
		this._items = items;
	},
	
	/**
	 * @override
	 */
	bind: function () {
		this.renderAll();
	},

	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this;
		var jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-accordion')) {
			jqEl.addClass('jl-accordion jl-border-box jl-round5');
		}
		var panels = jqEl.find('>div'), jqCaption, headHeight = 0, item;

		var captionCnt = Z._items ? Z._items.length - 1: -1, caption;
		panels.before(function(index) {
			if (index <= captionCnt) {
				caption = Z._items[index].caption;
			} else {
				caption = 'caption' + index;
			}
			return '<button class="btn btn-default jl-accordion-head btn-sm" jsletindex = "' + index + '">' + caption + '</button>';
		});

		var jqCaptions = jqEl.find('>.jl-accordion-head');
		jqCaptions.click(Z._doCaptionClick);
		
		headHeight = jqCaptions.outerHeight() * panels.length;
		var contentHeight = jqEl.innerHeight() - headHeight-1;
		
		panels.wrap('<div class="jl-accordion-body" style="height:'+contentHeight+'px;display:none"></div>');
        Z.setSelectedIndex(Z._selectedIndex, true);
	},
	
	_doCaptionClick: function(event){
		var jqCaption = jQuery(event.currentTarget),
			Z = jslet.ui.findJsletParent(jqCaption[0]).jslet,
			k = parseInt(jqCaption.attr('jsletindex'));
		Z.setSelectedIndex(k);
	},
	
	/**
	 * Set selected index
	 * 
	 * @param {Integer} index Panel index, start at 0.
	 */
	setSelectedIndex: function(index, isRenderAll){
		if (!index) {
			index = 0;
		}
		var Z = this;
		var jqBodies = jQuery(Z.el).find('>.jl-accordion-body');
		var pnlCnt = jqBodies.length - 1;
		if (index > pnlCnt) {
			return;
		}

		if (Z._selectedIndex == index && index < pnlCnt){
			jQuery(jqBodies[index]).slideUp('fast');
			if(!isRenderAll || isRenderAll && index > 0) {
				index++;
			}
			jQuery(jqBodies[index]).slideDown('fast');
			Z._selectedIndex = index;
			if (Z._onChanged){
				Z._onChanged.call(this, index);
			}
			return;
		}
		if (Z._selectedIndex >= 0 && Z._selectedIndex != index) {
			jQuery(jqBodies[Z._selectedIndex]).slideUp('fast');
		}
		jQuery(jqBodies[index]).slideDown('fast');
		Z._selectedIndex = index;
		if (Z._onChanged){
			Z._onChanged.call(this, index);
		}
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var jqEl = jQuery(this.el);
		jqEl.find('>.jl-accordion-head').off();
		$super();
	}
});
jslet.ui.register('Accordion', jslet.ui.Accordion);
jslet.ui.Accordion.htmlTemplate = '<div></div>';

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class Calendar. Example:
 * <pre><code>
 *  var jsletParam = {type:"Calendar"};
 *  //1. Declaring:
 *    &lt;div data-jslet='type:"Calendar"' />
 *
 *  //2. Binding
 *    &lt;div id='ctrlId' />
 *    //js snippet 
 *    var el = document.getElementById('ctrlId');
 *    jslet.ui.bindControl(el, jsletParam);
 *	
 *  //3. Create dynamically
 *    jslet.ui.createControl(jsletParam, document.body);
 *
 * </code></pre>
 */
"use strict";
jslet.ui.Calendar = jslet.Class.create(jslet.ui.Control, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.el = el;
		Z.allProperties = 'styleClass,value,onDateSelected,minDate,maxDate';

		Z._value = null;
		
		Z._onDateSelected = null;
		
		Z._minDate = null;

		Z._maxDate = null;
		
		Z._currYear = 0;
		Z._currMonth = 0;
		Z._currDate = 0;
		
		$super(el, params);
	},

	/**
	 * Calendar value.
	 * 
	 * @param {Date or undefined} value calendar value.
	 * @param {Date or undefined}
	 */
	value: function(value) {
		if(value === undefined) {
			return this._value;
		}
		jslet.Checker.test('Calendar.value', value).isDate();
		this._value = value;
	},
	
	/**
	 * Set or get minimum date of calendar range.
	 * 
	 * @param {Date or undefined} minDate minimum date of calendar range 
	 * @return {this or Date}
	 */
	minDate: function(minDate) {
		if(minDate === undefined) {
			return this._minDate;
		}
		jslet.Checker.test('Calendar.minDate', minDate).isDate();
		this._minDate = minDate;
	},
	
	/**
	 * Set or get maximum date of calendar range.
	 * 
	 * @param {Date or undefined} maxDate maximum date of calendar range 
	 * @return {this or Date}
	 */
	maxDate: function(maxDate) {
		if(maxDate === undefined) {
			return this._maxDate;
		}
		jslet.Checker.test('Calendar.maxDate', maxDate).isDate();
		this._maxDate = maxDate;
	},
		
	/**
	 * Fired when user select a date.
	 * Pattern: 
	 *	function(value){}
	 *	//value: Date
	 *
	 * @param {Function or undefined} onDateSelected Date selected event handler.
	 * @return {this or Function}
	 */
	onDateSelected: function(onDateSelected) {
		if(onDateSelected === undefined) {
			return this._onDateSelected;
		}
		jslet.Checker.test('Calendar.onDateSelected', onDateSelected).isFunction();
		this._onDateSelected = onDateSelected;
	},
	
	/**
	 * @override
	 */
	bind: function () {
		this.renderAll();
	},

	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this,
			jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-calendar')) {
			jqEl.addClass('jl-calendar panel panel-default');
		}
		var template = ['<div class="jl-cal-header">',
			'<a class="jl-cal-btn jl-cal-yprev" title="', jslet.locale.Calendar.yearPrev,
			'" href="javascript:;">&lt;&lt;</a><a href="javascript:;" class="jl-cal-btn jl-cal-mprev" title="', jslet.locale.Calendar.monthPrev, '">&lt;',
			'</a><a href="javascript:;" class="jl-cal-title"></a><a href="javascript:;" class="jl-cal-btn jl-cal-mnext" title="', jslet.locale.Calendar.monthNext, '">&gt;',
			'</a><a href="javascript:;" class="jl-cal-btn jl-cal-ynext" title="', jslet.locale.Calendar.yearNext, '">&gt;&gt;</a>',
		'</div>',
		'<div class="jl-cal-body">',
			'<table cellpadding="0" cellspacing="0">',
				'<thead><tr><th class="jl-cal-weekend">',
				jslet.locale.Calendar.Sun,
					'</th><th>',
					jslet.locale.Calendar.Mon,
						'</th><th>',
					jslet.locale.Calendar.Tue,
						'</th><th>',
					jslet.locale.Calendar.Wed,
						'</th><th>',
					jslet.locale.Calendar.Thu,
						'</th><th>',
					jslet.locale.Calendar.Fri,
						'</th><th class="jl-cal-weekend">',
					jslet.locale.Calendar.Sat,
						'</th></tr></thead><tbody>',
						'<tr><td class="jl-cal-weekend"><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td class="jl-cal-weekend"><a href="javascript:;"></a></td></tr>',
						'<tr><td class="jl-cal-weekend"><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td class="jl-cal-weekend"><a href="javascript:;"></a></td></tr>',
						'<tr><td class="jl-cal-weekend"><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td class="jl-cal-weekend"><a href="javascript:;"></a></td></tr>',
						'<tr><td class="jl-cal-weekend"><a href="javascript:;"></a></td><td><a href="javascript:;" class="jl-cal-disable"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td class="jl-cal-weekend"><a href="javascript:;"></a></td></tr>',
						'<tr><td class="jl-cal-weekend"><a href="javascript:;"></a></td><td><a href="javascript:;" class="jl-cal-disable"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td class="jl-cal-weekend"><a href="javascript:;"></a></td></tr>',
						'<tr><td class="jl-cal-weekend"><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td><a href="javascript:;"></a></td><td class="jl-cal-weekend"><a href="javascript:;"></a></td></tr>',
						'</tbody></table></div><div class="jl-cal-footer"><a class="jl-cal-today" href="javascript:;">', jslet.locale.Calendar.today, '</a></div>'];

		jqEl.html(template.join(''));
		var jqTable = jqEl.find('.jl-cal-body table');
		Z._currYear = -1;
		jqTable.on('click', Z._doTableClick);
		
		var dvalue = Z._value && jslet.isDate(Z._value) ? Z._value : new Date();
		this.setValue(dvalue);
		jqEl.find('.jl-cal-today').click(function (event) {
			var d = new Date();
			Z.setValue(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
			Z._fireSelectedEvent();
		});
		
		jqEl.find('.jl-cal-yprev').click(function (event) {
			Z.incYear(-1);
		});
		
		jqEl.find('.jl-cal-mprev').click(function (event) {
			Z.incMonth(-1);
		});
		
		jqEl.find('.jl-cal-ynext').click(function (event) {
			Z.incYear(1);
		});
		
		jqEl.find('.jl-cal-mnext').click(function (event) {
			Z.incMonth(1);
		});
		
		jqEl.on('keydown', function(event){
			var ctrlKey = event.ctrlKey,
				keyCode = event.keyCode;
			var delta = 0;
			if(keyCode == jslet.ui.KeyCode.UP) {
				if(ctrlKey) {
					Z.incYear(-1);
				} else {
					Z.incDate(-7);
				}
				event.preventDefault();
				return;
			} 
			if(keyCode == jslet.ui.KeyCode.DOWN) {
				if(ctrlKey) {
					Z.incYear(1);
				} else {
					Z.incDate(7);
				}
				event.preventDefault();
				return;
			}
			if(keyCode == jslet.ui.KeyCode.LEFT) {
				if(ctrlKey) {
					Z.incMonth(-1);
				} else {
					Z.incDate(-1);
				}
				event.preventDefault();
				return;
			}
			if(keyCode == jslet.ui.KeyCode.RIGHT) {
				if(ctrlKey) {
					Z.incMonth(1);
				} else {
					Z.incDate(1);
				}
				event.preventDefault();
				return;
			}
		});
	},
	
	_getNotNullDate: function() {
		var value =this._value;
		if(!value) {
			value = new Date();
		}
		return value;
	},
	
	incDate: function(deltaDay) {
		var value = this._getNotNullDate();
		value.setDate(value.getDate() + deltaDay);
		this.setValue(value);
	},
	
	incMonth: function(deltaMonth) {
		var value = this._getNotNullDate(),
			oldDate = value.getDate();
		value.setMonth(value.getMonth() + deltaMonth);
		if(oldDate >=29) {
			var newDate = value.getDate();
			if(oldDate != newDate) {
				value = new Date(value.getFullYear(), value.getMonth(), 1) - 24*3600*1000;
				value = new Date(value);
			}
		}
		this.setValue(value);
	},
	
	incYear: function(deltaYear) {
		var value = this._getNotNullDate(),
			oldDate = value.getDate();
		value.setFullYear(value.getFullYear() + deltaYear);
		if(oldDate >=29) {
			var newDate = value.getDate();
			if(oldDate != newDate) {
				value = new Date(value.getFullYear(), value.getMonth(), 1) - 24*3600*1000;
				value = new Date(value);
			}
		}
		this.setValue(value);
	},
	
	_innerSetValue: function(value) {
		var Z = this,
			oldValue = Z._getNotNullDate();
		if(value) { //Overwrite Year/Month/Date part, keep time part.
			oldValue.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
		}
		Z._value = oldValue;
	},
	
	/**
	 * Set date value of calendar.
	 * 
	 * @param {Date} value Calendar date
	 */
	setValue: function (value) {
		if (!value) {
			return;
		}

		var Z = this;
		if (Z._minDate && value < Z._minDate) {
			value = new Date(Z._minDate.getTime());
		}
		if (Z._maxDate && value > Z._maxDate) {
			value = new Date(Z._maxDate.getTime());
		}
		Z._innerSetValue(value);
		var y = value.getFullYear(), 
			m = value.getMonth();
		if (Z._currYear == y && Z._currMonth == m) {
			Z._setCurrDateCls();
		} else {
			Z._refreshDateCell(y, m);
		}
	},

	focus: function() {
		var Z = this,
			jqEl = jQuery(Z.el);
		jqEl.find('.jl-cal-current')[0].focus();

	},
	
	_checkNaviState: function () {
		var Z = this,
			jqEl = jQuery(Z.el), flag, btnToday;
		if (Z._minDate) {
			var minY = Z._minDate.getFullYear(),
				minM = Z._minDate.getMonth(),
				btnYearPrev = jqEl.find('.jl-cal-yprev')[0];
			flag = (Z._currYear <= minY);
			btnYearPrev.style.visibility = (flag ? 'hidden' : 'visible');

			flag = (Z._currYear == minY && Z._currMonth <= minM);
			var btnMonthPrev = jqEl.find('.jl-cal-mprev')[0];
			btnMonthPrev.style.visibility = (flag ? 'hidden' : 'visible');

			flag = (Z._minDate > new Date());
			btnToday = jqEl.find('.jl-cal-today')[0];
			btnToday.style.visibility = (flag ? 'hidden' : 'visible');
		}

		if (Z._maxDate) {
			var maxY = Z._maxDate.getFullYear(),
				maxM = Z._maxDate.getMonth(),
				btnYearNext = jqEl.find('.jl-cal-ynext')[0];
			flag = (Z._currYear >= maxY);
			btnYearNext.jslet_disabled = flag;
			btnYearNext.style.visibility = (flag ? 'hidden' : 'visible');

			flag = (Z._currYear == maxY && Z._currMonth >= maxM);
			var btnMonthNext = jqEl.find('.jl-cal-mnext')[0];
			btnMonthNext.jslet_disabled = flag;
			btnMonthNext.style.visibility = (flag ? 'hidden' : 'visible');

			flag = (Z._maxDate < new Date());
			btnToday = jqEl.find('.jl-cal-today')[0];
			btnToday.style.visibility = (flag ? 'hidden' : 'visible');
		}
	},

	_refreshDateCell: function (year, month) {
		var Z = this,
			jqEl = jQuery(Z.el),
			monthnames = jslet.locale.Calendar.monthNames,
			mname = monthnames[month],
			otitle = jqEl.find('.jl-cal-title')[0];
		otitle.innerHTML = mname + ',' + year;
		var otable = jqEl.find('.jl-cal-body table')[0],
			rows = otable.tBodies[0].rows,
			firstDay = new Date(year, month, 1),
			w1 = firstDay.getDay(),
			oneDayMs = 86400000, //24 * 60 * 60 * 1000
			date = new Date(firstDay.getTime() - (w1 + 1) * oneDayMs);
		date = new Date(date.getFullYear(), date.getMonth(), date.getDate());

		var rowCnt = rows.length, otr, otd, m, oa;
		for (var i = 1; i <= rowCnt; i++) {
			otr = rows[i - 1];
			for (var j = 1, tdCnt = otr.cells.length; j <= tdCnt; j++) {
				otd = otr.cells[j - 1];
				date = new Date(date.getTime() + oneDayMs);
				oa = otd.firstChild;
				if (Z._minDate && date < Z._minDate || Z._maxDate && date > Z._maxDate) {
					oa.innerHTML = '';
					otd.jslet_date_value = null;
					continue;
				} else {
					oa.innerHTML = date.getDate();
					otd.jslet_date_value = date;
				}
				m = date.getMonth();
				if (m != month) {
					jQuery(otd).addClass('jl-cal-disable');
				} else {
					jQuery(otd).removeClass('jl-cal-disable');
				}
			} //end for j
		} //end for i
		Z._currYear = year;
		Z._currMonth = month;
		Z._setCurrDateCls();
		Z._checkNaviState();
	},
	
	_fireSelectedEvent: function() {
		var Z = this;
		if (Z._onDateSelected) {
			Z._onDateSelected.call(Z, Z._value);
		}
	},
	
	_doTableClick: function (event) {
		event = jQuery.event.fix( event || window.event );
		var node = event.target,
			otd = node.parentNode;
		
		if (otd && otd.tagName && otd.tagName.toLowerCase() == 'td') {
			if (!otd.jslet_date_value) {
				return;
			}
			var el = jslet.ui.findFirstParent(otd, function (node) { return node.jslet; });
			var Z = el.jslet;
			Z._innerSetValue(otd.jslet_date_value);
			Z._setCurrDateCls();
			try{
				otd.firstChild.focus();
			}catch(e){
			}
			Z._fireSelectedEvent();
		}
	},

	_setCurrDateCls: function () {
		var Z = this;
		if (!jslet.isDate(Z._value)) {
			return;
		}
		var currM = Z._value.getMonth(),
			currY = Z._value.getFullYear(),
			currD = Z._value.getDate(),
			jqEl = jQuery(Z.el),
			otable = jqEl.find('.jl-cal-body table')[0],
			rows = otable.tBodies[0].rows,
			rowCnt = rows.length, otr, otd, m, d, y, date, jqLink;
		for (var i = 0; i < rowCnt; i++) {
			otr = rows[i];
			for (var j = 0, tdCnt = otr.cells.length; j < tdCnt; j++) {
				otd = otr.cells[j];
				date = otd.jslet_date_value;
				if (!date) {
					continue;
				}
				m = date.getMonth();
				y = date.getFullYear();
				d = date.getDate();
				jqLink = jQuery(otd.firstChild);
				if (y == currY && m == currM && d == currD) {
					if (!jqLink.hasClass('jl-cal-current')) {
						jqLink.addClass('jl-cal-current');
					}
					try{
						otd.firstChild.focus();
					} catch(e){
					}
				} else {
					jqLink.removeClass('jl-cal-current');
				}
			}
		}
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var jqEl = jQuery(this.el);
		jqEl.off();
		jqEl.find('.jl-cal-body table').off();
		jqEl.find('.jl-cal-today').off();
		jqEl.find('.jl-cal-yprev').off();
		jqEl.find('.jl-cal-mprev').off();
		jqEl.find('.jl-cal-mnext').off();
		jqEl.find('.jl-cal-ynext').off();
		$super();
	}
});
jslet.ui.register('Calendar', jslet.ui.Calendar);
jslet.ui.Calendar.htmlTemplate = '<div></div>';

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class FieldSet. Example:
 * <pre><code>
 *   //1. Declaring:
 *      &lt;div data-jslet='type:"FieldSet"' />
 *
 *  //2. Binding
 *      &lt;div id='ctrlId' />
 *      //Js snippet
 *      var jsletParam = {type:"FieldSet"};
 *      var el = document.getElementById('ctrlId');
 *      jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *      var jsletParam = {type:"FieldSet"};
 *      jslet.ui.createControl(jsletParam, document.body);
 *
 * </code></pre>
 */
"use strict";
jslet.ui.FieldSet = jslet.Class.create(jslet.ui.Control, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.el = el;
		Z.allProperties = 'styleClass,caption,collapsed';

		Z._caption = null; 
		
		Z._collapsed = false;
		
		$super(el, params);
	},

	/**
	 * Set or get caption of fieldset.
	 * 
	 * @param {String or undefined} caption caption of fieldset. 
	 * @return {this or String}
	 */
	caption: function(caption) {
		if(caption === undefined) {
			return this._caption;
		}
		jslet.Checker.test('FieldSet.caption', caption).isString();
		this._caption = caption;
	},

	/**
	 * Identify fieldset is collapsed or not.
	 * 
	 * @param {Boolean or undefined} collapsed true - fieldset is collapsed, false(default) - otherwise. 
	 * @return {this or Boolean}
	 */
	collapsed: function(collapsed) {
		if(collapsed === undefined) {
			return this._collapsed;
		}
		this._collapsed = collapsed ? true: false;
	},

	/**
	 * @override
	 */
	bind: function () {
		this.renderAll();
	},

	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this, jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-fieldset')) {
			jqEl.addClass('jl-fieldset jl-round5');
		}
		
		var tmpl = ['<legend class="jl-fieldset-legend">'];
		tmpl.push('<span class="jl-fieldset-title"><i class="fa fa-chevron-circle-up jl-fieldset-btn">');
		tmpl.push('<span>');
		tmpl.push(Z._caption);
		tmpl.push('</span></span></legend><div class="jl-fieldset-body"></div>');
		
		var nodes = Z.el.childNodes, 
			children = [],
			i, cnt;
		cnt = nodes.length;
		for(i = 0; i < cnt; i++){
			children.push(nodes[i]);
		}

		jqEl.html(tmpl.join(''));
		var obody = jQuery(Z.el).find('.jl-fieldset-body')[0];
		cnt = children.length;
		for(i = 0; i < cnt; i++){
			obody.appendChild(children[i]);
		}
		
		jqEl.find('.jl-fieldset-btn').click(jQuery.proxy(Z._doExpandBtnClick, this));
	},
	
	_doExpandBtnClick: function(){
		var Z = this, jqEl = jQuery(Z.el);
		var fsBody = jqEl.find('.jl-fieldset-body');
		if (!Z._collapsed){
			fsBody.slideUp();
			jqEl.addClass('jl-fieldset-collapse');
			jqEl.find('.jl-fieldset-btn').addClass('fa-chevron-circle-down');
		}else{
			fsBody.slideDown();
			jqEl.removeClass('jl-fieldset-collapse');
			jqEl.find('.jl-fieldset-btn').removeClass('fa-chevron-circle-down');
		}
		fsBody[0].focus();
		Z._collapsed = !Z._collapsed;
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var jqEl = jQuery(this.el);
		jqEl.find('input.jl-fieldset-btn').off();
		$super();
	}
});

jslet.ui.register('FieldSet', jslet.ui.FieldSet);
jslet.ui.FieldSet.htmlTemplate = '<fieldset></fieldset>';

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
* Menu Manager
*/
"use strict";
jslet.ui.menuManager = {};
/**
 * Global menu id collection, array of string
 */
jslet.ui.menuManager._menus = [];

/**
 * Register menu id
 * 
 * @param {String} menuid Menu control id
 */
jslet.ui.menuManager.register = function (menuid) {
	jslet.ui.menuManager._menus.push(menuid);
};

/**
 * Unregister menu id
 * 
 * @param {String} menuid Menu control id
 */
jslet.ui.menuManager.unregister = function (menuid) {
	for (var i = 0, len = this._menus.length; i < len; i++) {
		jslet.ui.menuManager._menus.splice(i, 1);
	}
};

/**
 * Hide all menu item.
 */
jslet.ui.menuManager.hideAll = function (event) {
	var id, menu, menus = jslet.ui.menuManager._menus;
	for (var i = 0, len = menus.length; i < len; i++) {
		id = menus[i];
		menu = jslet('#'+id);
		if (menu) {
			menu.hide();
		}
	}
	jslet.ui.menuManager.menuBarShown = false;
	jslet.ui.menuManager._contextObject = null;
};

jQuery(document).on('mousedown', jslet.ui.menuManager.hideAll);

/**
 * @class Calendar. Example:
 * <pre><code>
 *  var jsletParam = { type: 'MenuBar', onItemClick: globalMenuItemClick, items: [
 *		{ name: 'File', items: [
 *         { id: 'new', name: 'New Tab', iconClass: 'icon1' }]
 *      }]};
 *
 *  //1. Declaring:
 *    &lt;div data-jslet='jsletParam' />
 *
 *  //2. Binding
 *    &lt;div id='ctrlId' />
 *    //js snippet:
 *    var el = document.getElementById('ctrlId');
 *    jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *    jslet.ui.createControl(jsletParam, document.body);
 *
 * </code></pre>
 */
jslet.ui.MenuBar = jslet.Class.create(jslet.ui.Control, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.el = el;
		Z.allProperties = 'styleClass,onItemClick,items';

		Z._onItemClick = null;
		
		Z._items = null;
		$super(el, params);
	},

	/**
	 * Get or set menuItem click event handler
	 * Pattern: 
	 * function(menuId){}
	 *   //menuId: String
	 * 
	 * @param {Function or undefined} onItemClick menuItem click event handler
	 * @param {this or Function}
	 */
	onItemClick: function(onItemClick) {
		if(onItemClick === undefined) {
			return this._onItemClick;
		}
		jslet.Checker.test('MenuBar.onItemClick', onItemClick).isFunction();
		this._onItemClick = onItemClick;
	},
	
	/**
	 * Get or set menu items configuration.
	 * 
	 * menu item's properties: 
	 * id, //{String} Menu id
	 * name, //{String} Menu name 
	 * onClick, //{Event} Item click event, 
	 *   Pattern: function(event){}
	 *   
	 * disabled, //{Boolean} Menu item is disabled or not
	 * iconClass,  //{String} Icon style class 
	 * disabledIconClass, //{String} Icon disabled style class
	 * itemType, //{String} Menu item type, optional value: null, radio, check
	 * checked, //{Boolean} Menu item is checked or not,  only work when itemType equals 'radio' or 'check'
	 * group, //{String} Group name, only work when itemType equals 'radio'
	 * items, //{Array} Sub menu items
	 * 
	 * @param {PlanObject[] or undefined} items menu items.
	 * @param {this or PlanObject[]}
	 */
	items: function(items) {
		if(items === undefined) {
			return this._items;
		}
		jslet.Checker.test('MenuBar.items', items).isArray();
		var item;
		for(var i = 0, len = items.length; i < len; i++) {
			item = items[i];
			jslet.Checker.test('MenuBar.items.name', item.name).isString().required();
		}
		this._items = items;
	},
	
	/**
	 * @override
	 */
	bind: function () {
		this.renderAll();
	},

	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this;
		var jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-menubar')) {
			jqEl.addClass('jl-menubar jl-unselectable jl-bgcolor jl-round5');
		}

		Z._createMenuBar();
		jqEl.on('mouseout',function (event) {
			if (Z._preHoverItem && !jslet.ui.menuManager.menuBarShown) {
				jQuery(Z._preHoverItem).removeClass('jl-menubar-item-hover');
			}
		});
	},

	_createMenuBar: function () {
		var Z = this;
		if (Z.isPopup) {
			return;
		}

		for (var i = 0, cnt = Z._items.length, item; i < cnt; i++) {
			item = Z._items[i];
			Z._createBarItem(Z.el, item, Z._menubarclick);
		}
	},

	_showSubMenu: function (omi) {
		var Z = omi.parentNode.jslet,
			itemCfg = omi.jsletvar;
		if (!itemCfg.items) {
			return;
		}
		if (!itemCfg.subMenu) {
			var el = document.createElement('div');
			document.body.appendChild(el);
			itemCfg.subMenu = new jslet.ui.Menu(el, { onItemClick: Z._onItemClick, items: itemCfg.items });
		}
		var jqBody = jQuery(document.body),
			bodyMTop = parseInt(jqBody.css('margin-top')),
			bodyMleft = parseInt(jqBody.css('margin-left')),
			jqMi = jQuery(omi), 
			pos = jqMi.offset(), 
			posX = pos.left;
		if (jslet.locale.isRtl) {
			posX +=  jqMi.width() + 10;
		}
		itemCfg.subMenu.show(posX, pos.top + jqMi.height());
		jslet.ui.menuManager.menuBarShown = true;
		Z._activeMenuItem = omi;
		// this.parentNode.parentNode.jslet.ui._createMenuPopup(cfg);
	},

	_createBarItem: function (obar, itemCfg) {
		if (itemCfg.visible !== undefined && !itemCfg.visible) {
			return;
		}
		var omi = document.createElement('div');
		jQuery(omi).addClass('jl-menubar-item');
		omi.jsletvar = itemCfg;
		var Z = this, jqMi = jQuery(omi);
		jqMi.on('click',function (event) {
			var cfg = this.jsletvar;
			if(!cfg.items) {
				if (cfg.onClick) {
					cfg.onClick.call(Z, cfg.id || cfg.name);
				} else {
					if (Z._onItemClick)
						Z._onItemClick.call(Z, cfg.id || cfg.name);
				}
				jslet.ui.menuManager.hideAll();
			} else {
				//				if (Z._activeMenuItem != this || jslet.ui.menuManager.menuBarShown)
				Z._showSubMenu(this);
			}
			event.stopPropagation();
			event.preventDefault();
		});

		jqMi.on('mouseover', function (event) {
			if (Z._preHoverItem) {
				jQuery(Z._preHoverItem).removeClass('jl-menubar-item-hover');
			}
			Z._preHoverItem = this;
			jQuery(this).addClass('jl-menubar-item-hover');
			if (jslet.ui.menuManager.menuBarShown) {
				jslet.ui.menuManager.hideAll();
				Z._showSubMenu(this);
				jslet.ui.menuManager._inPopupMenu = true;
			}
		});
		
		var template = [];
		template.push('<a class="jl-focusable-item" href="javascript:void(0)">');
		template.push(itemCfg.name);
		template.push('</a>');
		
		omi.innerHTML = template.join('');
		obar.appendChild(omi);
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this;
		Z._activeMenuItem = null;
		Z._preHoverItem = null;
		Z._menubarclick = null;
		Z._onItemClick = null;
		var jqEl = jQuery(Z.el);
		jqEl.off();
		jqEl.find('.jl-menubar-item').off();
		jqEl.find('.jl-menubar-item').each(function(){
			var omi = this;
			if (omi.jsletvar){
				omi.jsletvar.subMenu = null;
				omi.jsletvar = null;
			}
		});
		$super();
	}
});
jslet.ui.register('MenuBar', jslet.ui.MenuBar);
jslet.ui.MenuBar.htmlTemplate = '<div></div>';

/**
 * @class Calendar. Example:
 * <pre><code>
 *  var jsletParam = { type: 'Menu', onItemClick: globalMenuItemClick, items: [
 *     { id: 'back', name: 'Backward', iconClass: 'icon1' },
 *     { id: 'go', name: 'Forward', disabled: true },
 *     { name: '-' }]};
 *
 *  //1. Declaring:
 *     &lt;div data-jslet='jsletParam' />
 *
 *  //2. Binding
 *     &lt;div id='menu1' />
 *     //js snippet:
 *     var el = document.getElementById('menu1');
 *     jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *     jslet.ui.createControl(jsletParam, document.body);
 * //Use the below code to show context menu
 * jslet('#ctrlId').showContextMenu(event);
 * //Show menu at the specified position
 * jslet('#ctrlId').show(left, top);
 * 
 * </code></pre>
 */
/***
* Popup Menu
*/
jslet.ui.Menu = jslet.Class.create(jslet.ui.Control, {
	_onItemClick: undefined,
	_items:undefined,
	_invoker: null,
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.el = el;
		Z.allProperties = 'onItemClick,items,invoker'; //'invoker' is used for inner
		//items is an array, menu item's properties: id, name, onClick,disabled,iconClass,disabledIconClass,itemType,checked,group,items
		$super(el, params);
		Z._activeSubMenu = null;
	},

	/**
	 * Get or set menuItem click event handler
	 * Pattern: 
	 * function(menuId){}
	 *   //menuId: String
	 * 
	 * @param {Function or undefined} onItemClick menuItem click event handler
	 * @param {this or Function}
	 */
	onItemClick: function(onItemClick) {
		if(onItemClick === undefined) {
			return this._onItemClick;
		}
		jslet.Checker.test('Menu.onItemClick', onItemClick).isFunction();
		this._onItemClick = onItemClick;
	},
	
	/**
	 * Get or set menu items configuration.
	 * 
	 * menu item's properties: 
	 * id, //{String} Menu id
	 * name, //{String} Menu name 
	 * onClick, //{Event} Item click event, 
	 *   Pattern: function(event){}
	 *   
	 * disabled, //{Boolean} Menu item is disabled or not
	 * iconClass,  //{String} Icon style class 
	 * disabledIconClass, //{String} Icon disabled style class
	 * itemType, //{String} Menu item type, optional value: null, radio, check
	 * checked, //{Boolean} Menu item is checked or not,  only work when itemType equals 'radio' or 'check'
	 * group, //{String} Group name, only work when itemType equals 'radio'
	 * items, //{Array} Sub menu items
	 * 
	 * @param {PlanObject[] or undefined} items menu items.
	 * @param {this or PlanObject[]}
	 */
	items: function(items) {
		if(items === undefined) {
			return this._items;
		}
		jslet.Checker.test('Menu.items', items).isArray();
		var item;
		for(var i = 0, len = items.length; i < len; i++) {
			item = items[i];
			jslet.Checker.test('Menu.items.name', item.name).isString().required();
		}
		this._items = items;
	},
	
	invoker: function(invoker) {
		if(invoker === undefined) {
			return this._invoker;
		}
		this._invoker = invoker;
	},
	
	/**
	 * @override
	 */
	bind: function () {
		this.renderAll();
	},

	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this,
			jqEl = jQuery(Z.el),
			ele = Z.el;
		if (!jqEl.hasClass('jl-menu')) {
			jqEl.addClass('jl-menu');
		}
		ele.style.display = 'none';

		if (!ele.id) {
			ele.id = jslet.nextId();
		}

		jslet.ui.menuManager.register(ele.id);
		Z._createMenuPopup();
		jqEl.on('mousedown',function (event) {
			event = jQuery.event.fix( event || window.event );
			event.stopPropagation();
			event.preventDefault();
			return false;
		});

		jqEl.on('mouseover', function (event) {
			jslet.ui.menuManager._inPopupMenu = true;
			if (jslet.ui.menuManager.timerId) {
				window.clearTimeout(jslet.ui.menuManager.timerId);
			}
		});

		jqEl.on('mouseout', function (event) {
			jslet.ui.menuManager._inPopupMenu = false;
			jslet.ui.menuManager.timerId = window.setTimeout(function () {
				if (!jslet.ui.menuManager._inPopupMenu) {
					jslet.ui.menuManager.hideAll();
				}
				jslet.ui.menuManager.timerId = null;
			}, 800);
		});
	},

	/**
	 * Show menu at specified position.
	 * 
	 * @param {Integer} left Position left
	 * @param {Integer} top Position top
	 */
	show: function (left, top) {
		var Z = this, 
			jqEl = jQuery(Z.el),
			width = jqEl.outerWidth(),
			height = jqEl.outerHeight(),
			jqWin = jQuery(window),
			winWidth = jqWin.scrollLeft() + jqWin.width(),
			winHeight = jqWin.scrollTop() + jqWin.height();
			
		left = left || Z.left || 10;
		top = top || Z.top || 10;
		if (jslet.locale.isRtl) {
			left -= width;
		}
		if(left + width > winWidth) {
			left += winWidth - left - width - 1;
		}
		if(top + height > winHeight) {
			top += winHeight - top - height - 1;
		}
		if(left < 0) {
			left = 0;
		}
		if(top < 0) {
			top = 0;
		}
		Z.el.style.left = left + 'px';
		Z.el.style.top = parseInt(top) + 'px';
		Z.el.style.display = 'block';
		if (!Z.shadow) {
			Z.shadow = document.createElement('div');
			jQuery(Z.shadow).addClass('jl-menu-shadow');
			Z.shadow.style.width = width + 'px';
			Z.shadow.style.height = height + 'px';
			document.body.appendChild(Z.shadow);
		}
		Z.shadow.style.left = left + 1 + 'px';
		Z.shadow.style.top = top + 1 + 'px';
		Z.shadow.style.display = 'block';
	},

	/**
	 * Hide menu item and all its sub menu item.
	 */
	hide: function () {
		this.ctxElement = null;
		this.el.style.display = 'none';
		if (this.shadow) {
			this.shadow.style.display = 'none';
		}
	},

	/**
	 * Show menu on context menu. Example:
	 * <pre><code>
	 *  <div id="popmenu" oncontextmenu="popMenu(event);">
	 *	function popMenu(event) {
	 *	jslet("#popmenu").showContextMenu(event);
	 *  }
	 * </code></pre>
	 */
	showContextMenu: function (event, contextObj) {
		jslet.ui.menuManager.hideAll();

		event = jQuery.event.fix( event || window.event );
		jslet.ui.menuManager._contextObject = contextObj;
		this.show(event.pageX, event.pageY);
		event.preventDefault();
	},

	_createMenuPopup: function () {
		var panel = this.el,
			items = this._items, itemCfg, name, i, cnt;
		cnt = items.length;
		for (i = 0; i < cnt; i++) {
			itemCfg = items[i];
			if (!itemCfg.name) {
				continue;
			}
			name = itemCfg.name.trim();
			if (name != '-') {
				this._createMenuItem(panel, itemCfg);
			} else {
				this._createLine(panel, itemCfg);
			}
		}

		var w = jQuery(panel).width() - 2 + 'px',
			arrMi = panel.childNodes, node;
		cnt = arrMi.length;
		for (i = 0; i < cnt; i++) {
			node = arrMi[i];
			if (node.nodeType == 1) {
				node.style.width = w;
			}
		}
		document.body.appendChild(panel);
	},

	_ItemClick: function (sender, cfg) {
		//has sub menu items
		if (cfg.items) {
			this._showSubMenu(sender, cfg);
			return;
		}
		if (cfg.disabled) {
			return;
		}
		var contextObj = jslet.ui.menuManager._contextObject || this;
		if (cfg.onClick) {
			cfg.onClick.call(contextObj, cfg.id || cfg.name, cfg.checked);
		} else {
			if (this._onItemClick) {
				this._onItemClick.call(contextObj, cfg.id || cfg.name, cfg.checked);
			}
		}
		if (cfg.itemType == 'check' || cfg.itemType == 'radio') {
			jslet.ui.Menu.setChecked(sender, !cfg.checked);
		}
		jslet.ui.menuManager.hideAll();
	},

	_hideSubMenu: function () {
		var Z = this;
		if (Z._activeSubMenu) {
			Z._activeSubMenu._hideSubMenu();
			Z._activeSubMenu.hide();
			Z._activeSubMenu.el.style.zIndex = parseInt(jQuery(Z.el).css('zIndex'));
		}
	},

	_showSubMenu: function (sender, cfg, delayTime) {
		var Z = this;
		var func = function () {
			Z._hideSubMenu();
			if (!cfg.subMenu) {
				return;
			}
			var jqPmi = jQuery(sender),
				pos = jqPmi.offset(), 
				x = pos.left;
			if (!jslet.locale.isRtl) {
				x += jqPmi.width();
			}

			cfg.subMenu.show(x - 2, pos.top);
			cfg.subMenu.el.style.zIndex = parseInt(jQuery(Z.el).css('zIndex')) + 1;
			Z._activeSubMenu = cfg.subMenu;
		};
		if (delayTime) {
			window.setTimeout(func, delayTime);
		} else {
			func();
		}
	},

	_ItemOver: function (sender, cfg) {
		if (this._activeSubMenu) {
			this._showSubMenu(sender, cfg, 200);
		}
	},

	_createMenuItem: function (container, itemCfg, defaultClickHandler) {
		//id, name, onClick,disabled,iconClass,disabledIconClass,itemType,checked,group,items,subMenuId
		var isCheckBox = false, 
			isRadioBox = false,
			itemType = itemCfg.itemType;
		if (itemType) {
			isCheckBox = (itemType == 'check');
			isRadioBox = (itemType == 'radio');
		}
		if (isCheckBox) {
			itemCfg.iconClass = 'jl-menu-check';
			itemCfg.disabledIconClass = 'jl-menu-check-disabled';
		}
		if (isRadioBox) {
			itemCfg.iconClass = 'jl-menu-radio';
			itemCfg.disabledIconClass = 'jl-menu-radio-disabled';
		}
		if (itemCfg.items) {
			itemCfg.disabled = false;
		}
		var mi = document.createElement('div'), Z = this, jqMi = jQuery(mi);
		jqMi.addClass('jl-menu-item ' + (itemCfg.disabled ? 'jl-menu-disabled' : 'jl-menu-enabled'));

		if (!itemCfg.id) {
			itemCfg.id = jslet.nextId();
		}
		mi.id = itemCfg.id;
		mi.jsletvar = itemCfg;
		jqMi.on('click', function (event) {
			Z._ItemClick(this, this.jsletvar);
			event.stopPropagation();
			event.preventDefault();
		});

		jqMi.on('mouseover', function (event) {
			Z._ItemOver(this, this.jsletvar);
			if (Z._preHoverItem) {
				jQuery(Z._preHoverItem).removeClass('jl-menu-item-hover');
			}
			Z._preHoverItem = this;
			if (!this.jsletvar.disabled) {
				jQuery(this).addClass('jl-menu-item-hover');
			}
		});

		jqMi.on('mouseout', function (event) {
			if (!this.jsletvar.subMenu) {
				jQuery(this).removeClass('jl-menu-item-hover');
			}
		});

		var template = [];
		template.push('<span class="jl-menu-icon-placeholder ');
		if ((isCheckBox || isRadioBox) && !itemCfg.checked) {
			//Empty 
		} else {
			if (itemCfg.iconClass) {
				template.push((!itemCfg.disabled || !itemCfg.disabledIconClass) ? itemCfg.iconClass : itemCfg.disabledIconClass);
			}
		}
		template.push('"></span>');

		if (itemCfg.items) {
			template.push('<div class="jl-menu-arrow"></div>');
		}

		template.push('<a  href="javascript:void(0)" class="jl-focusable-item jl-menu-content ');
		template.push(' jl-menu-content-left jl-menu-content-right');
		template.push('">');
		template.push(itemCfg.name);
		template.push('</a>');
		mi.innerHTML = template.join('');
		container.appendChild(mi);
		if (itemCfg.items) {
			var el = document.createElement('div');
			document.body.appendChild(el);
			itemCfg.subMenu = new jslet.ui.Menu(el, { onItemClick: Z._onItemClick, items: itemCfg.items, invoker: mi });
		}
	},

	_createLine: function (container, itemCfg) {
		var odiv = document.createElement('div');
		jQuery(odiv).addClass('jl-menu-line');
		container.appendChild(odiv);
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this, 
			jqEl = jQuery(Z.el);
		Z._activeSubMenu = null;
		jslet.ui.menuManager.unregister(Z.el.id);
		jqEl.off();
		jqEl.find('.jl-menu-item').each(function(){
			this.onmouseover = null;
			this.onclick = null;
			this.onmouseout = null;
		});
		
		$super();
	}
});

jslet.ui.register('Menu', jslet.ui.Menu);
jslet.ui.Menu.htmlTemplate = '<div></div>';

jslet.ui.Menu.setDisabled = function (menuId, disabled) {
	var jqMi;
	if (Object.isString(menuId)) {
		jqMi = jQuery('#'+menuId);
	} else {
		jqMi = jQuery(menuId);
	}
	var cfg = jqMi.context.jsletvar;
	if (cfg.items) {
		return;
	}
	if (disabled) {
		jqMi.removeClass('jl-menu-enabled');
		jqMi.addClass('jl-menu-disabled');
	} else {
		jqMi.removeClass('jl-menu-disabled');
		jqMi.addClass('jl-menu-enabled');
	}
	cfg.disabled = disabled;
};

jslet.ui.Menu.setChecked = function (menuId, checked) {
	var jqMi;
	if (typeof(menuId)==='string') {
		jqMi = jQuery('#' + menuId);
	} else {
		jqMi = jQuery(menuId);
	}
	var mi = jqMi.context,
		cfg = mi.jsletvar,
		itemType = cfg.itemType;
	if (itemType != 'check' && itemType != 'radio') {
		return;
	}
	if (itemType == 'radio') {
		if (cfg.checked && checked || !checked) {
			return;
		}
		var group = mi.group;
		//uncheck all radio button in the same group
		var allMi = mi.parentNode.childNodes;

		for (var i = 0, node, cfg1, icon, cnt = allMi.length; i < cnt; i++) {
			node = allMi[i];
			if (node == mi) {
				continue;
			}
			cfg1 = node.jsletvar;
			if (cfg1 && cfg1.itemType == 'radio' && cfg1.group == group) {
				icon = node.childNodes[0];
				if (cfg1.disabled) {
					jQuery(icon).removeClass(cfg1.disabledIconClass);
				} else {
					jQuery(icon).removeClass(cfg1.iconClass);
				}
				cfg1.checked = false;
			}
		}
	}

	var jqIcon = jQuery(mi.childNodes[0]);

	if (cfg.checked && !checked) {
		if (cfg.disabled) {
			jqIcon.removeClass(cfg.disabledIconClass);
		} else {
			jqIcon.removeClass(cfg.iconClass);
		}
	}
	if (!cfg.checked && checked) {
		if (cfg.disabled) {
			jqIcon.addClass(cfg.disabledIconClass);
		}else {
			jqIcon.addClass(cfg.iconClass);
		}
	}
	cfg.checked = checked;
};

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
* @class Overlay panel. Example:
* <pre><code>
*  var overlay = new jslet.ui.OverlayPanel(Z.el.parentNode);
*  overlay.setZIndex(999);
*  overlay.show();
* </code></pre>
* 
* @param {Html Element} container Html Element that OverlayPanel will cover.
* @param {String} color Color String.
*/
"use strict";
jslet.ui.OverlayPanel = function (container, color) {
	var odiv = document.createElement('div');
	jQuery(odiv).addClass('jl-overlay').on('click', function(event){
		event = jQuery.event.fix( event || window.event );
		var srcEle = event.target;
		if (jslet.ui.isChild(jslet.ui.PopupPanel.excludedElement,srcEle) ||
			jslet.ui.inPopupPanel(srcEle)) {
			return;
		}
		if (jslet.ui._activePopup) {
			jslet.ui._activePopup.hide();
		}
		event.stopPropagation();
		event.preventDefault();
	});
	
	if (color) {
		odiv.style.backgroundColor = color;
	}
	var left, top, width, height;
	if (!container) {
		var jqBody = jQuery(document.body);
		left = 0;
		top = 0;
		width = jqBody.width();
		height = jqBody.height();
	} else {
		width = jQuery(container).width();
		height = jQuery(container).height();
	}
	odiv.style.left = '0px';
	odiv.style.top = '0px';
	odiv.style.bottom = '0px';
	odiv.style.right = '0px';
	if (!container) {
		document.body.appendChild(odiv);
	} else {
		container.appendChild(odiv);
	}
	odiv.style.display = 'none';

	var oldResizeHanlder = null;
	if (!container) {
		oldResizeHanlder = window.onresize;

		window.onresize = function () {
			odiv.style.width = document.body.scrollWidth + 'px';
			odiv.style.height = document.body.scrollHeight + 'px';
		};
	} else {
		oldResizeHanlder = container.onresize;
		container.onresize = function () {
			var width = jQuery(container).width() - 12;
			var height = jQuery(container).height() - 12;
			odiv.style.width = width + 'px';
			odiv.style.height = height + 'px';
		};
	}

	this.overlayPanel = odiv;

	/**
	 * Show overlay panel
	 */
	this.show = function () {
		odiv.style.display = 'block';
		return odiv;
	};

	/**
	 * Hide overlay panel
	 */
	this.hide = function () {
		odiv.style.display = 'none';
		return odiv;
	};
	
	/**
	 * Set Z-index 
	 * 
	 * @param {Integer} zIndex Z-Index
	 */
	this.setZIndex = function(zIndex){
		this.overlayPanel.style.zIndex = zIndex;
	};

	this.destroy = function () {
		this.hide();
		if (!container) {
			window.onresize = oldResizeHanlder;
			document.body.removeChild(odiv);
		} else {
			container.onresize = oldResizeHanlder;
			container.removeChild(odiv);
		}
		jQuery(this.overlayPanel).off();
	};
};

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class Split Panel. Example:
 * <pre><code>
 * var jsletParam = {type:"SplitPanel",direction:"hori",floatIndex: 1};
 * //1. Declaring:
 *     &lt;div data-jslet='jsletParam' style="width: 300px; height: 400px;">
 *     &lt;div>content1&lt;/div>
 *     &lt;div>content2&lt;/div>
 *     &lt;/div>
 *     
 *  //2. Binding
 *     &lt;div id='ctrlId'>
 *       &lt;div>content1&lt;/div>
 *       &lt;div>content2&lt;/div>
 *     &lt;/div>
 *     //Js snippet
 *     var el = document.getElementById('ctrlId');
 *     jslet.ui.bindControl(el, jsletParam);
 *	
 *  //3. Create dynamically
 *     jslet.ui.createControl(jsletParam, document.body);
 *
 * </code></pre>
 */
"use strict";
jslet.ui.SplitPanel = jslet.Class.create(jslet.ui.Control, {
	directions: ['hori', 'vert'],
	
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.el = el;
		Z.allProperties = 'styleClass,direction,floatIndex,onExpanded,onSize';//{size:100, align:-1/0/1,minSize:10}

		Z._direction = 'hori';

		Z._floatIndex = 1;
		
		Z._onExpanded = null;
		
		Z._onSize = null;
		
		Z.panels = null; //Array, panel configuration
		Z.splitter = null;
		Z._oldSize = 0;
		jslet.resizeEventBus.subscribe(Z);
		$super(el, params);
	},

	/**
	 * Get or set float panel index, only one panel can be a floating panel.
	 * 
	 * @param {Integer or undefined} index float panel index.
	 * @return {this or Integer}
	 */
	floatIndex: function(index) {
		if(index === undefined) {
			return this._floatIndex;
		}
		jslet.Checker.test('SplitPanel.floatIndex', index).isGTEZero();
		this._floatIndex = index;
	},
	
	/**
	 * Get or set Split direction, optional value: hori, vert
	 * Default value is 'hori'
	 * 
	 * @param {String or undefined} direction optional value: hori, vert.
	 * @return {this or String}
	 */
	direction: function(direction) {
		if(direction === undefined) {
			return this._direction;
		}
		direction = jQuery.trim(direction);
		var checker = jslet.Checker.test('SplitPanel.direction', direction).required().isString();
		direction = direction.toLowerCase();
		checker.inArray(this.directions);
		this._direction = direction;
	},
	
	/**
	 * Fired when user expand/collapse one panel.
	 *  Pattern: 
	 *	function(panelIndex){} 
	 *	//panelIndex: Integer
	 *
	 * @param {Function or undefined} onExpanded expanded event handler.
	 * @return {this or Function}
	 */
	onExpanded: function(onExpanded) {
		if(onExpanded === undefined) {
			return this._onExpanded;
		}
		jslet.Checker.test('SplitPanel.onExpanded', onExpanded).isFunction();
		this._onExpanded = onExpanded;
	},
	
	/**
	 * Fired after user change size of one panel.
	 *  Pattern: 
	 *	function(panelIndex, newSize){} 
	 *	//panelIndex: Integer
	 *	//newSize: Integer
	 *
	 * @param {Function or undefined} onExpanded resize event handler.
	 * @return {this or Function}
	 */
	onSize: function(onSize) {
		if(onSize === undefined) {
			return this._onSize;
		}
		jslet.Checker.test('SplitPanel.onSize', onSize).isFunction();
		this._onSize = onSize;
	},
   
	/**
	 * @override
	 */
	bind: function () {
		this.renderAll();
	},

	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this, jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-splitpanel')) {
			jqEl.addClass('jl-splitpanel jl-border-box jl-round5');
		}
		Z.isHori = (Z._direction == 'hori');
		
		Z.width = jqEl.innerWidth();
		Z.height = jqEl.innerHeight();
		Z._oldSize = Z.isHori ? Z.width: Z.height;
		
		var panelDivs = jqEl.find('>div'),
			lastIndex = panelDivs.length - 1;
		if (!Z._floatIndex || Z._floatIndex > lastIndex) {
			Z._floatIndex = lastIndex;
		}
		if (Z._floatIndex > lastIndex) {
			Z._floatIndex = lastIndex;
		}
		if (!Z.panels) {
			Z.panels = [];
		}
		var containerSize = (Z.isHori ? Z.width : Z.height), sumSize = 0;

		panelDivs.each(function(k){
			var jqPanel = jQuery(panelDivs[k]),
				oPanel = Z.panels[k];
			if (!oPanel){
				oPanel = {};
				Z.panels[k] = oPanel;
			}

			var minSize = parseInt(jqPanel.css(Z.isHori ?'min-width': 'min-height'));
			oPanel.minSize = minSize ? minSize : 5;
			
			var maxSize = parseInt(jqPanel.css(Z.isHori ?'max-width': 'max-height'));
			oPanel.maxSize = maxSize ? maxSize : Infinity;
			oPanel.expanded = jqPanel.css('display') != 'none';
			
			var size = oPanel.size;
			if (size === null || size === undefined) {
				size = Z.isHori ? jqPanel.outerWidth(): jqPanel.outerHeight();
			} else {
				if (Z.isHori) {
					jqPanel.width(size - 5);
				} else {
					jqPanel.height(size - 5);
				}
			}
				
			if (k != Z._floatIndex){
				sumSize += size;
				oPanel.size = size;
			}
		});
		Z.panels[Z._floatIndex].size = containerSize - sumSize;
		
		Z.splitterTracker = document.createElement('div');
		var jqTracker = jQuery(Z.splitterTracker);
		jqTracker.addClass('jl-sp-splitter-tracker');
		var fixedSize = 0,
			clsName = Z.isHori ? 'jl-sp-panel-hori': 'jl-sp-panel-vert';
		Z.splitterClsName = Z.isHori ? 'jl-sp-splitter-hori': 'jl-sp-splitter-vert';
		Z.el.appendChild(Z.splitterTracker);
		if (Z.isHori) {
			Z.splitterTracker.style.height = '100%';
		} else {
			Z.splitterTracker.style.width = '100%';
		}
		var splitterSize = parseInt(jslet.ui.getCssValue(Z.splitterClsName, Z.isHori? 'width' : 'height'));
		panelDivs.after(function(k){
			var panel = panelDivs[k],
			jqPanel = jQuery(panel),
			expanded = Z.panels[k].expanded;
			
			jqPanel.addClass(clsName);

			if (k == Z._floatIndex) {
				Z.floatPanel = panel;
			} else {
				if (expanded) {
					fixedSize += splitterSize + Z.panels[k].size;
				} else {
					jqPanel.css('display', 'none');
					fixedSize += splitterSize;
				}
			}
			if (k == lastIndex){
				if (Z.isHori) {
					return '<div style="clear:both;width:0px"></div>';
				}
				return '';
			}
			var id = jslet.nextId(),
				minBtnCls = Z.isHori ? 'jl-sp-button-left' : 'jl-sp-button-top';
				
			if (Z._floatIndex <= k || !expanded) {
				minBtnCls += Z.isHori ? ' jl-sp-button-right' : ' jl-sp-button-bottom';
			}
			return '<div class="'+ Z.splitterClsName + ' jl-unselectable" id = "' + id + 
			'" jsletindex="'+ (k >= Z._floatIndex ? k+1: k)+ '"><div class="jl-sp-button ' + 
			minBtnCls +'"' + (expanded ? '': ' jsletcollapsed="1"') +'></div></div>';
		});
		if (Z.isHori) {
			jQuery(Z.floatPanel).width(jqEl.innerWidth() - fixedSize - 4);
		} else {
			jQuery(Z.floatPanel).height(jqEl.innerHeight() - fixedSize);
		}
		var splitters = jqEl.find('.'+Z.splitterClsName);
		splitters.on('mousedown', Z._splitterMouseDown);
		var splitBtns = splitters.children();
		splitBtns.on('mousedown', function(event){
			var jqBtn = jQuery(event.target),
				jqSplitter = jqBtn.parent(),
				index = parseInt(jqSplitter.attr('jsletindex'));
			Z.expand(index);
			event.stopPropagation();
		});
		
		var oSplitter;
		for(var i = 0, cnt = splitters.length; i < cnt; i++){
			oSplitter = splitters[i];
			oSplitter._doDragStart = Z._splitterDragStart;
			oSplitter._doDragging = Z._splitterDragging;
			oSplitter._doDragEnd = Z._splitterDragEnd;
			oSplitter._doDragCancel = Z._splitterDragCancel;
		}
	},
	
	/**
	 * Get float panel
	 * 
	 * @return {Html Element} 
	 */
	floatPanel: function(){
		return this.panels[this._floatIndex];	
	},
	
	changeSize: function(k, size){
		
	},
	
	/**
	 * Expand or collapse the specified panel
	 * 
	 * @param {Integer} index Panel index
	 * @param {Boolean} expanded True for expanded, false otherwise.
	 */
	expand: function(index, expanded, notChangeSize){
		var Z = this, jqPanel, jqEl = jQuery(Z.el),
			splitters = jqEl.find('.'+Z.splitterClsName);
		if (index < 0 || index > splitters.length) {
			return;
		}
		var	jqSplitter = jQuery(splitters[(index >= Z._floatIndex ? index - 1: index)]),
			jqBtn = jqSplitter.find(':first-child');
			
		if (expanded === undefined) {
			expanded  = jqBtn.attr('jsletcollapsed')=='1';
		}
		if (index < Z._floatIndex) {
			jqPanel = jqSplitter.prev();
		} else {
			jqPanel = jqSplitter.next();
		}
		if (Z.isHori){
			if (jqBtn.hasClass('jl-sp-button-right')) {
				jqBtn.removeClass('jl-sp-button-right');
			} else {
				jqBtn.addClass('jl-sp-button-right');
			}
		} else {
			if (jqBtn.hasClass('jl-sp-button-bottom')) {
				jqBtn.removeClass('jl-sp-button-bottom');
			} else {
				jqBtn.addClass('jl-sp-button-bottom');
			}
		}

		if (expanded){
			jqPanel.css('display', 'block');
			jqBtn.attr('jsletcollapsed', '0');
		}else{
			jqPanel.css('display','none');
			jqBtn.attr('jsletcollapsed', '1');
		}
		if(notChangeSize) {
			return;
		}
		var jqFp = jQuery(Z.floatPanel);
		if (Z.isHori) {
			jqFp.width(jqFp.width()+jqPanel.width()*(expanded ? -1: 1));
		} else {
			jqFp.height(jqFp.height()+jqPanel.height()*(expanded ? -1: 1));
		}
		Z.panels[index].expanded = expanded;
		if (Z._onExpanded) {
			Z._onExpanded.call(Z, index);
		}
		jslet.resizeEventBus.resize(Z.el);
	},
	
	/**
	 * @private
	 */
	_splitterMouseDown: function(event){
		var pos = jQuery(this).position(),
			Z = this.parentNode.jslet;
		Z.splitterTracker.style.top = pos.top + 'px';
		Z.splitterTracker.style.left = pos.left + 'px';
		Z.draggingId = this.id;
		var jqSplitter = jQuery('#'+Z.draggingId),
			jqBtn = jqSplitter.find(':first-child');
		if(jqBtn.attr('jsletcollapsed')=='1') { //Collapsed
			jqBtn.click();
			return;
		}
		
		jslet.ui.dnd.bindControl(this);
	},
		
	/**
	 * @private
	 */
	_splitterDragStart: function (oldX, oldY, x, y, deltaX, deltaY){
		var Z = this.parentNode.jslet,
			jqTracker = jQuery(Z.splitterTracker),
			jqSplitter = jQuery('#'+Z.draggingId),
			index = parseInt(jqSplitter.attr('jsletindex')),
			cfg = Z.panels[index],
			jqFp = jQuery(Z.floatPanel);
		
		Z.dragRangeMin = cfg.size - cfg.minSize;
		Z.dragRangeMax = cfg.maxSize - cfg.size;
		var fpMax = (Z.isHori ? jqFp.width() : jqFp.height()) - Z.panels[Z._floatIndex].minSize;
		if (Z.dragRangeMax > fpMax) {
			Z.dragRangeMax = fpMax;
		}
		jqTracker.show();
	},
	
	/**
	 * @private
	 */
	_splitterDragging: function (oldX, oldY, x, y, deltaX, deltaY){
		var Z = this.parentNode.jslet,
			jqTracker = jQuery(Z.splitterTracker),
			jqSplitter = jQuery('#'+Z.draggingId),
			index = parseInt(jqSplitter.attr('jsletindex')),
			delta = Math.abs(Z.isHori ? deltaX : deltaY),
			expanded;
			
		if (Z.isHori) {
			expanded = index < Z._floatIndex && deltaX >= 0 || index > Z._floatIndex && deltaX < 0;
		} else {
			expanded = index < Z._floatIndex && deltaY >= 0 || index > Z._floatIndex && deltaY < 0;
		}
		if (expanded && delta > Z.dragRangeMax){
			Z.endDelta = Z.dragRangeMax;
			return;
		}
		
		if (!expanded && delta > Z.dragRangeMin){
			Z.endDelta = Z.dragRangeMin;
			return;
		}
		
		Z.endDelta = Math.abs(Z.isHori ? deltaX : deltaY);
		var pos = jqTracker.offset();
		if (Z.isHori) {
			pos.left = x;
		} else {
			pos.top = y;
		}
		jqTracker.offset(pos);
	},
	
	/**
	 * @private
	 */
	_splitterDragEnd: function (oldX, oldY, x, y, deltaX, deltaY){
		var Z = this.parentNode.jslet,
			jqTracker = jQuery(Z.splitterTracker),
			jqSplitter = jQuery('#'+Z.draggingId),
			index = parseInt(jqSplitter.attr('jsletindex')),
			jqPanel = index < Z._floatIndex ? jqSplitter.prev(): jqSplitter.next(),
			expanded,
			jqFp = jQuery(Z.floatPanel);

		if (Z.isHori) {
			expanded = index < Z._floatIndex && deltaX >= 0 || index > Z._floatIndex && deltaX < 0;
		} else {
			expanded = index < Z._floatIndex && deltaY >= 0 || index > Z._floatIndex && deltaY < 0;
		}
		var delta = Z.endDelta * (expanded ? 1: -1);
		var newSize = Z.panels[index].size + delta;
		Z.panels[index].size = newSize;
		
		if (Z.isHori){
			jqPanel.width(newSize);
			jqFp.width(jqFp.width() - delta);
		}else{
			jqPanel.height(newSize);
			jqFp.height(jqFp.height() - delta);
		}
		if (Z._onSize) {
			Z._onSize.call(Z, index, newSize);
		}
		jslet.resizeEventBus.resize(Z.el);
		jqTracker.hide();
	},
	
	/**
	 * @private
	 */
	_splitterDragCancel: function (oldX, oldY, x, y, deltaX, deltaY){
		var Z = this.parentNode.jslet,
			jqTracker = jQuery(Z.splitterTracker);
		jqTracker.hide();
	},
	
	/**
	 * Run when container size changed, it's revoked by jslet.resizeeventbus.
	 * 
	 */
	checkSizeChanged: function(){
		var Z = this,
			jqEl = jQuery(Z.el),
			currSize = Z.isHori ? jqEl.width() : jqEl.height();
		if ( Z._oldSize != currSize){
			var delta = currSize - Z._oldSize;
			Z._oldSize = currSize;
			var oFp = Z.panels[Z._floatIndex],
				jqFp = jQuery(Z.floatPanel),
				newSize = delta + (Z.isHori ? jqFp.width(): jqFp.height());

			if (newSize < oFp.minSize) {
				newSize = oFp.minSize;
			}
			if (Z.isHori) {
				jqFp.width(newSize);
			} else {
				jqFp.height(newSize);
			}
		}
		jslet.resizeEventBus.resize(Z.floatPanel);
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this,
		jqEl = jQuery(Z.el);
		Z.splitterTracker = null;
		Z.floatPanel = null;
		var splitters = jqEl.find('.'+Z.splitterClsName);
		splitters.off('mousedown', Z._splitterMouseDown);
		var item;
		for(var i = 0, cnt = splitters.length; i < cnt; i++){
			item = splitters[i];
			jslet.ui.dnd.unbindControl(item);
			item._doDragStart = null;
			item._doDragging = null;
			item._doDragEnd = null;
			item._doDragCancel = null;
		}
		jslet.resizeEventBus.unsubscribe(Z);
		$super();
	}
});

jslet.ui.register('SplitPanel', jslet.ui.SplitPanel);
jslet.ui.SplitPanel.htmlTemplate = '<div></div>';

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class TabControl. Example:
 * <pre><code>
 * var jsletParam = {type: "TabControl", 
 *		activeIndex: 1, 
 *		onCreateContextMenu: doCreateContextMenu, 
 *		items: [
 *			{header: "one", userIFrame: true, url: "http://www.google.com", iconClass: "tabIcon"},
 *			{header: "two", closable: true, divId: "p2"},
 *			{header:"three",closable:true,divId:"p3"},
 *		]};
 *  //1. Declaring:
 *		&lt;div data-jslet='jsletParam' style="width: 300px; height: 400px;" />
 *
 *  //2. Binding
 *		&lt;div id='ctrlId' />
 *		//Js snippet
 *		var el = document.getElementById('ctrlId');
 *		jslet.ui.bindControl(el, jsletParam);
 *	
 *  //3. Create dynamically
 *		jslet.ui.createControl(jsletParam, document.body);
 *
 * </code></pre>
 */
"use strict";
/**
* Tab Item
*/
jslet.ui.TabItem = function () {
	var Z = this;
	Z.id = null; //{String} Element Id
	Z.index = -1; //{Integer} TabItem index
	Z.header = null; //{String} Head of tab item
	Z.closable = false; //{Boolean} Can be closed or not
	Z.disabled = false; //{Boolean} 
	Z.useIFrame = false; //{Boolean}
	Z.height = '100%';
	Z.url = null; //{String} 
	Z.contentId = null; //{String} 
	Z.content = null; //{String} 
};

jslet.ui.TabControl = jslet.Class.create(jslet.ui.Control, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.el = el;
		Z.allProperties = 'styleClass,activeIndex,newable,closable,items,onAddTabItem,onActiveIndexChanged,onRemoveTabItem,onCreateContextMenu,onContentLoading,onContentLoaded';
		
		Z._activeIndex = -1;
		
		Z._newable = true;
		
		Z._closable = true;
		
		Z._onActiveIndexChanged = null;
		
		Z._onAddTabItem = null;
		
		Z._onRemoveTabItem = null;
		
		Z._onCreateContextMenu = null;
		
		Z._items = [];
		
		Z._itemsWidth = [];
		Z._containerWidth = 0;
		Z._ready = false;
		
		Z._leftIndex = 0;
		Z._rightIndex = 0;
		Z._maxHeaderWidth = 160;
		Z._tabControlWidth = jQuery(Z.el).width();
		Z._tabControlHeight = jQuery(Z.el).height();
		Z._contextItemIndex = 0;
		
		Z._onContentLoading = null;
		Z._onContentLoaded = null;
		jslet.resizeEventBus.subscribe(this);
		$super(el, params);
	},

	/**
	 * Get or set active tab item index.
	 * 
	 * @param {Integer or undefined} index active tabItem index.
	 * @param {this or Integer}
	 */
	activeIndex: function(index) {
		if(index === undefined) {
			return this._activeIndex;
		}
		jslet.Checker.test('TabControl.activeIndex', index).isGTEZero();
		if(this._ready) {
			this._chgActiveIndex(index);
		} else {
			this._activeIndex = index;
		}
	},
	
	/**
	 * Get or set active tab item id.
	 * 
	 * @param {String or undefined} itemId active tabItem id.
	 * @param {this or String}
	 */
	activeItemId: function(itemId) {
		var Z = this;
		if(itemId === undefined) {
			var itemCfg = Z._items[this._activeIndex];
			if(itemCfg) {
				return itemCfg.id;
			}
			return null;
		}
		jslet.Checker.test('TabControl.activeItemId', itemId).isString();
		if(this._ready) {
			var items = Z._items;
			for(var i = 0, len = items.length; i < len; i++) {
				if(itemId === items[i].id) {
					this._chgActiveIndex(i);
					break;
				}
			}
		}
		return this;
	},
	
	/**
	 * Get active tab item config.
	 * 
	 * @return {jslet.ui.TabItem}
	 */
	activeItem: function() {
		var items = this._items;
		if(items && items.length > 0) {
			return this._items[this._activeIndex || 0];
		}
		return null;
	},
	
	/**
	 * Identify if user can add tab item on fly.
	 * 
	 * @param {Boolean or undefined} newable true(default) - user can add tab item on fly, false - otherwise.
	 * @return {this or Boolean} 
	 */
	newable: function(newable) {
		if(newable === undefined) {
			return this._newable;
		}
		this._newable = newable? true: false;
	},
	
	/**
	 * Identify if user can close tab item on fly.
	 * 
	 * @param {Boolean or undefined} closable true(default) - user can close tab item on fly, false - otherwise.
	 * @return {this or Boolean} 
	 */
	closable: function(closable) {
		if(closable === undefined) {
			return this._closable;
		}
		this._closable = closable? true: false;
	},
	
	/**
	 * Fired after add a new tab item.
	 * Pattern: 
	 *   function(){}
	 *   
	 * @param {Function or undefined} onAddTabItem tab item added event handler.
	 * @return {this or Function} 
	 */
	onAddTabItem: function(onAddTabItem) {
		if(onAddTabItem === undefined) {
			return this._onAddTabItem;
		}
		jslet.Checker.test('TabControl.onAddTabItem', onAddTabItem).isFunction();
		this._onAddTabItem = onAddTabItem;
	},
	
	/**
	 * Fired when user toggle tab item.
	 * Pattern: 
	 *   function(oldIndex, newIndex){}
	 *   //oldIndex: Integer
	 *   //newIndex: Integer
	 *   
	 * @param {Function or undefined} onActiveIndexChanged tab item active event handler.
	 * @return {this or Function} 
	 */
	onActiveIndexChanged: function(onActiveIndexChanged) {
		if(onActiveIndexChanged === undefined) {
			return this._onActiveIndexChanged;
		}
		jslet.Checker.test('TabControl.onActiveIndexChanged', onActiveIndexChanged).isFunction();
		this._onActiveIndexChanged = onActiveIndexChanged;
	},

	/**
	 * Fired after remove a tab item.
	 * Pattern: 
	 *  function(tabItemIndex, active){}
	 *  //tabItemIndex: Integer
	 *  //active: Boolean Identify if the removing item is active
	 *  //return: Boolean, false - cancel removing tab item, true - remove tab item. 
	 *   
	 * @param {Function or undefined} onRemoveTabItem tab item removed event handler.
	 * @return {this or Function} 
	 */
	onRemoveTabItem: function(onRemoveTabItem) {
		if(onRemoveTabItem === undefined) {
			return this._onRemoveTabItem;
		}
		jslet.Checker.test('TabControl.onRemoveTabItem', onRemoveTabItem).isFunction();
		this._onRemoveTabItem = onRemoveTabItem;
	},

	/**
	 * Fired before show context menu
	 * Pattern: 
	 *   function(menuItems){}
	 *   //menuItems: Array of MenuItem, @see menu item configuration in jslet.menu.js.
	 *   
	 * @param {Function or undefined} onCreateContextMenu creating context menu event handler.
	 * @return {this or Function} 
	 */
	onCreateContextMenu: function(onCreateContextMenu) {
		if(onCreateContextMenu === undefined) {
			return this._onCreateContextMenu;
		}
		jslet.Checker.test('TabControl.onCreateContextMenu', onCreateContextMenu).isFunction();
		this._onCreateContextMenu = onCreateContextMenu;
	},
	 
	/**
	 * Fired before loading content of tab item;
	 * Pattern: 
	 *   function(contentId, itemCfg){}
	 *   //contentId: {String} the content element's id.
	 *   //itemCfg: {Plan Object} tab item config
	 *   
	 * @param {Function or undefined} onContentLoading before loading tab panel content handler.
	 * @return {this or Function} 
	 */
	onContentLoading: function(onContentLoading) {
		if(onContentLoading === undefined) {
			return this._onContentLoading;
		}
		jslet.Checker.test('TabControl.onContentLoading', onContentLoading).isFunction();
		this._onContentLoading = onContentLoading;
	},
	 
	/**
	 * Fired after loading content of tab item;
	 * Pattern: 
	 *   function(contentId, itemCfg){}
	 *   //contentId: {String} the content element's id.
	 *   //itemCfg: {Plan Object} tab item config
	 *   
	 * @param {Function or undefined} onContentLoading after loading tab panel content handler.
	 * @return {this or Function} 
	 */
	onContentLoaded: function(onContentLoaded) {
		if(onContentLoaded === undefined) {
			return this._onContentLoaded;
		}
		jslet.Checker.test('TabControl.onContentLoaded', onContentLoaded).isFunction();
		this._onContentLoaded = onContentLoaded;
	},
	 
	/**
	 * Get or set tab item configuration.
	 * 
	 * @param {jslet.ui.TabItem[] or undefined} items tab items.
	 * @return {this or jslet.ui.TabItem[]}
	 */
	items: function(items) {
		if(items === undefined) {
			return this._items;
		}
		jslet.Checker.test('TabControl.items', items).isArray();
		var item;
		for(var i = 0, len = items.length; i < len; i++) {
			item = items[i];
			jslet.Checker.test('TabControl.items.header', item.header).isString().required();
		}
		this._items = items;
	},
	
	/**
	 * @override
	 */
	bind: function () {
		this.renderAll();
	},

	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this;
		Z._createContextMenu();

		var	template = [
			'<div class="jl-tab-header jl-unselectable"><div class="jl-tab-container jl-unselectable"><ul class="jl-tab-list">',
			Z._newable ? '<li><a href="javascript:;" class="jl-tab-inner"><span class="jl-tab-new">+</span></a></li>' : '',
			'</ul></div><a class="jl-tab-left jl-hidden"><span class="jl-nav-btn fa fa-arrow-circle-left"></span></a><a class="jl-tab-right jl-hidden"><span class="jl-nav-btn fa fa-arrow-circle-right"></span></a></div>',
			'<div class="jl-tab-panels jl-round5"></div>'];

		var jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-tabcontrol'))
			jqEl.addClass('jl-tabcontrol jl-round5');
		jqEl.html(template.join(''));
		if (Z._newable) {
			var oul = jqEl.find('.jl-tab-list')[0];
			var newTab = oul.childNodes[oul.childNodes.length - 1];
			Z._newTabItem = newTab;
			
			newTab.onclick = function () {
				var itemCfg = null;
				if (Z._onAddTabItem) {
					itemCfg = Z._onAddTabItem.call(Z);
				}
				if (!itemCfg) {
					itemCfg = new jslet.ui.TabItem();
					itemCfg.header = jslet.locale.TabControl.newTab;
					itemCfg.closable = true;
				}
				Z.addTabItem(itemCfg);
				Z._calcItemsWidth();
				Z.activeIndex(Z._items.length - 1);
			};
		}

		var jqNavBtn = jqEl.find('.jl-tab-left');
		
		jqNavBtn.on("click",function (event) {
			Z._setVisiTabItems(Z._leftIndex - 1);
			event.stopImmediatePropagation();
			event.preventDefault();
			return false;
		});
		jqNavBtn.on("mousedown",function (event) {
			event.stopImmediatePropagation();
			event.preventDefault();
			return false;
		});
		jqNavBtn = jqEl.find('.jl-tab-right');

		jqNavBtn.on("click",function (event) {
			Z._setVisiTabItems(Z._leftIndex + 1);
			event.stopImmediatePropagation();
			event.preventDefault();
			return false;
		});
		jqNavBtn.on("mousedown",function (event) {
			event.stopImmediatePropagation();
			event.preventDefault();
			return false;
		});
		
		if (Z._items && Z._items.length > 0) {
			var oitem, 
				cnt = Z._items.length;
			for (var i = 0; i < cnt; i++) {
				oitem = Z._items[i];
				Z._renderTabItem(oitem);
			}
			Z._activeIndex = 0;
		}
		Z._calcItemsWidth();
		Z._ready = true;
		Z._chgActiveIndex(Z._activeIndex);
	},

	addItem: function (itemCfg) {
		this._items[this._items.length] = itemCfg;
	},

	/**
	 * Change tab item's header
	 * 
	 * @param {Integer} index - tab item index.
	 * @param {String} header - tab item header.
	 */
	tabHeader: function(index, header) {
		jslet.Checker.test('tabHeader#index', index).isGTEZero();
		jslet.Checker.test('tabHeader#label', header).required().isString();
		
		var Z = this;
		var itemCfg = Z._getTabItemCfg(index);
		if(!itemCfg) {
			return;
		}

		itemCfg.header = header;
		var jqEl = jQuery(Z.el);
		var panelContainer = jqEl.find('.jl-tab-list')[0];
		var nodes = panelContainer.childNodes;
		jQuery(nodes[index]).find('.jl-tab-title').html(header);
		Z._calcItemsWidth();
	},
	
	/**
	 * Disable tab item.
	 * 
	 * @param {Integer} index - tab item index.
	 * @param {Boolean} disabled - true - disabled, false - otherwise.
	 */
	tabDisabled: function(index, disabled) {
		jslet.Checker.test('tabDisabled#index', index).isGTEZero();
		var Z = this;
		var itemCfg = Z._getTabItemCfg(index);
		if(!itemCfg) {
			return;
		}
		if(index == Z._activeIndex) {
			console.warn('Cannot set current tab item to disabled.');
			return;
		}
		itemCfg.disabled(disabled);
		var jqEl = jQuery(Z.el),
			jqPanels = jqEl.find('.jl-tab-panels'),
			panelContainer = jqPanels[0],
			nodes = panelContainer.childNodes,
			jqItem = jQuery(nodes[index]);
		if(disabled) {
			jqItem.addClass('jl-tab-disabled');
		} else {
			jqItem.removeClass('jl-tab-disabled');
		}
	},
	
	_checkTabItemCount: function() {
		var Z = this,
			jqTabPanels = jQuery(Z.el).find('.jl-tab-panels');
		if(!Z._items || Z._items.length === 0) {
			if(!jqTabPanels.hasClass('jl-hidden')) {
				jqTabPanels.addClass('jl-hidden');
			}
		} else {
			jqTabPanels.removeClass('jl-hidden');

		} 
	},
	
	/**
	 * Change active tab item.
	 * 
	 * @param {Integer} index Tab item index which will be toggled to.
	 */
	_chgActiveIndex: function (index) {
		var Z = this;
	
		var itemCfg = Z._getTabItemCfg(index);
		if(!itemCfg || itemCfg.disabled) {
			return;
		}
		if (Z._onActiveIndexChanged) {
			var canChanged = Z._onActiveIndexChanged.call(Z, Z._activeIndex, index);
			if (canChanged !== undefined && !canChanged) {
				return;
			}
		}
		
		var jqEl = jQuery(Z.el),
			oli, 
			oul = jqEl.find('.jl-tab-list')[0],
			nodes = oul.childNodes,
			cnt = nodes.length - (Z._newable ? 2 : 1);

		var itemContainer = jqEl.find('.jl-tab-panels')[0],
			item, 
			items = itemContainer.childNodes;
		for (var i = 0; i <= cnt; i++) {
			oli = jQuery(nodes[i]);
			item = items[i];
			if (i == index) {
				oli.addClass('jl-tab-active');
				item.style.display = 'block';
			}
			else {
				oli.removeClass('jl-tab-active');
				item.style.display = 'none';
			}
		}
		Z._activeIndex = index;
		if(index < Z._leftIndex || index >= Z._rightIndex) {
			Z._setVisiTabItems(null, Z._activeIndex);
		}
	},
	
	_getTabItemCfg: function(index) {
		var Z = this;
		if(Z._items.length <= index) {
			return null;
		}
		return Z._items[index];
	},
	
	_calcItemsWidth: function() {
		var Z = this,
			jqEl =jQuery(Z.el),
			nodes = jqEl.find('.jl-tab-list').children();
		Z._itemsWidth = [];
		Z._totalItemsWidth = 0;
		nodes.each(function(index){
			var w = jQuery(this).outerWidth() + 5;
			Z._itemsWidth[index] = w;
			Z._totalItemsWidth += w;
		});

		Z._containerWidth = jqEl.find('.jl-tab-container').innerWidth();
		Z._setNavBtnVisible();
	},
	
	_setVisiTabItems: function(leftIndex, rightIndex) {
		var Z = this, w, i, len;
		if(!leftIndex && leftIndex !== 0) {
			if(!rightIndex) {
				return;
			}
			if(Z._newable) {
				rightIndex++;
			}
			w = Z._itemsWidth[rightIndex];
			Z._leftIndex = rightIndex;
			for(i = rightIndex - 1; i >= 0; i--) {
				w += Z._itemsWidth[i];
				if(w > Z._containerWidth) {
					Z._leftIndex = i + 1;
					break;
				}
				Z._leftIndex = i;
			}
			leftIndex = Z._leftIndex;
		} else {
			Z._leftIndex = leftIndex;
		}
		w = 0;
		Z._rightIndex = leftIndex;
		for(i = leftIndex, len = Z._itemsWidth.length; i < len; i++) {
			w += Z._itemsWidth[i];
			if(w > Z._containerWidth) {
				Z._rightIndex = i - 1;
				break;
			}
			Z._rightIndex = i;
		}
		var leftPos = 0;
		for(i = 0; i < Z._leftIndex; i++) {
			leftPos += Z._itemsWidth[i];
		}
		leftPos += 5;
		var jqEl = jQuery(Z.el);
		jqEl.find('.jl-tab-container').scrollLeft(jslet.locale.isRtl ? 50000 - leftPos: leftPos);
		Z._setNavBtnVisible();
	},
	
	_setNavBtnVisible: function() {
		var Z = this,
			jqEl = jQuery(Z.el),
			jqBtnLeft = jqEl.find('.jl-tab-left'),
			isHidden = jqBtnLeft.hasClass('jl-hidden');
		if(Z._leftIndex > 0 && Z._totalItemsWidth > Z._containerWidth) {
			if(isHidden) {
				jqBtnLeft.removeClass('jl-hidden');
			}
		} else {
			if(!isHidden) {
				jqBtnLeft.addClass('jl-hidden');
			}
		}
		var jqBtnRight = jqEl.find('.jl-tab-right');
		var totalCnt = Z._itemsWidth.length;
		isHidden = jqBtnRight.hasClass('jl-hidden');
		if(Z._rightIndex < totalCnt - 1 && Z._totalItemsWidth > Z._containerWidth) {
			if(isHidden) {
				jqBtnRight.removeClass('jl-hidden');
			}
		} else {
			if(!isHidden) {
				jqBtnRight.addClass('jl-hidden');
			}
		}
	},
	
	_createHeader: function (parent, itemCfg) {
		var Z = this,
			canClose = Z._closable && itemCfg.closable,
			tmpl = ['<a href="javascript:;" class="jl-tab-inner' + (canClose? ' jl-tab-close-loc': '') + 
			        '" onclick="javascript:this.blur();" title="' + itemCfg.header + '"><span class="jl-tab-title '];

		tmpl.push('">');
		tmpl.push(itemCfg.header);
		tmpl.push('</span>');
		tmpl.push('<span class="fa fa-times close jl-tab-close' + (!canClose || itemCfg.disabled? ' jl-hidden': '') + '"></span><span style="clear:both"></span>');
		tmpl.push('</a>');
		var oli = document.createElement('li');
		if(itemCfg.disabled) {
			jQuery(oli).addClass('jl-tab-disabled');
		}
		oli.innerHTML = tmpl.join('');

		if (Z._newable) {
			var lastNode = parent.childNodes[parent.childNodes.length - 1];
			parent.insertBefore(oli, lastNode);
		} else {
			parent.appendChild(oli);
		}
		oli.jslet = Z;
		jQuery(oli).on('click', Z._changeTabItem);

		if (canClose) {
			jQuery(oli).find('.jl-tab-close').click(Z._doCloseBtnClick);
		}
		if(Z.contextMenu && !itemCfg.disabled) {
			oli.oncontextmenu = function (event) {
				var k = 0;
				var items = jQuery(Z.el).find('.jl-tab-list li').each(function() {
					if(this === event.currentTarget) {
						Z._contextItemIndex = k;
						return false;
					}
					k++;
				});
				Z.contextMenu.showContextMenu(event, Z);
			};
		}
	},

	_changeTabItem: function (event) {
		var nodes = this.parentNode.childNodes,
			index = -1;
		for (var i = 0; i < nodes.length; i++) {
			if (nodes[i] == this) {
				index = i;
				break;
			}
		}
		this.jslet._chgActiveIndex(index);
	},

	_doCloseBtnClick: function (event) {
		var oli = this.parentNode.parentNode,
			nodes = oli.parentNode.childNodes,
			index = -1;
		for (var i = 0; i < nodes.length; i++) {
			if (nodes[i] == oli) {
				index = i;
				break;
			}
		}
		oli.jslet.removeTabItem(index);
		event.preventDefault();
		return false;
	},

	_createBody: function (parent, itemCfg) {
		var Z = this,
			jqDiv = jQuery(document.createElement('div'));
		if (!jqDiv.hasClass('jl-tab-panel')) {
			jqDiv.addClass('jl-tab-panel');
		}
		var odiv = jqDiv[0];
		parent.appendChild(odiv);
		var padding = 4,
			jqEl = jQuery(Z.el),
			jqHead = jqEl.find('.jl-tab-header'),
			h = itemCfg.height;
		h = h ? h: '100%';

		if (itemCfg.content || itemCfg.contentId) {
			var ocontent = itemCfg.content ? itemCfg.content : jQuery('#'+itemCfg.contentId)[0];
			if (ocontent) {
				var pNode = ocontent.parentNode;
				if (pNode && pNode != odiv) {
					pNode.removeChild(ocontent);
				}
				odiv.appendChild(ocontent);
				ocontent.style.display = 'block';
				return;
			}
		}

		var url = itemCfg.url;
		if (url) {
			url = url + (url.indexOf('?') >= 0 ? '&': '?') + 'jlTabItemId=' + itemCfg.id;
			if (itemCfg.useIFrame || itemCfg.useIFrame === undefined) {
				var id = jslet.nextId(); 
				var s = '<iframe id="' + id + '"scrolling="yes" frameborder="0" allowtransparency="true" src="' + 
					url + 
				'" style="width: 100%;height:' + h  + ';background-color:transparent"></iframe>';
				jqDiv.html(s);
				itemCfg.contentId = id;
				if(Z._onContentLoading) {
					Z._onContentLoading.call(Z, id, itemCfg);
				}
			}
		}
	},

	/**
	 * Add tab item dynamically.
	 * 
	 * @param {Object} newItemCfg Tab item configuration
	 * @param {Boolean} noDuplicate Identify if the same "tabItem.id" can be added or not, default is true. 
	 */
	addTabItem: function (newItemCfg, noDuplicate) {
		var Z = this,
			tabItems = Z._items,
			newId = newItemCfg.id;
		if(!newId) {
			newId = jslet.nextId();
			newItemCfg.id = newId;
		}
		var itemCfg;
		if((noDuplicate === undefined || noDuplicate) && newId) {
			for(var i = 0, len = tabItems.length; i < len; i++) {
				itemCfg = tabItems[i];
				if(newId === itemCfg.id) {
					if(itemCfg.url !== newItemCfg.url) {
						itemCfg.url = newItemCfg.url;
						Z.reloadTabItem(itemCfg);
					}
					Z.activeIndex(i);
					return;
				}
			}
		}
		tabItems.push(newItemCfg);
		Z._renderTabItem(newItemCfg);
		Z._calcItemsWidth();
		Z._chgActiveIndex(tabItems.length - 1);
		Z._checkTabItemCount();
	},

	/**
	 * set the specified tab item to loaded state. It will fire the "onContentLoaded" event.
	 * 
	 * @param {String} tabItemId - tab item id.
	 */
	setContentLoadedState: function(tabItemId) {
		var Z = this;
		if(!Z._onContentLoaded) {
			return;
		}
		var	tabItems = Z._items,
			contentId = null,
			itemCfg;
		for(var i = 0, len = tabItems.length; i < len; i++) {
			itemCfg = tabItems[i];
			if(tabItemId === itemCfg.id) {
				contentId = itemCfg.contentId;
				break;
			}
		}
		if(!contentId) {
			return;
		}
		Z._onContentLoaded.call(Z, contentId, itemCfg);
	},
	
	/**
	 * Set tab item to changed state or not.
	 * 
	 * @param {String} tabItemId - tab item id.
	 * @param {Boolean} changed - changed state.
	 */
	setContentChangedState: function(tabItemId, changed) {
		var Z = this,
			tabItems = Z._items,
			itemCfg,
			idx = -1;
		for(var i = 0, len = tabItems.length; i < len; i++) {
			itemCfg = tabItems[i];
			if(tabItemId === itemCfg.id) {
				idx = i;
				break;
			}
		}
		if(idx < 0) {
			return;
		}
		itemCfg.changed = changed;
		var header = itemCfg.header,
			hasChangedFlag = (header.charAt(0) === '*');
		if(changed) {
			if(!hasChangedFlag) {
				header = '*' + header;
				Z.tabHeader(idx, header);
			}
		} else {
			if(hasChangedFlag) {
				header = header.substring(1);
				Z.tabHeader(idx, header);
			}
		}
	},
	
	/**
	 * Identify which exists changed tab item or not.
	 */
	hasChanged: function() {
		var Z = this,
			tabItems = Z._items,
			itemCfg,
			idx = -1;
		for(var i = 0, len = tabItems.length; i < len; i++) {
			itemCfg = tabItems[i];
			if(itemCfg.changed) {
				return true;
			}
		}
		return false;
	},
	
	_renderTabItem: function(itemCfg) {
		var Z = this,
			jqEl = jQuery(Z.el),
			oul = jqEl.find('.jl-tab-list')[0],
			panelContainer = jqEl.find('.jl-tab-panels')[0];
		if(!itemCfg.id) {
			itemCfg.id = jslet.nextId();
		}
		Z._createHeader(oul, itemCfg);
		Z._createBody(panelContainer, itemCfg);
	},
	
	/**
	 * Remove tab item with tabItemIndex
	 * 
	 * @param {Integer} tabItemIndex Tab item index
	 */
	removeTabItem: function (tabItemIndex, isBatch) {
		var Z = this;
		if (tabItemIndex >= Z._items.length || tabItemIndex < 0) {
			return;
		}
		var itemCfg = Z._items[tabItemIndex];
		if(itemCfg.changed) {
            jslet.ui.MessageBox.confirm(jslet.locale.TabControl.contentChanged, jslet.locale.MessageBox.confirm, function(button){
				if(button === 'ok') {
					Z._innerRemoveTabItem(tabItemIndex, isBatch);
				}
            });
		} else {
			Z._innerRemoveTabItem(tabItemIndex, isBatch);
		}
	},

	_innerRemoveTabItem: function (tabItemIndex, isBatch) {
		var Z = this,
			jqEl = jQuery(Z.el),
			oul = jqEl.find('.jl-tab-list')[0],
			nodes = oul.childNodes,
			cnt = nodes.length - (Z._newable ? 2 : 1),
			oli = jQuery(nodes[tabItemIndex]);
		var active = oli.hasClass('jl-tab-active');
		if (Z._onRemoveTabItem) {
			var canRemoved = Z._onRemoveTabItem.call(Z, Z._items[tabItemIndex], active);
			if (!canRemoved) {
				return;
			}
		}
		oli.find('.jl-tab-close').hide();
		oli.animate({width:'toggle'},200, function() {
			var elItem = oli[0]; 
			elItem.oncontextmenu = null;
			oul.removeChild(elItem);
			Z._items.splice(tabItemIndex, 1);
			var panelContainer = jqEl.find('.jl-tab-panels')[0];
			nodes = panelContainer.childNodes;
			var tabPanel = nodes[tabItemIndex];
			panelContainer.removeChild(tabPanel);
			if(!isBatch) {
				Z._calcItemsWidth();
				Z._checkTabItemCount();
			}
			if (active) {
				tabItemIndex = Z._getNextValidIndex(tabItemIndex, tabItemIndex >= cnt);
				if (tabItemIndex >= 0) {
					Z._chgActiveIndex(tabItemIndex);
				} else {
					Z._activeIndex = -1;
				}
			} else {
				if(Z._activeIndex > tabItemIndex) {
					Z._activeIndex--;
				}
			}
		});
	},

	_getNextValidIndex: function(start, isLeft) {
		var Z = this, i, len;
		if(isLeft) {
			for(i = start - 1; i >= 0; i--) {
				if(!Z._items[i].disabled) {
					return i;
				}
			}
		} else {
			for(i = start, len = Z._items.length; i < len; i++) {
				if(!Z._items[i].disabled) {
					return i;
				}
			}
		}
		return -1;
	},
	
	/**
	 * Reload the active tab panel.
	 */
	reload: function() {
		var Z = this,
			currIdx = Z._contextItemIndex,
			itemCfg = Z._items[currIdx];
		Z.reloadTabItem(itemCfg);
	},
	
	reloadTabItem: function(itemCfg) {
		var Z = this;
		if(!itemCfg) {
			return;
		}
		var contentId = itemCfg.contentId;
		if(contentId) {
			var jqFrame = jQuery('#' + contentId);
			if(Z._onContentLoading) {
				Z._onContentLoading.call(Z, jqFrame.attr('id'), itemCfg);
			}
			var url = itemCfg.url;
			url = url + (url.indexOf('?') >= 0 ? '&': '?') + 'jlTabItemId=' + itemCfg.id;
			jqFrame.attr('src', url);
		}
	},
	
	/**
	 * Close the current active tab item  if this tab item is closable.
	 */
	close: function (tabItemIndex) {
		var Z = this;
		if(tabItemIndex === undefined) {
			tabItemIndex = Z._activeIndex;
		}
		var itemCfg = Z._items[tabItemIndex];
		if (itemCfg && tabItemIndex >= 0 && itemCfg.closable && !itemCfg.disabled) {
			Z.removeTabItem(tabItemIndex);
		}
	},

	/**
	 * Close all closable tab item except current active tab item.
	 */
	closeOther: function () {
		var Z = this, oitem;
		for (var i = Z._items.length - 1; i >= 0; i--) {
			oitem = Z._items[i];
			if (oitem.closable && !oitem.disabled) {
				if (Z._contextItemIndex == i) {
					continue;
				}
				Z.removeTabItem(i, true);
			}
		}
		Z._calcItemsWidth();
		Z._checkTabItemCount();
	},
	
	/**
	 * Close all closable tab item.
	 */
	closeAll: function() {
		var Z = this, oitem;
		for (var i = Z._items.length - 1; i >= 0; i--) {
			oitem = Z._items[i];
			if (oitem.closable && !oitem.disabled) {
				Z.removeTabItem(i, true);
			}
		}
		Z._calcItemsWidth();
		Z._checkTabItemCount();
	},
	
	/**
	 * Run when container size changed, it's revoked by jslet.resizeeventbus.
	 * 
	 */
	checkSizeChanged: function(){
		var Z = this,
			jqEl = jQuery(Z.el),
			currWidth = jqEl.width(),
			currHeight = jqEl.height();
		if ( Z._tabControlWidth != currWidth){
			Z._tabControlWidth = currWidth;
			Z._calcItemsWidth();
			Z._setVisiTabItems(Z._leftIndex);
		}
	},
	
	_createContextMenu: function () {
		var Z = this;
		Z.contextMenu = null;
		if (!jslet.ui.Menu || !Z._closable) {
			return;
		}
		var menuCfg = { type: 'Menu', onItemClick: Z._menuItemClick, items: [
   			{ id: 'reload', name: jslet.locale.TabControl.reload},
			{ id: 'close', name: jslet.locale.TabControl.close},
			{ id: 'closeOther', name: jslet.locale.TabControl.closeOther},
			{ id: 'closeAll', name: jslet.locale.TabControl.closeAll}]
			};
		if (Z._onCreateContextMenu) {
			Z._onCreateContextMenu.call(Z, menuCfg.items);
		}

		if (menuCfg.items.length === 0) {
			return;
		}
		Z.contextMenu = jslet.ui.createControl(menuCfg);
	},

	_menuItemClick: function (menuId, checked) {
		if(menuId === 'reload') {
			this.reload();
		} else if (menuId === 'close') {
			this.close(this._contextItemIndex);
		} else if (menuId === 'closeOther') {
			this.closeOther();
		} else if (menuId === 'closeAll') {
			this.closeAll();
		}
	},

	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this;
		if(Z._newTabItem) {
			Z._newTabItem.onclick = null;
			Z._newTabItem = null;
		}
		var jqEl = jQuery(Z.el), 
			head = jqEl.find('.jl-tab-header')[0];
		
		jqEl.find('.jl-tab-left').off();
		jqEl.find('.jl-tab-right').off();
		head.oncontextmenu = null;
		jqEl.find('.jl-tab-close').off();
		var items = jqEl.find('.jl-tab-list').find('li');
		items.off();
		items.each(function(){
			this.jslet = null;
		});
		jslet.resizeEventBus.unsubscribe(this);

		$super();
	}
});

jslet.ui.register('TabControl', jslet.ui.TabControl);
jslet.ui.TabControl.htmlTemplate = '<div></div>';


/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
* @class TipPanel. Example:
* <pre><code>
*   var tipPnl = new jslet.ui.TipPanel();
*   tipPnl.show('Hello world', 10, 10);
* </code></pre>
*/
"use strict";
jslet.ui.TipPanel = function () {
	this._hideTimerId = null;
	this._showTimerId = null;
	this._oldElement = null;
	var p = document.createElement('div');
	jQuery(p).addClass('jl-tip-panel');
	document.body.appendChild(p);
	this._tipPanel = p;

	/**
	 * Show tips at specified position. Example:
	 * <pre><code>
	 *  tipPnl.show('foo...', event);
	 *  tipPnl.show('foo...', 100, 200);
	 * </code></pre>
	 * 
	 * @param {String} tips Tips text
	 * @param {Integer or Event} left Position left, if left is mouse event, then top argument can't be specified
	 * @param {Integer} top Position top
	 */
	this.show = function (tips, leftOrEvent, top) {
		var Z = this;
		var len = arguments.length;
		var isSameCtrl = false, left = leftOrEvent;
		if (len == 2) { //this.show(tips)
			var evt = left;
			evt = jQuery.event.fix( evt );

			top = evt.pageY + 16; left = evt.pageX + 2;
			var ele = evt.currentTarget;
			isSameCtrl = (ele === Z._oldElement);
			Z._oldElement = ele;
		} else {
			left = parseInt(left);
			top = parseInt(top);
		}

		if (Z._hideTimerId) {
			window.clearTimeout(Z._hideTimerId);
			if (isSameCtrl) {
				return;
			}
		}

		this._showTimerId = window.setTimeout(function () {
			var p = Z._tipPanel;
			p.innerHTML = tips;
			p.style.left = left + 'px';
			p.style.top = top + 'px';
			Z._tipPanel.style.display = 'block';
			Z._showTimerId = null;
		}, 300);
	};

	/**
	 * Hide tip panel
	 */
	this.hide = function () {
		var Z = this;
		if (Z._showTimerId) {
			window.clearTimeout(Z._showTimerId);
			return;
		}
		Z._hideTimerId = window.setTimeout(function () {
			Z._tipPanel.style.display = 'none';
			Z._hideTimerId = null;
			Z._oldElement = null;
		}, 300);
	};
};

/**
 * Global tip panel
 */
jslet.ui.globalTip = new jslet.ui.TipPanel();

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class WaitingBox. Example:
 * <pre><code>
 *   var wb = new jslet.ui.WaitingBox(document.getElementById("test"), "Gray", true);
 *	wb.show("Please wait a moment...");
 * 
 * </code></pre>
 * @param {Html Element} container The container which waitingbox reside on.
 * @param {String} overlayColor Overlay color
 * @param {Boolean} tipsAtNewLine Tips is at new line or not. If false, tips and waiting icon is at the same line.
 */
"use strict";
jslet.ui.WaitingBox = function (container, overlayColor, tipsAtNewLine) {
	var overlay = new jslet.ui.OverlayPanel(container);
	var s = '<div class="jl-waitingbox jl-round4"><b class="jl-waitingbox-icon"></b>';
		s += '<span class="jl-waitingbo-text"></span></div>';

	jQuery(overlay.overlayPanel).html(s);

	/**
	 * Show wating box
	 * 
	 * @param {String} tips Tips
	 */
	this.show = function (tips) {
		var p = overlay.overlayPanel,
			box = p.firstChild,
			tipPanel = box.childNodes[1];
		tipPanel.innerHTML = tips ? tips : '';
		var jqPnl = jQuery(p),
			ph = jqPnl.height(),
			pw = jqPnl.width();

		setTimeout(function () {
			var jqBox = jQuery(box);
			box.style.top = Math.round((ph - jqBox.height()) / 2) + 'px';
			box.style.left = Math.round((pw - jqBox.width()) / 2) + 'px';
		}, 10);

		overlay.show();
	};

	/**
	 * Hide waiting box
	 */
	this.hide = function () {
		overlay.hide();
	};

	this.destroy = function () {
		overlay.overlayPanel.innerHTML = '';
		overlay.destroy();
	};
};

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class Window, it has the following function: 
 * 1. Show as modal or modeless;
 * 2. User can change window size;
 * 3. User can minimize/maximize/restore/close window;
 * 4. User can move window;
 * 
 * Example:
 * <pre><code>
	var oWin = jslet.ui.createControl({ type: "Window", iconClass:"winicon", caption: "test window", minimizable: false, maximizable:false,onActive: doWinActive, onPositionChanged: doPositionChanged });
	oWin.setContent("Open modeless window in the Body(with icon)!");
	oWin.show(350,250);
	//or oWin.showModel(350, 250);

 *
 * </code></pre>
 */
"use strict";
jslet.ui.Window = jslet.Class.create(jslet.ui.Control, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.el = el;
		Z.allProperties = 'styleClass,caption,resizable,minimizable,maximizable,closable,iconClass,onSizeChanged,onClosed,onPositionChanged,onActive,width,height,minWidth,maxWidth,minHeight,maxHeight,isCenter,isSmallHeader,stopEventBubbling,animation';

		Z._caption = null;
		
		Z._resizable = true;
		
		Z._minimizable = true;

		Z._maximizable = true;
		
		Z._closable = true;
		
		Z._iconClass = null;
		
		Z._width = 0;
		
		Z._height = 0;
		
		Z._minWidth = 20;
		
		Z._minHeight = 30;
		
		Z._maxWidth = -1;

		Z._maxHeight = -1;

		Z._isCenter = false;
 
		Z._animation = 'linear';
		
		Z._onSizeChanged = null;
		
		Z._onPositionChanged = null;
		
		Z._onActive = null;
		
		Z._onClosed = null;

		Z._stopEventBubbling = false;
		
		Z._isModal = false;
		
		Z._state = null; 
		$super(el, params);
	},

	/**
	 * Get or set window caption.
	 * 
	 * @param {String or undefined} window caption.
	 * @return {String or this}
	 */
	caption: function(caption) {
		if(caption === undefined) {
			return this._caption;
		}
		jslet.Checker.test('Window.caption', caption).isString();
		this._caption = caption;
	},
	
	/**
	 * Get or set the icon class of window header.
	 * 
	 * @param {String or undefined} iconClass the icon of window header.
	 * @return {String or this}
	 */
	iconClass: function(iconClass) {
		if(iconClass === undefined) {
			return this._iconClass;
		}
		jslet.Checker.test('Window.iconClass', iconClass).isString();
		this._iconClass = iconClass;
	},
	
	/**
	 * Identify whether the window can be resized or not.
	 * 
	 * @param {Boolean or undefined} resizable true - window can be resized, false otherwise.
	 * @return {Boolean or this}
	 */
	resizable: function(resizable) {
		if(resizable === undefined) {
			return this._resizable;
		}
		this._resizable = resizable? true: false;
	},
	
	/**
	 * Identify whether the window can be minimized or not.
	 * 
	 * @param {Boolean or undefined} minimizable true - window can be minimized, false - otherwise.
	 * @return {Boolean or this}
	 */
	minimizable: function(minimizable) {
		if(minimizable === undefined) {
			return this._minimizable;
		}
		this._minimizable = minimizable? true: false;
	},
	
	/**
	 * Identify whether the window can be maximized or not.
	 * 
	 * @param {Boolean or undefined} maximizable true - window can be maximized, false - otherwise.
	 * @return {Boolean or this}
	 */
	maximizable: function(maximizable) {
		if(maximizable === undefined) {
			return this._maximizable;
		}
		this._maximizable = maximizable? true: false;
	},
	
	/**
	 * Identify whether the window can be closed or not.
	 * 
	 * @param {Boolean or undefined} closable true - window can be closed, false - otherwise.
	 * @return {Boolean or this}
	 */
	closable: function(closable) {
		if(closable === undefined) {
			return this._closable;
		}
		this._closable = closable? true: false;
	},
	
	/**
	 * Identify whether the window is shown in center of container.
	 * 
	 * @param {Boolean or undefined} isCenter true - window is shown in center of container, false - otherwise.
	 * @return {Boolean or this}
	 */
	isCenter: function(isCenter) {
		if(isCenter === undefined) {
			return this._isCenter;
		}
		this._isCenter = isCenter? true: false;
	},
	
	/**
	 * Animation effect for showing and hiding.
	 * 
	 * @param {String or undefined} animation - Animation effect for showing and hiding, optional value: 'none', 'linear', 'slide', 'fade', default is 'linear'.
	 * @return {String or this}
	 */
	animation: function(animation) {
		if(animation === undefined) {
			return this._animation;
		}
		this._animation = animation;
	},
	
	/**
	 * Identify whether stopping the event bubble.
	 * 
	 * @param {Boolean or undefined} stopEventBubbling true - stop event bubbling, false - otherwise.
	 * @return {Boolean or this}
	 */
	stopEventBubbling: function(stopEventBubbling) {
		if(stopEventBubbling === undefined) {
			return this._stopEventBubbling;
		}
		this._stopEventBubbling = stopEventBubbling? true: false;
	},
	
	/**
	 * Get or set window width.
	 * 
	 * @param {Integer or undefined} width window width.
	 * @return {Integer or this}
	 */
	width: function(width) {
		if(width === undefined) {
			return this._width;
		}
		jslet.Checker.test('Window.width', width).isGTZero();
		this._width = width;
	},

	/**
	 * Get or set window height.
	 * 
	 * @param {Integer or undefined} height window height.
	 * @return {Integer or this}
	 */
	height: function(height) {
		if(height === undefined) {
			return this._height;
		}
		jslet.Checker.test('Window.height', height).isGTZero();
		this._height = height;
	},

	/**
	 * Get or set window minimum width.
	 * 
	 * @param {Integer or undefined} minWidth window minimum width.
	 * @return {Integer or this}
	 */
	minWidth: function(minWidth) {
		if(minWidth === undefined) {
			return this._minWidth;
		}
		jslet.Checker.test('Window.minWidth', minWidth).isGTZero();
		if(minWidth < 20) {
			minWidth = 20;
		}
		this._minWidth = minWidth;
	},

	/**
	 * Get or set window minimum height.
	 * 
	 * @param {Integer or undefined} minHeight window minimum height.
	 * @return {Integer or this}
	 */
	minHeight: function(minHeight) {
		if(minHeight === undefined) {
			return this._minHeight;
		}
		jslet.Checker.test('Window.minHeight', minHeight).isGTZero();
		if(minHeight < 30) {
			minHeight = 30;
		}
		this._minHeight = minHeight;
	},

	/**
	 * Get or set window maximum width.
	 * 
	 * @param {Integer or undefined} maxWidth window maximum width.
	 * @return {Integer or this}
	 */
	maxWidth: function(maxWidth) {
		if(maxWidth === undefined) {
			return this._maxWidth;
		}
		jslet.Checker.test('Window.maxWidth', maxWidth).isNumber();
		this._maxWidth = maxWidth;
	},

	/**
	 * Get or set window maximum height.
	 * 
	 * @param {Integer or undefined} maxHeight window maximum height.
	 * @return {Integer or this}
	 */
	maxHeight: function(maxHeight) {
		if(maxHeight === undefined) {
			return this._maxHeight;
		}
		jslet.Checker.test('Window.maxHeight', maxHeight).isNumber();
		this._maxHeight = maxHeight;
	},

	/**
	 * Set or get window size changed event handler.
	 * Pattern:
	 *   function(width, height){}
	 *   //width: Integer Window width
	 *   //height: Integer Window height
	 * 
	 * @param {Function or undefined} onSizeChanged window size changed event handler
	 * @return {Function or this}
	 */
	onSizeChanged: function(onSizeChanged) {
		if(onSizeChanged === undefined) {
			return this._onSizeChanged;
		}
		jslet.Checker.test('Window.onSizeChanged', onSizeChanged).isFunction();
		this._onSizeChanged = onSizeChanged;
	},
	
	/**
	 * Set or get window position changed event handler.
	 * Fired when user changes the window's position.
	 * Pattern: 
	 *   function(left, top){}
	 *   //left: Integer Window position left
	 *   //top: Integer Window position top 
	 * 
	 * @param {Function or undefined} onPositionChanged window position changed event handler
	 * @return {Function or this}
	 */
	onPositionChanged: function(onPositionChanged) {
		if(onPositionChanged === undefined) {
			return this._onPositionChanged;
		}
		jslet.Checker.test('Window.onPositionChanged', onPositionChanged).isFunction();
		this._onPositionChanged = onPositionChanged;
	},

	/**
	 * Set or get window activated event handler.
	 * Fired when the window is active.
	 *	function(windObj){}
	 *	//windObj: jslet.ui.Window Window Object
	 * 
	 * @param {Function or undefined} onActive window activated event handler
	 * @return {Function or this}
	 */
	onActive: function(onActive) {
		if(onActive === undefined) {
			return this._onActive;
		}
		jslet.Checker.test('Window.onActive', onActive).isFunction();
		this._onActive = onActive;
	},
	
	
	/**
	 * Set or get window closed event handler.
	 * Fired when uses closes window.
	 * Pattern: 
	 *	function(windObj){}
	 *	//windObj: jslet.ui.Window Window Object
	 *	//return: String If return value equals 'hidden', then hide window instead of closing.
	 * 
	 * @param {Function or undefined} onClosed window closed event handler
	 * @return {Function or this}
	 */
	onClosed: function(onClosed) {
		if(onClosed === undefined) {
			return this._onClosed;
		}
		jslet.Checker.test('Window.onClosed', onClosed).isFunction();
		this._onClosed = onClosed;
	},
	
	/**
	 * @override
	 */
	bind: function () {
		this.renderAll();
	},

	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this;
		if (!Z._closable) {
			Z._minimizable = false;
			Z._maximizable = false;
		}
		var jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-window')) {
			jqEl.addClass('panel panel-default jl-window');
		}
		if (Z._width) {
			jqEl.width(Z._width);
		}
		if (Z._height) {
			jqEl.height(Z._height);
		}
		jqEl.css('display','none');
		var template = [
		'<div class="panel-heading jl-win-header jl-win-header-sm" style="cursor:move">',
			Z._iconClass ? '<span class="jl-win-header-icon ' + Z._iconClass + '"></span>' : '',
			'<span class="panel-title jl-win-caption">', Z._caption ? Z._caption : '', '</span>',
			'<span class="jl-win-tool jl-unselectable">'];
			template.push(Z._closable ? '<button class="close jl-win-close" onfocus="this.blur();">x</button>' : '');
			template.push(Z._maximizable ? '<button class="close jl-win-max" onfocus="this.blur();">□</button>' : '');
			template.push(Z._minimizable ? '<button class="close jl-win-min" onfocus="this.blur();">-</button>' : '');
		template.push('</span></div>');
		template.push('<div class="panel-body jl-win-body"></div>');

		jqEl.html(template.join(''));
		jqEl.on('mousemove', Z._doWinMouseMove);
		jqEl.on('mousedown', Z._doWinMouseDown);
		jqEl.on('dblclick', function(event){
			event.stopPropagation();
			event.preventDefault();
		});

		jqEl.on('click', function(event){
			if(Z._stopEventBubbling) {
				event.stopPropagation();
				event.preventDefault();
			}
		});
		
		if (Z._height) {
			Z._changeBodyHeight();
		}
		var jqHeader = jqEl.find('.jl-win-header'),
			header = jqHeader[0];
		var jqBody = jqEl.find('.jl-win-body');
		jqBody.on('mouseenter',function (event) {
			window.setTimeout(function(){
				if (jslet.temp_dragging) {
					return;
				}
				Z.cursor = null;
			},300);
		});
		jqBody.on('dblclick',function (event) {
			event.stopPropagation();
			event.preventDefault();
		});
		
		jqHeader.on('mousedown',function (event) {
			Z.activate();
			if (Z._state == 'max') {
				return;
			}
			Z.cursor = null;
			jslet.ui.dnd.bindControl(this);
		});

		jqHeader.on('dblclick',function (event) {
			event.stopPropagation();
			event.preventDefault();
			if (!Z._maximizable) {
				return;
			}
			if (Z._state != 'max') {
				Z.maximize();
			} else {
				Z.restore();
			}
		});

		header._doDragStart = function (oldX, oldY, x, y, deltaX, deltaY) {
			Z._createTrackerMask(header);
			Z.trackerMask.style.cursor = header.style.cursor;
			jslet.temp_dragging = true;
		};

		header._doDragging = function (oldX, oldY, x, y, deltaX, deltaY) {
			Z.setPosition(Z.left + deltaX, Z.top + deltaY, true);
		};

		header._doDragEnd = function (oldX, oldY, x, y, deltaX, deltaY) {
			var left = parseInt(Z.el.style.left);
			var top = parseInt(Z.el.style.top);
			Z.setPosition(left, top);
			Z._removeTrackerMask();
			Z.cursor = null;
			jslet.temp_dragging = false;
		};

		header._doDragCancel = function (oldX, oldY, x, y, deltaX, deltaY) {
			Z.setPosition(Z.left, Z.top);
			Z._removeTrackerMask();
			Z.cursor = null;
			jslet.temp_dragging = false;
		};

		Z.el._doDragStart = function (oldX, oldY, x, y, deltaX, deltaY) {
			Z._createTrackerMask(this);
			Z._createTracker();
			Z.trackerMask.style.cursor = Z.el.style.cursor;
			jslet.temp_dragging = true;
		};

		Z.el._doDragging = function (oldX, oldY, x, y, deltaX, deltaY) {
			Z._changeTrackerSize(deltaX, deltaY);
		};

		Z.el._doDragEnd = function (oldX, oldY, x, y, deltaX, deltaY) {
			if (!Z.tracker) {
				return;
			}
			var left = parseInt(Z.tracker.style.left);
			var top = parseInt(Z.tracker.style.top);
			var width = parseInt(Z.tracker.style.width);
			var height = parseInt(Z.tracker.style.height);

			Z.setPosition(left, top);
			Z.changeSize(width, height);
			Z._removeTrackerMask();
			Z._removeTracker();
			Z.cursor = null;
			jslet.temp_dragging = false;
		};

		Z.el._doDragCancel = function (oldX, oldY, x, y, deltaX, deltaY) {
			Z._removeTrackerMask();
			Z._removeTracker();
			Z.cursor = null;
			jslet.temp_dragging = false;
		};

		if (Z._closable) {
			var jqClose = jqEl.find('.jl-win-close');
			jqClose.click(function (event) {
				Z.close();
				event = jQuery.event.fix( event || window.event );
				event.stopPropagation();
				event.preventDefault();
			});
		}
		if (Z._minimizable) {
			var jqMin = jqEl.find('.jl-win-min');
			jqMin.click(function (event) {
				Z.minimize();
				event = jQuery.event.fix( event || window.event );
				event.stopPropagation();
				event.preventDefault();
			});
		}
		if (Z._maximizable) {
			var jqMax = jqEl.find('.jl-win-max'),
				btnMax = jqMax[0];
			jqMax.click(function (event) {
				if (Z._state != 'max') {
					btnMax.innerHTML = '■';
					Z.maximize();
				} else {
					btnMax.innerHTML = '□';
					Z.restore();
				}
				event = jQuery.event.fix( event || window.event );
				event.stopPropagation();
				event.preventDefault();
			});
		}
	},

	/**
	 * Show window at specified position
	 * 
	 * @param {Integer} left - Position left.
	 * @param {Integer} top - Position top.
	 */
	show: function (left, top) {
		var Z = this,
			jqEl = jQuery(Z.el);
		if (Z._isCenter) {
			var offsetP = jqEl.offsetParent()[0],
				jqOffsetP = jQuery(offsetP),
				pw = jqOffsetP.width(),
				ph = jqOffsetP.height();
			left = offsetP.scrollLeft + Math.round((pw - jqEl.outerWidth()) / 2);
			top = offsetP.scrollTop + Math.round((ph - jqEl.outerHeight()) / 2);
			if(left < 0) {
				left = 0;
			}
			if(top < 0) {
				top = 0;
			} 
		}

		Z.top = top ? top : 0;
		Z.left = left ? left : 0;
		Z.el.style.left = Z.left + 'px';
		Z.el.style.top = Z.top + 'px';
		if(Z._animation == 'slide') {
			jqEl.slideDown();
		} else if(Z._animation == 'fade') {
			jqEl.fadeIn();
		} else if(Z._animation == 'none') {
			jqEl.show();
		} else {
			jqEl.show('fast');
		}
		Z.activate();
	},

	/**
	 * Show modal window at specified position
	 * 
	 * @param {Integer} left Position left.
	 * @param {Integer} top Position top.
	 * @param {String} animation - Animation effect. optional value: 'slide', 'fade'
	 */
	showModal: function (left, top) {
		var Z = this;
		Z._isModal = true;
		if (!Z.overlay) {
			Z.overlay = new jslet.ui.OverlayPanel(Z.el.parentNode);
		}
		jslet.ui.GlobalZIndex += 10;
		var k = jslet.ui.GlobalZIndex;
		Z.el.style.zIndex = k;
		Z.show(left, top);
		Z.overlay.setZIndex(k - 2);
		Z.overlay.show();
	},

	/**
	 * Hide window
	 * @param {String} animation - Animation effect. optional value: 'slide', 'fade'
	 */
	hide: function () {
		var Z = this;
		var jqEl = jQuery(Z.el);
		if(Z._animation == 'slide') {
			jqEl.slideUp();
		} else if(Z._animation == 'fade') {
			jqEl.fadeOut();
		} else if(Z._animation == 'none') {
			jqEl.hide();
		} else {
			jqEl.hide('fast');
		}
		if (Z.overlay) {
			Z.overlay.hide();
		}
	},

	/**
	 * Close window, this will fire onClosed event.
	 * 
	 */
	close: function () {
		var Z = this;
		if(!Z.el) {
			return;
		}
		if (Z._onClosed) {
			var action = Z._onClosed.call(Z);
			if (action && action.toLowerCase() == 'hidden') {
				Z.hide();
				return;
			}
		}
		var pnode = Z.el.parentNode;
		pnode.removeChild(Z.el);
		if (Z.overlay) {
			Z.overlay.destroy();
			Z.overlay = null;
		}
		jslet.ui.GlobalZIndex -= 10;
		Z.destroy();
	},

	/**
	 * Minimize window
	 */
	minimize: function () {
		var Z = this;
		if (Z._state == 'min') {
			Z.restore();
			return;
		}
		if (Z._state == 'max') {
			Z.restore();
		}
		var jqEl = jQuery(Z.el);
		Z._tempHeight = jqEl.height();
		Z._tempWidth = jqEl.width();
		Z.changeSize(Z._tempWidth, Z._getHeaerHeight() + 2);
		Z._state = 'min';
	},

	/**
	 * Maximize window
	 */
	maximize: function () {
		var Z = this;
		var offsetP = jQuery(Z.el).offsetParent();
		var width = offsetP.innerWidth(); // -12;
		var height = offsetP.innerHeight(); // -12;
		Z.setPosition(0, 0, true);
		if (Z._state !== 'min') {
			var jqEl = jQuery(Z.el);
			Z._tempHeight = jqEl.height();
			Z._tempWidth = jqEl.width();
		}
		Z.changeSize(width, height);
		Z._state = 'max';
	},

	/**
	 * Restore window
	 */
	restore: function () {
		var Z = this;
		Z.setPosition(Z.left, Z.top, true);
		Z.changeSize(Z._tempWidth, Z._tempHeight);
		Z._state = null;
	},

	/**
	 * Activate window, this will fire the 'OnActive' event
	 */
	activate: function () {
		var Z = this;
		if (!Z.overlay) {
			Z.bringToFront();
		}
		if (Z._onActive) {
			Z._onActive.call();
		}
	},

	/**
	 * Change window position.
	 * 
	 * @param {Integer} left Position left
	 * @param {Integer} top Position top
	 * @param {Boolean} notUpdateLeftTop True - Only change html element position, 
	 *		not change the inner position of Window object, it is usually use for moving action
	 */
	setPosition: function (left, top, notUpdateLeftTop) {
		var Z = this;
		if (!notUpdateLeftTop) {
			Z.left = left;
			Z.top = top;
		} else {
			if (Z._onPositionChanged) {
				var result = Z._onPositionChanged.call(Z, left, top);
				if (result) {
					if (result.left) {
						left = result.left;
					}
					if (result.top) {
						top = result.top;
					}
				}
			}
		}
		Z.el.style.left = left + 'px';
		Z.el.style.top = top + 'px';
	},

	/**
	 * Change window size.
	 * 
	 * @param {Integer} width Window width
	 * @param {Integer} height Window height
	 * @param {Boolean} notUpdateSize True - Only change html element size, 
	 *		not change the inner size of Window object, it is usually use for moving action
	 */
	changeSize: function (width, height) {
		var Z = this;
		if (Z._onSizeChanged) {
			Z._onSizeChanged.call(Z, width, height);
		}

		var jqEl = jQuery(Z.el);
		jqEl.width(width);
		jqEl.height(height);
		Z._changeBodyHeight();
	},

	_getHeaerHeight: function() {
		var Z = this,
			jqEl = jQuery(Z.el),
			jqHeader = jqEl.find('.jl-win-header');
		return jqHeader.outerHeight();
	},
	
	_changeBodyHeight: function() {
		var Z = this,
			jqEl = jQuery(Z.el),
			jqBody = jqEl.find('.jl-win-body');
		jqBody.outerHeight(jqEl.innerHeight() - Z._getHeaerHeight());
	},
	
	/**
	 * Get window caption element. You can use it to customize window caption.
	 * 
	 * @return {Html Element}
	 */
	getCaptionPanel: function () {
		return jQuery(this.el).find('.jl-win-caption')[0];
	},

	/**
	 * Set window caption
	 * 
	 * @param {String} caption Window caption
	 */
	changeCaption: function (caption) {
		this.caption = caption;
		var captionDiv = jQuery(this.el).find('.jl-win-caption');
		captionDiv.html(caption);
	},

	/**
	 * Get window content element. You can use it to customize window content.
	 * 
	 * @return {Html Element}
	 */
	getContentPanel: function () {
		return jQuery(this.el).find('.jl-win-body')[0];
	},

	/**
	 * Set window content
	 * 
	 * @param {String} html Html text for window content
	 */
	setContent: function (html) {
		if (!html){
			jslet.showError('Window content cannot be null!');
			return;
		}
		var bodyDiv = jQuery(this.el).find('.jl-win-body');
		if (html && html.toLowerCase) {
			bodyDiv.html(html);
		} else {
			bodyDiv.html('');
			
			html.parentNode.removeChild(html);
			bodyDiv[0].appendChild(html);
			if (html.style && html.style.display == 'none') {
				html.style.display = 'block';
			}
		}
	},

	/**
	 * Bring window to front
	 */
	bringToFront: function () {
		var Z = this;
		var p = Z.el.parentNode;
		var node, jqEl = jQuery(Z.el);
		var maxIndex = 0, jqNode, winIdx;
		for (var i = 0, cnt = p.childNodes.length; i < cnt; i++) {
			node = p.childNodes[i];
			if (node.nodeType != 1 || node == Z.el) {
				if (!Z._isModal) {
					jqEl.find('.jl-win-header').addClass('jl-window-active');
				}
				continue;
			}
			jqNode = jQuery(node);
			
			if (jqNode.hasClass('jl-window')) {
				winIdx = parseInt(node.style.zIndex) || 0;
				if (maxIndex < winIdx) {
					maxIndex = winIdx;
				}
				if (!Z._isModal) {
					jqNode.find('.jl-win-header').removeClass('jl-window-active');
				}
			}
		}
		var styleObj = jqEl.getStyleObject();
		winIdx = parseInt(styleObj.zIndex) || 0;
		if (winIdx <= maxIndex) {
			Z.setZIndex(maxIndex + 2);
		}
	},

	/**
	 * Set window Z-Index
	 * 
	 * @param {Integer} zIndex Z-Index
	 */
	setZIndex: function (zIndex) {
		this.el.style.zIndex = zIndex;
		if(this.overlay) {
			this.overlay.setZIndex(zIndex - 2);
		}
	},

	_checkSize: function (width, height) {
		var Z = this;
		if (width) {
			if (width < Z._minWidth || Z._maxWidth > 0 && width > Z._maxWidth) {
				return false;
			}
		}

		if (height) {
			if (height < Z.minHeight || Z._maxHeight > 0 && height > Z._maxHeight) {
				return false;
			}
		}
		return true;
	},

	_changeTrackerSize: function (deltaX, deltaY) {
		var Z = this;
		if (!Z.tracker || !Z.cursor) {
			return;
		}
		var jqEl = jQuery(Z.el), 
			w = jqEl.width(), 
			h = jqEl.height(), 
			top = null, left = null;

		if (Z.cursor == 'nw') {
			w = w - deltaX;
			h = h - deltaY;
			top = Z.top + deltaY;
			left = Z.left + deltaX;
		} else if (Z.cursor == 'n') {
			h = h - deltaY;
			top = Z.top + deltaY;
		} else if (Z.cursor == 'ne') {
			h = h - deltaY;
			w = w + deltaX;
			top = Z.top + deltaY;
		} else if (Z.cursor == 'e') {
			w = w + deltaX;
		} else if (Z.cursor == 'se') {
			w = w + deltaX;
			h = h + deltaY;
		} else if (Z.cursor == 's'){
			h = h + deltaY;
		} else if (Z.cursor == 'sw') {
			h = h + deltaY;
			w = w - deltaX;
			left = Z.left + deltaX;
		} else if (Z.cursor == 'w') {
			w = w - deltaX;
			left = Z.left + deltaX;
		}

		if (!Z._checkSize(w, h)) {
			return;
		}
		var jqTracker = jQuery(Z.tracker);
		if (w) {
			jqTracker.width(w);
		}
		if (h) {
			jqTracker.height(h);
		}
		if (top) {
			Z.tracker.style.top = top + 'px';
		}
		if (left) {
			Z.tracker.style.left = left + 'px';
		}
	},

	_doWinMouseMove: function (event) {
		if (jslet.temp_dragging) {
			return;
		}
		event = jQuery.event.fix( event || window.event );
		
		var srcEl = event.target, jqSrcEl = jQuery(srcEl);
		
		if (!jqSrcEl.hasClass('jl-window')) {
			return;
		}
		if (!srcEl.jslet._resizable || srcEl.jslet._state) {
			srcEl.jslet.cursor = null;
			srcEl.style.cursor = 'default';
			return;
		}

		var pos = jqSrcEl.offset(),
			x = event.pageX - pos.left,
			y = event.pageY - pos.top,
			w = jqSrcEl.width(),
			h = jqSrcEl.height();
		var delta = 8, wdelta = w - delta, hdelta = h - delta, cursor = null;
		if (x <= delta && y <= delta) {
			cursor = 'nw';
		} else if (x > delta && x < wdelta && y <= delta) {
			cursor = 'n';
		} else if (x >= wdelta && y <= delta) {
			cursor = 'ne';
		} else if (x >= wdelta && y > delta && y <= hdelta) {
			cursor = 'e';
		} else if (x >= wdelta && y >= hdelta) {
			cursor = 'se';
		} else if (x > delta && x < wdelta && y >= hdelta) {
			cursor = 's';
		} else if (x <= delta && y >= hdelta) {
			cursor = 'sw';
		} else if (x <= delta && y > delta && y < hdelta) {
			cursor = 'w';
		}
		
		srcEl.jslet.cursor = cursor;
		srcEl.style.cursor = cursor ? cursor + '-resize' : 'default';
	},

	_doWinMouseDown: function (event) {
		var ojslet = this.jslet;
		ojslet.activate();
		if (ojslet.cursor) {
			jslet.ui.dnd.bindControl(this);
		}
	},

	_createTrackerMask: function (holder) {
		var Z = this;
		if (Z.trackerMask) {
			return;
		}
		var jqBody = jQuery(document.body);

		Z.trackerMask = document.createElement('div');
		jQuery(Z.trackerMask).addClass('jl-win-tracker-mask');
		Z.trackerMask.style.top = '0px';
		Z.trackerMask.style.left = '0px';
		Z.trackerMask.style.zIndex = 99998;
		Z.trackerMask.style.width = jqBody.width() + 'px';
		Z.trackerMask.style.height = jqBody.height() + 'px';
		Z.trackerMask.style.display = 'block';
		Z.trackerMask.onmousedown = function () {
			if (holder && holder._doDragCancel) {
				holder._doDragCancel();
			}
		};
		jqBody[0].appendChild(Z.trackerMask);
	},

	_removeTrackerMask: function () {
		var Z = this;
		if (Z.trackerMask) {
			Z.trackerMask.onmousedown = null;
			document.body.removeChild(Z.trackerMask);
		}
		Z.trackerMask = null;
	},

	_createTracker: function () {
		var Z = this;
		if (Z.tracker) {
			return;
		}
		var jqEl = jQuery(Z.el), 
			w = jqEl.width(), 
			h = jqEl.height();
		
		Z.tracker = document.createElement('div');
		var jqTracker = jQuery(Z.tracker);
		jqTracker.addClass('jl-win-tracker');
		Z.tracker.style.top = Z.top + 'px';
		Z.tracker.style.left = Z.left + 'px';
		Z.tracker.style.zIndex = 99999;
		jqTracker.width(w);
		jqTracker.height(h);
		Z.tracker.style.display = 'block';
		Z.el.parentNode.appendChild(Z.tracker);
	},

	_removeTracker: function () {
		var Z = this;
		if (Z.tracker) {
			Z.el.parentNode.removeChild(Z.tracker);
		}
		Z.tracker = null;
	},

	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this,
			jqEl = jQuery(Z.el);
		jqEl.find('.jl-win-max').off();
		jqEl.find('.jl-win-min').off();
		jqEl.find('.jl-win-close').off();

		var jqHeader = jqEl.find('.jl-win-header'),
			header = jqHeader[0];
		jqHeader.off();
		jqEl.find('.jl-win-body').off();
		if (Z.trackerMask) {
			Z.trackerMask.onmousedown = null;
		}
		Z.trackerMask = null;
		Z.el._doDragCancel = null;
		Z.el._doDragEnd = null;
		Z.el._doDragging = null;
		Z.el._doDragStart = null;
		header._doDragCancel = null;
		header._doDragEnd = null;
		header._doDragging = null;
		header._doDragStart = null;
		
		if ($super) {
			$super();
		}
	}
});
jslet.ui.register('Window', jslet.ui.Window);
jslet.ui.Window.htmlTemplate = '<div></div>';


/**
* @class MessageBox
*/
jslet.ui.MessageBox = function () {

	//hasInput-0:none,1-single line input, 2:multiline input
	/**
	 * Show message box
	 * 
	 * @param {String} message Message text
	 * @param {String} caption Caption text
	 * @param {String} iconClass Caption icon class
	 * @param {String[]} buttons Array of button names, like : ['ok','cancel']
	 * @param {Fucntion} callbackFn Callback function when user click one button, 
	 *	Pattern: 
	 *	function({String}button, {String} value){}
	 *	//button: String, button name;
	 *	//value: String, the alue inputed by user;
	 * @param {Integer} hasInput There is input or not, value options: 0 - none, 1 - single line input, 2 - multiline input
	 * @param {String} defaultValue The default value of Input element, if hasInput = 0, this argument is be igored.
	 * @param {Fucntion} validateFn Validate function of input element, if hasInput = 0, this argument is be igored.
	 *   Pattern: 
	 *   function(value){}
	 *   //value: String, the value which need to be validated.
	 * 
	 */
	this.show = function (message, caption, iconClass, buttons, callbackFn, hasInput, defaultValue, validateFn) {

		var opt = { type: 'window', caption: caption, isCenter: true, resizable: false, minimizable: false, maximizable: false, stopEventBubbling: true, animation: 'fade'};
		var owin = jslet.ui.createControl(opt);
		var iconHtml = '';
		if (iconClass) {
			iconHtml = '<div class="jl-msg-icon ';
			if (iconClass == 'info' || iconClass == 'error' || iconClass == 'question' || iconClass == 'warning') {
				iconHtml += 'jl-msg-icon-' + iconClass;
			} else {
				iconHtml += iconClass;
			}
			iconHtml += '"><i class="fa ';
			switch (iconClass) {
	            case 'info':
	            	iconHtml += 'fa-info';
	                break;
	            case 'error':
	            	iconHtml += 'fa-times';
	                break;
	            case 'success':
	            	iconHtml += 'fa-check';
	                break;
	            case 'warning':
	            	iconHtml += 'fa-exclamation';
	                break;
	            case 'question':
	            	iconHtml += 'fa-question';
	                break;
	            default :
	            	iconHtml += 'fa-info';
                 	break;
	        }
			iconHtml += '"></i></div>';
		}

		var btnCount = buttons.length;
		var btnHtml = [], btnName, i;
		if (jslet.locale.isRtl){
			for (i = btnCount - 1; i >=0; i--) {
				btnName = buttons[i];
				btnHtml.push('<button class="jl-msg-button btn btn-default btn-xs" ');
				btnHtml.push(' data-jsletname="');
				btnHtml.push(btnName);
				btnHtml.push('">');
				btnHtml.push(jslet.locale.MessageBox[btnName]);
				btnHtml.push('</button>');
			}
		} else {
			for (i = 0; i < btnCount; i++) {
				btnName = buttons[i];
				btnHtml.push('<button class="jl-msg-button btn btn-default btn-xs" ');
				btnHtml.push('" data-jsletname="');
				btnHtml.push(btnName);
				btnHtml.push('">');
				btnHtml.push(jslet.locale.MessageBox[btnName]);
				btnHtml.push('</button>');
			}
		}
		var inputHtml = ['<br />'];
		if (hasInput) {
			if (hasInput == 1) {
				inputHtml.push('<input type="text"');
			} else {
				inputHtml.push('<textarea rows="5"');
			}
			inputHtml.push(' style="width:');
			inputHtml.push('98%"');
			if (defaultValue !== null && defaultValue !== undefined) {
				inputHtml.push(' value="');
				inputHtml.push(defaultValue);
				inputHtml.push('"');
			}
			if (hasInput == 1) {
				inputHtml.push(' />');
			} else {
				inputHtml.push('></textarea>');
			}
		}
		if(message) {
			message = message.replace('\n', '<br />');
		}
		var html = ['<div class="jl-msg-container">', iconHtml, '<div class="' + (hasInput? 'jl-msg-message-noicon': 'jl-msg-message') + '">',
					message, inputHtml.join(''), '</div>', '</div>',
					'<div class="jl-msg-tool"><div>', btnHtml.join(''), '</div></div>'
		];

		owin.setContent(html.join(''));
		var jqEl = jQuery(owin.el);
		var toolBar = jqEl.find('.jl-msg-tool')[0].firstChild;
		var inputCtrl = null;
		if (hasInput == 1) {
			inputCtrl = jqEl.find('.jl-msg-container input')[0];
		} else {
			inputCtrl = jqEl.find('.jl-msg-container textarea')[0];
		}
		
		jQuery(toolBar).on('click', 'button', function(event) {
			var obtn = event.currentTarget;
			var btnName = jQuery(obtn).attr('data-jsletname');
			var value = null;
			if (hasInput && btnName == 'ok') {
				value = inputCtrl.value;
				if (validateFn && !validateFn(value)) {
					inputCtrl.focus();
					return;
				}
			}
			owin.close();
			if (callbackFn) {
				callbackFn(btnName, value);
			}
		});

		owin.onClosed(function () {
			if (callbackFn) {
				callbackFn(btnName);
			}
		});
		
		owin.showModal();
		owin.setZIndex(99981);
		var k = btnCount - 1;
		if (jslet.locale.isRtl) {
			k = 0;
		}
		var toolBtn = toolBar.childNodes[k];
		if(toolBtn) {
			toolBtn.focus();
		}
		return owin;
	};
};

/**
 * Show alert message. Example:
 * <pre><code>
 * jslet.ui.MessageBox.alert('Finished!', 'Tips');
 * </code></pre>
 */
jslet.ui.MessageBox.alert = function (message, caption, callbackFn, timeout) {
	var omsgBox = new jslet.ui.MessageBox();
	if (!caption) {
		caption = jslet.locale.MessageBox.info;
	}
	var owin = omsgBox.show(message, caption, 'info', ['ok'], callbackFn);
	if(timeout) {
		timeout = parseInt(timeout);
		if(window.isNaN(timeout)) {
			window.setTimeout(function() {
				owin.close();
			}, timeout);
		}
	}
};

/**
 * Show error message. Example:
 * <pre><code>
 * jslet.ui.MessageBox.alert('You have made a mistake!', 'Error');
 * </code></pre>
 */
jslet.ui.MessageBox.error = function (message, caption, callbackFn, timeout) {
	var omsgBox = new jslet.ui.MessageBox();
	if (!caption) {
		caption = jslet.locale.MessageBox.error;
	}
	var owin = omsgBox.show(message, caption, 'error', ['ok'], callbackFn);
	if(timeout) {
		timeout = parseInt(timeout);
		if(window.isNam(timeout)) {
			window.setTimeout(function() {
				owin.close();
			}, timeout);
		}
	}
};

/**
 * Show warning message. Example:
 * <pre><code>
 * jslet.ui.MessageBox.warn('Program will be shut down!', 'Warning');
 * </code></pre>
 */
jslet.ui.MessageBox.warn = function (message, caption, callbackFn) {
	var omsgBox = new jslet.ui.MessageBox();
	if (!caption) {
		caption = jslet.locale.MessageBox.warn;
	}
	omsgBox.show(message, caption, 'warning', ['ok'], callbackFn);
};

/**
 * Show confirm message. Example:
 * <pre><code>
 * var callbackFn = function(button, value){
 * alert('Button: ' + button + ' clicked!');
 * }
 * jslet.ui.MessageBox.warn('Are you sure?', 'Confirm', callbackFn);//show Ok/Cancel
 * jslet.ui.MessageBox.warn('Are you sure?', 'Confirm', callbackFn, true);//show Yes/No/Cancel
 * </code></pre>
 */
jslet.ui.MessageBox.confirm = function(message, caption, callbackFn, isYesNo){
	var omsgBox = new jslet.ui.MessageBox();
	if (!caption) {
		caption = jslet.locale.MessageBox.confirm;
	}
	if (!isYesNo) {
		omsgBox.show(message, caption, 'question',['ok', 'cancel'], callbackFn);	
	} else {
		omsgBox.show(message, caption, 'question', ['yes', 'no', 'cancel'], callbackFn);
	}
};

/**
 * Prompt user to input some value. Example:
 * <pre><code>
 * var callbackFn = function(button, value){
 * alert('Button: ' + button + ' clicked!');
 * }
 * var validateFn = function(value){
 *  if (!value){
 *    alert('Please input some thing!');
 * return false;
 *  }
 *  return true;
 * }
 * jslet.ui.MessageBox.prompt('Input your name: ', 'Prompt', callbackFn, 'Bob', validateFn);
 * jslet.ui.MessageBox.warn('Input your comments: ', 'Prompt', callbackFn, null, validateFn, true);
 * </code></pre>
 */
jslet.ui.MessageBox.prompt = function (message, caption, callbackFn, defaultValue, validateFn, isMultiLine) {
	var omsgBox = new jslet.ui.MessageBox();
	if (!caption) {
		caption = jslet.locale.MessageBox.prompt;
	}
	if (!isMultiLine) {
		omsgBox.show(message, caption, null, ['ok', 'cancel'], callbackFn, 1, defaultValue, validateFn);
	} else {
		omsgBox.show(message, caption, null, ['ok', 'cancel'], callbackFn, 2, defaultValue, validateFn);
	}
};

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

"use strict";
jslet.ui.TableCellEditor = function(tableCtrl) { 
	var _tableCtrl = tableCtrl; 
	var _editPanel;
	var _currField;
	
	function _create() { 
		var html = '<div class="form-group form-group-sm jl-tbl-editpanel"><table class="jl-tbl-edittable"><tbody><tr class="jl-tbl-editrow">';
		var columns = _tableCtrl._sysColumns, colCfg,
			tblDataset = tableCtrl.dataset(),
			dsName = tblDataset.name(),
			left = 1, i, len;
			
		for(i = 0, len = columns.length; i < len; i++) {
			colCfg = columns[i];
			left += colCfg.width + 1;
		}
		columns = _tableCtrl.innerColumns;
		var tableId = tableCtrl.el.id,
			editorTabIndex = tableCtrl.editorTabIndex(),
			isBool,
			alignStr = ';text-align: center';
		for(i = 0, len = columns.length; i < len; i++) {
			colCfg = columns[i];
			if(colCfg.field) {
				isBool = (tblDataset.getField(colCfg.field).dataType() === jslet.data.DataType.BOOLEAN);
				html += '<td class="jl-edtfld-' + colCfg.field +  '" style="display:none;vertical-align: middle' + (isBool? alignStr: '') + 
				'"><div data-jslet=\'type:"DBPlace",dataset:"' + dsName + 
				'",field:"' + colCfg.field + 
				'", tableId: "' + tableId + 
				'", expandChildWidth: ' + (isBool? 'false': 'true') + 
				(editorTabIndex? ', tabIndex: ' + editorTabIndex: '') + 
				'\' class="' + colCfg.widthCssName + '"></div></td>';
			}
		}
		html += '</tr></tbody></table></div>';
		var jqPanel = jQuery(html);
		jqPanel.appendTo(jQuery(_tableCtrl.el));
		jqPanel.css('left', left + 'px');
		jslet.ui.install(jqPanel[0]);
		_editPanel = jqPanel;
		jqPanel.height(_tableCtrl.rowHeight());
		jqPanel.on('keydown', function(event) {
			var keyCode = event.which;
			//prevent to fire dbtable's ctrl+c
			if(event.ctrlKey && keyCode === jslet.ui.KeyCode.C) { //ctrl + c
	       		event.stopImmediatePropagation();
			}
		});
	}
	
	_create();
	
	this.showEditor = function(fldName, otd) {
		var dataset = _tableCtrl.dataset();
		if(!fldName) {
			_tableCtrl.dataset().focusEditControl(_currField);
			return;
		}
		var fldObj = dataset.getField(fldName);
		if(!fldObj || fldObj.disabled() || fldObj.readOnly()) {
			_editPanel.hide();
			return;
		}
		var cellPos = jQuery(otd).offset();
		if(_currField) {
			_editPanel.show().find('.jl-edtfld-' + _currField).hide();
		}
		var jqEditor = _editPanel.find('.jl-edtfld-' + fldName);
		_editPanel.offset(cellPos);
		jqEditor.show();
		_tableCtrl.dataset().focusEditControl(fldName);
		_currField = fldName;
	};
	
	this.currentField = function() {
		return _currField;
	};
	
	this.hideEditor = function() {
		_editPanel.hide();
	};
	
	this.destroy = function() { 
		_tableCtrl = null; 
	};
};

/**
 * Find dialog for DBTable and DBTreeView control
 */
jslet.ui.FindDialog = function (dbContainer) {
	var _dialog;
	var _dataset = dbContainer.dataset();
	var _containerEl = dbContainer.el;
	var _currfield = null;
	var _findingField = null;
	var _left = -1;
	var _top = -1;
	function initialize() {
		var opt = { type: 'window', caption: jslet.formatMessage(jslet.locale.findDialog.caption, ['']), isCenter: false, resizable: true, minimizable: false, maximizable: false, 
				stopEventBubbling: true, styleClass: 'jl-finddlg'};
		_dialog = jslet.ui.createControl(opt, _containerEl);
		_dialog.onClosed(function(){
			return 'hidden';
		});
			
		var content = '<div class="input-group input-group-sm"><input class="form-control jl-finddlg-value" placeholder="' + 
		jslet.locale.findDialog.placeholder + '"/>' + 
		'<div class="input-group-btn"><button class="btn btn-default jl-finddlg-find"><i class="fa fa-search" /></button></div></div>';
		
		_dialog.setContent(content);
		_dialog.onPositionChanged(function(left, top) {
			_left = (left > 0? left: 0);
			_top = (top > 0? top: 0);
		});
		var dlgEl = _dialog.el;

		var jqFindingValue = jQuery(dlgEl).find('.jl-finddlg-value');
		var isStart = true;
		jqFindingValue.on('keydown', function(event){
			if(event.keyCode === jslet.ui.KeyCode.ENTER) {
				findData();
	       		event.stopImmediatePropagation();
				event.preventDefault();
				return false;
			}
			isStart = true;
		});
		
		var jqFind = jQuery(dlgEl).find('.jl-finddlg-find');
		jqFind.on('click', function(event) {
			findData();
		});

		function findData() {
			if(_dataset.recordCount() < 2) {
				return;
			}
			var findingValue = jqFindingValue.val(),
				currRecno = 0;
			if(!isStart) {
				currRecno = _dataset.recno() + 1;
			}
			var found = _dataset.findByField(_findingField, findingValue, currRecno, true, 'any');
			isStart = !found;
			if(!found) {
				if(currRecno > 0) { //If not found, find from the first position.
					findData();
				}
			}
			return found;
		}
	}
	
	this.show = function(left, top) {
		if(_left >= 0) {
			left = _left;
		}
		if(_top >= 0) {
			top = _top;
		}
		left = left || 0;
		top = top || 0;
		_dialog.show(left, top);
		this.focus();
	};
	
	this.hide = function() {
		_dialog.hide();
	};
	
	this.findingField = function(findingField) {
		if(findingField === undefined) {
			return _findingField;
		}
		var oldField = _findingField;
		_findingField = findingField;
		if(_findingField) {
			var fldObj = _dataset.getField(_findingField);
			if(fldObj) {
				_dialog.changeCaption(jslet.formatMessage(jslet.locale.findDialog.caption, [fldObj.label()]));
				if(oldField != findingField) {
					jQuery(_dialog.el).find('.jl-finddlg-value').val('');
				}
			}
		}
	};
	
	this.focus = function() {
		jQuery(_dialog.el).find('.jl-finddlg-value').focus();
	};
	
	this.destroy = function() {
		_dialog.destroy();
	};
	
	initialize();
};

/**
 * Filter dialog for DBTable and DBTreeView control
 */
jslet.ui.FilterDialog = function (dataset, fields) {
	
};

/**
 * Filter panel for DBTable
 */
jslet.ui.DBTableFilterPanel = function(tblCtrl) {
	var Z = this;
	Z._width = 300;
	Z._height = 150;
	Z.fieldName = null;
	Z._filterDatasetObj = new jslet.data.FilterDataset(tblCtrl.dataset());
	Z._filterDataset = Z._filterDatasetObj.filterDataset();
	Z._filterDataset.getField('lParenthesis').visible(false);
	Z._filterDataset.getField('rParenthesis').visible(false);
	Z._filterDataset.getField('logicalOpr').visible(false);
	Z._filterDataset.getField('valueExprInput').visible(false);
	Z._dbtable = tblCtrl;
	Z._jqFilterBtn = null;
	Z._currFieldName = null;
	Z._currFilterExpr = null;
};

jslet.ui.DBTableFilterPanel.prototype = {
	
	jqFilterBtn: function(jqFilterBtn) {
		this._jqFilterBtn = jqFilterBtn;
	},
		
	changeField: function(fldName) {
		var dsFilter = this._filterDataset,
			fldObj = dsFilter.getField('field'),
			lkDs = fldObj.lookup().dataset();
		dsFilter.cancel();
		lkDs.filter('[name] == "' + fldName +'" || like([name],"'+ fldName + '.%' + '")');
		lkDs.filtered(true);
		fldObj.visible(lkDs.recordCount() > 1);
		if(!dsFilter.find('[field] == "' + fldName + '" || like([field], "' + fldName + '.%' + '")')) {
			dsFilter.appendRecord();
			dsFilter.setFieldValue('field', fldName);
		}
		this._currFieldName = fldName;
	},
	
	show: function (left, top, ajustX, ajustY) {
		var Z = this;
		if (!Z._panel) {
			Z._panel = Z._create();
		}
		Z._panel.style.left = left + 'px';
		Z._panel.style.top = top + 'px';
		jQuery(Z._panel).show('fast');
		window.setTimeout(function(){
			Z._filterDataset.focusEditControl('value');
		},5);
	},

	hide: function () {
		this._filterDataset.cancel();
		jQuery(this._panel).hide('fast');
	},
	
	cancelFilter: function() {
		this._filterDataset.cancel();
	},
	
	_create: function () {
		var Z = this;
		if (!Z._panel) {
			Z._panel = document.createElement('div');
			Z._dbtable.el.appendChild(Z._panel);
		}
		jQuery(Z._panel).addClass('panel panel-default jl-filter-panel');
		Z._panel.innerHTML = '<div class=""><div data-jslet="type: \'DBEditPanel\', dataset: \'' + Z._filterDataset.name() + 
		'\', columnCount: 1,hasLabel:false " style="width:100%;height:100%" ></div></div>' +
		'<div><button class="btn btn-default btn-sm jl-filter-panel-ok" tabIndex="90990">' + jslet.locale.FilterPanel.ok +
		'</button><button class="btn btn-default btn-sm jl-filter-panel-cancel" tabIndex="90991">' + jslet.locale.FilterPanel.cancel + 
		'</button><button class="btn btn-default btn-sm jl-filter-panel-clear" tabIndex="90992">' + jslet.locale.FilterPanel.clear + 
		'</button><button class="btn btn-default btn-sm jl-filter-panel-clearall" tabIndex="90993">' + jslet.locale.FilterPanel.clearAll + 
		'</button></div>';
		jslet.ui.install(Z._panel);
		var jqPanel = jQuery(Z._panel);
		jqPanel.find('.jl-filter-panel-ok').on('click', function(){
			var dsFilter = Z._filterDataset;
			dsFilter.confirm();
			if(jslet.isEmpty(dsFilter.getFieldValue('value'))) {
				dsFilter.deleteRecord();
			}
			var filter = Z._filterDatasetObj.getFilterExpr();
			Z._dbtable.dataset().filter(filter).filtered(true);
			Z._currFilterExpr = filter;
			
			Z.hide();
			Z._setFilterBtnStyle();
		});
		jqPanel.find('.jl-filter-panel-cancel').on('click', function(){
			Z._filterDataset.cancel();
			Z.hide();
		});
		jqPanel.find('.jl-filter-panel-clear').on('click', function(){
			Z._filterDataset.deleteRecord();
			var filter = Z._filterDatasetObj.getFilterExpr();
			Z._dbtable.dataset().filter(filter).filtered(true);
			Z.hide();
			Z._currFilterExpr = filter;
			Z._setFilterBtnStyle();
		});
		jqPanel.find('.jl-filter-panel-clearall').on('click', function(){
			Z._filterDataset.dataList(null);
			Z._dbtable.dataset().filter(null).filtered(false);
			Z.hide();
			Z._clearFilterBtnStyle();
		});
		//prevent to fire the dbtable's keydown event.
		jqPanel.on('keydown', function(event) {
       		event.stopImmediatePropagation();
		});
		return Z._panel;
	},

	_clearFilterBtnStyle: function() {
		var jqPanel = jQuery(this._panel);
		jQuery(this._dbtable.el).find('.jl-tbl-filter-hasfilter').attr('title', '').removeClass('jl-tbl-filter-hasfilter');
		jqPanel.find('.jl-filter-panel-clearall').attr('title', '');
		this._currFilterExpr = null;
	},
	
	checkFilterBtnStyle: function() {
		var Z = this;
		if(!Z._currFilterExpr) {
			return;
		}
		var dsHost = Z._dbtable.dataset(),
			dsFilterExpr = dsHost.filter();
		if(dsHost.filtered() && dsFilterExpr == Z._currFilterExpr) {
			return;
		}
		Z._clearFilterBtnStyle();
		var dsFilter = Z._filterDataset;
		if(!dsFilterExpr || !dsHost.filtered()) {
			dsFilter.dataList(null);
		}
		var filterText = Z._filterDatasetObj.getFilterExprText();
		jQuery(Z._dbtable.el).find('button.jl-tbl-filter').each(function(){
			var fldName = this.getAttribute('jsletfilterfield');
			var jqFilterBtn = jQuery(this);
			if(dsFilter.find('[field] == "' + fldName + '" || like([field], "' + fldName + '.%' + '")')) {
				jqFilterBtn.addClass('jl-tbl-filter-hasfilter');
			} else {
				jqFilterBtn.removeClass('jl-tbl-filter-hasfilter');
			}
			jqFilterBtn.attr('title', filterText || '');
		});
		jQuery(Z._panel).find('.jl-filter-panel-clearall').attr('title', filterText || '');
	},
	
	_setFilterBtnStyle: function() {
		var Z = this;
		var filterText = Z._filterDatasetObj.getFilterExprText();
		
		var dsFilter = Z._filterDataset;
		if(dsFilter.find('[field] == "' + Z._currFieldName + '" || like([field], "' + Z._currFieldName + '.%' + '")')) {
			Z._jqFilterBtn.addClass('jl-tbl-filter-hasfilter');
		} else {
			Z._jqFilterBtn.removeClass('jl-tbl-filter-hasfilter');
		}
		Z._jqFilterBtn.attr('title', filterText || '');
		jQuery(Z._dbtable.el).find('.jl-tbl-filter-hasfilter').attr('title', filterText || '');
		jQuery(Z._panel).find('.jl-filter-panel-clearall').attr('title', filterText || '');
	},
	
	destroy: function(){
		var Z = this;
		jslet.ui.uninstall(Z._panel);
		Z._panel.innerHTML = '';
		Z._panel = null;
		Z._dbtable = null;
		Z._jqFilterBtn = null;
	}
};

/**
 * Export dialog;
 */
jslet.ui.ExportDialog = function(dataset, hasSchemaSection) {
	this._dataset = jslet.data.getDataset(dataset);
	this._exportDataset = null;
	this._hasSchemaSection = (hasSchemaSection === undefined || hasSchemaSection ? true: false);
	
	this._dlgId = null;
	
	this._initialize();
};

jslet.ui.ExportDialog.prototype = {
	_initialize: function() {
		var fldCfg = [
		    	      {name: 'field', type: 'S', length: 100, label: 'Field Name', nullText: 'default'}, 
		    	      {name: 'label', type: 'S', length: 50, label: 'Field Label'},
		    	      {name: 'parent', type: 'S', length: 100, label: 'Field Name'}, 
		    	    ];
		var exportLKDs = jslet.data.createDataset('exportLKDs' + jslet.nextId(), fldCfg, 
				{keyField: 'field', codeField: 'field', nameField: 'label', parentField: 'parent', isFireGlobalEvent: false});
		exportLKDs.onCheckSelectable(function(){
	        return !this.hasChildren(); 
	    });
		
		var expFldCfg = [
    	      //{name: 'schemaId', type: 'S', length: 30, label: 'Export Schema ID'}, 
    	      {name: 'schema', type: 'S', length: 30, label: 'Export Schema'}, 
    	      {name: 'fields', type: 'S', length: 500, label: 'Export Fields', visible: false, valueStyle: jslet.data.FieldValueStyle.MULTIPLE, lookup: {dataset: exportLKDs}}
    	    ];
    	this._exportDataset = jslet.data.createDataset('exportDs' + jslet.nextId(), expFldCfg, {keyField: 'schema', nameField: 'schema', isFireGlobalEvent: false});
    	if(this._hasSchemaSection) {
	    	var exportDsClone = this._exportDataset;
	    	var lkObj = new jslet.data.FieldLookup();
	    	lkObj.dataset(exportDsClone);
	    	this._exportDataset.getField('schema').lookup(lkObj);
    	}
		var opt = { type: 'window', caption: jslet.locale.ExportDialog.caption, isCenter: true, resizable: true, minimizable: false, maximizable: false, animation: 'fade'};
		var owin = jslet.ui.createControl(opt);
		var html = ['<div class="form-horizontal jl-expdlg-content" data-jslet="dataset: \'', this._exportDataset.name(),
		            '\'"><div class="form-group form-group-sm">',
		            '<div class="col-sm-6"><div data-jslet="type:\'DBComboSelect\',field:\'schema\'"></div></div>',
		            '<div class="col-sm-6"><button class="btn btn-default btn-sm" id="jlbtnSave">',
		            jslet.locale.ExportDialog.saveSchema,
		            '</button><button class="btn btn-default btn-sm">',
		            jslet.locale.ExportDialog.deleteSchema,
		            '</button></div></div>',
		            
		            '<div class="form-group form-group-sm">',
		            '<div class="col-sm-12 jl-expdlg-fields" data-jslet="type:\'DBList\',field:\'fields\',correlateCheck:true"></div></div>',

		            '<div class="form-group form-group-sm"><label class="control-label col-sm-3">',
		            jslet.locale.ExportDialog.fileName,
		            '</label>',
					'<div class="col-sm-9"><input id="jltxtExportFile" class="form-control" type="text"></input></div></div>',
		            '<div class="form-group form-group-sm"><label class="control-label col-sm-8">&nbsp</label>',
		            '<div class="col-sm-4"><button id="jlbtnExport" class="btn btn-default btn-sm">',
		            jslet.locale.ExportDialog.exportData,
		            '</button><button id="jlbtnCancel" class="btn btn-default btn-sm">',
		            jslet.locale.ExportDialog.cancel,
		            '</button></div></div>',
		            '</div>'];
		owin.setContent(html.join(''));
		owin.onClosed(function () {
			return 'hidden';
		});
		var Z = this;
		this._dlgId = owin.el.id;
		var jqEl = jQuery(owin.el);
		jqEl.find('#jlbtnExport').click(function(event) {
			var jqExpportFile = jqEl.find('#jltxtExportFile');
			var fileName = jqExpportFile.val();
			if(!fileName || !fileName.trim()) {
				jslet.showInfo('FileName required!');
				event.stopPropagation();
				event.preventDefault();
				return false;
			}
			var fields = Z._exportDataset.getFieldValue('fields');
			
			Z._dataset.exportCsvFile(fileName, {includeFields: fields});
			owin.close();
		});
		jqEl.find('#jlbtnSave').click(function(event) {
			jslet.ui.MessageBox.prompt('Please input exportting shema: ', 'Input Export Schema', function(button, value){
				if(button === 'ok' && value) {
					var fields = Z._exportDataset.getFieldValue('fields');
					Z._exportDataset.appendRecord();
					Z._exportDataset.setFieldValue('schema', value);
					Z._exportDataset.setFieldValue('fields', fields);
					Z._exportDataset.confirm();
				}
			});
		});
		
		jqEl.find('#jlbtnCancel').click(function(event) {
			owin.close();
		});
	},
	
	exportDataset: function(exportDs) {
		return this._exportDataset;
	},
	
	_refreshFields: function() {
		var dataList = [{field: '_all_', label: jslet.locale.ExportDialog.all}];
		var fieldNames = [];
		
		function addFields(dataList, fieldNames, fields, parentField, isDetailDs) {
			var fldObj, fldName;
			for(var i = 0, len = fields.length; i < len; i++) {
				fldObj = fields[i];
				fldName = fldObj.name();
				if(parentField && isDetailDs) {
					fldName = parentField + '.' + fldName;
				}
				var detailDs = fldObj.subDataset();
				if(detailDs) {
					dataList.push({field: fldName, label: fldObj.label(), parent: parentField || '_all_'});
					addFields(dataList, fieldNames, detailDs.getNormalFields(), fldName, true);
					continue;
				}
				if(!fldObj.visible()) {
					continue;
				}
				dataList.push({field: fldName, label: fldObj.label(), parent: parentField || '_all_'});
				var fldChildren = fldObj.children();
				if(fldChildren) {
					addFields(dataList, fieldNames, fldChildren, fldName);
				} else {
					fieldNames.push(fldName);
				}
			}
		}
		addFields(dataList, fieldNames, this._dataset.getFields());
		var exportLKDs = this._exportDataset.getField('fields').lookup().dataset();
		exportLKDs.dataList(dataList);
		this._exportDataset.setFieldValue('fields', fieldNames);
		exportLKDs.first();
	},

	show: function() {
		var Z = this;
		Z._refreshFields();
		var jqEl = jQuery('#' + this._dlgId);
		var owin = jqEl[0].jslet;
		var fileName = Z._dataset.description() + '.csv';
		var jqExpportFile = jqEl.find('#jltxtExportFile');
		jqExpportFile.val(fileName);
		owin.showModal();
		owin.setZIndex(999);
		return owin;
	}
};

jslet.ui.InputSettingDialog = function() {
	this._inputSettingDs = null;
	
	this._hostDataset = null;
	
	this._onClosed = null;
	
	this._onRestoreDefault = null;
	
	this._settings = null;
	var Z = this;
	
	function doProxyFieldChanged(dataRec, proxyFldName, proxyFldObj) {
		var hostFldObj = jslet.data.getDataset(dataRec.dataset).getField(proxyFldName);
		proxyFldObj.dataType(hostFldObj.dataType());
		proxyFldObj.length(hostFldObj.length());
		proxyFldObj.scale(hostFldObj.scale());
		proxyFldObj.editMask(hostFldObj.editMask());

		proxyFldObj.displayFormat(hostFldObj.displayFormat());
		proxyFldObj.dateFormat(hostFldObj.dateFormat());
		proxyFldObj.displayControl(hostFldObj.displayControl());
		proxyFldObj.validChars(hostFldObj.validChars());
		if(hostFldObj.lookup()) {
			var hostLkObj = hostFldObj.lookup();
			var lkObj = new jslet.data.FieldLookup();
			lkObj.dataset(hostLkObj.dataset());
			lkObj.keyField(hostLkObj.keyField());
			lkObj.codeField(hostLkObj.codeField());
			lkObj.nameField(hostLkObj.nameField());
			lkObj.displayFields(hostLkObj.displayFields());
			lkObj.parentField(hostLkObj.parentField());
			lkObj.onlyLeafLevel(false);
			proxyFldObj.lookup(lkObj);
			proxyFldObj.editControl('DBComboSelect');
		} else {
			proxyFldObj.lookup(null);
			var editorObj = hostFldObj.editControl();
			if(jslet.compareValue(editorObj.type,'DBTextArea') === 0) {
				editorObj = {type: 'DBText'};
			}
			proxyFldObj.editControl(editorObj);
		}
		proxyFldObj.valueStyle(jslet.data.FieldValueStyle.NORMAL);
	}

	function initialize() {
		var fldCfg = [{name: 'dataset', type: 'S', length: 30, visible: false},
		              {name: 'field', type: 'S', length: 30, displayWidth: 20, visible: false},
		              {name: 'label', type: 'S', label: jslet.locale.InputSettingDialog.labelLabel, length: 50, displayWidth: 20, disabled: true},
		              {name: 'parentField', type: 'S', length: 30, visible: false},
		              {name: 'tabIndex', type: 'N', label: 'tabIndex', length: 3, visible: false},
		              {name: 'defaultValue', type: 'P', label: jslet.locale.InputSettingDialog.labelDefaultValue, length: 200, displayWidth:30, proxyHostFieldName: 'field', proxyFieldChanged: doProxyFieldChanged},
		              {name: 'focused', type: 'B', label: jslet.locale.InputSettingDialog.labelFocused, displayWidth: 6},
		              {name: 'valueFollow', type: 'B', label: jslet.locale.InputSettingDialog.labelValueFollow, displayWidth: 6},
		              {name: 'isDatasetField', type: 'B', label: '', visible: false},
		              ];
		
		Z._inputSettingDs = jslet.data.createDataset('custDs' + jslet.nextId(), fldCfg, 
				{keyField: 'field', nameField: 'label', parentField: 'parentField', logChanges: false, indexFields: 'tabIndex', isFireGlobalEvent: false});
		
		var custContextFn = function(fldObj, changingFldName){
			var dataset = fldObj.dataset();
			fldObj.disabled(dataset.getFieldValue('isDatasetField'));
		};
		
		Z._inputSettingDs.contextRules([{"condition": "true", "rules": [
		     {"field": 'defaultValue', "customized": custContextFn},
		     {"field": 'focused', "customized": custContextFn},
		     {"field": 'valueFollow', "customized": custContextFn}
		]}]);
		Z._inputSettingDs.enableContextRule();
		Z._inputSettingDs.onFieldChanged(function(propName, propValue){
			if(Z._isInit) {
				return;
			}
			if(!Z._settings) {
				Z._settings = {};
			}
			var hostDsName = this.getFieldValue('dataset'),
				hostFldName = this.getFieldValue('field'),
				dsSetting = Z._settings[hostDsName];
			if(!dsSetting) {
				dsSetting = {};
				Z._settings[hostDsName] = dsSetting;
			}
			var fldSetting = dsSetting[hostFldName];
			if(!fldSetting) {
				fldSetting = {};
				dsSetting[hostFldName] = fldSetting; 
			}
			fldSetting[propName] = propValue;
		});
	}
	
	initialize.call(this);
};

jslet.ui.InputSettingDialog.prototype = {
		
	hostDataset: function(hostDataset) {
		if(hostDataset === undefined) {
			return this._hostDataset;
		}
		this._hostDataset = hostDataset;
	},
	
	onClosed: function(onClosedFn) {
		if(onClosedFn === undefined) {
			return this._onClosed;
		}
		this._onClosed = onClosedFn;
	},
	
	onRestoreDefault: function(onRestoreDefaultFn) {
		if(onRestoreDefaultFn === undefined) {
			return this._onRestoreDefault;
		}
		this._onRestoreDefault = onRestoreDefaultFn;
	},
	
	show: function(hostDataset) {
		jslet.Checker.test('InputSettingDialog.show#hostDataset', hostDataset).required();
		var Z = this;
		Z._hostDataset = hostDataset;
		Z._isInit = true;
		Z._settings = null;
		Z._inputSettingDs.disableControls();
		try {
			Z._initializeFields();
		} finally {
			Z._isInit = false;
			Z._inputSettingDs.first();
			Z._inputSettingDs.enableControls();
		}
		var creating = false;
		if(!Z._dlgId) {
			Z._createDialog();
			creating = true;
		}
		var tblFields = jQuery('#' + Z._dlgId).find('.jl-isdlg-fields')[0].jslet;
		tblFields.expandAll();
		if(creating) {
			tblFields.onRowClick(function() {
				if(this.dataset().getFieldValue('isDatasetField')) {
					this.toggle();
				}
			});
		}
		var owin = jslet('#' + Z._dlgId);
		owin.showModal();
		owin.setZIndex(999);
	},
	
	_initializeFields: function(hostDs, isKeepFields, parentField) {
		var Z = this,
			dataset = Z._inputSettingDs,
			fldObj;
		if(!hostDs) {
			hostDs = jslet.data.getDataset(Z._hostDataset);
		}
		var fields = hostDs.getNormalFields();
		if(!isKeepFields) {
			dataset.dataList(null);
		}
		var isDsFld;
		for(var i = 0, len = fields.length; i < len; i++) {
			fldObj = fields[i];
			isDsFld = fldObj.subDataset()? true: false;
			if(!isDsFld && !fldObj.visible()) {
				continue;
			}
			dataset.appendRecord();
			dataset.setFieldValue('isDatasetField', isDsFld);
			
			dataset.setFieldValue('dataset', hostDs.name());
			dataset.setFieldValue('field', fldObj.name());
			dataset.setFieldValue('label', fldObj.label());
			dataset.setFieldValue('tabIndex', fldObj.tabIndex());
			if(parentField) {
				dataset.setFieldValue('parentField', parentField);
			}
			if(!isDsFld) {
				dataset.setFieldValue('defaultValue', fldObj.defaultValue());
				dataset.setFieldValue('focused', fldObj.focused());
				dataset.setFieldValue('valueFollow', fldObj.valueFollow());
			}
			dataset.confirm();
			if(isDsFld) {
				this._initializeFields(fldObj.subDataset(), true, fldObj.name());
			}
		}
	},
	
	_createDialog: function() {
		var opt = { type: 'window', caption: jslet.locale.InputSettingDialog.caption, isCenter: true, resizable: true, minimizable: false, maximizable: false, animation: 'fade', styleClass: 'jl-isdlg'};
		var owin = jslet.ui.createControl(opt);
		var html = [
		            '<div class="form-group form-group-sm">',
		            '<div class="jl-isdlg-fields" data-jslet="type:\'DBTable\',dataset:\'', this._inputSettingDs.name(), 
		            '\',treeField:\'label\',readOnly:false,hasFilterDialog:false"></div></div>',

//		            '<div class="form-group form-group-sm">',
//		            '<div class="col-sm-3"><button id="jlbtnSave" class="btn btn-default btn-sm">',
//		            '<button id="jlbtnUp" class="btn btn-default btn-sm">', jslet.locale.InputSettingDialog.save, '</button>',
//		            '<button id="jlbtnDown" class="btn btn-default btn-sm">', jslet.locale.InputSettingDialog.save, '</button>',
//		            '</div>',
//		            '<label class="control-label col-sm-6">&nbsp</label>',
//		            '<div class="col-sm-3"><button id="jlbtnSave" class="btn btn-default btn-sm">',
		            
		            '<div class="form-group form-group-sm"><label class="control-label col-sm-9">&nbsp</label>',
		            '<div class="col-sm-3"><button id="jlbtnSave" class="btn btn-default btn-sm">',		            
		            jslet.locale.InputSettingDialog.save,
		            '</button><button id="jlbtnCancel" class="btn btn-default btn-sm">',
		            jslet.locale.InputSettingDialog.cancel,
		            '</button></div></div>',
		            '</div>'];
		owin.setContent(html.join(''));
		owin.onClosed(function () {
			return 'hidden';
		});
		this._dlgId = owin.el.id;
		var jqEl = jQuery(owin.el), 
			Z = this;
		
//		jqEl.find('#jlbtnUp').on('click', function(event) {
//			var dataset = Z._inputSettingDs;
//			if(dataset.recordCount() === 0) {
//				return;
//			}
//			var idx = dataset.getFieldValue('tabIndex');
//			if(!idx) {
//				idx = dataset.recno();
//			}
//			if(idx === 0) {
//				return;
//			}
//			var context = dataset.startSilenceMove();
//			try {
//				dataset.setFieldValue('tabIndex', idx - 1);
//				dataset.prior();
//				dataset.setFieldValue('tabIndex', idx);
//				dataset.confirm();
//			} finally {
//				dataset.endSilenceMove(context);
//			}
//			dataset.indexFields(dataset.indexFields());
//		});
		
		jqEl.find('#jlbtnSave').on('click', function(event) {
			if(Z._settings) {
				var hostDs, fldObj, fldSetting, propSetting;
				for(var dsName in Z._settings) {
					hostDs = jslet.data.getDataset(dsName);
					fldSetting = Z._settings[dsName]; 
					for(var fldName in fldSetting) {
						fldObj = hostDs.getField(fldName);
						propSetting = fldSetting[fldName];
						for(var propName in propSetting) {
							fldObj[propName](propSetting[propName]);
						}
					}
				}
				if(Z._onClosed) {
					Z._onClosed(Z._settings);
				}
			}
			owin.close();
		});
		jqEl.find('#jlbtnCancel').on('click', function(event) {
			owin.close();
		});
		
		jslet.ui.install(owin.el);
	}
};

jslet.ui.defaultInputSettingDialog = new jslet.ui.InputSettingDialog();

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBChart, show data as a chart. There are five chart type: column, bar, line, area, pie  
 * Example:
 * <pre><code>
 *		var jsletParam = {type:"dbchart", dataset:"summary", chartType:"column",categoryField:"month",valueFields:"amount"};
 * 
 * //1. Declaring:
 *		&lt;div id="chartId" data-jslet='type:"dbchart",chartType:"column",categoryField:"month",valueFields:"amount,netProfit", dataset:"summary"' />
 *		or
 *		&lt;div data-jslet='jsletParam' />
 *
 *  //2. Binding
 *		&lt;div id="ctrlId"  />
 *		//Js snippet
 *		var el = document.getElementById('ctrlId');
 *		jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *		jslet.ui.createControl(jsletParam, document.body);
 *
 * </code></pre>
 */
"use strict";
jslet.ui.DBChart = jslet.Class.create(jslet.ui.DBControl, {
	chartTypes: ['line', 'bar', 'stackbar', 'pie'],
	legendPositions: ['none', 'top', 'bottom', 'left', 'right'],
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,chartType,chartTitle,categoryField,valueFields,legendPos';
		Z.requiredProperties = 'valueFields,categoryField';
		
		/**
		 * {String} Chart type. Optional value is: column, bar, line, area, pie
		 */
		Z._chartType = "line";
		/**
		 * {String} Category field, use comma(,) to separate multiple fields.
		 */
		Z._categoryFields = null;
		/**
		 * {Number} Value field, only one field allowed.
		 */
		Z._valueFields = null;
		/**
		 * {String} Chart title
		 */
		Z._chartTitle = null;

		/**
		 * {String} Legend position, optional value: none, top, bottom, left, right
		 */
		Z._legendPos = 'top';
		
		Z._fieldValidated = false;
		
		$super(el, params);
	},

	chartType: function(chartType) {
		if(chartType === undefined) {
			return this._chartType;
		}
		chartType = jQuery.trim(chartType);
		var checker = jslet.Checker.test('DBChart.chartType', chartType).isString().required();
		checker.testValue(chartType.toLowerCase()).inArray(this.chartTypes);
		this._chartType = chartType;
	},
	
	categoryField: function(categoryField) {
		if(categoryField === undefined) {
			return this._categoryField;
		}
		jslet.Checker.test('DBChart.categoryField', categoryField).isString().required();
		categoryField = jQuery.trim(categoryField);
		this._categoryField = categoryField;
		this._fieldValidated = false;
	},
	
	valueFields: function(valueFields) {
		if(valueFields === undefined) {
			return this._valueFields;
		}
		jslet.Checker.test('DBChart.valueFields', valueFields).isString().required();
		valueFields = jQuery.trim(valueFields);
		this._valueFields = valueFields.split(',');
		this._fieldValidated = false;
	},
	
	chartTitle: function(chartTitle) {
		if(chartTitle === undefined) {
			return this._chartTitle;
		}
		jslet.Checker.test('DBChart.chartTitle', chartTitle).isString();
		this._chartTitle = chartTitle;
	},
	
	legendPos: function(legendPos) {
		if(legendPos === undefined) {
			return this._legendPos;
		}
		legendPos = jQuery.trim(legendPos);
		var checker = jslet.Checker.test('DBChart.legendPos', legendPos).isString().required();
		checker.testValue(legendPos.toLowerCase()).inArray(this.legendPositions);
		this._legendPos = legendPos;
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
	bind: function () {
		if(!this.el.id) {
			this.el.id = jslet.nextId();
		}
		this.renderAll();
	}, // end bind

	_validateFields: function() {
		var Z = this;
		if(Z._fieldValidated) {
			return;
		}
		var dsObj = Z._dataset,
			fldName = Z._categoryField;
		if (!dsObj.getField(fldName)) {
			throw new Error(jslet.formatMessage(jslet.locale.Dataset.fieldNotFound, [fldName]));
		}
		
		for(var i = 0, len = Z._valueFields.length; i < len; i++) {
			fldName = Z._valueFields[i];
			if(!dsObj.getField(fldName)) {
				throw new Error(jslet.formatMessage(jslet.locale.Dataset.fieldNotFound, [fldName]));
			}
		}
		Z._fieldValidated = true;
	},
	
	_getLineData: function() {
		var Z = this,
			dsObj = Z._dataset;
		if (dsObj.recordCount() === 0) {
			return {xLabels: [], yValues: []};
		}
		var oldRecno = dsObj.recnoSilence(),
			xLabels = [],
			yValues = [],
			legendLabels = [];

		try {
			var isInit = false, valueFldName,
				valueFldCnt = Z._valueFields.length,
				valueArr;
			for(var k = 0, recCnt = dsObj.recordCount(); k < recCnt; k++) {
				dsObj.recnoSilence(k);
				xLabels.push(dsObj.getFieldText(Z._categoryField));
				for(var i = 0; i < valueFldCnt; i++) {
					valueFldName = Z._valueFields[i];
					if(!isInit) {
						valueArr = [];
						yValues.push(valueArr);
						legendLabels.push(dsObj.getField(valueFldName).label());
					} else {
						valueArr = yValues[i];
					}
					valueArr.push(dsObj.getFieldValue(valueFldName));
				}
				isInit = true;
			} //End for k
		} finally {
			dsObj.recnoSilence(oldRecno);
		}
		return {xLabels: xLabels, yValues: yValues, legendLabels: legendLabels};
	},

	_getPieData: function() {
		var Z = this,
			dsObj = Z._dataset;
		if (dsObj.recordCount() === 0) {
			return [];
		}
		var oldRecno = dsObj.recnoSilence(),
			result = [];
			
		try {
			var valueFldName = Z._valueFields[0],
				label, value;
			for(var k = 0, recCnt = dsObj.recordCount(); k < recCnt; k++) {
				dsObj.recnoSilence(k);
				label = dsObj.getFieldText(Z._categoryField);
				value = dsObj.getFieldValue(valueFldName);
				result.push([label, value]);
			}
		} finally {
			dsObj.recnoSilence(oldRecno);
		}
		return result;
	},

	_drawLineChart: function() {
		var Z = this;
		var chartData = Z._getLineData();
		
		jQuery.jqplot(Z.el.id, chartData.yValues, 
		{ 
			title: Z._chartTitle, 
            animate: !jQuery.jqplot.use_excanvas,
			// Set default options on all series, turn on smoothing.
			seriesDefaults: {
				rendererOptions: {smooth: true},
				pointLabels: {show: true, formatString: '%d'}				
			},
			
			legend:{ show:true,
				labels: chartData.legendLabels
			},
			
            axes: {
				xaxis: {
					renderer: jQuery.jqplot.CategoryAxisRenderer,
					ticks: chartData.xLabels
				}
			}
		});
	},
		
	_drawPieChart: function() {
		var Z = this;
		var chartData = Z._getPieData();
		
		jQuery.jqplot(Z.el.id, [chartData], {
			title: Z._chartTitle, 
            animate: !jQuery.jqplot.use_excanvas,
			seriesDefaults:{
				renderer: jQuery.jqplot.PieRenderer ,
				pointLabels: {show: true, formatString: '%d'}				
			},
			legend:{ show:true }
		});
	},
	
	_drawBarChart: function(isStack) {
		var Z = this;
		var chartData = Z._getLineData();

        jQuery.jqplot(Z.el.id, chartData.yValues, {
			title: Z._chartTitle,
			stackSeries: isStack,
            // Only animate if we're not using excanvas (not in IE 7 or IE 8)..
            animate: !jQuery.jqplot.use_excanvas,
            seriesDefaults:{
                renderer:jQuery.jqplot.BarRenderer,
				pointLabels: {show: true, formatString: '%d'}				
            },

			legend:{ show:true,
				labels: chartData.legendLabels
			},
			
            axes: {
                xaxis: {
                    renderer: jQuery.jqplot.CategoryAxisRenderer,
                    ticks: chartData.xLabels
                }
            },
            highlighter: { show: false }
        });	
	},
	
	drawChart: function () {
		var Z = this,
			dsObj = Z._dataset;
			
		Z.el.innerHTML = '';
		Z._validateFields();
		if(Z._chartType == 'pie') {
			Z._drawPieChart();
			return;
		}
		if(Z._chartType == 'line') {
			Z._drawLineChart();
			return;
		}
		if(Z._chartType == 'bar') {
			Z._drawBarChart(false);
			return;
		}
		if(Z._chartType == 'stackbar') {
			Z._drawBarChart(true);
			return;
		}
		
		
	}, // end draw chart

	refreshControl: function (evt) {
		var evtType = evt.eventType;
		if (evtType == jslet.data.RefreshEvent.UPDATEALL || 
			evtType == jslet.data.RefreshEvent.UPDATERECORD ||
			evtType == jslet.data.RefreshEvent.UPDATECOLUMN || 
			evtType == jslet.data.RefreshEvent.INSERT || 
			evtType == jslet.data.RefreshEvent.DELETE) {
			this.drawChart();
		}
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
	destroy: function($super){
		this.swf = null;
		$super();
	}
});

jslet.ui.register('DBChart', jslet.ui.DBChart);
jslet.ui.DBChart.htmlTemplate = '<div></div>';

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
* DBEditPanel
*/
"use strict";
jslet.ui.DBEditPanel = jslet.Class.create(jslet.ui.DBControl, {
	_totalColumns: 12, //Bootstrap column count 
	/**
	 * @override
	*/
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,columnCount,labelCols,onlySpecifiedFields,fields,hasLabel';
		
		/**
		 * {Integer} Column count
		 */
		Z._columnCount = 3;
		/**
		 * {Integer} The gap between label and editor
		 */
		Z._labelCols = 1;

		/**
		 * {Boolean} True - only show specified fields, false otherwise.
		 */
		Z._onlySpecifiedFields = false;
		/**
		 * Array of edit field configuration, prototype: [{field: "field1", colSpan: 2, rowSpan: 1}, ...]
		 */
		Z._fields = null;
		
		Z._hasLabel = true;
		
		Z._metaChangedDebounce = jslet.debounce(Z.renderAll, 10);

		$super(el, params);
	},
	
	columnCount: function(columnCount) {
		if(columnCount === undefined) {
			return this._columnCount;
		}
		jslet.Checker.test('DBEditPanel.columnCount', columnCount).isGTZero();
		this._columnCount = parseInt(columnCount);
	},
	
	labelCols: function(labelCols) {
		if(labelCols === undefined) {
			return this._labelCols;
		}
		jslet.Checker.test('DBEditPanel.labelCols', labelCols).isNumber().between(1,3);
		this._labelCols = parseInt(labelCols);
	},
	
	onlySpecifiedFields: function(onlySpecifiedFields) {
		if(onlySpecifiedFields === undefined) {
			return this._onlySpecifiedFields;
		}
		this._onlySpecifiedFields = onlySpecifiedFields ? true: false;
	},
	
	hasLabel: function(hasLabel) {
		if(hasLabel === undefined) {
			return this._hasLabel;
		}
		this._hasLabel = hasLabel ? true: false;
	},
	
	fields: function(fields) {
		if(fields === undefined) {
			return this._fields;
		}
		jslet.Checker.test('DBEditPanel.fields', fields).isArray();
		var fldCfg;
		for(var i = 0, len = fields.length; i < len; i++) {
			fldCfg = fields[i];
			jslet.Checker.test('DBEditPanel.fields.field', fldCfg.field).isString().required();
			jslet.Checker.test('DBEditPanel.fields.labelCols', fldCfg.colSpan).isNumber().between(1,3);
			jslet.Checker.test('DBEditPanel.fields.dataCols', fldCfg.colSpan).isNumber().between(1,11);
			jslet.Checker.test('DBEditPanel.fields.prefix', fldCfg.prefix).isArray();
			jslet.Checker.test('DBEditPanel.fields.suffix', fldCfg.suffix).isArray();
			fldCfg.inFirstCol = fldCfg.inFirstCol ? true: false;
			fldCfg.showLine = fldCfg.showLine ? true: false;
			fldCfg.visible = (fldCfg.visible === undefined || fldCfg.visible) ? true: false;
		}
		this._fields = fields;
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
	bind: function () {
		this.renderAll();
	},
	
	_calcLayout: function () {
		var Z = this,
			allFlds = Z._dataset.getNormalFields(), 
			fldLayouts, fldObj, i, layoutcnt,
			fcnt = allFlds.length;
		
		if (!Z._onlySpecifiedFields) {
			fldLayouts = [];
			var fldName, found, editFld, maxFld, visible;
			layoutcnt = Z._fields ? Z._fields.length : 0;
			for (i = 0; i < fcnt; i++) {
				fldObj = allFlds[i];
				fldName = fldObj.name();
				visible = fldObj.visible();
				found = false;
				for (var j = 0; j < layoutcnt; j++) {
					editFld = Z._fields[j];
					if (fldName == editFld.field) {
						found = true;
						if(editFld.visible === undefined || editFld.visible) {
							fldLayouts.push(editFld);
						}
						break;
					}
				}
				
				if (!found) {
					if(!visible) {
						continue;
					}
					fldLayouts.push({
						field: fldObj.name()
					});
				}
			} //end for i
		} else {
			fldLayouts = Z._fields;
		}

		var dftDataCols = Math.floor((Z._totalColumns - Z._labelCols * Z._columnCount) / Z._columnCount);
		if(dftDataCols <= 0) {
			dftDataCols = 1;
		}

		//calc row, col
		var layout, r = 0, c = 0, colsInRow = 0, itemCnt;
		for (i = 0, layoutcnt = fldLayouts.length; i < layoutcnt; i++) {
			layout = fldLayouts[i];
			if(!layout.labelCols) {
				layout._innerLabelCols = Z._labelCols;
			}
			if(!layout.dataCols) {
				layout._innerDataCols = dftDataCols;
			} else {
				layout._innerDataCols = layout.dataCols;	
			}
			itemCnt = layout._innerLabelCols + layout._innerDataCols;
			if (layout.inFirstCol || layout.showLine || colsInRow + itemCnt > Z._totalColumns) {
				r++;
				colsInRow = 0;
			}
			layout.row = r;
			colsInRow += itemCnt;
		}
		return fldLayouts;
	},
	
	getEditField: function (fieldName) {
		var Z = this;
		if (!Z._fields) {
			Z._fields = [];
		}
		var editFld;
		for (var i = 0, cnt = Z._fields.length; i < cnt; i++) {
			editFld = Z._fields[i];
			if (editFld.field == fieldName) {
				return editFld;
			}
		}
		var fldObj = Z._dataset.getField(fieldName);
		if (!fldObj) {
			return null;
		}
		editFld = {
			field: fieldName
		};
		Z._fields.push(editFld);
		return editFld;
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this;
		Z.removeAllChildControls();
		var jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-editpanel')) {
			jqEl.addClass('jl-editpanel form-horizontal');
		}
		jqEl.html('');
		var allFlds = Z._dataset.getNormalFields(),
			fcnt = allFlds.length;
		var layouts = Z._calcLayout();
		//calc max label width
			
		var layout, dbctrl, editor, r = -1, oLabel, editorCfg, fldName, fldObj, ohr, octrlDiv, opanel, ctrlId, dbCtrl;
		for (var i = 0, cnt = layouts.length; i < cnt; i++) {
			layout = layouts[i];
			if (layout.showLine) {
				ohr = document.createElement('hr');
				Z.el.appendChild(ohr);
			}
			if (layout.row != r) {
				opanel = document.createElement('div');
				opanel.className = 'form-group form-group-sm';
				Z.el.appendChild(opanel);
				r = layout.row;

			}
			fldName = layout.field;
			fldObj = Z._dataset.getField(fldName);
			if (!fldObj) {
				throw new Error(jslet.formatMessage(jslet.locale.Dataset.fieldNotFound, [fldName]));
			}
			editorCfg = fldObj.editControl();
			var isCheckBox = editorCfg.type.toLowerCase() == 'dbcheckbox';
			if(isCheckBox) {
				if(Z._hasLabel) {
					oLabel = document.createElement('div');
					opanel.appendChild(oLabel);
					oLabel.className = 'col-sm-' + layout._innerLabelCols;
				}
				octrlDiv = document.createElement('div');
				opanel.appendChild(octrlDiv);
				octrlDiv.className = 'col-sm-' + (Z._hasLabel?　layout._innerDataCols: 12);
				
				editorCfg.dataset = Z._dataset;
				editorCfg.field = fldName;
				editor = jslet.ui.createControl(editorCfg, null);
				octrlDiv.appendChild(editor.el);
				Z.addChildControl(editor);
				if(Z._hasLabel) {
					oLabel = document.createElement('label');
					octrlDiv.appendChild(oLabel);
					dbCtrl = new jslet.ui.DBLabel(oLabel, {
						type: 'DBLabel',
						dataset: Z._dataset,
						field: fldName
					});
				}
				ctrlId = jslet.nextId();
				editor.el.id = ctrlId;
				jQuery(oLabel).attr('for', ctrlId);
				Z.addChildControl(dbCtrl);
			} else {
				if(Z._hasLabel) {
					oLabel = document.createElement('label');
					opanel.appendChild(oLabel);
					oLabel.className = 'col-sm-' + layout._innerLabelCols;
					dbctrl = new jslet.ui.DBLabel(oLabel, {
						type: 'DBLabel',
						dataset: Z._dataset,
						field: fldName
					});
					Z.addChildControl(dbCtrl);
				}
				
				octrlDiv = document.createElement('div');
				opanel.appendChild(octrlDiv);
				octrlDiv.className = 'col-sm-' + (Z._hasLabel?　layout._innerDataCols: 12);
				
				ctrlId = Z._renderEditPart(octrlDiv, layout);
				jQuery(oLabel).attr('for', ctrlId);
				Z.addChildControl(editor);
			}
		}
	}, // render All
	
	_renderEditPart: function(ctrlDiv, layoutCfg) {
		var Z = this, fldName, i, len,
			hasPrefix = layoutCfg.prefix && layoutCfg.prefix.length > 0,
			hasSuffix = layoutCfg.suffix && layoutCfg.suffix.length > 0,
			otherPartWidth = 0;
			
		if(hasPrefix) {
			otherPartWidth = Z._renderOtherPart(ctrlDiv, layoutCfg.prefix);
		}
		fldName = layoutCfg.field;
		var editorEl = Z._renderEditor(fldName);
		ctrlDiv.appendChild(editorEl);
		
		if(hasSuffix) {
			otherPartWidth += Z._renderOtherPart(ctrlDiv, layoutCfg.suffix);
		}
		if(otherPartWidth) {
			jQuery(editorEl).addClass('jl-ep-part');
			editorEl.style.width = jQuery(ctrlDiv).width() - otherPartWidth + 'px';
		}
		return editorEl.id;
	},
	
	_renderOtherPart: function(ctrlDiv, arrPrefixOrSuffix) {
		var fixCfg, editorEl, width, partEl, 
			jqCtrlDiv = jQuery(ctrlDiv), 
			totalWidth = 0;
		for(var i = 0, len = arrPrefixOrSuffix.length; i < len; i++) {
			fixCfg = arrPrefixOrSuffix[i];
			width = fixCfg.width;
			if(fixCfg.field) {
				partEl = this._renderEditor(fixCfg.field);
				jqCtrlDiv.append(partEl);
			} else if(fixCfg.content) {
				var id = jslet.nextId();
				jqCtrlDiv.append('<div id = "' + id + '">' + fixCfg.content + '</div>');
				var children = jqCtrlDiv.children();
				partEl = jQuery('#' + id)[0];
			} else {
				console.warn('prefix or suffix: field or content is required!');
				continue;
			}
			if(!width) {
				console.warn('Width is empty, use 5% instead!');
				width = '5%';
			}
			jQuery(partEl).addClass('jl-ep-part');
			
			partEl.style.width = width;
			totalWidth += jQuery(partEl).outerWidth();
		}
		return totalWidth;
	},
	
	_renderEditor: function(fldName) {
		var editor = jslet.ui.createControl({type: 'DBPlace', dataset: this._dataset, field: fldName}, null);
		editor.el.id = jslet.nextId();
		return editor.el;
	},
	
	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName){
		if(metaName && (metaName == 'visible' || metaName == 'editControl')) {
			this._metaChangedDebounce.call(this);
		}
	}
});

jslet.ui.register('DBEditPanel', jslet.ui.DBEditPanel);
jslet.ui.DBEditPanel.htmlTemplate = '<div></div>';

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBInspector. 
 * Display&Edit fields in two columns: Label column and Value column. If in edit mode, this control takes the field editor configuration from dataset field object.
 * Example:
 * <pre><code>
 *  var jsletParam = {type:"DBInspector",dataset:"employee",columnCount:1,columnWidth:100};
 * 
 * //1. Declaring:
 *  &lt;div id='ctrlId' data-jslet='type:"DBInspector",dataset:"employee",columnCount:1,columnWidth:100' />
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
jslet.ui.DBInspector = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,columnCount,fields';
		
		Z._columnCount = 1;
		
		Z._fields = null;
		
		Z._metaChangedDebounce = jslet.debounce(Z.renderAll, 10);

		$super(el, params);
	},
	
	/**
	 * {Integer} Column count
	 */
	columnCount: function(columnCount) {
		if(columnCount === undefined) {
			return this._columnCount;
		}
		jslet.Checker.test('DBInspector.columnCount', columnCount).isGTZero();
		this._columnCount = parseInt(columnCount);
	},
	
	fields: function(fields) {
		if(fields === undefined) {
			return this._fields;
		}
		jslet.Checker.test('DBInspector.fields', fields).isArray();
		var fldCfg;
		for(var i = 0, len = fields.length; i < len; i++) {
			fldCfg = fields[i];
			jslet.Checker.test('DBInspector.fields.field', fldCfg.field).isString().required();
			fldCfg.visible = fldCfg.visible ? true: false;
		}
		this._fields = fields;
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
	bind: function () {
		var Z = this;
		var colCnt = Z._columnCount;
		if (colCnt) {
			colCnt = parseInt(colCnt);
		}
		if (colCnt && colCnt > 0) {
			Z._columnCount = colCnt;
		} else {
			Z._columnCount = 1;
		}
		Z.renderAll();
	}, // end bind
	
		/**
		 * @override
		 */
	renderAll: function () {
		var Z = this,
			jqEl = jQuery(Z.el);
		Z.removeAllChildControls();
		
		if (!jqEl.hasClass('jl-inspector'))
			jqEl.addClass('jl-inspector jl-round5');
		var totalWidth = jqEl.width(),
			allFlds = Z._dataset.getFields();
		jqEl.html('<table cellpadding=0 cellspacing=0 style="margin:0;padding:0;table-layout:fixed;width:100%;height:100%"><tbody></tbody></table>');
		var fldObj, i, found, visible, fldName, cfgFld,
			fcnt = allFlds.length,
			visibleFlds = [];
		for (i = 0; i < fcnt; i++) {
			fldObj = allFlds[i];
			fldName = fldObj.name();
			found = false;
			if(Z._fields) {
				for(var j = 0, len = Z._fields.length; j < len; j++) {
					cfgFld = Z._fields[j];
					if(fldName == cfgFld.field) {
						found = true;
						visible = cfgFld.visible? true: false;
						break;
					} 
				}
			}
			if(!found) {
				visible = fldObj.visible();
			}
			if (visible) {
				visibleFlds.push(fldObj);
			}
		}
		fcnt = visibleFlds.length;
		if (fcnt === 0) {
			return;
		}
		var w, c, columnCnt = Math.min(fcnt, Z._columnCount), arrLabelWidth = [];
		for (i = 0; i < columnCnt; i++) {
			arrLabelWidth[i] = 0;
		}
		var startWidth = jslet.ui.textMeasurer.getWidth('*');
		jslet.ui.textMeasurer.setElement(Z.el);
		for (i = 0; i < fcnt; i++) {
			fldObj = visibleFlds[i];
			c = i % columnCnt;
			w = Math.round(jslet.ui.textMeasurer.getWidth(fldObj.displayLabel()) + startWidth) + 15;
			if (arrLabelWidth[c] < w) {
				arrLabelWidth[c] = w;
			}
		}
		jslet.ui.textMeasurer.setElement();
		
		var totalLabelWidth = 0;
		for (i = 0; i < columnCnt; i++) {
			totalLabelWidth += arrLabelWidth[i];
		}
		
		var editorWidth = Math.round((totalWidth - totalLabelWidth) / columnCnt);
		
		var otable = Z.el.firstChild,
			tHead = otable.createTHead(), otd, otr = tHead.insertRow(-1);
		for (i = 0; i < columnCnt; i++) {
			otd = otr.insertCell(-1);
			otd.style.width = arrLabelWidth[i] + 'px';
			otd = otr.insertCell(-1);
		}
		
		var oldRowNo = -1, oldC = -1, rowNo, odiv, oLabel, editor, fldCtrl, dbCtrl;
		Z.preRowIndex = -1;
		for (i = 0; i < fcnt; i++) {
			fldObj = visibleFlds[i];
			fldName = fldObj.name();
			rowNo = Math.floor(i / columnCnt);
			c = i % columnCnt;
			if (oldRowNo != rowNo) {
				otr = otable.insertRow(-1);
				oldRowNo = rowNo;
			}
			
			otd = otr.insertCell(-1);
			otd.noWrap = true;
			otd.className = jslet.ui.htmlclass.DBINSPECTOR.labelColCls;
			
			oLabel = document.createElement('label');
			otd.appendChild(oLabel);
			dbCtrl = new jslet.ui.DBLabel(oLabel, {
				type: 'DBLabel',
				dataset: Z._dataset,
				field: fldName
			});
			Z.addChildControl(dbCtrl);
			
			otd = otr.insertCell(-1);
			otd.className = jslet.ui.htmlclass.DBINSPECTOR.editorColCls;
			otd.noWrap = true;
			otd.align = 'left';
			odiv = document.createElement('div');
			odiv.noWrap = true;
			otd.appendChild(odiv);
			fldCtrl = fldObj.editControl();
			fldCtrl.dataset = Z._dataset;
			fldCtrl.field = fldName;
			
			editor = jslet.ui.createControl(fldCtrl, odiv);
			if (!editor.isCheckBox) {
				editor.el.style.width = '100%';//editorWidth - 10 + 'px';
			}
			Z.addChildControl(editor);
		} // end for
	},
	
	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName){
		if(metaName && (metaName == 'visible' || metaName == 'editControl')) {
			this._metaChangedDebounce.call(this);
		}
	}
});

jslet.ui.htmlclass.DBINSPECTOR = {
	labelColCls: 'jl-inspector-label',
	editorColCls: 'jl-inspector-editor'
};

jslet.ui.register('DBInspector', jslet.ui.DBInspector);
jslet.ui.DBInspector.htmlTemplate = '<div></div>';

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */
"use strict";
jslet.ui.htmlclass.TABLECLASS = {
	currentrow: 'jl-tbl-current',
	scrollBarWidth: 16,
	selectColWidth: 30,
	hoverrow: 'jl-tbl-row-hover',
};

/**
 * Table column
 */
jslet.ui.TableColumn = function () {
	var Z = this;
	Z.field = null;   //String, field name
	Z.colNum = null;  //Integer, column number
	Z.label = null;   //String, column header label
	Z.title = null;   //String, column header title
	Z.displayOrder = null; //Integer, display order
	Z.width = null;   //Integer, column display width
	Z.colSpan = null; //Integer, column span
	Z.disableHeadSort = false; //Boolean, true - user sort this column by click column header
	Z.mergeSame = false; //Boolean, true - if this column value of adjoined rows is same then merge these rows 
	Z.noRefresh = false; //Boolean, true - do not refresh for customized column
	Z.visible = true; //Boolean, identify specified column is visible or not 
	Z.cellRender = null; //Function, column cell render for customized column  
};

/**
 * Sub group, use this class to implement complex requirement in one table row, like master-detail style row
 */
jslet.ui.TableSubgroup = function(){
var Z = this;
	Z.hasExpander = true; //Boolean, true - will add a new column automatically, click this column will expand or collapse subgroup panel
	Z.template = null;//String, html template 
	Z.height = 0; //Integer, subgroup panel height
};

/**
 * Table column header, use this class to implement hierarchical header
 */
jslet.ui.TableHead = function(){
	var Z = this;
	Z.label = null; //String, Head label
	Z.title = null; //String, Head title
	Z.id = null;//String, Head id
	Z.rowSpan = 0;  //@private
	Z.colSpan = 0;  //@private
	Z.disableHeadSort = false; //Boolean, true - user sort this column by click column header
	Z.subHeads = null; //array of jslet.ui.TableHead
};

jslet.ui.AbstractDBTable = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		
		Z.allProperties = 'styleClass,dataset,fixedRows,fixedCols,hasSeqCol,hasSelectCol,reverseSeqCol,seqColHeader,noborder,readOnly,editable,hideHead,disableHeadSort,onlySpecifiedCol,selectBy,rowHeight,onRowClick,onRowDblClick,onSelect,onSelectAll,beforeSelect,beforeSelectAll,afterSelect,afterSelectAll,onCustomSort,onFillRow,onFillCell,treeField,columns,subgroup,aggraded,autoClearSelection,onCellClick,defaultCellRender,hasFindDialog,hasFilterDialog';
		
		Z._fixedRows = 0;

		Z._fixedCols = 0;

		Z._hasSeqCol = true;
		
		Z._reverseSeqCol = false;
	
		Z._seqColHeader = null;

		Z._hasSelectCol = false;
		
		Z._noborder = false;
		
		Z._editable = false;

		Z._hideHead = false;
		
		Z._onlySpecifiedCol = false;
		
		Z._disableHeadSort = false;
		
		Z._aggraded = true;
		
		Z._autoClearSelection = true;
		
		Z._selectBy = null;

		Z._rowHeight = null;

		Z._headRowHeight = null;

		Z._treeField = null;

		Z._columns = null;
		
		Z._onRowClick = null;

		Z._onRowDblClick = null;
		
		Z._onCellClick = null;
		
		Z._onCustomSort = null; 
		
		Z._onSelect = null;

		Z._onSelectAll = null;
		
		Z._beforeSelect = null;
		
		Z._afterSelect = null;
		
		Z._beforeSelectAll = null;
		
		Z._afterSelectAll = null;
		
		Z._onFillRow = null;
		
		Z._onFillCell = null;		

		Z._defaultCellRender = null;

		Z._hasFindDialog = true;
		
		Z._hasFilterDialog = true;
		//@private
		Z._repairHeight = 0;
		Z.contentHeight = 0;
		Z.subgroup = null;//jslet.ui.TableSubgroup
		
		Z._sysColumns = null;//all system column like sequence column, select column, sub-group column
		Z._isHoriOverflow = false;
		Z._oldHeight = null;
		
		Z._currRow = null;
		Z._currColNum = 0;
		Z._editingField = null;
		Z._editorTabIndex = 1;
		Z._rowHeightChanged = false;
		
		Z._cellEditor = null;
		
		$super(el, params);
	},
	
	/**
	 * Get or set Fixed row count.
	 * 
	 * @param {Integer or undefined} rows fixed rows.
	 * @return {Integer or this}
	 */
	fixedRows: function(rows) {
		if(rows === undefined) {
			return this._fixedRows;
		}
			jslet.Checker.test('DBTable.fixedRows', rows).isNumber();
		this._fixedRows = parseInt(rows);
	},
	
	/**
	 * Get or set Fixed column count.
	 * 
	 * @param {Integer or undefined} cols fixed cols.
	 * @return {Integer or this}
	 */
	fixedCols: function(cols) {
		if(cols === undefined) {
			return this._fixedCols;
		}
		jslet.Checker.test('DBTable.fixedCols', cols).isNumber();
		this._fixedCols = parseInt(cols);
	},
	
	/**
	 * Get or set row height of table row.
	 * 
	 * @param {Integer or undefined} rowHeight table row height.
	 * @return {Integer or this}
	 */
	rowHeight: function(rowHeight) {
		var Z = this;
		if(rowHeight === undefined) {
			if(Z._rowHeight === null) {
				var clsName = Z._editable? 'jl-tbl-editing-row': 'jl-tbl-row';
				Z._rowHeight = parseInt(jslet.ui.getCssValue(clsName, 'height')) || 25;
			}
			return Z._rowHeight;
		}
		jslet.Checker.test('DBTable.rowHeight', rowHeight).isGTZero();
		Z._rowHeight = parseInt(rowHeight);
		Z._rowHeightChanged = true;
	},
	
	/**
	 * Get or set row height of table header.
	 * 
	 * @param {Integer or undefined} headRowHeight table header row height.
	 * @return {Integer or this}
	 */
	headRowHeight: function(headRowHeight) {
		if(headRowHeight === undefined) {
			if(this._headRowHeight === null) {
				this._headRowHeight = parseInt(jslet.ui.getCssValue('jl-tbl-header-row', 'height')) || 25;
			}
			return this._headRowHeight;
		}
		jslet.Checker.test('DBTable.headRowHeight', headRowHeight).isGTZero();
		this._headRowHeight = parseInt(headRowHeight);
	},
	
	/**
	 * Identify whether there is sequence column in DBTable.
	 * 
	 * @param {Boolean or undefined} hasSeqCol true(default) - has sequence column, false - otherwise.
	 * @return {Boolean or this}
	 */
	hasSeqCol: function(hasSeqCol) {
		if(hasSeqCol === undefined) {
			return this._hasSeqCol;
		}
		this._hasSeqCol = hasSeqCol ? true: false;
	},

	/**
	 * Identify whether the sequence number is reverse.
	 * 
	 * @param {Boolean or undefined} reverseSeqCol true - the sequence number is reverse, false(default) - otherwise.
	 * @return {Boolean or this}
	 */
	reverseSeqCol: function(reverseSeqCol) {
		if(reverseSeqCol === undefined) {
			return this._reverseSeqCol;
		}
		this._reverseSeqCol = reverseSeqCol ? true: false;
	},
		
	/**
	 * Get or set sequence column header.
	 * 
	 * @param {String or undefined} seqColHeader sequence column header.
	 * @return {String or this}
	 */
	seqColHeader: function(seqColHeader) {
		if(seqColHeader === undefined) {
			return this._seqColHeader;
		}
		this._seqColHeader = seqColHeader;
	},
		
	/**
	 * Identify whether there is "select" column in DBTable.
	 * 
	 * @param {Boolean or undefined} hasSelectCol true(default) - has "select" column, false - otherwise.
	 * @return {Boolean or this}
	 */
	hasSelectCol: function(hasSelectCol) {
		if(hasSelectCol === undefined) {
			return this._hasSelectCol;
		}
		this._hasSelectCol = hasSelectCol ? true: false;
	},
	
	/**
	 * Identify the table has border or not.
	 * 
	 * @param {Boolean or undefined} noborder true - the table without border, false(default) - otherwise.
	 * @return {Boolean or this}
	 */
	noborder: function(noborder) {
		if(noborder === undefined) {
			return this._noborder;
		}
		this._noborder = noborder ? true: false;
	},
	
	/**
	 * @deprecated
	 * Use onFieldChanged instead.
	 * 
	 * Identify the table is read only or not.
	 * 
	 * @param {Boolean or undefined} readOnly true(default) - the table is read only, false - otherwise.
	 * @return {Boolean or this}
	 */
	readOnly: function(readOnly) {
		var Z = this;
		if(readOnly === undefined) {
			return !Z._editable;
		}
		Z.editable(!readOnly);
	},
	
	/**
	 * Identify the table is editable or not.
	 * 
	 * @param {Boolean or undefined} editable true(default) - the table is editable, false - otherwise.
	 * @return {Boolean or this}
	 */
	editable: function(editable) {
		var Z = this;
		if(editable === undefined) {
			return Z._editable;
		}
		Z._editable = editable ? true: false;
		if(Z._editable && !Z._rowHeightChanged) {
			Z._rowHeight = null;
		}
	},
	
	
	/**
	 * Identify the table is hidden or not.
	 * 
	 * @param {Boolean or undefined} hideHead true - the table header is hidden, false(default) - otherwise.
	 * @return {Boolean or this}
	 */
	hideHead: function(hideHead) {
		if(hideHead === undefined) {
			return this._hideHead;
		}
		this._hideHead = hideHead ? true: false;
	},
	
	/**
	 * Identify the table has aggraded row or not.
	 * 
	 * @param {Boolean or undefined} aggraded true - the table has aggraded row, false(default) - otherwise.
	 * @return {Boolean or this}
	 */
	aggraded: function(aggraded) {
		if(aggraded === undefined) {
			return this._aggraded;
		}
		this._aggraded = aggraded ? true: false;
	},

	/**
	 * Identify whether automatically clear selection when selecting table cells.
	 * 
	 * @param {Boolean or undefined} autoClearSelection true(default) - automatically clear selection, false(default) - otherwise.
	 * @return {Boolean or this}
	 */
	autoClearSelection: function(autoClearSelection) {
		if(autoClearSelection === undefined) {
			return this._autoClearSelection;
		}
		this._autoClearSelection = autoClearSelection ? true: false;
	},
	
	/**
	 * Identify disable table head sorting or not.
	 * 
	 * @param {Boolean or undefined} disableHeadSort true - disable table header sorting, false(default) - otherwise.
	 * @return {Boolean or this}
	 */
	disableHeadSort: function(disableHeadSort) {
		if(disableHeadSort === undefined) {
			return this._disableHeadSort;
		}
		this._disableHeadSort = disableHeadSort ? true: false;
	},
	
	/**
	 * Identify show the specified columns or not.
	 * 
	 * @param {Boolean or undefined} onlySpecifiedCol true - only showing the specified columns, false(default) - otherwise.
	 * @return {Boolean or this}
	 */
	onlySpecifiedCol: function(onlySpecifiedCol) {
		if(onlySpecifiedCol === undefined) {
			return this._onlySpecifiedCol;
		}
		this._onlySpecifiedCol = onlySpecifiedCol ? true: false;
	},
	
	/**
	 * Specified field names for selecting group records, multiple field names are separated with ','
	 * @see jslet.data.Dataset.select(selected, selectBy).
	 * 
	 * <pre><code>
	 * tbl.selectBy('code,gender');
	 * </code></pre>
	 * 
	 * @param {String or undefined} selectBy group selecting field names.
	 * @return {String or this}
	 */
	selectBy: function(selectBy) {
		if(selectBy === undefined) {
			return this._selectBy;
		}
			jslet.Checker.test('DBTable.selectBy', selectBy).isString();
		this._selectBy = selectBy;
	},
	
	/**
	 * Display table as tree style. If this property is set, the dataset must be a tree style dataset, 
	 *  means dataset.parentField() and dataset.levelField() can not be empty.
	 * Only one field name allowed.
	 * 
	 * <pre><code>
	 * tbl.treeField('code');
	 * </code></pre>
	 * 
	 * @param {String or undefined} treeField the field name which will show as tree style.
	 * @return {String or this}
	 */
	treeField: function(treeField) {
		if(treeField === undefined) {
			return this._treeField;
		}
		jslet.Checker.test('DBTable.treeField', treeField).isString();
		this._treeField = treeField;
	},

	/**
	 * Default cell render, it must be a child class of @see jslet.ui.CellRender 
	 * <pre><code>
	 * 	var cellRender = jslet.Class.create(jslet.ui.CellRender, {
	 *		createHeader: function(cellPanel, colCfg) { },
	 *		createCell: function (cellPanel, colCfg) { },
	 *		refreshCell: function (cellPanel, colCfg, recNo) { }
	 * });
	 * </code></pre>  
	 */
	defaultCellRender: function(defaultCellRender) {
		if(defaultCellRender === undefined) {
			return this._defaultCellRender;
		}
		jslet.Checker.test('DBTable.defaultCellRender', defaultCellRender).isObject();
		
		this._defaultCellRender = defaultCellRender;
	},
	
	currColNum: function(currColNum) {
		var Z = this;
		if(currColNum === undefined) {
			return Z._currColNum;
		}
		var oldColNum = Z._currColNum;
		Z._currColNum = currColNum;
		if(oldColNum !== currColNum) {
			Z._adjustCurrentCellPos(oldColNum > currColNum);
		}
		Z._showCurrentCell();
		if(Z._findDialog) {
			var colCfg = Z.innerColumns[currColNum];
			if(colCfg.field) {
				Z._findDialog.findingField(colCfg.field);
			}
		}
	},
	
	/**
	 * Fired when table row clicked.
	 *  Pattern: 
	 *	function(event}{}
	 *  	//event: Js mouse event
	 *  
	 * @param {Function or undefined} onRowClick table row clicked event handler.
	 * @return {this or Function}
	 */
	onRowClick: function(onRowClick) {
		if(onRowClick === undefined) {
			return this._onRowClick;
		}
		jslet.Checker.test('DBTable.onRowClick', onRowClick).isFunction();
		this._onRowClick = onRowClick;
	},
	
	/**
	 * Fired when table row double clicked.
	 *  Pattern: 
	 *	function(event}{}
	 *  	//event: Js mouse event
	 *  
	 * @param {Function or undefined} onRowDblClick table row double clicked event handler.
	 * @return {this or Function}
	 */
	onRowDblClick: function(onRowDblClick) {
		if(onRowDblClick === undefined) {
			return this._onRowDblClick;
		}
		jslet.Checker.test('DBTable.onRowDblClick', onRowDblClick).isFunction();
		this._onRowDblClick = onRowDblClick;
	},
	
	/**
	 * Fired when table cell clicked.
	 *  Pattern: 
	 *	function(event}{}
	 *  	//event: Js mouse event
	 *  
	 * @param {Function or undefined} onCellClick table cell clicked event handler.
	 * @return {this or Function}
	 */
	onCellClick: function(onCellClick) {
		if(onCellClick === undefined) {
			return this._onCellClick;
		}
		jslet.Checker.test('DBTable.onCellClick', onCellClick).isFunction();
		this._onCellClick = onCellClick;
	},
	
	/**
	 * Fired when table row is selected(select column is checked).
	 *  Pattern: 
	 *   function(selected}{}
	 *   //selected: Boolean
	 *   //return: true - allow user to select this row, false - otherwise.
	 *  
	 * @param {Function or undefined} onSelect table row selected event handler.
	 * @return {this or Function}
	 */
	onSelect: function(onSelect) {
		if(onSelect === undefined) {
			return this._onSelect;
		}
		jslet.Checker.test('DBTable.onSelect', onSelect).isFunction();
		this._onSelect = onSelect;
	},
	
	/**
	 * Fired when all table rows are selected.
	 *  Pattern: 
	 *   function(dataset, Selected}{}
	 *   //dataset: jslet.data.Dataset
	 *   //Selected: Boolean
	 *   //return: true - allow user to select, false - otherwise.
	 *  
	 * @param {Function or undefined} onSelectAll All table row selected event handler.
	 * @return {this or Function}
	 */
	onSelectAll: function(onSelectAll) {
		if(onSelectAll === undefined) {
			return this._onSelectAll;
		}
		jslet.Checker.test('DBTable.onSelectAll', onSelectAll).isFunction();
		this._onSelectAll = onSelectAll;
	},
	
	/**
	 * Fired when table row is selecting(select column is checked).
	 *  Pattern: 
	 *   function(selected}{}
	 *   //selected: Boolean
	 *   //return: true - allow user to select this row, false - otherwise.
	 *  
	 * @param {Function or undefined} onSelect table row selected event handler.
	 * @return {this or Function}
	 */
	beforeSelect: function(beforeSelect) {
		if(beforeSelect === undefined) {
			return this._beforeSelect;
		}
		jslet.Checker.test('DBTable.beforeSelect', beforeSelect).isFunction();
		this._beforeSelect = beforeSelect;
	},
	
	/**
	 * Fired when table row is selected(select column is checked).
	 *  Pattern: 
	 *   function(selected}{}
	 *   //selected: Boolean
	 *   //return: true - allow user to select this row, false - otherwise.
	 *  
	 * @param {Function or undefined} onSelect table row selected event handler.
	 * @return {this or Function}
	 */
	afterSelect: function(afterSelect) {
		if(afterSelect === undefined) {
			return this._afterSelect;
		}
		jslet.Checker.test('DBTable.afterSelect', afterSelect).isFunction();
		this._afterSelect = afterSelect;
	},
	
	/**
	 * Fired when all table rows are selecting(select column is checked).
	 *  Pattern: 
	 *   function(selected}{}
	 *   //selected: Boolean
	 *   //return: true - allow user to select this row, false - otherwise.
	 *  
	 * @param {Function or undefined} onSelect table row selected event handler.
	 * @return {this or Function}
	 */
	beforeSelectAll: function(beforeSelectAll) {
		if(beforeSelectAll === undefined) {
			return this._beforeSelectAll;
		}
		jslet.Checker.test('DBTable.beforeSelectAll', beforeSelectAll).isFunction();
		this._beforeSelectAll = beforeSelectAll;
	},
	
	/**
	 * Fired when all table rows are selected(select column is checked).
	 *  Pattern: 
	 *   function(selected}{}
	 *   //selected: Boolean
	 *   //return: true - allow user to select this row, false - otherwise.
	 *  
	 * @param {Function or undefined} onSelect table row selected event handler.
	 * @return {this or Function}
	 */
	afterSelectAll: function(afterSelectAll) {
		if(afterSelectAll === undefined) {
			return this._afterSelectAll;
		}
		jslet.Checker.test('DBTable.afterSelectAll', afterSelectAll).isFunction();
		this._afterSelectAll = afterSelectAll;
	},
	
	/**
	 * Fired when user click table header to sort data. You can use it to sort data instead of default, like sending request to server to sort data.  
	 * Pattern: 
	 *   function(indexFlds}{}
	 *   //indexFlds: String, format: fieldName desc/asce(default), fieldName,..., desc - descending order, asce - ascending order, like: "field1 desc,field2,field3"
	 *   
	 * @param {Function or undefined} onCustomSort Customized sorting event handler.
	 * @return {this or Function}
	 */
	onCustomSort: function(onCustomSort) {
		if(onCustomSort === undefined) {
			return this._onCustomSort;
		}
		jslet.Checker.test('DBTable.onCustomSort', onCustomSort).isFunction();
		this._onCustomSort = onCustomSort;
	},
	
	/**
	 * Fired when fill row, user can use this to customize each row style like background color, font color
	 * Pattern:
	 *   function(otr, dataset){)
	 *   //otr: Html element: TR
	 *   //dataset: jslet.data.Dataset
	 *   
	 * @param {Function or undefined} onFillRow Table row filled event handler.
	 * @return {this or Function}
	 */
	onFillRow: function(onFillRow) {
		if(onFillRow === undefined) {
			return this._onFillRow;
		}
		jslet.Checker.test('DBTable.onFillRow', onFillRow).isFunction();
		this._onFillRow = onFillRow;
	},
	
	/**
	 * Fired when fill cell, user can use this to customize each cell style like background color, font color
	 * Pattern:
	 *   function(otd, dataset, fieldName){)
	 *   //otd: Html element: TD
	 *   //dataset: jslet.data.Dataset
	 *   //fieldName: String
	 *   
	 * @param {Function or undefined} onFillCell Table cell filled event handler.
	 * @return {this or Function}
	 */
	onFillCell: function(onFillCell) {
		if(onFillCell === undefined) {
			return this._onFillCell;
		}
		jslet.Checker.test('DBTable.onFillCell', onFillCell).isFunction();
		this._onFillCell = onFillCell;
	},
	
	/**
	 * Identify has finding dialog or not.
	 * 
	 * @param {Boolean or undefined} hasFindDialog true(default) - show finding dialog when press 'Ctrl + F', false - otherwise.
	 * @return {Boolean or this}
	 */
	hasFindDialog: function(hasFindDialog) {
		var Z = this;
		if(hasFindDialog === undefined) {
			return Z._hasFindDialog;
		}
		Z._hasFindDialog = hasFindDialog? true: false;
	},

	/**
	 * Identify has filter dialog or not.
	 * 
	 * @param {Boolean or undefined} hasFilterDialog true(default) - show filter dialog when creating table, false - otherwise.
	 * @return {Boolean or this}
	 */
	hasFilterDialog: function(hasFilterDialog) {
		var Z = this;
		if(hasFilterDialog === undefined) {
			return Z._hasFilterDialog;
		}
		Z._hasFilterDialog = hasFilterDialog? true: false;
	},

	cellEditor: function() {
		var Z = this;
		if(!Z._editable) {
			return null;
		}
		if(!Z._cellEditor) {
			Z._cellEditor = new jslet.ui.TableCellEditor(Z);
		}
		return Z._cellEditor;
	},

	/**
	 * Table columns configurations, array of jslet.ui.TableColumn.
	 * 
	 * @param {jslet.ui.TableColumn[] or undefined} columns Table columns configurations.
	 * @return {jslet.ui.TableColumn[] or undefined}
	 */
	columns: function(columns) {
		if(columns === undefined) {
			return this._columns;
		}
		jslet.Checker.test('DBTable.columns', columns).isArray();
		var colObj;
		for(var i = 0, len = columns.length; i < len; i++) {
			colObj = columns[i];
			jslet.Checker.test('DBTable.Column.field', colObj.field).isString();
			jslet.Checker.test('DBTable.Column.label', colObj.label).isString();
			jslet.Checker.test('DBTable.Column.colNum', colObj.colNum).isGTEZero();
			jslet.Checker.test('DBTable.Column.displayOrder', colObj.displayOrder).isNumber();
			jslet.Checker.test('DBTable.Column.width', colObj.width).isGTZero();
			jslet.Checker.test('DBTable.Column.colSpan', colObj.colSpan).isGTZero();
			colObj.disableHeadSort = colObj.disableHeadSort ? true: false;
			if(!colObj.field) {
				colObj.disableHeadSort = true;
			}
			colObj.mergeSame = colObj.mergeSame ? true: false;
			colObj.noRefresh = colObj.noRefresh ? true: false;
			jslet.Checker.test('DBTable.Column.cellRender', colObj.cellRender).isObject();
		}
		this._columns = columns;
	},
	
	/**
	 * Goto and show the specified cell by field name.
	 * 
	 * @param {String} fldName field name.
	 */
	gotoField: function(fldName) {
		jslet.Checker.test('DBTable.gotoField#fldName', fldName).required().isString();
		var colNum = this.getColNumByField(fldName);
		if(colNum >= 0) {
			this.gotoColumn(colNum);
		}
	},
	
	getColNumByField: function(fldName) {
		var lastColNum = this.innerColumns.length - 1,
			colCfg;
		for(var i = 0; i <= lastColNum; i++) {
			colCfg = this.innerColumns[i];
			if(colCfg.field == fldName) {
				return colCfg.colNum;
			}
		}
		return -1;
	},
	
	getFieldByColNum: function(colNum) {
		var lastColNum = this.innerColumns.length - 1,
			colCfg;
		for(var i = 0; i <= lastColNum; i++) {
			colCfg = this.innerColumns[i];
			if(colCfg.colNum == colNum) {
				return colCfg.field;
			}
		}
		return null;
	},
	
	/**
	 * Goto and show the specified cell by field name.
	 * 
	 * @param {String} fldName field name.
	 */
	gotoColumn: function(colNum) {
		jslet.Checker.test('DBTable.gotoColumn#colNum', colNum).required().isGTEZero();
		var lastColNum = this.innerColumns.length - 1;
		if(colNum > lastColNum) {
			colNum = lastColNum;
		}
		this.currColNum(colNum);
	},
	
	editorTabIndex: function() {
		return this._editorTabIndex;
	},
	
	/**
	* @override
	*/
	isValidTemplateTag: function (el) {
		return el.tagName.toLowerCase() == 'div';
	},
	
	_calcTabIndex: function() {
		var Z = this,
			jqEl = jQuery(Z.el);
		if(Z._editable) {
			var masterFldObj = Z._dataset.getMasterFieldObject(),
				tbIdx = null;
			if(masterFldObj) {
				tbIdx = masterFldObj.tabIndex();
			}
			if(!tbIdx) {
				tbIdx = Z.el.tabIndex;
			}
			Z._editorTabIndex = tbIdx && tbIdx > 0? tbIdx: null;
		}
		Z.el.tabIndex = -1;
	},
	
	/**
	 * @override
	 */
	bind: function () {
		var Z = this;
		jslet.resizeEventBus.subscribe(Z);
		
		jslet.ui.textMeasurer.setElement(Z.el);
		Z.charHeight = jslet.ui.textMeasurer.getHeight('M')+4;
		jslet.ui.textMeasurer.setElement();
		Z.charWidth = jslet.global.defaultCharWidth || 12;
		Z._widthStyleId = jslet.nextId();
		Z._initializeVm();
		Z._calcTabIndex();
		Z.renderAll();
		var jqEl = jQuery(Z.el);
        var notFF = ((typeof Z.el.onmousewheel) == 'object'); //firefox or nonFirefox browser
        var wheelEvent = (notFF ? 'mousewheel' : 'DOMMouseScroll');
        jqEl.on(wheelEvent, function (event) {
            var originalEvent = event.originalEvent;
            var num = notFF ? originalEvent.wheelDelta / -120 : originalEvent.detail / 3;
			if(Z._editable && Z._dataset.status() != jslet.data.DataSetStatus.BROWSE) {
				Z._dataset.confirm();
			}
			var cellEditor = Z.cellEditor();
			if(cellEditor) {
				cellEditor.hideEditor();
			}
            Z.listvm.setVisibleStartRow(Z.listvm.getVisibleStartRow() + num);
       		event.preventDefault();
        });

        jqEl.on('mousedown', function(event){
        	if(event.shiftKey) {
	       		event.preventDefault();
	       		event.stopImmediatePropagation();
	       		return false;
        	}
        });
        
        jqEl.on('click', 'button.jl-tbl-filter', function(event) {
    		if (!Z._filterPanel) {
    			Z._filterPanel = new jslet.ui.DBTableFilterPanel(Z);
    		}
    		var btnEle = event.currentTarget,
    			jqFilterBtn = jQuery(btnEle),
    			tblPos = jQuery(Z.el).offset();
    		var r = jqFilterBtn.offset(), 
    			h = jqFilterBtn.outerHeight(), 
    			x = r.left - tblPos.left, 
    			y = r.top + h - tblPos.top;
    		if (jslet.locale.isRtl){
    			x = x + jqFilterBtn.outerWidth();
    		}
    		var fldName = jqFilterBtn[0].getAttribute('jsletfilterfield');
    		Z._filterPanel.changeField(fldName);
    		Z._filterPanel.jqFilterBtn(jqFilterBtn);
    		Z._filterPanel.show(x, y, 0, h);
        	
       		event.preventDefault();
       		event.stopImmediatePropagation();
        });
        
        jqEl.on('click', 'td.jl-tbl-cell', function(event){
        	var otd = event.currentTarget;
        	var colCfg = otd.jsletColCfg;
        	if(colCfg) {
        		if(colCfg.isSeqCol) { //If the cell is sequence cell, process row selection.
        			Z._processRowSelection(event.ctrlKey, event.shiftKey, event.altKey);
        		} else {
	        		var colNum = colCfg.colNum;
	        		if(colNum !== 0 && !colNum) {
	        			return;
	        		}
					Z._doBeforeSelect(event.ctrlKey, event.shiftKey, event.altKey);
	        		Z.currColNum(colNum);
					Z._processSelection(event.ctrlKey, event.shiftKey, event.altKey);
        		}
            	Z._doCellClick(colCfg);
            	var cellEditor = Z.cellEditor();
            	if(cellEditor) {
            		if(Z._isCellEditable(colCfg)) {
            			var fldName = colCfg.field;
            			cellEditor.showEditor(fldName, otd);
            			if(colCfg.isBoolColumn) {
            				window.setTimeout(function() {
                				Z._dataset.setFieldValue(fldName, !Z._dataset.getFieldValue(fldName));
            				}, 5);
            			}
            		} else {
            			cellEditor.hideEditor();
            		}
            	}
        	}
        	if(event.shiftKey || event.ctrlKey) {
	       		event.preventDefault();
	       		event.stopImmediatePropagation();
	       		return false;
        	}
        });

		jqEl.on('keydown', function (event) {
			var keyCode = event.which,
				ctrlKey = event.ctrlKey,
				shiftKey = event.shiftKey,
				altKey = event.altKey;
			if(Z._hasFindDialog && ctrlKey && keyCode === jslet.ui.KeyCode.F) { //ctrl + f
				Z.showFindDialog();
				event.preventDefault();
	       		event.stopImmediatePropagation();
				return false;
			}
			if(ctrlKey && keyCode === jslet.ui.KeyCode.E) { //ctrl + e
				Z.gotoNextError();
				event.preventDefault();
	       		event.stopImmediatePropagation();
				return false;
			}
			if(ctrlKey && keyCode === jslet.ui.KeyCode.C) { //ctrl + c
				Z.copySelection(false);
				return;
			}
			if(ctrlKey && keyCode === jslet.ui.KeyCode.A) { //ctrl + a
				Z.selectAllCells();
				event.preventDefault();
	       		event.stopImmediatePropagation();
				return false;
			}
			var isTabKey = (keyCode === jslet.ui.KeyCode.TAB || keyCode === jslet.global.defaultFocusKeyCode);
			if(shiftKey && isTabKey) { //Shift TAB Left
				if(!Z.tabPrior()) {
					return;
				}
			} else if(isTabKey) { //TAB Right
				if(!Z.tabNext()) {
					return;
				}
			} else if(keyCode === jslet.ui.KeyCode.LEFT) { //Arrow Left
				Z.movePriorCell(ctrlKey, shiftKey, altKey);
			} else if( keyCode === jslet.ui.KeyCode.RIGHT) { //Arrow Right
				Z.moveNextCell(ctrlKey, shiftKey, altKey);
			} else if (keyCode === jslet.ui.KeyCode.UP) {//KEY_UP
				Z._doBeforeSelect(ctrlKey, shiftKey, altKey);
				Z.listvm.priorRow();
				Z._processSelection(ctrlKey, shiftKey, altKey);
			} else if (keyCode === jslet.ui.KeyCode.DOWN) {//KEY_DOWN
				Z._doBeforeSelect(ctrlKey, shiftKey, altKey);
				Z.listvm.nextRow();
			} else if (keyCode === jslet.ui.KeyCode.PAGEUP) {//KEY_PAGEUP
				Z.listvm.priorPage();
			} else if (keyCode === jslet.ui.KeyCode.PAGEDOWN) {//KEY_PAGEDOWN
				Z.listvm.nextPage();
			} else {
				return;
			}
			event.preventDefault();
       		event.stopImmediatePropagation();
		});		
	}, // end bind
	
	showFindDialog: function() {
		var Z = this;
		if(Z._filterPanel) {
			Z._filterPanel.hide();
		}
		if(!Z._hasFindDialog) {
			return;
		}
		if(!Z._findDialog) {
			Z._findDialog = new jslet.ui.FindDialog(Z);
		}
		if(!Z._findDialog.findingField()) {
			var colCfg = Z.innerColumns[Z._currColNum];
			if(colCfg.field) {
				Z._findDialog.findingField(colCfg.field);
			} else {
				//Get first column with field name.
				for(var i = Z._currColNum + 1, len = Z.innerColumns.length; i < len; i++) {
					colCfg = Z.innerColumns[i];
					if(colCfg.field) {
						Z._findDialog.findingField(colCfg.field);
						break;
					}
				}
			}
		}
		if(Z._findDialog.findingField()) {
			Z._findDialog.show(0, Z.headSectionHt);
		}		
	},
	
	gotoNextError: function() {
		var Z = this;
		if(!Z._dataset.nextError()) {
			Z._dataset.firstError();
		}
	},
	
	copySelection: function(fitExcel) {
		var Z = this, 
			selectedText;
		if(fitExcel) {
			selectedText = Z._dataset.selection.getSelectionText('"', true, '\t');
		} else {
			selectedText = Z._dataset.selection.getSelectionText('', false, '\t');
		}
		if(!selectedText) {
			var fldName = Z.getFieldByColNum(Z._currColNum);
			if(fldName) {
				selectedText = Z._dataset.getFieldText(fldName);
			}
		}
		if(selectedText) {
			jslet.Clipboard.putText(selectedText);
			window.setTimeout(function(){Z.el.focus();}, 5);
		}
	},
	
	selectAllCells: function() {
		var Z = this,
			fields = [], colCfg, fldName;
		for(var i = 0, len = Z.innerColumns.length; i < len; i++) {
			colCfg = Z.innerColumns[i];
			fldName = colCfg.field;
			if(fldName) {
				fields.push(fldName);
			}
		}
		Z._dataset.selection.selectAll(fields, true);
		Z._refreshSelection();
	},
	
	tabPrior: function() {
		var Z = this,
			fldName = Z.getFieldByColNum(Z._currColNum),
			lastColNum, num = null, 
			focusedFields = Z._dataset.focusedFields(),
			editingFields = Z._getEditingFields();
		if(editingFields && editingFields.indexOf(fldName) >= 0) {
			var focusMngr = jslet.ui.focusManager,
				onChangingFocusFn = focusMngr.onChangingFocus();
			
			if(focusedFields) {
				focusedFields = focusedFields.slice(0);
				for(var i = focusedFields.length - 1; i >= 0; i--) {
					if(editingFields.indexOf(focusedFields[i]) < 0) {
						focusedFields.splice(i, 1);
					}
				}
			}
			var idx = -1, fields;
			if(focusedFields) {
				fields = focusedFields;
				idx = fields.indexOf(fldName);
			}
			if(idx < 0) {
				fields = editingFields;
				idx = fields.indexOf(fldName);
			}
			if(onChangingFocusFn) {
				var cancelFocus = onChangingFocusFn(document.activeElement || Z.el, true, Z._dataset, 
						focusMngr.activeField(), fields, focusMngr.activeValueIndex());
				if(!cancelFocus) {
					return true;
				}
			}
			if(fields && idx >= 0) {
				if(idx === 0) {
					if(Z._dataset.recno() > 0) {
						Z._dataset.prior();
						fldName = fields[fields.length - 1];
					} else {
						return false;
					}
				} else {
					fldName = fields[idx - 1];
				}
				num = Z.getColNumByField(fldName);
			}
		}
		if(num === null) {
			lastColNum = Z.innerColumns.length - 1;
			if(Z._currColNum === 0) {
				if(Z._dataset.recno() > 0) {
					Z._dataset.prior();
					num = lastColNum;
				} else {
					return false;
				}
			} else {
				num = Z._currColNum - 1;
			}
		}
		Z.currColNum(num);
		return true;
	},
	
	tabNext: function() {
		var Z = this,
			fldName = Z.getFieldByColNum(Z._currColNum),
			lastColNum, num = null, 
			focusedFields = Z._dataset.focusedFields(),
			editingFields = Z._getEditingFields();
			
		if(editingFields && editingFields.indexOf(fldName) >= 0) {
			var focusMngr = jslet.ui.focusManager,
				onChangingFocusFn = focusMngr.onChangingFocus();
			
			if(focusedFields) {
				focusedFields = focusedFields.slice(0);
				for(var i = focusedFields.length - 1; i >= 0; i--) {
					if(editingFields.indexOf(focusedFields[i]) < 0) {
						focusedFields.splice(i, 1);
					}
				}
			}
			var idx = -1, fields;
			if(focusedFields) {
				fields = focusedFields;
				idx = fields.indexOf(fldName);
			}
			if(idx < 0) {
				fields = editingFields;
				idx = fields.indexOf(fldName);
			}
			if(onChangingFocusFn) {
				var cancelFocus = onChangingFocusFn(document.activeElement || Z.el, false, Z._dataset, 
						focusMngr.activeField(), fields, focusMngr.activeValueIndex());
				if(!cancelFocus) {
					return true;
				}
			}
			if(fields && idx >= 0) {
				if(idx === fields.length - 1) {
					if(Z._dataset.recno() < Z._dataset.recordCount() - 1) {
						Z._dataset.next();
						fldName = fields[0];
					} else {
						return false;
					}
				} else {
					fldName = fields[idx + 1];
				}
				num = Z.getColNumByField(fldName);
			}
		}
		if(num === null) {
			lastColNum = Z.innerColumns.length - 1;
			if(Z._currColNum < lastColNum) {
				num = Z._currColNum + 1;
			} else {
				if(Z._dataset.recno() === Z._dataset.recordCount() - 1) {
					return false;
				}
				Z._dataset.next();
				num = 0;
			}
		}
		Z.currColNum(num);
		return true;
	},
	
	movePriorCell: function(ctrlKey, shiftKey, altKey) {
		var Z = this,
			lastColNum = Z.innerColumns.length - 1,
			num;
		
		if(Z._currColNum === 0) {
			if(Z._dataset.recno() > 0) {
				Z._dataset.prior();
				num = lastColNum;
			} else {
				return;
			}
		} else {
			num = Z._currColNum - 1;
		}
		Z._doBeforeSelect(ctrlKey, shiftKey, altKey);
		Z.currColNum(num);
		Z._processSelection(ctrlKey, shiftKey, altKey);
	},
	
	moveNextCell: function() {
		var Z = this,
			lastColNum = Z.innerColumns.length - 1,
			num;
		
		if(Z._currColNum < lastColNum) {
			num = Z._currColNum + 1;
		} else {
			if(Z._dataset.recno() === Z._dataset.recordCount() - 1) {
				return;
			}
			Z._dataset.next();
			num = 0;
		}
		Z.currColNum(num);
	},
	
	_getEditingFields: function() {
		var Z = this; 
		if(!Z._editable) {
			return null;
		}
		var fldName, fldObj,
			dsObj = Z._dataset,
			result = null;

		for(var i = 0, len = Z.innerColumns.length; i < len; i++) {
			fldName = Z.innerColumns[i].field;
			if(!fldName) {
				continue;
			}
			fldObj = dsObj.getField(fldName);
			if(!fldObj.disabled() && !fldObj.readOnly()) {
				if(!result) {
					result = [];
				}
				result.push(fldName);
			}
		}
		return result;
	},
	
	_initializeVm: function () {
		var Z = this;

		Z.listvm = new jslet.ui.ListViewModel(Z._dataset, Z._treeField ? true : false);
		
		Z.listvm.onTopRownoChanged = function (rowno) {
			if (rowno < 0) {
				return;
			}
			Z._fillData();
			
			Z._syncScrollBar(rowno);
			Z._showCurrentRow();
		};
	
		Z.listvm.onVisibleCountChanged = function () {
			Z.renderAll();
		};
		
		Z.listvm.onCurrentRownoChanged = function (preRowno, rowno) {
			if (Z._dataset.recordCount() === 0) {
				Z._currRow = null;
				return;
			}
			Z._dataset.recno(Z.listvm.getCurrentRecno());
			if (Z._currRow) {
				if (Z._currRow.fixed) {
					jQuery(Z._currRow.fixed).removeClass(jslet.ui.htmlclass.TABLECLASS.currentrow);
				}
				jQuery(Z._currRow.content).removeClass(jslet.ui.htmlclass.TABLECLASS.currentrow);
			}
			var currRow = Z._getTrByRowno(rowno), otr;
			if (!currRow) {
				return;
			}
			otr = currRow.fixed;
			if (otr) {
				jQuery(otr).addClass(jslet.ui.htmlclass.TABLECLASS.currentrow);
			}
			
			otr = currRow.content;
			jQuery(otr).addClass(jslet.ui.htmlclass.TABLECLASS.currentrow);
			Z._currRow = currRow;
			if(Z._editable) {
				var fldName = Z._editingField;
				if(fldName) {
					var fldObj = Z._dataset.getField(fldName);
					if(fldObj && !fldObj.disabled() && !fldObj.readOnly()) {
						Z._dataset.focusEditControl(fldName);
					}
				}
			}
		};
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this;
		Z._innerDestroy();
		Z.el.innerHTML = '';
		Z.listvm.fixedRows = Z._fixedRows;
		Z._calcParams();
		Z.listvm.refreshModel();
		Z._createFrame();
		Z._fillData();
		Z._showCurrentRow();
		Z._oldHeight = jQuery(Z.el).height();
		Z._updateSortFlag(true);
	}, // end renderAll

	_doBeforeSelect: function(hasCtrlKey, hasShiftKey, hasAltKey) {
	},
	
	_getSelectionFields: function(startColNum, endColNum) {
		if(startColNum > endColNum) {
			var tmp = startColNum;
			startColNum = endColNum;
			endColNum = tmp;
		}
		var fields = [], fldName, colCfg, colNum;
		for(var i = 0, len = this.innerColumns.length; i < len; i++) {
			colCfg = this.innerColumns[i];
			colNum = colCfg.colNum;
			if(colNum >= startColNum && colNum <= endColNum) {
				fldName = colCfg.field;
				if(fldName) {
					fields.push(fldName);
				}
			}
		}
		return fields;
	},
	
	_processSelection: function(hasCtrlKey, hasShiftKey, hasAltKey) {
		var Z = this,
			currRecno = Z._dataset.recno(),
			fldName;
		if(hasCtrlKey || !Z._autoClearSelection) { //If autoClearSelection = false, click a cell will select it.
			fldName = Z.innerColumns[Z._currColNum].field;
			if(fldName) {
				if(Z._dataset.selection.isSelected(currRecno, fldName)) {
					Z._dataset.selection.remove(currRecno, currRecno, [fldName], true);
				} else {
					Z._dataset.selection.add(currRecno, currRecno, [fldName], true);
				}
				Z._refreshSelection();
			}
			Z._preRecno = currRecno;
			Z._preColNum = Z._currColNum;
			return;
		}
		if(hasShiftKey) {
			var fields;
			if(Z._preTmpRecno >= 0 && Z._preTmpColNum >= 0) {
				fields = Z._getSelectionFields(Z._preColNum || 0, Z._preTmpColNum);
				Z._dataset.selection.remove(Z._preRecno || 0, Z._preTmpRecno, fields, false);
			}
			fields = Z._getSelectionFields(Z._preColNum || 0, Z._currColNum);
			Z._dataset.selection.add(Z._preRecno || 0, currRecno, fields, true);
			Z._refreshSelection();
			Z._preTmpRecno = currRecno;
			Z._preTmpColNum = Z._currColNum;
		} else {
			Z._preRecno = currRecno;
			Z._preColNum = Z._currColNum;
			Z._preTmpRecno = currRecno;
			Z._preTmpColNum = Z._currColNum;
			if(Z._autoClearSelection) {
				Z._dataset.selection.removeAll();
				Z._refreshSelection();
			}
		}
	},
	
	_processColumnSelection: function(colCfg, hasCtrlKey, hasShiftKey, hasAltKey) {
		if(!hasCtrlKey && !hasShiftKey) {
			return;
		}
		var Z = this,
			recCnt = Z._dataset.recordCount();
		if(recCnt === 0) {
			return;
		}
		var fields, colNum;
		if(hasShiftKey) {
			if(Z._preTmpColNum >= 0) {
				fields = Z._getSelectionFields(Z._preColNum || 0, Z._preTmpColNum);
				Z._dataset.selection.remove(0, recCnt, fields, true);
			}
			colNum = colCfg.colNum + colCfg.colSpan - 1;
			fields = Z._getSelectionFields(Z._preColNum || 0, colNum);
			Z._dataset.selection.add(0, recCnt, fields, true);
			Z._preTmpColNum = colNum;
		} else {
			if(!hasCtrlKey && Z._autoClearSelection) {
				Z._dataset.selection.removeAll();
			}
			if(colCfg.colSpan > 1) {
				fields = [];
				var startColNum = colCfg.colNum,
					endColNum = colCfg.colNum + colCfg.colSpan, fldName;
				
				for(colNum = startColNum; colNum < endColNum; colNum++) {
					fldName = Z.innerColumns[colNum].field;
					fields.push(fldName);
				}
			} else {
				fields = [colCfg.field];
			}
			Z._dataset.selection.add(0, recCnt, fields, true);
			Z._preColNum = colCfg.colNum;
		}
		Z._refreshSelection();
	},
	
	_processRowSelection: function(hasCtrlKey, hasShiftKey, hasAltKey) {
		if(!hasCtrlKey && !hasShiftKey) {
			return;
		}
		var Z = this,
			fields = Z._getSelectionFields(0, Z.innerColumns.length - 1);
		var currRecno = Z._dataset.recno();
		if(hasShiftKey) {
			if(Z._preTmpRecno >= 0) {
				Z._dataset.selection.remove(Z._preRecno || 0, Z._preTmpRecno, fields, true);
			}
			Z._dataset.selection.add(Z._preRecno || 0, currRecno, fields, true);
			Z._preTmpColNum = currRecno;
		} else {
			if(!hasCtrlKey && Z._autoClearSelection) {
				Z._dataset.selection.removeAll();
			}
			Z._dataset.selection.add(currRecno, currRecno, fields, true);
			Z._preRecno = currRecno;
		}
		Z._refreshSelection();
	},
	
	_prepareColumn: function(){
		var Z = this, cobj;
		Z._sysColumns = [];
		//prepare system columns
		if (Z._hasSeqCol){
			cobj = {label:'&nbsp;',width: Z.seqColWidth, disableHeadSort:true,isSeqCol:true, 
					cellRender:jslet.ui.DBTable.sequenceCellRender, widthCssName: Z._widthStyleId + '-s0'};
			Z._sysColumns.push(cobj);
		}
		if (Z._hasSelectCol){
			cobj = {label:'<input type="checkbox" />', width: Z.selectColWidth, disableHeadSort:true,isSelectCol:true, 
					cellRender:jslet.ui.DBTable.selectCellRender, widthCssName: Z._widthStyleId + '-s1'};
			Z._sysColumns.push(cobj);
		}
		
		if (Z.subgroup && Z.subgroup.hasExpander){
			cobj = {label:'&nbsp;', width: Z.selectColWidth, disableHeadSort:true, isSubgroup: true, 
					cellRender:jslet.ui.DBTable.subgroupCellRender, widthCssName: Z._widthStyleId + '-s2'};
			Z._sysColumns.push(cobj);
		}
		//prepare data columns
		var tmpColumns = [], fldObj;
		if (Z._columns) {
			for(var k = 0, colCnt2 = Z._columns.length; k < colCnt2; k++){
				cobj = Z._columns[k];
				if (!cobj.field){
					cobj.disableHeadSort = true;
				} else {
					fldObj = Z._dataset.getField(cobj.field);
					if(!fldObj) {
						throw new Error('Not found Field: ' + cobj.field);
					}
					cobj.displayOrder = fldObj.displayOrder();
				}
				tmpColumns.push(cobj);
			}
		}
		function getColumnObj(fldName) {
			if (Z._columns){
				for(var m = 0, colCnt1 = Z._columns.length; m < colCnt1; m++){
					cobj = Z._columns[m];
					if (cobj.field && cobj.field == fldName){
						return cobj;
					}
				}
			}
			return null;
		}
		var i, fldcnt, colCnt, fldName;
		if (!Z._onlySpecifiedCol) {
			var fields = Z._dataset.getFields();
			for (i = 0, fldcnt = fields.length; i < fldcnt; i++) {
				fldObj = fields[i];
				fldName = fldObj.name();
				if (fldObj.visible()) {
					cobj = getColumnObj(fldName);
					if(!cobj) {
						cobj = new jslet.ui.TableColumn();
						cobj.field = fldObj.name();
						cobj.displayOrder = fldObj.displayOrder();
						tmpColumns.push(cobj);
					}
				} // end if visible
			} // end for
			if (Z._columns){
				for(i = 0, colCnt = Z._columns.length; i < colCnt; i++){
					cobj = Z._columns[i];
					if (!cobj.field){
						continue;
					}
					fldObj = Z._dataset.getTopField(cobj.field);
					if (!fldObj) {
						throw new Error("Field: " + cobj.field + " doesn't exist!");
					}
					var children = fldObj.children();
					if (children && children.length > 0){
						fldName = fldObj.name();
						var isUnique = true;
						// cobj.field is not a child of a groupfield, we need check if the topmost parent field is duplicate or not 
						if (cobj.field != fldName){
							for(var n = 0; n < tmpColumns.length; n++){
								if (tmpColumns[n].field == fldName){
									isUnique = false;
									break;
								}
							} // end for k
						}
						if (isUnique){
							cobj = new jslet.ui.TableColumn();
							cobj.field = fldName;
							cobj.displayOrder = fldObj.displayOrder();
							tmpColumns.push(cobj);
						}
					}
				} //end for i
			} //end if Z.columns
		}
		
		tmpColumns.sort(function(cobj1, cobj2) {
			var ord1 = cobj1.displayOrder || 0;
			var ord2 = cobj2.displayOrder || 0;
			return ord1 === ord2? 0: (ord1 < ord2? -1: 1);
		});
		
		Z.innerHeads = [];
		Z.innerColumns = [];
		var ohead, label, 
			context = {lastColNum: 0, depth: 0};
		
		for(i = 0, colCnt = tmpColumns.length; i < colCnt; i++){
			cobj = tmpColumns[i];
			fldName = cobj.field;
			if (!fldName){
				ohead = new jslet.ui.TableHead();
				label = cobj.label;
				ohead.label = label? label: "";
				ohead.level = 0;
				ohead.colNum = context.lastColNum++;
				cobj.colNum = ohead.colNum;
				ohead.id = jslet.nextId();
				ohead.widthCssName = Z._widthStyleId + '-' + ohead.colNum;
				cobj.widthCssName = ohead.widthCssName;
				ohead.disableHeadSort = cobj.disableHeadSort;

				Z.innerHeads.push(ohead);
				Z.innerColumns.push(cobj);
				
				continue;
			}
			fldObj = Z._dataset.getField(fldName);
			Z._convertField2Head(context, fldObj);
		}

		Z.maxHeadRows = context.depth + 1;
		Z._calcHeadSpan();
	
		//check fixedCols property
		var preColCnt = 0, len,
			fixedColNum = Z._fixedCols - Z._sysColumns.length;
		colCnt = 0;
		for(i = 1, len = Z.innerHeads.length; i < len; i++){
			ohead = Z.innerHeads[i];
			colCnt += ohead.colSpan;
			if (fixedColNum <= preColCnt || fixedColNum == colCnt) {
				break;
			}
			if (fixedColNum < colCnt && fixedColNum > preColCnt) {
				Z._fixedCols = preColCnt + Z._sysColumns.length;
			}
			
			preColCnt = colCnt;
		}
	},
	
	_calcHeadSpan: function(heads){
		var Z = this;
		if (!heads) {
			heads = Z.innerHeads;
		}
		var ohead, childCnt = 0;
		for(var i = 0, len = heads.length; i < len; i++ ){
			ohead = heads[i];
			ohead.rowSpan = Z.maxHeadRows - ohead.level;
			if (ohead.subHeads){
				ohead.colSpan = Z._calcHeadSpan(ohead.subHeads);
				childCnt += ohead.colSpan;
			} else {
				ohead.colSpan = 1;
				childCnt++;
			}
		}
		return childCnt;
	},
	
	_convertField2Head: function(context, fldObj, parentHeadObj){
		var Z = this;
		if (!fldObj.visible()) {
			return false;
		}
		var level = 0, heads;
		if (!parentHeadObj){
			heads = Z.innerHeads;
		} else {
			level = parentHeadObj.level + 1;
			heads = parentHeadObj.subHeads;
		}
		var ohead, fldName = fldObj.name();
		ohead = new jslet.ui.TableHead();
		ohead.label = fldObj.displayLabel();
		ohead.field = fldName;
		ohead.level = level;
		ohead.colNum = context.lastColNum;
		ohead.id = jslet.nextId();
		heads.push(ohead);
		context.depth = Math.max(level, context.depth);
		var fldChildren = fldObj.children();
		if (fldChildren && fldChildren.length > 0){
			ohead.subHeads = [];
			var added = false;
			for(var i = 0, cnt = fldChildren.length; i< cnt; i++){
				Z._convertField2Head(context, fldChildren[i], ohead);
			}
		} else {
			context.lastColNum ++;
			var cobj, found = false;
			var len = Z._columns ? Z._columns.length: 0;
			for(var k = 0; k < len; k++){
				cobj = Z._columns[k];
				if (cobj.field == fldName){
					found = true;
					break;
				}
			}
			if (!found){
				cobj = new jslet.ui.TableColumn();
				cobj.field = fldName;
			}
			if (!cobj.label){
				cobj.label = fldObj.displayLabel();
			}
			if(fldObj.getType() === jslet.data.DataType.BOOLEAN) {
				cobj.isBoolColumn = true;
			}
			cobj.mergeSame = fldObj.mergeSame();
			cobj.colNum = ohead.colNum;
			if (!cobj.width){
				var maxWidth = fldObj ? fldObj.displayWidth() : 0;
				if (!Z._hideHead && cobj.label) {
					maxWidth = Math.max(maxWidth, cobj.label.length);
				}
				cobj.width = maxWidth ? (maxWidth * Z.charWidth) : 10;
			}
			//check and set cell render
			if (!cobj.cellRender) {
				if (fldObj.getType() == jslet.data.DataType.BOOLEAN){//data type is boolean
					cobj.cellRender = jslet.ui.DBTable.boolCellRender;
				} else {
					if (cobj.field == Z._treeField) {
						cobj.cellRender = jslet.ui.DBTable.treeCellRender;
					}
				}
			}
			ohead.widthCssName = Z._widthStyleId + '-' + ohead.colNum;
			cobj.widthCssName = ohead.widthCssName;
			
			Z.innerColumns.push(cobj);
		}
		return true;
	},
	
	_calcParams: function () {
		var Z = this;
		Z._currColNum = 0;
		Z._preTmpColNum = -1;
		Z._preTmpRecno = -1;
		Z._preRecno = -1;
		Z._preColNum = -1;

		if (Z._treeField) {//if tree table, then can't sort by clicking column header
			Z._disableHeadSort = true;
		}
		// calculate Sequence column width
		if (Z._hasSeqCol) {
			Z.seqColWidth = ('' + Z._dataset.recordCount()).length * Z.charWidth + 5;
			var sWidth = jslet.ui.htmlclass.TABLECLASS.selectColWidth;
			Z.seqColWidth = Z.seqColWidth > sWidth ? Z.seqColWidth: sWidth;
		} else {
			Z.seqColWidth = 0;
		}
		// calculate Select column width
		if (Z._hasSelectCol) {
			Z.selectColWidth = jslet.ui.htmlclass.TABLECLASS.selectColWidth;
		} else {
			Z.selectColWidth = 0;
		}
		//calculate Fixed row section's height
		if (Z._fixedRows > 0) {
			Z.fixedSectionHt = Z._fixedRows * Z.rowHeight();
		} else {
			Z.fixedSectionHt = 0;
		}
		//Calculate Foot section's height
		if (Z.aggraded() && Z.dataset().checkAggraded()){
			Z.footSectionHt = Z.rowHeight();
		} else {
			Z.footSectionHt = 0;
		}
		Z._prepareColumn();

		// fixed Column count must be less than total columns
		if (Z._fixedCols) {
			if (Z._fixedCols > Z.innerColumns.length) {
				Z._fixedCols = Z.innerColumns.length;
			}
		}
		Z.hasFixedCol = Z._sysColumns.length > 0 || Z._fixedCols > 0;
		if (Z.hasFixedCol){
			var w = 0, i, cnt;
			for(i = 0, cnt = Z._sysColumns.length; i < cnt; i++){
				w += Z._sysColumns[i].width + 1;
			}
			for(i = 0, cnt = Z._fixedCols; i < cnt; i++){
				w += Z.innerColumns[i].width + 1;
			}
			Z.fixedColWidth = w + 1;
		} else {
			Z.fixedColWidth = 0;
		}
	}, // end _calcParams

	_setScrollBarMaxValue: function (maxValue) {
		var Z = this,
			v = maxValue + Z._repairHeight;
		Z.jqVScrollBar.find('div').height(v);
		if(Z.contentSectionHt + Z.footSectionHt >= v) {
			Z.jqVScrollBar.parent().addClass('jl-scrollbar-hidden');	
		} else {
			Z.jqVScrollBar.parent().removeClass('jl-scrollbar-hidden');	
		}
	},

	_changeColWidthCssRule: function(cssName, width){
		var Z = this,
			styleEle = document.getElementById(Z._widthStyleId),
			styleObj = styleEle.styleSheet || styleEle.sheet,
			cssRules = styleObj.cssRules || styleObj.rules,
			cssRule = null, found = false;
			cssName = '.' + cssName;
		for(var i = 0, len = cssRules.length; i < len; i++) {
			cssRule = cssRules[i];
			if(cssRule.selectorText == cssName) {
				found = true;
				break;
			}
		}
		if(found) {
			cssRule.style.width = width + 'px';
		}
		return found;
	},

	_changeColWidth: function (index, deltaW) {
		var Z = this,
			colObj = Z.innerColumns[index];
		if (colObj.width + deltaW <= 0) {
			return;
		}
		colObj.width += deltaW;
		if(colObj.field) {
			Z._dataset.designMode(true);
			try {
				Z._dataset.getField(colObj.field).displayWidth(Math.round(colObj.width/Z.charWidth));
			} finally {
				Z._dataset.designMode(false);
			}
		}
		if(Z._changeColWidthCssRule(colObj.widthCssName, colObj.width)) {
			Z._changeContentWidth(deltaW);
		}
	},

	_refreshSeqColWidth: function() {
		var Z = this;
		if (!Z._hasSeqCol) {
			return;
		}
		var oldSeqColWidth = Z.seqColWidth;
		Z.seqColWidth = ('' + Z._dataset.recordCount()).length * Z.charWidth;
		var sWidth = jslet.ui.htmlclass.TABLECLASS.selectColWidth;
		Z.seqColWidth = Z.seqColWidth > sWidth ? Z.seqColWidth: sWidth;
		if(Z.seqColWidth == oldSeqColWidth) {
			return;
		}
		var colObj;
		for(var i = 0, len = Z._sysColumns.length; i < len; i++) {
			colObj = Z._sysColumns[i];
			if(colObj.isSeqCol) {
				break;
			}
		}
		colObj.width = Z.seqColWidth;
		Z._changeColWidthCssRule(colObj.widthCssName, Z.seqColWidth);
		var deltaW = Z.seqColWidth - oldSeqColWidth;
		Z._changeContentWidth(deltaW, true);
	},

	_changeContentWidth: function (deltaW, isLeft) {
		var Z = this,
			totalWidth = Z.getTotalWidth(isLeft),
			totalWidthStr = totalWidth + 'px';
		if(!isLeft) {
			Z.rightHeadTbl.parentNode.style.width = totalWidthStr;
			Z.rightFixedTbl.parentNode.style.width = totalWidthStr;
			Z.rightContentTbl.parentNode.style.width = totalWidthStr;
			if (Z.footSectionHt) {
				Z.rightFootTbl.style.width = totalWidthStr;
			}
		} else {
			Z.fixedColWidth = totalWidth;
			Z.leftHeadTbl.parentNode.parentNode.style.width = Z.fixedColWidth + 1 + 'px';
			Z.leftHeadTbl.parentNode.style.width = totalWidthStr;
			Z.leftFixedTbl.parentNode.style.width = totalWidthStr;
			Z.leftContentTbl.parentNode.style.width = totalWidthStr;
		}
		Z._checkHoriOverflow();
	},

	_createFrame: function () {
		var Z = this;
		Z.el.style.position = 'relative';
		var jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-table')) {
			jqEl.addClass('jl-table jl-border-box jl-round5');
		}
		if(Z._noborder){
			jqEl.addClass('jl-tbl-noborder');
		}
		
		function generateWidthStyle() {
			var colObj, cssName, i, len,
				styleHtml = ['<style type="text/css" id="' + Z._widthStyleId + '">\n'];
			for(i = 0, len = Z._sysColumns.length; i < len; i++) {
				colObj = Z._sysColumns[i];
				styleHtml.push('.' + colObj.widthCssName +'{width:' + colObj.width + 'px}\n');
			}
			for(i = 0, len = Z.innerColumns.length; i< len; i++) {
				colObj = Z.innerColumns[i];
				styleHtml.push('.' + colObj.widthCssName +'{width:' + colObj.width + 'px}\n');
			}
			styleHtml.push('</style>');
			return styleHtml.join('');
		}
		
		var dbtableframe = [
			'<div class="jl-tbl-splitter" style="display: none"></div>',
			generateWidthStyle(),
			'<div class="jl-tbl-norecord">',
			jslet.locale.DBTable.norecord,
			'</div>',
			'<table class="jl-tbl-container"><tr>',
			'<td><div class="jl-tbl-fixedcol"><table class="jl-tbl-data"><tbody /></table><table class="jl-tbl-data"><tbody /></table><div class="jl-tbl-content-div"><table class="jl-tbl-data"><tbody /></table></div><table><tbody /></table></div></td>',
			'<td><div class="jl-tbl-contentcol"><div><table class="jl-tbl-data jl-tbl-content-table" border="0" cellpadding="0" cellspacing="0"><tbody /></table></div><div><table class="jl-tbl-data jl-tbl-content-table"><tbody /></table></div><div class="jl-tbl-content-div"><table class="jl-tbl-data jl-tbl-content-table"><tbody /></table></div><table class="jl-tbl-content-table jl-tbl-footer"><tbody /></table></div></td>',
			'<td class="jl-scrollbar-col"><div class="jl-tbl-vscroll-head"></div><div class="jl-tbl-vscroll"><div /></div></td></tr></table>'];
		
		jqEl.html(dbtableframe.join(''));

		var children = jqEl.find('.jl-tbl-fixedcol')[0].childNodes;
		Z.leftHeadTbl = children[0];
		Z.leftFixedTbl = children[1];
		Z.leftContentTbl = children[2].firstChild;
		Z.leftFootTbl = children[3];
		
		children = jqEl.find('.jl-tbl-contentcol')[0].childNodes;
		Z.rightHeadTbl = children[0].firstChild;
		Z.rightFixedTbl = children[1].firstChild;
		Z.rightContentTbl = children[2].firstChild;
		Z.rightFootTbl = children[3];

		Z.height = jqEl.height();
		if (Z._hideHead){
			Z.leftHeadTbl.style.display = 'none';
			Z.rightHeadTbl.style.display = 'none';
			jqEl.find('.jl-tbl-vscroll-head').css('display', 'none');
		}
		if (Z._fixedRows <= 0){
			Z.leftFixedTbl.style.display = 'none';
			Z.rightFixedTbl.style.display = 'none';
		}
		if (!Z.footSectionHt){
			Z.leftFootTbl.style.display = 'none';
			Z.rightFootTbl.style.display = 'none';
		}
		Z.leftHeadTbl.parentNode.parentNode.style.width = Z.fixedColWidth + 'px';
		
		var jqRightHead = jQuery(Z.rightHeadTbl);
		jqRightHead.off();
		var x = jqRightHead.on('mousedown', Z._doSplitHookDown);
		var y = jqRightHead.on('mouseup', Z._doSplitHookUp);
		
		jQuery(Z.leftHeadTbl).on('mousedown', '.jl-tbl-header-cell', function(event){
			event = jQuery.event.fix(event || window.event);
			var el = event.target;
			if (el.className == 'jl-tbl-splitter-hook') {
				return;
			}
			var colCfg = this.jsletColCfg;
			if(colCfg.field) {
				Z._processColumnSelection(colCfg, event.ctrlKey, event.shiftKey, event.altKey);
			}
		});
		
		jqRightHead.on('mousedown', '.jl-tbl-header-cell', function(event){
			event = jQuery.event.fix(event || window.event);
			var el = event.target;
			if (el.className == 'jl-tbl-splitter-hook') {
				return;
			}
			var colCfg = this.jsletColCfg;
			if(colCfg.field) {
				Z._processColumnSelection(colCfg, event.ctrlKey, event.shiftKey, event.altKey);
			}
		});

		jQuery(Z.leftHeadTbl).on('mouseup', '.jl-focusable-item', function(event){
			event = jQuery.event.fix(event || window.event);
			var el = event.target;
			if (Z.isDraggingColumn) {
				return;
			}
			Z._doHeadClick(this.parentNode.parentNode.parentNode.jsletColCfg, event.ctrlKey);
			Z._head_label_cliecked = true;
			event.stopImmediatePropagation();
			event.preventDefault();
			return false;
		});
		
		jqRightHead.on('mouseup', '.jl-focusable-item', function(event){
			event = jQuery.event.fix(event || window.event);
			var el = event.target;
			if (Z.isDraggingColumn) {
				return;
			}
			Z._doHeadClick(this.parentNode.parentNode.parentNode.jsletColCfg, event.ctrlKey);
			Z._head_label_cliecked = true;
			event.stopImmediatePropagation();
			event.preventDefault();
			return false;
		});
		
		var dragTransfer = null;
		jqRightHead.on('dragstart', '.jl-focusable-item', function(event){
			if(Z._filterPanel) {
				Z._filterPanel.hide();
			}
			var otd = this.parentNode.parentNode.parentNode,
				colCfg = otd.jsletColCfg,
				e = event.originalEvent,
				transfer = e.dataTransfer;
			transfer.dropEffect = 'link';
			transfer.effectAllowed = 'link';
			dragTransfer = {fieldName: colCfg.field, rowIndex: otd.parentNode.rowIndex, cellIndex: otd.cellIndex};
			transfer.setData('fieldName', colCfg.field); //must has this row otherwise FF does not work.
			return true;
		});

		function checkDropable(currCell) {
			var colCfg = currCell.jsletColCfg,
				srcRowIndex = dragTransfer.rowIndex,
				srcCellIndex = dragTransfer.cellIndex,
				currRowIndex = currCell.parentNode.rowIndex,
				currCellIndex = currCell.cellIndex;
			var result = (srcRowIndex == currRowIndex && currCellIndex != srcCellIndex);
			if(!result) {
				return result;
			}
			var	srcFldName = dragTransfer.fieldName,
				currFldName = colCfg.field,
				srcPFldObj = Z._dataset.getField(srcFldName).parent(),
				currPFldObj = currFldName && Z._dataset.getField(currFldName).parent();
			result = (srcPFldObj === currPFldObj || (currPFldObj && srcPFldObj.name() == currPFldObj.name()));
			return result;
		}
		
		jqRightHead.on('dragover', '.jl-tbl-header-cell .jl-tbl-header-div', function(event){
			if(!dragTransfer) {
				return false;
			}
			var otd = this.parentNode,
				e = event.originalEvent,
				transfer = e.dataTransfer;
			if(checkDropable(otd)) { 
				jQuery(event.currentTarget).addClass('jl-tbl-col-over');
				transfer.dropEffect = 'link';
			} else {
				transfer.dropEffect = 'move';
			}
		    return false;
		});

		jqRightHead.on('dragenter', '.jl-tbl-header-cell .jl-tbl-header-div', function(event){
			if(!dragTransfer) {
				return false;
			}
			var otd = this.parentNode,
				e = event.originalEvent,
				transfer = e.dataTransfer;
			if(checkDropable(otd)) { 
				jQuery(event.currentTarget).addClass('jl-tbl-col-over');
				transfer.dropEffect = 'link';
			} else {
				transfer.dropEffect = 'move';
			}
		    return false;
		});
		
		jqRightHead.on('dragleave', '.jl-tbl-header-cell .jl-tbl-header-div', function(event){
			if(!dragTransfer) {
				return false;
			}
			jQuery(event.currentTarget).removeClass('jl-tbl-col-over');
			return  false;
		});
		
		jqRightHead.on('drop', '.jl-tbl-header-cell .jl-tbl-header-div', function(event){
			if(!dragTransfer) {
				return false;
			}
			jQuery(event.currentTarget).removeClass('jl-tbl-col-over');
			var currCell = this.parentNode,
				e = event.originalEvent,
				transfer = e.dataTransfer,
				colCfg = currCell.jsletColCfg,
				srcRowIndex = dragTransfer.rowIndex,
				srcCellIndex = dragTransfer.cellIndex,
				currRowIndex = currCell.parentNode.rowIndex,
				currCellIndex = currCell.cellIndex;
			
			if(!checkDropable(currCell)) { 
				return;
			}
			var destField = this.parentNode.jsletColCfg.field;
			if(!destField) {
				return;
			}
			var	srcField = dragTransfer.fieldName;
			Z._moveColumn(srcRowIndex, srcCellIndex, currCellIndex);
	    	return false;
		});
		
		var jqLeftFixedTbl = jQuery(Z.leftFixedTbl),
			jqRightFixedTbl = jQuery(Z.rightFixedTbl),
			jqLeftContentTbl = jQuery(Z.leftContentTbl),
			jqRightContentTbl = jQuery(Z.rightContentTbl);
		
		jqLeftFixedTbl.off();
		jqLeftFixedTbl.on('mouseenter', 'tr', function() {
			jQuery(this).addClass(jslet.ui.htmlclass.TABLECLASS.hoverrow);
			jQuery(jqRightFixedTbl[0].rows[this.rowIndex]).addClass(jslet.ui.htmlclass.TABLECLASS.hoverrow);
		});
		jqLeftFixedTbl.on('mouseleave', 'tr', function() {
			jQuery(this).removeClass(jslet.ui.htmlclass.TABLECLASS.hoverrow);
			jQuery(jqRightFixedTbl[0].rows[this.rowIndex]).removeClass(jslet.ui.htmlclass.TABLECLASS.hoverrow);
		});

		jqRightFixedTbl.off();
		jqRightFixedTbl.on('mouseenter', 'tr', function() {
			jQuery(this).addClass(jslet.ui.htmlclass.TABLECLASS.hoverrow);
			jQuery(jqLeftFixedTbl[0].rows[this.rowIndex]).addClass(jslet.ui.htmlclass.TABLECLASS.hoverrow);
		});
		jqRightFixedTbl.on('mouseleave', 'tr', function() {
			jQuery(this).removeClass(jslet.ui.htmlclass.TABLECLASS.hoverrow);
			jQuery(jqLeftFixedTbl[0].rows[this.rowIndex]).removeClass(jslet.ui.htmlclass.TABLECLASS.hoverrow);
		});
		
		jqLeftContentTbl.off();
		jqLeftContentTbl.on('mouseenter', 'tr', function() {
			jQuery(this).addClass(jslet.ui.htmlclass.TABLECLASS.hoverrow);
			jQuery(jqRightContentTbl[0].rows[this.rowIndex]).addClass(jslet.ui.htmlclass.TABLECLASS.hoverrow);
		});
		jqLeftContentTbl.on('mouseleave', 'tr', function(){
			jQuery(this).removeClass(jslet.ui.htmlclass.TABLECLASS.hoverrow);
			jQuery(jqRightContentTbl[0].rows[this.rowIndex]).removeClass(jslet.ui.htmlclass.TABLECLASS.hoverrow);
		});
		
		jqRightContentTbl.off();
		jqRightContentTbl.on('mouseenter', 'tr', function(){
			jQuery(this).addClass(jslet.ui.htmlclass.TABLECLASS.hoverrow);
			var hasLeft = (Z._fixedRows > 0 || Z._sysColumns.length > 0);
			if(hasLeft) {
				jQuery(jqLeftContentTbl[0].rows[this.rowIndex]).addClass(jslet.ui.htmlclass.TABLECLASS.hoverrow);
			}
		});
		jqRightContentTbl.on('mouseleave', 'tr', function(){
			jQuery(this).removeClass(jslet.ui.htmlclass.TABLECLASS.hoverrow);
			var hasLeft = (Z._fixedRows > 0 || Z._sysColumns.length > 0);
			if(hasLeft) {
				jQuery(jqLeftContentTbl[0].rows[this.rowIndex]).removeClass(jslet.ui.htmlclass.TABLECLASS.hoverrow);
			}
		});
		
		Z.jqVScrollBar = jqEl.find('.jl-tbl-vscroll');
		//The scrollbar width must be set explicitly, otherwise it doesn't work in IE. 
		Z.jqVScrollBar.width(jslet.scrollbarSize()+1);
		
		Z.jqVScrollBar.off().on('scroll', function () {
			if (Z._keep_silence_) {
				return;
			}
			if(Z._editable && Z._dataset.status() != jslet.data.DataSetStatus.BROWSE) {
				Z._dataset.confirm();
			}
			var num = Math.round(this.scrollTop / Z.rowHeight());// + Z._fixedRows;
			if (num != Z.listvm.getVisibleStartRow()) {
				Z._keep_silence_ = true;
				try {
					Z.listvm.setVisibleStartRow(num);
					Z._showCurrentRow();
					var cellEditor = Z.cellEditor();
					if(cellEditor) {
						cellEditor.hideEditor();
					}
				} finally {
					Z._keep_silence_ = false;
				}
			}

		});

		jqEl.find('.jl-tbl-contentcol').off().on('scroll', function () {
			if(Z._isCurrCellInView()) {
				//Avoid focusing the current control
				jslet.temp.focusing = true;
				try {
					Z._showCurrentCell();
					
				} finally {
					jslet.temp.focusing = false;
				}
			} else {
	        	var cellEditor = Z.cellEditor();
	        	if(cellEditor) {
	       			cellEditor.hideEditor();
	        	}
			}
			if(Z._filterPanel) {
				Z._filterPanel.hide();
			}
		});
		
		var splitter = jqEl.find('.jl-tbl-splitter')[0];
		splitter._doDragStart = function(){
			this.style.display = 'block';
			if(Z._filterPanel) {
				Z._filterPanel.hide();
			}
		};
		
		splitter._doDragging = function (oldX, oldY, x, y, deltaX, deltaY) {
			var bodyMleft = parseInt(jQuery(document.body).css('margin-left'));

			var ojslet = splitter.parentNode.jslet;
			var colObj = ojslet.innerColumns[ojslet.currColId];
			if (colObj.width + deltaX <= 40) {
				return;
			}
			splitter.style.left = x - jQuery(splitter.parentNode).offset().left - bodyMleft + 'px';
		};

		splitter._doDragEnd = function (oldX, oldY, x, y, deltaX,
			deltaY) {
			var Z = splitter.parentNode.jslet;
			Z._changeColWidth(Z.currColId, deltaX);
			splitter.style.display = 'none';
			splitter.parentNode.jslet.isDraggingColumn = false;
			var cellEditor = Z.cellEditor();
			if(cellEditor) {
				cellEditor.showEditor();
			}

		};

		splitter._doDragCancel = function () {
			splitter.style.display = 'none';
			splitter.parentNode.jslet.isDraggingColumn = false;
		};

		if (Z.footSectionHt){
			Z.leftFootTbl.style.display = '';
			Z.rightFootTbl.style.display = '';
		}
		Z._renderHeader();
		if (Z._hideHead) {
			Z.headSectionHt = 0;
		} else {
			Z.headSectionHt = Z.maxHeadRows * Z.headRowHeight();
		}
		Z._changeContentWidth(0);

		Z.noRecordDiv = jqEl.find('.jl-tbl-norecord')[0];
		Z.noRecordDiv.style.top = Z.headSectionHt + 'px';
		Z.noRecordDiv.style.left = jqEl.find('.jl-tbl-fixedcol').width() + 5 + 'px';
		jqEl.find('.jl-tbl-vscroll-head').height(Z.headSectionHt + Z.fixedSectionHt);
		Z._renderBody();
	},

	_moveColumn: function(rowIndex, srcCellIndex, destCellIndex) {
		var Z = this;
		
		function moveOneRow(cells, srcStart, srcEnd, destStart, destEnd) {
			var cobj, 
				colNo = 0, 
				srcCells = [],
				destCells = [], i, len;
			
			for(i = 0, len = cells.length; i < len; i++) {
				cobj = cells[i];
				if(colNo >= srcStart && colNo <= srcEnd) {
					srcCells.push(cobj);
				} else if(colNo >= destStart && colNo <= destEnd) {
					destCells.push(cobj);
				} else {
					if(colNo > srcEnd && colNo > destEnd) {
						break;
					}
				}
				
				colNo += cobj.colSpan || 1;
			}
			var destCell;
			if(srcStart > destStart) {	
				destCell = destCells[0];
				for(i = 0, len = srcCells.length; i < len; i++) {
					jQuery(srcCells[i]).insertBefore(destCell);
				}
			} else {
				destCell = destCells[destCells.length - 1];
				for(i = srcCells.length; i >= 0; i--) {
					jQuery(srcCells[i]).insertAfter(destCell);
				}
			}
		}
		
		function moveOneTableColumn(rows, rowIndex, srcStart, srcEnd, destStart, destEnd) {
			var rowCnt = rows.length;
			if(rowCnt === 0 || rowCnt === rowIndex) {
				return;
			}
			var colCfg = rows[rowIndex].cells[srcStart].jsletColCfg;
			var rowObj, cellCnt;
			for(var i = rowIndex, len = rows.length; i < len; i++) {
				rowObj = rows[i];
				moveOneRow(rowObj.cells, srcStart, srcEnd, destStart, destEnd);
			}
		}
		
		var rows = Z.rightHeadTbl.createTHead().rows, cobj,
			rowObj = rows[rowIndex],
			srcStart = 0,
			srcEnd = 0,
			destStart = 0,
			destEnd = 0, 
			preColNo = 0,
			colNo = 0;
		
		for(var i = 0, len = rowObj.cells.length; i < len; i++) {
			cobj = rowObj.cells[i];
			preColNo = colNo; 
			colNo += (cobj.colSpan || 1);
			if(i === srcCellIndex) {
				srcStart = preColNo;
				srcEnd = colNo - 1;
			}
			if(i === destCellIndex) {
				destStart = preColNo;
				destEnd = colNo - 1;
			}
		}
		var srcCell = rowObj.cells[srcCellIndex],
			destCell = rowObj.cells[destCellIndex];
		var srcColCfg = srcCell.jsletColCfg,
			destColCfg = destCell.jsletColCfg,
			srcFldName = srcColCfg.field,
			destFldName = destColCfg.field;
		if(srcFldName && destFldName) {
			Z._dataset.designMode(true);
			try {
				Z._dataset.moveField(srcFldName, destFldName);
			} finally {
				Z._dataset.designMode(false);
			}
		}
		var currField = Z.getFieldByColNum(Z._currColNum);
		var dataRows = Z.rightContentTbl.tBodies[0].rows;
		Z._changeColNum(dataRows[0], srcStart, srcEnd, destStart, destEnd);
		var headRows = Z.rightHeadTbl.createTHead().rows;
		moveOneTableColumn(headRows, rowIndex, srcStart, srcEnd, destStart, destEnd);
		moveOneTableColumn(Z.rightFixedTbl.tBodies[0].rows, 0, srcStart, srcEnd, destStart, destEnd);
		moveOneTableColumn(dataRows, 0, srcStart, srcEnd, destStart, destEnd);
		moveOneTableColumn(Z.rightFootTbl.tBodies[0].rows, 0, srcStart, srcEnd, destStart, destEnd);
		Z._dataset.selection.removeAll();
		Z._refreshSelection();
    	Z.gotoField(currField);
	},
	
	_changeColNum: function(rowObj, srcStart, srcEnd, destStart, destEnd) {
		if(!rowObj) {
			return;
		}
		var cobj, 
			colNo = 0, 
			srcCells = [],
			destCells = [],
			cells = rowObj.cells, i, len;
		
		for(i = 0, len = cells.length; i < len; i++) {
			cobj = cells[i];
			if(colNo >= srcStart && colNo <= srcEnd) {
				srcCells.push(cobj);
			} else if(colNo >= destStart && colNo <= destEnd) {
				destCells.push(cobj);
			} else {
				if(colNo > srcEnd && colNo > destEnd) {
					break;
				}
			}
			colNo += cobj.colSpan || 1;
		}
		var srcCellLen = srcCells.length,
			destCellLen = destCells.length,
			firstDestColNum= destCells[0].jsletColCfg.colNum,
			k = 0, colCfg;
		if(srcStart > destStart) {
			for(i = srcStart; i <= srcEnd; i++) {
				colCfg = cells[i].jsletColCfg;
				colCfg.colNum = firstDestColNum + (k++);
			}
			for(i = destStart; i < srcStart; i++) {
				colCfg = cells[i].jsletColCfg;
				colCfg.colNum = colCfg.colNum + srcCellLen;
			}
		} else {
			var newStart = firstDestColNum - srcCellLen + destCellLen;
			for(i = srcStart; i <= srcEnd; i++) {
				colCfg = cells[i].jsletColCfg;
				colCfg.colNum = newStart + (k++);
			}
			for(i = srcEnd + 1; i <= destEnd; i++) {
				colCfg = cells[i].jsletColCfg;
				colCfg.colNum = colCfg.colNum - srcCellLen;
			}
		}		
	},
	
	_calcAndSetContentHeight: function(){
		var Z = this,
			jqEl = jQuery(Z.el);

		Z.contentSectionHt = Z.height - Z.headSectionHt - Z.fixedSectionHt - Z.footSectionHt;
		if (Z._isHoriOverflow){
			Z.contentSectionHt -= jslet.ui.htmlclass.TABLECLASS.scrollBarWidth;
		}
		var rh = Z.rowHeight();
		Z.listvm.setVisibleCount(Math.floor((Z.contentSectionHt) / rh), true);
		Z._repairHeight = Z.contentSectionHt - Z.listvm.getVisibleCount() * rh;
		
		jqEl.find('.jl-tbl-contentcol').height(Z.height);
		jqEl.find('.jl-tbl-content-div').height(Z.contentSectionHt);

		Z.jqVScrollBar.height(Z.contentSectionHt + Z.footSectionHt);
		Z._setScrollBarMaxValue(Z.listvm.getNeedShowRowCount() * rh);
	},
	
	_checkHoriOverflow: function(){
		var Z = this,
			contentWidth = Z.getTotalWidth();

		if(Z._hideHead) {
			Z._isHoriOverflow = contentWidth > jQuery(Z.rightContentTbl.parentNode.parentNode).innerWidth();
		} else {
			Z._isHoriOverflow = contentWidth > Z.rightHeadTbl.parentNode.parentNode.clientWidth;
		}
		Z._calcAndSetContentHeight();
	},
	
	_refreshHeadCell: function(fldName) {
		var Z = this,
			jqEl = jQuery(Z.el), oth = null, cobj;
		jqEl.find('.jl-tbl-header-cell').each(function(index, value){
			cobj = this.jsletColCfg;
			if(cobj && cobj.field == fldName) {
				oth = this;
				return false;
			}
		});
		if(!oth) {
			return;
		}
		var fldObj = Z._dataset.getField(cobj.field);
		cobj.label = fldObj.displayLabel();
		var ochild = oth.childNodes[0];
		var cellRender = cobj.cellRender || Z._defaultCellRender;
		if (cellRender && cellRender.createHeader) {
			ochild.html('');
			cellRender.createHeader.call(Z, ochild, cobj);
		} else {
			var sh = cobj.label || '&nbsp;';
			if(cobj.field && Z._isCellEditable(cobj)) {
				if(fldObj && fldObj.required()) {
					sh = '<span class="jl-lbl-required">*</span>' + sh;
				}
			} 
			jQuery(oth).find('.jl-focusable-item').html(sh);
		}
	},
	
	_createHeadCell: function (otr, cobj) {
		var Z = this,
			rowSpan = 0, colSpan = 0;
		
		if (!cobj.subHeads) {
			rowSpan = Z.maxHeadRows - (cobj.level ? cobj.level: 0);
		} else {
			colSpan = cobj.colSpan;
		}
		var oth = document.createElement('th');
		oth.className = 'jl-tbl-header-cell jl-unselectable';
		oth.noWrap = true;
		oth.jsletColCfg = cobj;
		if (rowSpan && rowSpan > 1) {
			oth.rowSpan = rowSpan;
		}
		if (colSpan && colSpan > 1) {
			oth.colSpan = colSpan;
		}
		oth.innerHTML = '<div style="position: relative" unselectable="on" class="jl-unselectable jl-tbl-header-div jl-border-box ' + 
			(cobj.widthCssName || '') +'">';
		var ochild = oth.childNodes[0];
		var cellRender = cobj.cellRender || Z._defaultCellRender;
		if (cellRender && cellRender.createHeader) {
			cellRender.createHeader.call(Z, ochild, cobj);
		} else {
			var sh = cobj.label || '&nbsp;';
			if(cobj.field) {
				var fldObj = Z._dataset.getField(cobj.field);
				if(fldObj && fldObj.required()) {
					sh = '<span class="jl-lbl-required">*</span>' + sh;
				}
			} 
			ochild.innerHTML = [
			    Z._hasFilterDialog && cobj.field && !cobj.subHeads? '<button class="jl-tbl-filter" jsletfilterfield="' + cobj.field + 
			    		'"><i class="fa fa-filter"></i></button>': '',
			    '<span id="',
				cobj.id, 
				'" unselectable="on" style="width:100%;padding:0px 2px">',
				((!Z._disableHeadSort && !cobj.disableHeadSort) ? '<span class="jl-focusable-item" draggable="true">' + sh +'</span>': sh),
				'</span><span unselectable="on" class="jl-tbl-sorter" title="',
				jslet.locale.DBTable.sorttitle,
				'">&nbsp;</span><div  unselectable="on" class="jl-tbl-splitter-hook" colid="',
				cobj.colNum,
				'">&nbsp;</div>'].join('');
		}
		otr.appendChild(oth);	
	}, // end _createHeadCell

	_renderHeader: function () {
		var Z = this;
		if (Z._hideHead) {
			return;
		}
		var otr, otrLeft = null, cobj, otrRight, otd, oth, i, cnt,
			leftHeadObj = Z.leftHeadTbl.createTHead(),
			rightHeadObj = Z.rightHeadTbl.createTHead();
		for(i = 0; i < Z.maxHeadRows; i++){
			leftHeadObj.insertRow(-1);
			rightHeadObj.insertRow(-1);
		}
		otr = leftHeadObj.rows[0];
		for(i = 0, cnt = Z._sysColumns.length; i < cnt; i++){
			cobj = Z._sysColumns[i];
			cobj.rowSpan = Z.maxHeadRows;
			Z._createHeadCell(otr, cobj);
		}
		function travHead(arrHeadCfg){
			var cobj, otr;
			for(var m = 0, ccnt = arrHeadCfg.length; m < ccnt; m++){
				cobj = arrHeadCfg[m];
				if (cobj.colNum < Z._fixedCols) {
					otr = leftHeadObj.rows[cobj.level];
				} else {
					otr = rightHeadObj.rows[cobj.level];
				}
				Z._createHeadCell(otr, cobj);
				if (cobj.subHeads) {
					travHead(cobj.subHeads);
				}
			}
		}
		travHead(Z.innerHeads);
		var jqTr1, jqTr2, h= Z.headRowHeight();
		for(i = 0; i <= Z.maxHeadRows; i++){
			jqTr1 = jQuery(leftHeadObj.rows[i]);
			jqTr2 = jQuery(rightHeadObj.rows[i]);
			jqTr1.height(h);
			jqTr2.height(h);
		}
		Z.sortedCell = null;
		Z.indexField = null;
	}, // end renderHead

	getTotalWidth: function(isLeft){
		var Z= this,
			totalWidth = 0, i, cnt;
		if(!isLeft) {
			for(i = Z._fixedCols, cnt = Z.innerColumns.length; i < cnt; i++){
				totalWidth += Z.innerColumns[i].width;
			}
		} else {
			for(i = 0, cnt = Z._sysColumns.length; i < cnt; i++){
				totalWidth += Z._sysColumns[i].width;
			}
			for(i = 0, cnt = Z._fixedCols; i < cnt; i++){
				totalWidth += Z.innerColumns[i].width;
			}
		}
		return totalWidth;
	},
	
	_doSplitHookDown: function (event) {
		event = jQuery.event.fix( event || window.event );
		var ohook = event.target;
		if (ohook.className != 'jl-tbl-splitter-hook') {
			return;
		}
		var tblContainer = jslet.ui.findFirstParent(ohook, function (el) {
			return el.tagName.toLowerCase() == 'div' && el.jslet && el.jslet._dataset;
		});
		var jqTblContainer = jQuery(tblContainer),
			jqBody = jQuery(document.body), 
			bodyMTop = parseInt(jqBody.css('margin-top')),
			bodyMleft = parseInt(jqBody.css('margin-left')),
			y = jqTblContainer.position().top - bodyMTop,
			jqHook = jQuery(ohook),
			h = jqTblContainer.height() - 20,
			currLeft = jqHook.offset().left - jqTblContainer.offset().left - bodyMleft,
			splitDiv = jqTblContainer.find('.jl-tbl-splitter')[0];
		splitDiv.style.left = currLeft + 'px';
		splitDiv.style.top = '1px';
		splitDiv.style.height = h + 'px';
		jslet.ui.dnd.bindControl(splitDiv);
		tblContainer.jslet.currColId = parseInt(jqHook.attr('colid'));
		tblContainer.jslet.isDraggingColumn = true;
	},

	_doSplitHookUp: function (event) {
		event = jQuery.event.fix( event || window.event );
		var ohook = event.target.lastChild;
		if (!ohook || ohook.className != 'jl-tbl-splitter-hook') {
			return;
		}
		var tblContainer = jslet.ui.findFirstParent(ohook, function (el) {
			return el.tagName.toLowerCase() == 'div' && el.jslet && el.jslet._dataset;
		});

		var jqTblContainer = jQuery(tblContainer),
			jqBody = jQuery(document.body); 
		jqBody.css('cursor','auto');

		var splitDiv = jqTblContainer.find('.jl-tbl-splitter')[0];
		if (splitDiv.style.display != 'none') {
			splitDiv.style.display = 'none';
		}
		tblContainer.jslet.isDraggingColumn = false;
	},

	_getColumnByField: function (fieldName) {
		var Z = this;
		if (!Z.innerColumns) {
			return null;
		}
		var cobj;
		for (var i = 0, cnt = Z.innerColumns.length; i < cnt; i++) {
			cobj = Z.innerColumns[i];
			if (cobj.field == fieldName) {
				return cobj;
			}
		}
		return null;
	},

	_doHeadClick: function (colCfg, ctrlKeyPressed) {
		var Z = this;
		if (Z._disableHeadSort || colCfg.disableHeadSort || Z.isDraggingColumn) {
			return;
		}
		Z._doSort(colCfg.field, ctrlKeyPressed);
	}, // end _doHeadClick

	_doSort: function (sortField, isMultiSort) {
		var Z = this;
		Z._dataset.confirm();
		Z._dataset.disableControls();
		try {
			if (!Z._onCustomSort) {
				Z._dataset.toggleIndexField(sortField, !isMultiSort);
			} else {
				Z._onCustomSort.call(Z, sortField);
			}
			Z.listvm.refreshModel();
		} finally {
			Z._dataset.enableControls();
		}
	},

	_updateSortFlag: function () {
		var Z = this;
		if (Z._hideHead) {
			return;
		}

		var sortFields = Z._dataset.mergedIndexFields();
		
		var leftHeadObj = Z.leftHeadTbl.createTHead(),
			rightHeadObj = Z.rightHeadTbl.createTHead(),
			leftHeadCells, rightHeadCells,
			allHeadCells = [], oth, i, cnt, r,
			rowCnt = leftHeadObj.rows.length;
		for(r = 0; r < rowCnt; r++) {
			leftHeadCells = leftHeadObj.rows[r].cells;
			for (i = 0, cnt = leftHeadCells.length; i < cnt; i++){
				oth = leftHeadCells[i];
				if (oth.jsletColCfg) {
					allHeadCells[allHeadCells.length] = oth;
				}
			}
		}
		for(r = 0; r < rowCnt; r++) {
			rightHeadCells =  rightHeadObj.rows[r].cells;
			for (i = 0, cnt = rightHeadCells.length; i < cnt; i++){
				oth = rightHeadCells[i];
				if (oth.jsletColCfg) {
					allHeadCells[allHeadCells.length] = oth;
				}
			}
		}
		var len = sortFields.length, sortDiv, 
			cellCnt = allHeadCells.length;
		for (i = 0; i < cellCnt; i++) {
			oth = allHeadCells[i];
			sortDiv = jQuery(oth).find('.jl-tbl-sorter')[0];
			if (sortDiv) {
				sortDiv.innerHTML = '&nbsp;';
			}
		}
		var fldName, sortFlag, sortObj, 
			k = 1;
		for (i = 0; i < len; i++) {
			sortObj = sortFields[i];
			for (var j = 0; j < cellCnt; j++) {
				oth = allHeadCells[j];
				fldName = oth.jsletColCfg.field;
				if (!fldName) {
					continue;
				}
				sortDiv = jQuery(oth).find('.jl-tbl-sorter')[0];
				sortFlag = '&nbsp;';
				if (fldName == sortObj.fieldName) {
					sortFlag = sortObj.order === 1 ? '<i class="fa fa-arrow-up"></i>' : '<i class="fa fa-arrow-down"></i>';
					if (len > 1) {
						sortFlag += k++;
					}
					break;
				}
			}
			sortDiv.innerHTML = sortFlag;
			if (!oth) {
				continue;
			}
		}
	},

	_doSelectBoxClick: function (event) {
		var ocheck = null;
		if (event){
			event = jQuery.event.fix( event || window.event );
			ocheck = event.target;
		} else {
			ocheck = this;
		}
		var otr = jslet.ui.getParentElement(ocheck, 2);
		try {
			jQuery(otr).click();// tr click
		} finally {
			var otable = jslet.ui.findFirstParent(otr, function (node) {
				return node.jslet? true: false;
			});
			var oJslet = otable.jslet;

			if (oJslet._onSelect) {
				var flag = oJslet._onSelect.call(oJslet, ocheck.checked);
				if (flag !== undefined && !flag) {
					ocheck.checked = !ocheck.checked;
					return;
				}
			}
			if(oJslet._beforeSelect) {
				oJslet._beforeSelect.call(oJslet);
			}
			oJslet._dataset.select(ocheck.checked ? 1 : 0, oJslet._selectBy);
			if(oJslet._afterSelect) {
				oJslet._afterSelect.call(oJslet);
			}
		}
	}, // end _doSelectBoxClick

	_doCellClick: function (colCfg) {
		var Z = this;
		if (Z._onCellClick) {
			Z._onCellClick.call(Z, colCfg);
		}
	},
	
	_doRowDblClick: function (event) {
		var otable = jslet.ui.findFirstParent(this, function (node) {
			return node.jslet? true: false;
		});

		var Z = otable.jslet;
		if (Z._onRowDblClick) {
			Z._onRowDblClick.call(Z, event);
		}
	},

	_doRowClick: function (event) {
		var otable = jslet.ui.findFirstParent(this, function (node) {
			return node.jslet ? true: false;
		});

		var Z = otable.jslet;
		var dataset = Z.dataset();
		if(this.jsletrecno !== dataset.recno()) {
			if(dataset.status()) {
				dataset.confirm();
			}
	
			var rowno = Z.listvm.recnoToRowno(this.jsletrecno);
			Z.listvm.setCurrentRowno(rowno);
			Z._dataset.recno(Z.listvm.getCurrentRecno());
		}
		if (Z._onRowClick) {
			Z._onRowClick.call(Z, event);
		}
	},

	_renderCell: function (otr, colCfg, isFirstCol) {
		var Z = this;
		var otd = document.createElement('td');
		otd.noWrap = true;
		otd.jsletColCfg = colCfg;
		jQuery(otd).addClass('jl-tbl-cell');
		otd.innerHTML = '<div class="jl-tbl-cell-div ' + (colCfg.widthCssName || '') + '"></div>';
		var ochild = otd.firstChild;
		var cellRender = colCfg.cellRender || Z._defaultCellRender;
		if (cellRender && cellRender.createCell) {
			cellRender.createCell.call(Z, ochild, colCfg);
		} else if (!Z._isCellEditable(colCfg)) {
				jslet.ui.DBTable.defaultCellRender.createCell.call(Z, ochild, colCfg);
				colCfg.editable = false;
		} else {
			jslet.ui.DBTable.defaultCellRender.createCell.call(Z, ochild, colCfg);
			colCfg.editable = true;
		}
		otr.appendChild(otd);
	},

	_renderRow: function (sectionNum, onlyRefreshContent) {
		var Z = this;
		var rowCnt = 0, leftBody = null, rightBody,
			hasLeft = Z._fixedCols > 0 || Z._sysColumns.length > 0;
		switch (sectionNum) {
			case 1:
				{//fixed data
					rowCnt = Z._fixedRows;
					if (hasLeft) {
						leftBody = Z.leftFixedTbl.tBodies[0];
					}
					rightBody = Z.rightFixedTbl.tBodies[0];
					break;
				}
			case 2:
				{//data content
					rowCnt = Z.listvm.getVisibleCount();
					if (hasLeft) {
						leftBody = Z.leftContentTbl.tBodies[0];
					}
					rightBody = Z.rightContentTbl.tBodies[0];
					break;
				}
		}
		var otr, oth, colCfg, isfirstCol, 
			startRow = 0, j,
			fldCnt = Z.innerColumns.length;
		if (onlyRefreshContent){
			startRow = rightBody.rows.length;
		}
		var rh = Z.rowHeight();
		// create date content table row
		for (var i = startRow; i < rowCnt; i++) {
			if (hasLeft) {
				otr = leftBody.insertRow(-1);
				otr.style.height = rh + 'px';

				otr.ondblclick = Z._doRowDblClick;
				otr.onclick = Z._doRowClick;
				var sysColLen = Z._sysColumns.length;
				for(j = 0; j < sysColLen; j++){
					colCfg = Z._sysColumns[j];
					Z._renderCell(otr, colCfg, j === 0);
				}
				
				isfirstCol = sysColLen === 0;
				for(j = 0; j < Z._fixedCols; j++) {
					colCfg = Z.innerColumns[j];
					Z._renderCell(otr, colCfg, isfirstCol && j === 0);
				}
			}
			isfirstCol = !hasLeft;
			otr = rightBody.insertRow(-1);
			otr.style.height = rh + 'px';
			otr.ondblclick = Z._doRowDblClick;
			otr.onclick = Z._doRowClick;
			for (j = Z._fixedCols; j < fldCnt; j++) {
				colCfg = Z.innerColumns[j];
				Z._renderCell(otr, colCfg, j == Z._fixedCols);
			}
		}
	},

	_renderBody: function (onlyRefreshContent) {
		var Z = this;
		if (onlyRefreshContent){
			Z._renderRow(2, true);
		} else {
			Z._renderRow(1);
			Z._renderRow(2);
			Z._renderTotalSection();
		}
	}, // end _renderBody

	_renderTotalSection: function() {
		var Z = this;
		if (!Z.footSectionHt) {
			return;
		}
		var hasLeft = Z._fixedCols > 0 || Z._sysColumns.length > 0,
			leftBody,
			rightBody,
			otr, colCfg, j, len;
		if (hasLeft) {
			leftBody = Z.leftFootTbl.tBodies[0];
		}
		rightBody = Z.rightFootTbl.tBodies[0];
		
		function createCell(colCfg) {
			var otd = document.createElement('td');
			otd.noWrap = true;
			otd.innerHTML = '<div class="jl-tbl-footer-div ' + (colCfg.widthCssName || '') + '"></div>';
			otd.jsletColCfg = colCfg;
			return otd;
		}
		
		if (hasLeft) {
			otr = leftBody.insertRow(-1);
			otr.style.height = Z.rowHeight() + 'px';

			for(j = 0, len = Z._sysColumns.length; j < len; j++) {
				colCfg = Z._sysColumns[j];
				otr.appendChild(createCell(colCfg));
			}
			
			for(j = 0; j < Z._fixedCols; j++) {
				colCfg = Z.innerColumns[j];
				otr.appendChild(createCell(colCfg));
			}
		}
		otr = rightBody.insertRow(-1);
		otr.style.height = Z.rowHeight() + 'px';
		for (j = Z._fixedCols, len = Z.innerColumns.length; j < len; j++) {
			colCfg = Z.innerColumns[j];
			otr.appendChild(createCell(colCfg));
		}
		
	},
	
	_fillTotalSection: function () {
		var Z = this,
			aggradeValues = Z._dataset.aggradedValues();
		if (!Z.footSectionHt || !aggradeValues) {
			return;
		}
		var sysColCnt = Z._sysColumns.length,
			hasLeft = Z._fixedCols > 0 || sysColCnt > 0,
			otrLeft, otrRight;
		if (hasLeft) {
			otrLeft = Z.leftFootTbl.tBodies[0].rows[0];
		}
		otrRight = Z.rightFootTbl.tBodies[0].rows[0];

		var otd, k = 0, fldObj, cobj, fldName, totalValue;
		var aggradeValueObj,
			labelDisplayed = false,
			canShowLabel = true;
		if(sysColCnt > 0) {
			otd = otrLeft.cells[sysColCnt - 1];
			otd.innerHTML = jslet.locale.DBTable.totalLabel;
			canShowLabel = false;
		}
		var colNum;
		for (var i = 0, len = Z.innerColumns.length; i < len; i++) {
			cobj = Z.innerColumns[i];
			colNum = cobj.colNum;
			if (colNum < Z._fixedCols) {
				otd = otrLeft.cells[colNum + sysColCnt];
			} else {
				otd = otrRight.cells[colNum - Z._fixedCols];
			}
			otd.style.textAlign = 'right';

			fldName = cobj.field;
			aggradeValueObj = aggradeValues[fldName];
			if (!aggradeValueObj) {
				if(canShowLabel) {
					var content;
					if(labelDisplayed) {
						content = '&nbsp;';
					} else {
						content = jslet.locale.DBTable.totalLabel;
						labelDisplayed = true;
					}
					otd.firstChild.innerHTML = content;
				}
				continue;
			}
			canShowLabel = false;
			fldObj = Z._dataset.getField(fldName);
			if(fldObj.getType() === jslet.data.DataType.NUMBER) {
				totalValue = aggradeValueObj.sum;
			} else {
				totalValue = aggradeValueObj.count;
			}
			var dispFmt = fldObj.displayFormat();
			var displayValue = totalValue;
			if(dispFmt && fldObj.getType() === jslet.data.DataType.NUMBER) {
				displayValue = totalValue? jslet.formatNumber(totalValue, dispFmt) : '';
			}
			otd.firstChild.innerHTML = displayValue;
			otd.firstChild.title = displayValue;
		}
	},
	
	_fillData: function () {
		var Z = this;
		var preRecno = Z._dataset.recno(),
			allCnt = Z.listvm.getNeedShowRowCount(),
			h = allCnt * Z.rowHeight() + Z.footSectionHt;
		Z._setScrollBarMaxValue(h);
		var noRecord = Z.dataset().recordCount() === 0;
		Z.noRecordDiv.style.display = (noRecord ?'block':'none');
		var oldRecno = Z._dataset.recnoSilence();
		try {
			Z._fillRow(true);
			Z._fillRow(false);
			if (Z.footSectionHt) {
				Z._fillTotalSection();
			}
		} finally {
			Z._dataset.recnoSilence(oldRecno);
		}
		Z._refreshSeqColWidth();
		if(Z._cellEditor && noRecord) {
			Z._cellEditor.hideEditor();
		}
	},

	_fillRow: function (isFixed) {
		var Z = this,
			rowCnt = 0, start = 0, leftBody = null, rightBody,
			hasLeft = Z._fixedCols > 0 || Z._sysColumns.length > 0;
			
		if (isFixed) {
			rowCnt = Z._fixedRows;
			start = -1 * Z._fixedRows;
			if (rowCnt === 0) {
				return;
			}
			if (hasLeft) {
				leftBody = Z.leftFixedTbl.tBodies[0];
			}
			rightBody = Z.rightFixedTbl.tBodies[0];
		} else {
			rowCnt = Z.listvm.getVisibleCount();
			start = Z.listvm.getVisibleStartRow();
			if (hasLeft) {
				leftBody = Z.leftContentTbl.tBodies[0];
			}
			rightBody = Z.rightContentTbl.tBodies[0];
		}
		
		var otr, colCfg, isfirstCol, recNo = -1, cells, clen, otd, j, 
			fldCnt = Z.innerColumns.length,
			allCnt = Z.listvm.getNeedShowRowCount() - Z.listvm.getVisibleStartRow(),
			fixedRows = hasLeft ? leftBody.rows : null,
			contentRows = rightBody.rows,
			sameValueNodes = {},
			isFirst = true,
			actualCnt = Math.min(contentRows.length, rowCnt);

		for (var i = 0; i < actualCnt ; i++) {
			if (i + (isFixed? start: 0) >= allCnt) {
				if (hasLeft) {
					otr = fixedRows[i];
					otr.style.display = 'none';
				}
				otr = contentRows[i];
				otr.style.display = 'none';
				continue;
			}

			Z.listvm.setCurrentRowno(i + start, true);
			recNo = Z.listvm.getCurrentRecno();
			Z._dataset.recnoSilence(recNo);
			if (hasLeft) {
				otr = fixedRows[i];
				otr.jsletrecno = recNo;
				otr.style.display = '';
				if (Z._onFillRow) {
					Z._onFillRow.call(Z, otr, Z._dataset);
				}
				cells = otr.childNodes;
				clen = cells.length;
				for (j = 0; j < clen; j++) {
					otd = cells[j];
					Z._fillCell(recNo, otd, sameValueNodes, isFirst);
				}
			}

			otr = contentRows[i];
			otr.jsletrecno = recNo;
			otr.style.display = '';
			if (Z._onFillRow) {
				Z._onFillRow.call(Z, otr, Z._dataset);
			}
			// fill content table
			otr = contentRows[i];
			cells = otr.childNodes;
			clen = cells.length;
			for (j = 0; j < clen; j++) {
				otd = cells[j];
				Z._fillCell(recNo, otd, sameValueNodes, isFirst);
			} //end for data content field
			isFirst = 0;
		} //end for records
	},

	_fillCell: function (recNo, otd, sameValueNodes, isFirst) {
		var Z = this,
		colCfg = otd.jsletColCfg;
		if (!colCfg)
			return;
		var fldName = colCfg.field,
			cellPanel = otd.firstChild;
		
		if (Z._onFillCell) {
			Z._onFillCell.call(Z, cellPanel, Z._dataset, fldName);
		}
		if (fldName && colCfg.mergeSame && sameValueNodes) {
			if (isFirst || !Z._dataset.isSameAsPrevious(fldName)) {
				sameValueNodes[fldName] = { cell: otd, count: 1 };
				jQuery(otd).attr('rowspan', 1);
				otd.style.display = '';
			}
			else {
				var sameNode = sameValueNodes[fldName];
				sameNode.count++;
				otd.style.display = 'none';
				jQuery(sameNode.cell).attr('rowspan', sameNode.count);
			}
		}
		var cellRender = colCfg.cellRender || Z._defaultCellRender;
		if (cellRender && cellRender.refreshCell) {
			cellRender.refreshCell.call(Z, cellPanel, colCfg, recNo);
		} else {
			jslet.ui.DBTable.defaultCellRender.refreshCell.call(Z, cellPanel, colCfg, recNo);
		}
		if(fldName) {
			var errObj = Z._dataset.getFieldErrorByRecno(recNo, fldName);
			var jqTd = jQuery(otd);
			var title = cellPanel.title;
			if(errObj && errObj.message) {
				if(!jqTd.hasClass('has-error')) {
					jqTd.addClass('has-error');
				}
				cellPanel.title = errObj.message;
			} else {
				if(jqTd.hasClass('has-error')) {
					jqTd.removeClass('has-error');
				}
			}
		}
	},

	refreshCurrentRow: function () {
		var Z = this,
			hasLeft = Z._fixedCols > 0 || Z._hasSeqCol || Z._hasSelectCol,
			fixedBody = null, contentBody, idx,
			recno = Z._dataset.recno();

		if (recno < Z._fixedRows) {
			if (hasLeft) {
				fixedBody = Z.leftFixedTbl.tBodies[0];
			}
			contentBody = Z.rightFixedTbl.tBodies[0];
			idx = recno;
		}
		else {
			if (hasLeft) {
				fixedBody = Z.leftContentTbl.tBodies[0];
			}
			contentBody = Z.rightContentTbl.tBodies[0];
			idx = Z.listvm.recnoToRowno(Z._dataset.recno()) - Z.listvm.getVisibleStartRow();
		}

		var otr, cells, otd, recNo, colCfg, j, clen;

		if (hasLeft) {
			otr = fixedBody.rows[idx];
			if (!otr) {
				return;
			}
			cells = otr.childNodes;
			recNo = otr.jsletrecno;
			if (Z._onFillRow) {
				Z._onFillRow.call(Z, otr, Z._dataset);
			}
			var ocheck;
			for (j = 0, clen = cells.length; j < clen; j++) {
				otd = cells[j];
				colCfg = otd.jsletColCfg;
				if (colCfg && colCfg.isSeqCol) {
					colCfg.cellRender.refreshCell.call(Z, otd.firstChild, colCfg);
					continue;
				}
				if (colCfg && colCfg.isSelectCol) {
					ocheck = otd.firstChild;
					ocheck.checked = Z._dataset.selected();
					continue;
				}
				Z._fillCell(recNo, otd);
			}
		}

		otr = contentBody.rows[idx];
		if (!otr) {
			return;
		}
		recNo = otr.jsletrecno;
		if (Z._onFillRow) {
			Z._onFillRow.call(Z, otr, Z._dataset);
		}
		// fill content table
		cells = otr.childNodes;
		for (j = 0, clen = cells.length; j < clen; j++) {
			otd = cells[j];
			Z._fillCell(recNo, otd);
		}
	},

	_getLeftRowByRecno: function (recno) {
		var Z = this;
		if (recno < Z._fixedRows) {
			return Z.leftFixedTbl.tBodies[0].rows[recno];
		}
		var rows = Z.leftContentTbl.tBodies[0].rows, row;
		for (var i = 0, cnt = rows.length; i < cnt; i++) {
			row = rows[i];
			if (row.jsletrecno == recno) {
				return row;
			}
		}
		return null;
	}, // end _getLeftRowByRecno

	_showCurrentRow: function (checkVisible) {//Check if current row is in visible area
		var Z = this,
			rowno = Z.listvm.recnoToRowno(Z._dataset.recno());
		Z.listvm.setCurrentRowno(rowno, false, checkVisible);
		Z._showCurrentCell();
	},

	_getTrByRowno: function (rowno) {
		var Z = this, 
			hasLeft = Z._fixedCols > 0 || Z._sysColumns.length > 0,
			idx, otr, k, rows, row, fixedRow;

		if (rowno < 0) {//fixed rows
			rows = Z.rightFixedTbl.tBodies[0].rows;
			k = Z._fixedRows + rowno;
			row = rows[k];
			fixedRow = (hasLeft ? Z.leftFixedTbl.tBodies[0].rows[k] : null);
			return { fixed: fixedRow, content: row };
		}
		//data content
		rows = Z.rightContentTbl.tBodies[0].rows;
		k = rowno - Z.listvm.getVisibleStartRow();
		if (k >= 0) {
			row = rows[k];
			if (!row) {
				return null;
			}
			fixedRow = hasLeft ? Z.leftContentTbl.tBodies[0].rows[k] : null;
			return { fixed: fixedRow, content: row };
		}
		return null;
	},

	_getCurrCellEl: function() {
		var Z = this;
		if(!Z._currRow) {
			return null;
		}
		var contentRow = Z._currRow.content,
			cells = contentRow.cells, 
			cellEl, colCfg;
		for(var i = 0, len = cells.length; i < len; i++) {
			cellEl = cells[i];
			colCfg = cellEl.jsletColCfg;
			if(colCfg && colCfg.colNum === Z._currColNum) {
				return cellEl;
			}
		}
		return null;
	},
	
	_adjustCurrentCellPos: function(isLeft) {
		var Z = this;
		if(!Z._currRow) {
			return;
		}
		var jqEl = jQuery(Z.el),
			jqContentPanel = jqEl.find('.jl-tbl-contentcol'),
			contentPanel = jqContentPanel[0],
			oldScrLeft = contentPanel.scrollLeft;
		if(Z._currColNum < Z._fixedCols) { //If current cell is in fixed content area
			return;
		}
		var currTd = Z._getCurrCellEl(),
			currTdLeft = currTd.offsetLeft,
			currTdWidth = currTd.offsetWidth,
			containerWidth = contentPanel.clientWidth,
			containerLeft = contentPanel.scrollLeft;
		if(currTdLeft < containerLeft) {
			contentPanel.scrollLeft = currTdLeft;
			return;
		}
		if(currTdLeft + currTdWidth > containerLeft + containerWidth) {
			contentPanel.scrollLeft = currTdLeft + currTdWidth - containerWidth;
		}
	},

	_isCurrCellInView: function() {
		var Z = this,
			jqEl = jQuery(Z.el),
			jqContentPanel = jqEl.find('.jl-tbl-contentcol'),
			contentPanel = jqContentPanel[0],
			borderW = (Z._noborder ? 0: 2),
			oldScrLeft = contentPanel.scrollLeft,
			currColLeft = 0, i, len;
		if(Z._currColNum < Z._fixedCols) { //If current cell is in fixed content area
			return true;
		}
		for(i = Z._fixedCols, len = Z.innerColumns.length; i < Z._currColNum; i++) {
			currColLeft += (Z.innerColumns[i].width + borderW); //"2" is the cell border's width(left+right)
		}
		if(currColLeft < oldScrLeft) {
			return false; 
		}
		var containerWidth = jqContentPanel.innerWidth(),
			contentWidth = jqContentPanel.find('.jl-tbl-content-div').width(),
			scrWidth = 0;
		for(i = Z.innerColumns.length - 1; i > Z._currColNum; i--) {
			scrWidth += (Z.innerColumns[i].width + borderW); //"2" is the cell border's width(left+right)
		}
		currColLeft = contentWidth - scrWidth - containerWidth;
		currColLeft = (currColLeft >= 0? currColLeft: 0);
		if(currColLeft > oldScrLeft) {
			return false; 
		}
		
		return true;
	},
	
	_showCurrentCell: function() {
		var Z = this,
			rowObj = Z._currRow;
		if(!rowObj) {
			return;
		}
		var otr;
		if(Z._currColNum >= Z._fixedCols) {
			otr = rowObj.content;
		} else {
			otr = rowObj.fixed;
		}
		var recno = otr.jsletrecno;
    	var cellEditor = Z.cellEditor();
		if(recno !== Z._dataset.recno()) {
    		if(Z.prevCell) {
    			Z.prevCell.removeClass('jl-tbl-curr-cell');
    		}
        	if(cellEditor) {
       			cellEditor.hideEditor();
        	}
			return;
		}
		var ocells = otr.cells, otd, colCfg, found = false;
		for(var i = 0, len = ocells.length; i < len; i++) {
			otd = ocells[i];
        	colCfg = otd.jsletColCfg;
        	if(colCfg && colCfg.colNum == Z._currColNum) {
        		if(Z.prevCell) {
        			Z.prevCell.removeClass('jl-tbl-curr-cell');
        		}
        		var jqCell = jQuery(otd);
        		jqCell.addClass('jl-tbl-curr-cell');
        		Z.prevCell = jqCell;
        		found = true;
        		break;
        	}
		}
    	if(cellEditor && found) {
    		if(Z._isCurrCellInView()) {
    			cellEditor.showEditor(colCfg.field, otd);
    		} else {
    			cellEditor.hideEditor();
    		}
    	}
	},
	
	_showSelected: function(otd, fldName, recno) {
		var Z = this,
			jqCell = jQuery(otd);
		if(recno === undefined) {
			recno = Z._dataset.recno();
		}
		var isSelected = Z._dataset.selection.isSelected(recno, fldName);
		if(isSelected) {
			jqCell.addClass('jl-tbl-selected');
		} else {
			jqCell.removeClass('jl-tbl-selected');
		}
	},
	
	_refreshSelection: function() {
		var Z = this;
		jQuery(Z.el).find('td.jl-tbl-cell').each(function(k, otd){
        	var colCfg = otd.jsletColCfg;
        	var recno = parseInt(otd.parentNode.jsletrecno);
        	if((recno || recno === 0) && colCfg) {
        		var fldName = colCfg.field;
        		if(fldName) {
        			Z._showSelected(otd, fldName, recno);
        		}
        	}
		});
	},
	
	_syncScrollBar: function (rowno) {
		var Z = this;
		if (Z._keep_silence_) {
			return;
		}
		var	sw = rowno * Z.rowHeight();
		Z._keep_silence_ = true;
		try {
			var scrBar = Z.jqVScrollBar[0];
			window.setTimeout(function() {
				scrBar.scrollTop = sw;
			}, 10);
		} finally {
			Z._keep_silence_ = false;
		}
	},

	/**
	 * Toggle(expand/collapse) the current record expanded status, enabled for tree style table.
	 */
	toggle: function() {
		var Z = this;
		if(Z._dataset.recordCount() === 0) {
			return;
		}
		var expanded = Z._dataset.expandedByRecno(Z._dataset.recno());
		if (expanded) {
			Z.listvm.collapse(function(){
				Z._fillData();
			});
		} else {
			Z.listvm.expand(function(){
				Z._fillData();
			});
		}
	},
	
	/**
	 * Expand the current record, enabled for tree style table.
	 */
	expand: function() {
		var Z = this;
		if(Z._dataset.recordCount() === 0) {
			return;
		}
		var expanded = Z._dataset.expandedByRecno(Z._dataset.recno());
		if (!expanded) {
			Z.listvm.expand(function(){
				Z._fillData();
			});
		}
	},
	
	/**
	 * Collapse the current record, enabled for tree style table.
	 */
	collapse: function() {
		var Z = this;
		if(Z._dataset.recordCount() === 0) {
			return;
		}
		var expanded = Z._dataset.expandedByRecno(Z._dataset.recno());
		if (expanded) {
			Z.listvm.collapse(function(){
				Z._fillData();
			});
		}
	},
	
	/**
	 * Expand all records, enabled for tree style table.
	 */
	expandAll: function () {
		var Z = this;
		Z.listvm.expandAll(function () {
			Z._fillData(); 
		});
	},

	/**
	 * Collapse all records, enabled for tree style table.
	 */
	collapseAll: function () {
		var Z = this;
		Z.listvm.collapseAll(function () {
			Z._fillData(); 
		});
	},

	_doMetaChanged: function(metaName, fldName) {
		var Z = this;
		if(!fldName) {
			Z.renderAll();
			return;
		}
		if(metaName == 'label' && !Z._hideHead) {
			Z._refreshHeadCell(fldName);
			return;
		}
		
		if(metaName == 'required' && Z._editable && !Z._hideHead) {
			Z._refreshHeadCell(fldName);
			return;
		}

		if(metaName == 'visible') {
			
		}
		if(Z._editable && (metaName == 'readOnly' || metaName == 'disabled')) {
			var cellEditor = Z.cellEditor();
			if(cellEditor) {
				var currFld = cellEditor.currentField();
				if(currFld == fldName) {
					cellEditor.showEditor(fldName);
				}
			}
		}
	},
	
	refreshControl: function (evt) {
		var Z = this, i, cnt, otr, otd, checked, ocheckbox, col, recno,
			evtType = evt.eventType;
		if (evtType == jslet.data.RefreshEvent.CHANGEMETA) {
			Z._doMetaChanged(evt.metaName, evt.fieldName);
		} else if (evtType == jslet.data.RefreshEvent.AGGRADED) {
			Z._fillTotalSection();			
		} else if (evtType == jslet.data.RefreshEvent.BEFORESCROLL) {
			
		} else if (evtType == jslet.data.RefreshEvent.SCROLL) {
			if (Z._dataset.recordCount() === 0) {
				return;
			}
			Z._showCurrentRow(true);
		} else if (evtType == jslet.data.RefreshEvent.UPDATEALL) {
			if(!Z.listvm) {
				return;
			}
			Z.listvm.refreshModel();
			Z._updateSortFlag(true);
			if(Z._dataset.recordCount() === 0) {
				Z._currRow = null;
			}
			Z._fillData();
			Z._showCurrentRow(true);
			if(Z._filterPanel) {
				Z._filterPanel.checkFilterBtnStyle();
			}
			//Clear "Select all" checkbox
			if(Z._hasSelectCol) {
				jQuery(Z.el).find('.jl-tbl-select-all')[0].checked = false;
			}
		} else if (evtType == jslet.data.RefreshEvent.UPDATERECORD) {
			Z.refreshCurrentRow();
		} else if (evtType == jslet.data.RefreshEvent.UPDATECOLUMN || evtType == jslet.data.RefreshEvent.UPDATELOOKUP) {
			Z._fillData();
		} else if (evtType == jslet.data.RefreshEvent.INSERT) {
			Z.listvm.refreshModel();
			recno = Z._dataset.recno();
			var	preRecno = evt.preRecno;

			Z._fillData();
			Z._keep_silence_ = true;
			try {
				Z.refreshControl(jslet.data.RefreshEvent.scrollEvent(recno, preRecno));
			} finally {
				Z._keep_silence_ = false;
			}
		} else if (evtType == jslet.data.RefreshEvent.DELETE) {
			Z.listvm.refreshModel();
			Z._fillData();
			if(Z._dataset.recordCount() === 0) {
				Z._currRow = null;
			}
		} else if (evtType == jslet.data.RefreshEvent.SELECTRECORD) {
			if (!Z._hasSelectCol) {
				return;
			}
			col = 0;
			if (Z._hasSeqCol) {
				col++;
			}
			recno = evt.recno;
			for(i = 0, cnt = recno.length; i < cnt; i++){
				otr = Z._getLeftRowByRecno(recno[i]);
				if (!otr) {
					continue;
				}
				otd = otr.cells[col];
				checked = evt.selected ? true : false;
				ocheckbox = jQuery(otd).find('[type=checkbox]')[0];
				ocheckbox.checked = checked;
				ocheckbox.defaultChecked = checked;
			}
		} else if (evtType == jslet.data.RefreshEvent.SELECTALL) {
			if (!Z._hasSelectCol) {
				return;
			}
			col = 0;
			if (Z._hasSeqCol) {
				col++;
			}
			var leftFixedBody = Z.leftFixedTbl.tBodies[0],
				leftContentBody = Z.leftContentTbl.tBodies[0],
				rec,
				oldRecno = Z._dataset.recno();

			try {
				for (i = 0, cnt = leftFixedBody.rows.length; i < cnt; i++) {
					otr = leftFixedBody.rows[i];
					if (otr.style.display == 'none') {
						break;
					}
					Z._dataset.recnoSilence(otr.jsletrecno);
					checked = Z._dataset.selected() ? true : false;
					otd = otr.cells[col];
					ocheckbox = jQuery(otd).find('[type=checkbox]')[0];
					ocheckbox.checked = checked;
					ocheckbox.defaultChecked = checked;
				}

				for (i = 0, cnt = leftContentBody.rows.length; i < cnt; i++) {
					otr = leftContentBody.rows[i];
					if (otr.style.display == 'none') {
						break;
					}
					Z._dataset.recnoSilence(otr.jsletrecno);
					checked = Z._dataset.selected() ? true : false;
					otd = otr.cells[col];
					ocheckbox = jQuery(otd).find('[type=checkbox]')[0];
					ocheckbox.checked = checked;
					ocheckbox.defaultChecked = checked;
				}
			} finally {
				Z._dataset.recnoSilence(oldRecno);
			}
		} //end event selectall
	}, // refreshControl

	_isCellEditable: function(colCfg){
		var Z = this;
		if (!Z._editable) {
			return false;
		}
		var fldName = colCfg.field;
		if (!fldName) {
			return false;
		}
		var fldObj = Z._dataset.getField(fldName),
			isEditable = !fldObj.fieldDisabled() && !fldObj.fieldReadOnly() ? 1 : 0;
		return isEditable;
	},
	
	/**
	 * Run when container size changed, it's revoked by jslet.resizeeventbus.
	 * 
	 */
	checkSizeChanged: function(){
		var Z = this,
			jqEl = jQuery(Z.el),
			newHeight = jqEl.height();
		if (newHeight == Z._oldHeight) {
			return;
		}
		Z.height = newHeight;
		Z.renderAll();
	},
	
	_innerDestroy: function() {
		var Z = this, 
			jqEl = jQuery(Z.el);
		Z._currRow = null;
		Z.listvm.reset();
		Z.leftHeadTbl = null;
		Z.rightHeadTbl = null;
		jQuery(Z.rightHeadTbl).off();

		Z.leftFixedTbl = null;
		Z.rightFixedTbl = null;

		Z.leftContentTbl = null;
		Z.rightContentTbl = null;

		Z.leftFootTbl = null;
		Z.rightFootTbl = null;
		
		Z.noRecordDiv = null;
		if(Z.jqVScrollBar) {
			Z.jqVScrollBar.off();
		}
		Z.jqVScrollBar = null;
		
		var splitter = jqEl.find('.jl-tbl-splitter')[0];
		if(splitter) {
			splitter._doDragging = null;
			splitter._doDragEnd = null;
			splitter._doDragCancel = null;
		}
		Z.parsedHeads = null;
		Z.prevCell = null;
		jqEl.find('tr').each(function(){
			this.ondblclick = null;
			this.onclick = null;
		});
		
		jqEl.find('.jl-tbl-select-check').off();
		if(Z._filterPanel) {
			Z._filterPanel.destroy();
			Z._filterPanel = null;
		}
		
		if(Z._findDialog) {
			Z._findDialog.destroy();
			Z._findDialog = null;
		}
		
		if(Z._cellEditor) {
			Z._cellEditor.destroy();
			Z._cellEditor = null;
		}		
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this, 
			jqEl = jQuery(Z.el);
		jslet.resizeEventBus.unsubscribe(Z);
		jqEl.off();
		Z._innerDestroy();
		Z.listvm.destroy();
		Z.listvm = null;
		$super();
	} 
});

jslet.ui.DBTable = jslet.Class.create(jslet.ui.AbstractDBTable, {});


jslet.ui.register('DBTable', jslet.ui.DBTable);
jslet.ui.DBTable.htmlTemplate = '<div></div>';

jslet.ui.CellRender = jslet.Class.create({
	createHeader: function(cellPanel, colCfg) {
		
	},
	
	createCell: function (cellPanel, colCfg) {
	
	},
	
	refreshCell: function (cellPanel, colCfg, recNo) {
	
	}
});

jslet.ui.DefaultCellRender =  jslet.Class.create(jslet.ui.CellRender, {
	createCell: function (cellPanel, colCfg) {
		var Z = this,
			fldName = colCfg.field,
			fldObj = Z._dataset.getField(fldName);
		cellPanel.parentNode.style.textAlign = fldObj.alignment();
	},
								
	refreshCell: function (cellPanel, colCfg, recNo) {
		if (!colCfg || colCfg.noRefresh) {
			return;
		}
		var Z = this,
			fldName = colCfg.field;
		if (!fldName) {
			return;
		}
		
		var fldObj = Z._dataset.getField(fldName), text;
		try {
			text = Z._dataset.getFieldTextByRecno(recNo, fldName);
		} catch (e) {
			text = 'error: ' + e.message;
			console.error(e);
		}
		
		if (fldObj.urlExpr()) {
			var url = '<a href=' + fldObj.calcUrl(),
				target = fldObj.urlTarget();
			if (target) {
				url += ' target=' + target;
			}
			url += '>' + text + '</a>';
			text = url;
		}
		if(text === '' || text === null || text === undefined) {
			text = '&nbsp;';
		}
		var jqCellPanel = jQuery(cellPanel); 
		jqCellPanel.html(text);
		cellPanel.title = jqCellPanel.text();
		Z._showSelected(cellPanel.parentNode, fldName, recNo);
	} 
});

jslet.ui.SequenceCellRender = jslet.Class.create(jslet.ui.CellRender, {
	createHeader: function(cellPanel, colCfg) {
		cellPanel.innerHTML = this._seqColHeader || '&nbsp;';
	},
	
	createCell: function (cellPanel, colCfg) {
		jQuery(cellPanel.parentNode).addClass('jl-tbl-sequence');
	},
	
	refreshCell: function (cellPanel, colCfg) {
		if (!colCfg || colCfg.noRefresh) {
			return;
		}
		var jqDiv = jQuery(cellPanel), 
			text,
			recno = this.listvm.getCurrentRecno();
		if(this._reverseSeqCol) {
			text = this._dataset.recordCount() - recno;
		} else {
			text = recno + 1;
		}
		var title;
		if(this._dataset.existRecordError(recno)) {
			jqDiv.parent().addClass('has-error');
			title = this._dataset.getRecordErrorInfo(recno);
		} else {
			jqDiv.parent().removeClass('has-error');
			title = text;
		}
		
		cellPanel.title = title;
		jqDiv.html(text);
	}
});

jslet.ui.SelectCellRender = jslet.Class.create(jslet.ui.CellRender, {
	createHeader: function(cellPanel, colCfg) {
		cellPanel.style.textAlign = 'center';
		var ocheckbox = document.createElement('input');
		ocheckbox.type = 'checkbox';
		var Z = this;
		jQuery(ocheckbox).addClass('jl-tbl-select-check jl-tbl-select-all').on('click', function (event) {
			if(Z._beforeSelectAll) {
				Z._beforeSelectAll.call(Z);
			}
			Z._dataset.selectAll(this.checked ? 1 : 0, Z._onSelectAll);
			if(Z._afterSelectAll) {
				Z._afterSelectAll.call(Z);
			}
		});
		cellPanel.appendChild(ocheckbox);
	},
	
   createCell: function (cellPanel, colCfg) {
	    cellPanel.style.textAlign = 'center';
		var Z = this, 
		ocheck = document.createElement('input'),
		jqCheck = jQuery(ocheck);
		jqCheck.attr('type', 'checkbox').addClass('jl-tbl-select-check');
		jqCheck.click(Z._doSelectBoxClick);
		cellPanel.appendChild(ocheck);
	},

	refreshCell: function (cellPanel, colCfg, recNo) {
		if (!colCfg || colCfg.noRefresh) {
			return;
		}
		var Z = this,
			ocheck = cellPanel.firstChild;
		if(Z._dataset.checkSelectable(recNo)) {
			ocheck.checked = Z._dataset.selectedByRecno(recNo);
			ocheck.style.display = '';
		} else {
			ocheck.style.display = 'none';
		}
	}
});

jslet.ui.SubgroupCellRender = jslet.Class.create(jslet.ui.CellRender, {
	createCell: function(otd, colCfg){
		//TODO
	}
});

jslet.ui.BoolCellRender = jslet.Class.create(jslet.ui.DefaultCellRender, {
	refreshCell: function (cellPanel, colCfg, recNo) {
		if (!colCfg || colCfg.noRefresh) {
			return;
		}
		cellPanel.style.textAlign = 'center';
		var jqDiv = jQuery(cellPanel);
		jqDiv.html('&nbsp;');
		var Z = this,
			fldName = colCfg.field, 
			fldObj = Z._dataset.getField(fldName);
		if (Z._dataset.getFieldValueByRecno(recNo, fldName)) {
			jqDiv.addClass('jl-tbl-checked');
			jqDiv.removeClass('jl-tbl-unchecked');
		}
		else {
			jqDiv.removeClass('jl-tbl-checked');
			jqDiv.addClass('jl-tbl-unchecked');
		}
		Z._showSelected(cellPanel.parentNode, fldName, recNo);
	}
});
		
jslet.ui.TreeCellRender = jslet.Class.create(jslet.ui.CellRender, {
	initialize: function () {
	},
		
	createCell: function (cellPanel, colCfg, recNo) {
		var Z = this;

		var odiv = document.createElement('div'),
			jqDiv = jQuery(odiv);
		odiv.style.height = Z.rowHeight() - 2 + 'px';
		jqDiv.html('<span class="jl-tbltree-indent"></span><span class="jl-tbltree-node"></span><span class="jl-tbltree-icon"></span><span class="jl-tbltree-text"></span>');
		
		var obtn = odiv.childNodes[1];
		obtn.onclick = function (event) {
			var otr = jslet.ui.findFirstParent(this,
			function(node){
				return node.tagName && node.tagName.toLowerCase() == 'tr';
			});
			
			event.stopImmediatePropagation();
			event.preventDefault();
			Z._dataset.recno(otr.jsletrecno);
			if(Z._dataset.aborted()) {
				return false;
			}
			if (this.expanded) {
				Z.listvm.collapse(function(){
					Z._fillData();
				});
			} else {
				Z.listvm.expand(function(){
					Z._fillData();
				});
			}
			return false;
		};
		
		obtn.onmouseover = function (event) {
			var jqBtn = jQuery(this);
			if (jqBtn.hasClass('jl-tbltree-collapse')) {
				jqBtn.addClass('jl-tbltree-collapse-hover');
			} else {
				jqBtn.addClass('jl-tbltree-expand-hover');
			}
		};
		
		obtn.onmouseout = function (event) {
			var jqBtn = jQuery(this);
			jqBtn.removeClass('jl-tbltree-collapse-hover');
			jqBtn.removeClass('jl-tbltree-expand-hover');
		};
		
		cellPanel.appendChild(odiv);
	},
	
	refreshCell: function (cellPanel, colCfg, recNo) {
		if (!colCfg || colCfg.noRefresh) {
			return;
		}
		var odiv = cellPanel.firstChild,
			arrSpan = odiv.childNodes,
			Z = this,
			level = Z.listvm.getLevel(recNo);
		
		if (!jslet.ui.TreeCellRender.iconWidth) {
			jslet.ui.TreeCellRender.iconWidth = parseInt(jslet.ui.getCssValue('jl-tbltree-indent', 'width'));
		}
		var hasChildren = Z.listvm.hasChildren(recNo),
			indentWidth = (!hasChildren ? level + 1 : level) * jslet.ui.TreeCellRender.iconWidth,
			oindent = arrSpan[0];
		oindent.style.width = indentWidth + 'px';
		var expBtn = arrSpan[1]; //expand button
		expBtn.style.display = hasChildren ? 'inline-block' : 'none';
		if (hasChildren) {
			expBtn.expanded = Z._dataset.expandedByRecno(recNo);
			var jqExpBtn = jQuery(expBtn);
			jqExpBtn.removeClass('jl-tbltree-expand');
			jqExpBtn.removeClass('jl-tbltree-collapse');
			jqExpBtn.addClass((expBtn.expanded ? 'jl-tbltree-expand' : 'jl-tbltree-collapse'));
		}
		if (colCfg.getIconClass) {
			var iconCls = colCfg.getIconClass(level, hasChildren);
			if (iconCls) {
				var jqIcon = jQuery(arrSpan[2]);
				jqIcon.addClass('jl-tbltree-icon ' + iconCls);
			}
		}
		
		var otext = arrSpan[3];
		
		var fldName = colCfg.field, fldObj = Z._dataset.getField(fldName), text;
		try {
			text = Z._dataset.getFieldTextByRecno(recNo, fldName);
		} catch (e) {
			text = 'error: ' + e.message;
		}
		cellPanel.title = text;
		if (fldObj.urlExpr()) {
			var url = '<a href=' + fldObj.calcUrl();
			var target = fldObj.urlTarget();
			if (target) {
				url += ' target=' + target;
			}
			url += '>' + text + '</a>';
			text = url;
		}
		otext.innerHTML = text;
		Z._showSelected(cellPanel.parentNode, fldName, recNo);
	}
});

jslet.ui.DBTable.defaultCellRender = new jslet.ui.DefaultCellRender();

jslet.ui.DBTable.treeCellRender = new jslet.ui.TreeCellRender();
jslet.ui.DBTable.boolCellRender = new jslet.ui.BoolCellRender();
jslet.ui.DBTable.sequenceCellRender = new jslet.ui.SequenceCellRender();
jslet.ui.DBTable.selectCellRender = new jslet.ui.SelectCellRender();
jslet.ui.DBTable.subgroupCellRender = new jslet.ui.SubgroupCellRender();

/**
* Splitter: used in jslet.ui.DBTable
*/
jslet.ui.Splitter = function () {
	if (!jslet.ui._splitDiv) {
		var odiv = document.createElement('div');
		odiv.className = 'jl-split-column';
		odiv.style.display = 'none';
		jslet.ui._splitDiv = odiv;
		document.body.appendChild(odiv);
		odiv = null;
	}
	
	this.isDragging = false;
	
	this.attach = function (el, left, top, height) {
		if (!height) {
			height = jQuery(el).height();
		}
		var odiv = jslet.ui._splitDiv;
		odiv.style.height = height + 'px';
		odiv.style.left = left + 'px';
		odiv.style.top = top + 'px';
		odiv.style.display = 'block';
		jslet.ui.dnd.bindControl(this);
		this.isDragging = false;
	};
	
	this.unattach = function () {
		jslet.ui._splitDiv.style.display = 'none';
		this.onSplitEnd = null;
		this.onSplitCancel = null;
	};
	
	this.onSplitEnd = null;
	this.onSplitCancel = null;
	
	this._doDragEnd = function (oldX, oldY, x, y, deltaX, deltaY) {
		jslet.ui.dnd.unbindControl();
		if (this.onSplitEnd) {
			this.onSplitEnd(x - oldX);
		}
		this.unattach();
		this.isDragging = false;
	};
	
	this._doDragging = function (oldX, oldY, x, y, deltaX, deltaY) {
		this.isDragging = true;
		jslet.ui._splitDiv.style.left = x + 'px';
	};
	
	this._doDragCancel = function () {
		jslet.ui.dnd.unbindControl();
		if (this.onSplitCancel) {
			this.onSplitCancel();
		}
		this.unattach();
		this.isDragging = false;
	};
};


/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBTreeView. 
 * Functions:
 * 1. Perfect performance, you can load unlimited data;
 * 2. Checkbox on tree node;
 * 3. Relative check, when you check one tree node, its children and its parent will check too;
 * 4. Many events for you to customize tree control;
 * 5. Context menu supported and you can customize your context menu;
 * 6. Icon supported on each tree node.
 * 
 * Example:
 * <pre><code>
 *	var jsletParam = { type: "DBTreeView", 
 *	dataset: "dsAgency", 
 *	displayFields: "[code]+'-'+[name]",
 *  keyField: "id", 
 *	parentField: "parentid",
 *  hasCheckBox: true, 
 *	iconClassField: "iconcls", 
 *	onCreateContextMenu: doCreateContextMenu, 
 *	correlateCheck: true
 * };
 * //1. Declaring:
 *  &lt;div id="ctrlId" data-jslet="jsletParam">
 *  or
 *  &lt;div data-jslet='jsletParam' />
 *  
 *  //2. Binding
 *  &lt;div id="ctrlId"  />
 *  //Js snippet
 *	var el = document.getElementById('ctrlId');
 *  jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *  jslet.ui.createControl(jsletParam, document.body);
 *		
 * </code></pre>
 */
"use strict";
jslet.ui.DBTreeView = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,displayFields,hasCheckBox,correlateCheck,onlyCheckChildren,readOnly,expandLevel,codeField,codeFormat,onItemClick,onItemDblClick,beforeCheckBoxClick,afterCheckBoxClick,iconClassField,onGetIconClass,onRenderItem,onCreateContextMenu';
		Z.requiredProperties = 'displayFields';
		
		Z._displayFields = null;

		Z._hasCheckBox = false;

		Z._readOnly = false;
		
		Z._correlateCheck = false;
		
		Z._onlyCheckChildren = false;
		
		Z._iconClassField = null;
		
		Z._expandLevel = -1;
		
		Z._onItemClick = null;
		
		Z._onItemDblClick = null;

		Z._beforeCheckBoxClick = null;
		
		Z._afterCheckBoxClick = null;

		Z._onGetIconClass = null;
		
		Z._onRenderItem = null;
		
		Z._onCreateContextMenu = null;
		
		Z.iconWidth = null;
		
		$super(el, params);
	},
	
	/**
	 * Display fields to render tree node, it's a js expresssion, like: "[code]+'-'+[name]"
	 * 
	 * @param {String or undefined} displayFields - Display fields, it's a js expresssion, like: "[code]+'-'+[name]"
	 * @return {String or this}
	 */
	displayFields: function(displayFields) {
		if(displayFields === undefined) {
			var dispFields = this._displayFields;
			if(dispFields) {
				return dispFields;
			} else {
				var dataset = this._dataset;
				var dispField = dataset.nameField() || dataset.codeField() || dataset.keyField();
				if(dispField) {
					return '[' + dispField + ']';
				}
				jslet.Checker.test('DBTreeView.displayFields', dispField).required();
			}
		}
		displayFields = jQuery.trim(displayFields);
		jslet.Checker.test('DBTreeView.displayFields', displayFields).required().isString();
		this._displayFields = displayFields;
	},
	
	/**
	 * If icon class is stored one field, you can set this property to display different tree node icon.
	 * 
	 * @param {String or undefined} iconClassField - If icon class is stored one field, you can set this property to display different tree node icon.
	 * @return {String or this}
	 */
	iconClassField: function(iconClassField) {
		if(iconClassField === undefined) {
			return this._iconClassField;
		}
		iconClassField = jQuery.trim(iconClassField);
		jslet.Checker.test('DBTreeView.iconClassField', iconClassField).isString();
		this._iconClassField = iconClassField;
	},
	
	/**
	 * Identify if there is a check box on tree node
	 * 
	 * @param {Boolean or undefined} hasCheckBox - Identify if there is a check box on tree node.
	 * @return {Boolean or this}
	 */
	hasCheckBox: function(hasCheckBox) {
		if(hasCheckBox === undefined) {
			return this._hasCheckBox;
		}
		this._hasCheckBox = hasCheckBox ? true: false;
	},
	
	/**
	 * If true, when you check one tree node, its children and its parent will be checked too;
	 * 
	 * @param {Boolean or undefined} correlateCheck - If true, when you check one tree node, its children and its parent will be checked too.
	 * @return {Boolean or this}
	 */
	correlateCheck: function(correlateCheck) {
		if(correlateCheck === undefined) {
			return this._correlateCheck;
		}
		this._correlateCheck = correlateCheck ? true: false;
	},
	
	onlyCheckChildren: function(onlyCheckChildren) {
		if(onlyCheckChildren === undefined) {
			return this._onlyCheckChildren;
		}
		this._onlyCheckChildren = onlyCheckChildren ? true: false;
	},
	
	/**
	 * Identify if the checkbox is read only or not, ignored if "hasCheckBox" is false
	 * 
	 * @param {Boolean or undefined} readOnly - Checkbox is readonly or not, ignored if hasCheckBox = false.
	 * @return {Boolean or this}
	 */
	readOnly: function(readOnly) {
		if(readOnly === undefined) {
			return this._readOnly;
		}
		this._readOnly = readOnly ? true: false;
	},
	
	/**
	 * Identify the nodes which level is from 0 to "expandLevel" will be expanded when initialize tree.
	 * 
	 * @param {Integer or undefined} expandLevel - Identify the nodes which level is from 0 to "expandLevel" will be expanded when initialize tree.
	 * @return {Integer or this}
	 */
	expandLevel: function(expandLevel) {
		if(expandLevel === undefined) {
			return this._expandLevel;
		}
		jslet.Checker.test('DBTreeView.expandLevel', expandLevel).isGTEZero();
		this._expandLevel = parseInt(expandLevel);
	},
	
	onItemClick: function(onItemClick) {
		if(onItemClick === undefined) {
			return this._onItemClick;
		}
		jslet.Checker.test('DBTreeView.onItemClick', onItemClick).isFunction();
		this._onItemClick = onItemClick;
	},
	
	onItemDblClick: function(onItemDblClick) {
		if(onItemDblClick === undefined) {
			return this._onItemDblClick;
		}
		jslet.Checker.test('DBTreeView.onItemDblClick', onItemDblClick).isFunction();
		this._onItemDblClick = onItemDblClick;
	},
	
	beforeCheckBoxClick: function(beforeCheckBoxClick) {
		if(beforeCheckBoxClick === undefined) {
			return this._beforeCheckBoxClick;
		}
		jslet.Checker.test('DBTreeView.beforeCheckBoxClick', beforeCheckBoxClick).isFunction();
		this._beforeCheckBoxClick = beforeCheckBoxClick;
	},
	
	afterCheckBoxClick: function(afterCheckBoxClick) {
		if(afterCheckBoxClick === undefined) {
			return this._afterCheckBoxClick;
		}
		jslet.Checker.test('DBTreeView.afterCheckBoxClick', afterCheckBoxClick).isFunction();
		this._afterCheckBoxClick = afterCheckBoxClick;
	},
	
	/**
	 * {Event} You can use this event to customize your tree node icon flexibly.
	 * Pattern: 
	 *   function(keyValue, level, isLeaf){}
	 *   //keyValue: String, key value of tree node;
	 *   //level: Integer, tree node level;
	 *   //isLeaf: Boolean, Identify if the tree node is the leaf node.
	 */
	onGetIconClass: function(onGetIconClass) {
		if(onGetIconClass === undefined) {
			return this._onGetIconClass;
		}
		jslet.Checker.test('DBTreeView.onGetIconClass', onGetIconClass).isFunction();
		this._onGetIconClass = onGetIconClass;
	},
	
	onRenderItem: function(onRenderItem) {
		if(onRenderItem === undefined) {
			return this._onRenderItem;
		}
		jslet.Checker.test('DBTreeView.onRenderItem', onRenderItem).isFunction();
		this._onRenderItem = onRenderItem;
	},
	
	onCreateContextMenu: function(onCreateContextMenu) {
		if(onCreateContextMenu === undefined) {
			return this._onCreateContextMenu;
		}
		jslet.Checker.test('DBTreeView.onCreateContextMenu', onCreateContextMenu).isFunction();
		this._onCreateContextMenu = onCreateContextMenu;
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
	bind: function () {
		var Z = this,
			jqEl = jQuery(Z.el);
		Z.scrBarSize = jslet.scrollbarSize() + 1;
		
		if (Z._keyField === undefined) {
			Z._keyField = Z._dataset.keyField();
		}
		var ti = jqEl.attr('tabindex');
		if (!ti) {
			jqEl.attr('tabindex', -1);
		}
		jqEl.keydown(function(event){
			if (Z._doKeydown(event.which)) {
				event.preventDefault();
			}
		});
		jqEl.on('mouseenter', 'td.jl-tree-text', function(event){
			jQuery(this).addClass('jl-tree-nodes-hover');
		});
		jqEl.on('mouseleave', 'td.jl-tree-text', function(event){
			jQuery(this).removeClass('jl-tree-nodes-hover');
		});
		if (!jqEl.hasClass('jl-tree')) {
			jqEl.addClass('jl-tree');
		}
        var notFF = ((typeof Z.el.onmousewheel) == 'object'); //firefox or nonFirefox browser
        var wheelEvent = (notFF ? 'mousewheel' : 'DOMMouseScroll');
        jqEl.on(wheelEvent, function (event) {
            var originalEvent = event.originalEvent;
            var num = notFF ? originalEvent.wheelDelta / -120 : originalEvent.detail / 3;
            Z.listvm.setVisibleStartRow(Z.listvm.getVisibleStartRow() + num);
       		event.preventDefault();
        });
		
		Z.renderAll();
		Z.refreshControl(jslet.data.RefreshEvent.scrollEvent(this._dataset.recno()));
		Z._createContextMenu();		
		jslet.resizeEventBus.subscribe(Z);
	}, // end bind
	
	/**
	 * @override
	*/
	renderAll: function () {
		var Z = this,
			jqEl = jQuery(Z.el);
		Z.evaluator = new jslet.Expression(Z._dataset, Z.displayFields());
		
		jqEl.html('');
		Z.oldWidth = jqEl.width();
		Z.oldHeight = jqEl.height();
		Z.nodeHeight = Z.iconWidth =  parseInt(jslet.ui.getCssValue('jl-tree', 'line-height'));
		var strHeight = jqEl[0].style.height; 
		if(strHeight.indexOf('%') > 0) {
			Z.treePanelHeight = jqEl.parent().height() * parseFloat(strHeight) / 100;
		} else {
			Z.treePanelHeight = jqEl.height();
		}
		Z.treePanelWidth = jqEl.width();
		Z.nodeCount = Math.floor(Z.treePanelHeight / Z.nodeHeight);

		Z._initVm();
		Z._initFrame();
	}, // end renderAll
	
	_initFrame: function(){
		var Z = this,
			jqEl = jQuery(Z.el);
			
		jqEl.find('.jl-tree-container').off();
		jqEl.find('.jl-tree-scrollbar').off();
			
		var lines = [], i, cnt;
		for(i = 0; i < 5; i++){//Default cells for lines is 5
			lines.push('<td class="jl-tree-lines" ');
			lines.push(jslet.ui.DBTreeView.NODETYPE);
			lines.push('="0"></td>');
		}
		var s = lines.join(''),
			tmpl = ['<div class="jl-tree-container">'];
		for(i = 0, cnt = Z.nodeCount; i < cnt; i++){
			tmpl.push('<table class="jl-tree-nodes" cellpadding="0" cellspacing="0"><tr>');
			tmpl.push(s);
			tmpl.push('<td class="jl-tree-expander" ');
			tmpl.push(jslet.ui.DBTreeView.NODETYPE);//expander
			tmpl.push('="1"></td><td ');
			tmpl.push(jslet.ui.DBTreeView.NODETYPE);//checkbox
			tmpl.push('="2"></td><td ');
			tmpl.push(jslet.ui.DBTreeView.NODETYPE);//icon
			tmpl.push('="3"></td><td class="jl-tree-text" ');
			tmpl.push(jslet.ui.DBTreeView.NODETYPE);//text
			tmpl.push('="9" nowrap="nowrap"></td></tr></table>');
		}
		tmpl.push('</div><div class="jl-tree-scrollbar"><div class="jl-tree-tracker"></div></div>');
		jqEl.html(tmpl.join(''));
		
		var treePnl = jqEl.find('.jl-tree-container');
		treePnl.on('click', function(event){
			Z._doRowClick(event.target);
		});
		treePnl.on('dblclick', function(event){
			Z._doRowDblClick(event.target);
		});
		Z.listvm.setVisibleCount(Z.nodeCount);
		var sb = jqEl.find('.jl-tree-scrollbar');
		
		sb.on('scroll',function(){
			var numb = Math.ceil(this.scrollTop/Z.nodeHeight);
			if (numb != Z.listvm.getVisibleStartRow()) {
				Z._skip_ = true;
				try {
					Z.listvm.setVisibleStartRow(numb);
				} finally {
					Z._skip_ = false;
				}
			}
		});	
	},
	
	resize: function(){
		var Z = this,
			jqEl = jQuery(Z.el),
			height = jqEl.height(),
			width = jqEl.width();
		if (width != Z.oldWidth){
			Z.oldWidth = width;
			Z.treePanelWidth = jqEl.innerWidth();
			Z._fillData();
		}
		if (height != Z.oldHeight){
			Z.oldHeight = height;
			Z.treePanelHeight = jqEl.innerHeight();
			Z.nodeCount = Math.floor(height / Z.nodeHeight) - 1;
			Z._initFrame();
		}
	},
	
	hasChildren: function() {
		return this.listvm.hasChildren();
	},
	
	_initVm:function(){
		var Z=this;
		Z.listvm = new jslet.ui.ListViewModel(Z._dataset, true);
		Z.listvm.refreshModel(Z._expandLevel);
		Z.listvm.fixedRows=0;
		
		Z.listvm.onTopRownoChanged=function(rowno){
			rowno = Z.listvm.getCurrentRowno();
			Z._fillData();
			Z._doCurrentRowChanged(rowno);
			Z._syncScrollBar(rowno);
		};
		
		Z.listvm.onVisibleCountChanged=function(){
			Z._fillData();
			var allCount = Z.listvm.getNeedShowRowCount();
			jQuery(Z.el).find('.jl-tree-tracker').height(Z.nodeHeight * allCount);
		};
		
		Z.listvm.onCurrentRownoChanged=function(prevRowno, rowno){
			Z._doCurrentRowChanged(rowno);
		};
		
		Z.listvm.onNeedShowRowsCountChanged = function(allCount){
			Z._fillData();
			jQuery(Z.el).find('.jl-tree-tracker').height(Z.nodeHeight * (allCount + 2));
		};
		
		Z.listvm.onCheckStateChanged = function(){
			Z._fillData();
		};
	},
	
	_doKeydown: function(keyCode){
		var Z = this, result = false;
		if (keyCode === jslet.ui.KeyCode.SPACE){//space
			Z._doCheckBoxClick();
			result = true;
		} else if (keyCode === jslet.ui.KeyCode.UP) {//KEY_UP
			Z.listvm.priorRow();
			result = true;
		} else if (keyCode === jslet.ui.KeyCode.DOWN) {//KEY_DOWN
			Z.listvm.nextRow();
			result = true;
		} else if (keyCode === jslet.ui.KeyCode.LEFT) {//KEY_LEFT
			if (jslet.locale.isRtl) {
				Z.listvm.expand();
			} else {
				Z.listvm.collapse();
			}
			result = true;
		} else if (keyCode === jslet.ui.KeyCode.RIGHT) {//KEY_RIGHT
			if (jslet.locale.isRtl) {
				Z.listvm.collapse();
			} else {
				Z.listvm.expand();
			}
			result = true;
		} else if (keyCode === jslet.ui.KeyCode.PAGEUP) {//KEY_PAGEUP
			Z.listvm.priorPage();
			result = true;
		} else if (keyCode === jslet.ui.KeyCode.PAGEDOWN) {//KEY_PAGEDOWN
			Z.listvm.nextPage();
			result = true;
		}
		return result;
	},
	
	_getTrByRowno: function(rowno){
		var nodes = jQuery(this.el).find('.jl-tree-nodes'), row;
		for(var i = 0, cnt = nodes.length; i < cnt; i++){
			row = nodes[i].rows[0];
			if (row.jsletrowno == rowno) {
				return row;
			}
		}
		return null;
	},
	
	_doCurrentRowChanged: function(rowno){
		var Z = this;
		if (Z.prevRow){
			jQuery(Z._getTextTd(Z.prevRow)).removeClass(jslet.ui.htmlclass.TREENODECLASS.selected);
		}
		var otr = Z._getTrByRowno(rowno);
		if (otr) {
			jQuery(Z._getTextTd(otr)).addClass(jslet.ui.htmlclass.TREENODECLASS.selected);
		}
		Z.prevRow = otr;
	},
	
	_getTextTd: function(otr){
		return otr.cells[otr.cells.length - 1];
	},
	
	_doExpand: function(){
		this.expand();
	},
	
	_doRowClick: function(treeNode){
		var Z = this,
			nodeType = treeNode.getAttribute(jslet.ui.DBTreeView.NODETYPE);
		if(!nodeType) {
			return;
		}
		if (nodeType != '0') {
			Z._syncToDs(treeNode);
		}
		if (nodeType == '1' || nodeType == '2'){ //expander
			var item = Z.listvm.getCurrentRow();
			if (nodeType == '1' && item.children && item.children.length > 0){
				if (item.expanded) {
					Z.collapse();
				} else {
					Z.expand();
				}
			}
			if (nodeType == '2'){//checkbox
				Z._doCheckBoxClick();
			}
		}
		if(nodeType == '9') {
			Z._doCheckBoxClick();
			if(Z._onItemClick) {
				Z._onItemClick.call(Z);
			}
		}
	},
	
	_doRowDblClick: function(treeNode){
		this._syncToDs(treeNode);
		var nodeType = treeNode.getAttribute(jslet.ui.DBTreeView.NODETYPE);
		if (this._onItemDblClick && nodeType == '9') {
			this._onItemDblClick.call(this);
		}
	},
	
	_doCheckBoxClick: function(){
		var Z = this;
		if (Z._readOnly) {
			return;
		}
		var node = Z.listvm.getCurrentRow();
		if(!node.hasCheckbox) {
			return;
		}
		if (Z._beforeCheckBoxClick && !Z._beforeCheckBoxClick.call(Z)) {
			return;
		}
		Z.listvm.checkNode(!Z._dataset.selected()? 1:0, Z._correlateCheck, Z._onlyCheckChildren);
		if (Z._afterCheckBoxClick) {
			Z._afterCheckBoxClick.call(Z);
		}
	},
	
	_syncToDs: function(otr){
		var rowno = -1, k;
		while(true){
			k = otr.jsletrowno;
			if (k === 0 || k){
				rowno = k;
				break;
			}
			otr = otr.parentNode;
			if (!otr) {
				break;
			}
		}
		if (rowno < 0) {
			return;
		}
		this.listvm.setCurrentRowno(rowno);
		this._dataset.recno(this.listvm.getCurrentRecno());
	},
	
	_fillData: function(){
		var Z = this,
			vCnt = Z.listvm.getVisibleCount(), 
			topRowno = Z.listvm.getVisibleStartRow(),
			allCnt = Z.listvm.getNeedShowRowCount(),
			availbleCnt = vCnt + topRowno,
			index = 0,
			jqEl = jQuery(Z.el),
			nodes = jqEl.find('.jl-tree-nodes'), node;
		if (Z._isRendering) {
			return;
		}

		Z._isRendering = true;
		Z._skip_ = true;
		var oldRecno = Z._dataset.recnoSilence(),
			preRowNo = Z.listvm.getCurrentRowno(),
			ajustScrBar = true, maxNodeWidth = 0, nodeWidth;
		try{
			if (allCnt < availbleCnt){
				for(var i = availbleCnt - allCnt; i > 0; i--){
					node = nodes[vCnt - i];
					node.style.display = 'none';
				}
				ajustScrBar = false; 
			} else {
				allCnt = availbleCnt;
			}
			var endRow = allCnt - 1;
			
			for(var k = topRowno; k <= endRow; k++){
				node = nodes[index++];
				nodeWidth = Z._fillNode(node, k);
				if (ajustScrBar && maxNodeWidth < Z.treePanelWidth){
					if (k == endRow && nodeWidth < Z.treePanelWidth) {
						ajustScrBar = false;
					} else {
						maxNodeWidth = Math.max(maxNodeWidth, nodeWidth);
					}
				}
				if (k == endRow && ajustScrBar){
					node.style.display = 'none';
				} else {
					node.style.display = '';
					node.jsletrowno = k;
				}
			}
		} finally {
			Z.listvm.setCurrentRowno(preRowNo, false);
			Z._dataset.recnoSilence(oldRecno);
			Z._isRendering = false;
			Z._skip_ = false;
		}
	},

	_getCheckClassName: function(expanded){
		if (!expanded) {
			return jslet.ui.htmlclass.TREECHECKBOXCLASS.unChecked;
		}
		if (expanded == 2) { //mixed checked
			return jslet.ui.htmlclass.TREECHECKBOXCLASS.mixedChecked;
		}
		return jslet.ui.htmlclass.TREECHECKBOXCLASS.checked;
	},
	
	_fillNode: function(nodeTbl, rowNo){
		var row = nodeTbl.rows[0],
			Z = this,
			item = Z.listvm.setCurrentRowno(rowNo, true),
			cells = row.cells, 
			cellCnt = cells.length, 
			requiredCnt = item.level + 4,
			otd, i, cnt;
		Z._dataset.recnoSilence(Z.listvm.getCurrentRecno());
		row.jsletrowno = rowNo;
		if (cellCnt < requiredCnt){
			for(i = 1, cnt = requiredCnt - cellCnt; i <= cnt; i++){
				otd = row.insertCell(0);
				jQuery(otd).addClass('jl-tree-lines').attr('jsletline', 1);
			}
		}
		if (cellCnt >= requiredCnt){
			for(i = 0, cnt = cellCnt - requiredCnt; i < cnt; i++){
				cells[i].style.display = 'none';
			}
			for(i = cellCnt - requiredCnt; i < requiredCnt; i++){
				cells[i].style.display = '';
			}
		}
		cellCnt = cells.length;
		//Line
		var pitem = item, k = 1, totalWidth = Z.iconWidth * item.level;
		for(i = item.level; i > 0; i--){
			otd = row.cells[cellCnt- 4 - k++];
			pitem = pitem.parent;
			if (pitem.islast) {
				otd.className = jslet.ui.htmlclass.TREELINECLASS.empty;
			} else {
				otd.className = jslet.ui.htmlclass.TREELINECLASS.line;
			}
		}

		//expander
		var oexpander = row.cells[cellCnt- 4];
		oexpander.noWrap = true;
		oexpander.style.display = '';
		if (item.children && item.children.length > 0) {
			if (!item.islast) {
				oexpander.className = item.expanded ? jslet.ui.htmlclass.TREELINECLASS.minus : jslet.ui.htmlclass.TREELINECLASS.plus;
			} else {
				oexpander.className = item.expanded ? jslet.ui.htmlclass.TREELINECLASS.minusBottom : jslet.ui.htmlclass.TREELINECLASS.plusBottom;
			}
		} else {
			if (!item.islast) {
				oexpander.className = jslet.ui.htmlclass.TREELINECLASS.join;
			} else {
				oexpander.className = jslet.ui.htmlclass.TREELINECLASS.joinBottom;
			}
		}
		totalWidth += Z.iconWidth;
				
		// CheckBox
		var flag = Z._hasCheckBox && Z._dataset.checkSelectable();
		var node = Z.listvm.getCurrentRow();
		node.hasCheckbox = flag;
		var ocheckbox = row.cells[cellCnt- 3];
		if (flag) {
			ocheckbox.noWrap = true;
			ocheckbox.className = Z._getCheckClassName(Z._dataset.selected());
			ocheckbox.style.display = '';
			totalWidth += Z.iconWidth;
		} else {
			ocheckbox.style.display = 'none';
		}
		//Icon
		var oIcon = row.cells[cellCnt- 2],
			clsName = 'jl-tree-icon',
			iconClsId = null;

		var isLeaf = !(item.children && item.children.length > 0);
		if(Z._iconClassField || Z._onGetIconClass) {
			if(Z._iconClassField) {
				iconClsId = Z._dataset.getFieldValue(Z._iconClassField);
			} else if (Z._onGetIconClass) {
				iconClsId = Z._onGetIconClass.call(Z, Z._dataset.keyValue(), item.level, isLeaf); //keyValue, level, isLeaf
			}
			if (iconClsId) {
				clsName += ' '+ iconClsId;
			}
			if (oIcon.className != clsName) {
				oIcon.className = clsName;
			}
			oIcon.style.display = '';
			totalWidth += Z.iconWidth;
		} else {
			oIcon.style.display = 'none';
		}
		//Text
		var text = Z.evaluator.eval() || '      ';
		jslet.ui.textMeasurer.setElement(Z.el);
		var width = Math.round(jslet.ui.textMeasurer.getWidth(text)) + 10;
		totalWidth += width + 10;
		jslet.ui.textMeasurer.setElement();
		var oText = row.cells[cellCnt- 1];
		oText.style.width = width + 'px';
		var jqTd = jQuery(oText);
		jqTd.html(text);
		if (item.isbold) {
			jqTd.addClass('jl-tree-child-checked');
		} else {
			jqTd.removeClass('jl-tree-child-checked');
		}
		if(Z._onRenderItem) {
			Z._onRenderItem.call(Z, oIcon, oText, item.level, isLeaf); //keyValue, level, isLeaf
		}
		return totalWidth;
	},
		
	_updateCheckboxState: function(){
		var Z = this, 
			oldRecno = Z._dataset.recnoSilence(),
			jqEl = jQuery(Z.el),
			nodes = jqEl.find('.jl-tree-nodes'),
			rowNo, cellCnt, row;
		try{
			for(var i = 0, cnt = nodes.length; i < cnt; i++){
				row = nodes[i].rows[0];
				cellCnt = row.cells.length;
	
				rowNo = row.jsletrowno;
				if(rowNo) {
					Z.listvm.setCurrentRowno(rowNo, true);
					Z._dataset.recnoSilence(Z.listvm.getCurrentRecno());
					row.cells[cellCnt- 3].className = Z._getCheckClassName(Z._dataset.selected());
				}
			}
		} finally {
			Z._dataset.recnoSilence(oldRecno);
		}
	},
	
	_syncScrollBar: function(){
		var Z = this;
		if (Z._skip_) {
			return;
		}
		jQuery(Z.el).find('.jl-tree-scrollbar').scrollTop(Z.nodeHeight * Z.listvm.getVisibleStartRow());
	},
		
	expand: function () {
		this.listvm.expand();
	},
	
	collapse: function () {
		this.listvm.collapse();
	},
	
	expandAll: function () {
		this.listvm.expandAll();
	},
	
	collapseAll: function () {
		this.listvm.collapseAll();
	},
	
	_createContextMenu: function () {
		if (!jslet.ui.Menu) {
			return;
		}
		var Z = this;
		var menuCfg = { type: 'Menu', onItemClick: Z._menuItemClick, items: []};
		if (Z._hasCheckBox) {
			menuCfg.items.push({ id: 'checkAll', name: jslet.locale.DBTreeView.checkAll });
			menuCfg.items.push({ id: 'uncheckAll', name: jslet.locale.DBTreeView.uncheckAll });
			menuCfg.items.push({ name: '-' });
		}
		menuCfg.items.push({ id: 'expandAll', name: jslet.locale.DBTreeView.expandAll });
		menuCfg.items.push({ id: 'collapseAll', name: jslet.locale.DBTreeView.collapseAll});
		if (Z._onCreateContextMenu) {
			Z._onCreateContextMenu.call(Z, menuCfg.items);
		}
		if (menuCfg.items.length === 0) {
			return;
		}
		Z.contextMenu = jslet.ui.createControl(menuCfg);
		jQuery(Z.el).on('contextmenu', function (event) {
			var node = event.target,
				nodeType = node.getAttribute(jslet.ui.DBTreeView.NODETYPE);
			if(!nodeType || nodeType == '0') {
				return;
			}
			Z._syncToDs(node);
			Z.contextMenu.showContextMenu(event, Z);
		});
	},
	
	_menuItemClick: function (menuid, checked) {
		if (menuid == 'expandAll') {
			this.expandAll();
		} else if (menuid == 'collapseAll') {
			this.collapseAll();
		} else if (menuid == 'checkAll') {
			this.listvm.checkChildNodes(true, this._correlateCheck);
		} else if (menuid == 'uncheckAll') {
			this.listvm.checkChildNodes(false, this._correlateCheck);
		}
	},
	
	refreshControl: function (evt) {
		var Z = this,
			evtType = evt.eventType;
		if (evtType == jslet.data.RefreshEvent.CHANGEMETA) {
			//empty
		} else if (evtType == jslet.data.RefreshEvent.UPDATEALL) {
			Z.renderAll();
		} else if (evtType == jslet.data.RefreshEvent.INSERT ||
			evtType == jslet.data.RefreshEvent.DELETE){
			Z.listvm.refreshModel(Z._expandLevel);
			if(evtType == jslet.data.RefreshEvent.INSERT) {
				Z.listvm.syncDataset();
			}
		} else if (evtType == jslet.data.RefreshEvent.UPDATERECORD ||
			evtType == jslet.data.RefreshEvent.UPDATECOLUMN){
			Z._fillData();
		} else if (evtType == jslet.data.RefreshEvent.SELECTALL) {
			if (Z._hasCheckBox) {
				Z._fillData();
			}
		} else if (evtType == jslet.data.RefreshEvent.SELECTRECORD) {
			if (Z._hasCheckBox) {
				Z.listvm.checkNode(Z._dataset.selected(), Z._correlateCheck, Z._onlyCheckChildren);
			}
		} else if (evtType == jslet.data.RefreshEvent.SCROLL) {
			Z.listvm.syncDataset();
		}
	}, // end refreshControl
		
	/**
	 * Run when container size changed, it's revoked by jslet.resizeeventbus.
	 * 
	 */
	checkSizeChanged: function(){
		this.resize();
	},

	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this,
			jqEl = jQuery(Z.el);
		
		jslet.resizeEventBus.unsubscribe(Z);
		jqEl.find('.jl-tree-nodes').off();
		Z.listvm.destroy();
		Z.listvm = null;
		Z.prevRow = null;
		
		$super();
	}
});

jslet.ui.htmlclass.TREELINECLASS = {
		line : 'jl-tree-lines jl-tree-line',// '|'
		join : 'jl-tree-lines jl-tree-join',// |-
		joinBottom : 'jl-tree-lines jl-tree-join-bottom',// |_
		minus : 'jl-tree-lines jl-tree-minus',// O-
		minusBottom : 'jl-tree-lines jl-tree-minus-bottom',// o-_
		noLineMinus : 'jl-tree-lines jl-tree-noline-minus',// o-
		plus : 'jl-tree-lines jl-tree-plus',// o+
		plusBottom : 'jl-tree-lines jl-tree-plus-bottom',// o+_
		noLinePlus : 'jl-tree-lines jl-tree-noline-plus',// o+
		empty : 'jl-tree-empty'
};
jslet.ui.htmlclass.TREECHECKBOXCLASS = {
//		checkbox : 'jl-tree-checkbox',
	checked : 'jl-tree-checkbox jl-tree-checked',
	unChecked : 'jl-tree-checkbox jl-tree-unchecked',
	mixedChecked : 'jl-tree-checkbox jl-tree-mixedchecked'
};

jslet.ui.htmlclass.TREENODECLASS = {
	selected : 'jl-tree-selected',
	childChecked : 'jl-tree-child-checked',
	treeNodeLevel : 'jl-tree-child-level'
};

jslet.ui.DBTreeView.NODETYPE = 'data-nodetype';

jslet.ui.register('DBTreeView', jslet.ui.DBTreeView);
jslet.ui.DBTreeView.htmlTemplate = '<div></div>';



/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * Inner Class for DBTable and DBTreeView control
 */
"use strict";
jslet.ui.ListViewModel = function (dataset, isTree) {// boolean, identify if it's tree model
	var visibleCount = 0,
		visibleStartRow = 0,
		visibleEndRow = 0,
		needShowRows = null,//Array of all rows that need show, all of these rows's status will be 'expanded'
		allRows = null,//Array of all rows, include 'expanded' and 'collapsed' rows
		currentRowno = 0,
		currentRecno = 0;
	this.onTopRownoChanged = null; //Event handler: function(rowno){}
	this.onVisibleCountChanged = null; //Event handler: function(visibleRowCount){}
	this.onCurrentRownoChanged = null; //Event handler: function(rowno){}
	this.onNeedShowRowsCountChanged = null; //Event handler: function(needShowCount){}
	this.onCheckStateChanged = null;  //Event handler: function(){}
		
	this.fixedRows = 0;
	var initial = function () {
		if (!isTree) {
			return false;
		}
		var ds = dataset;
		if (!ds._parentField || !ds._keyField) {
			return false;
		}
		return true;
	};
	initial();
	
	this.refreshModel = function (expandLevel) {
		if (!isTree) {
			return;
		}
		if(expandLevel === undefined) {
			expandLevel = -1;
		}
		var dsObj = dataset, 
			hiddenCnt = 0, 
			recno, 
			allCnt = dsObj.recordCount(), 
			childCnt, 
			result = [], 
			pId,
			oldRecno = dsObj.recnoSilence();
		try {
			dsObj.recnoSilence(this.fixedRows);
			var level = 0, 
				pnodes = [], 
				node, pnode, 
				tmpNode, tmpKeyValue,
				currRec, keyValue, recCnt;
			for(recno = 0, recCnt = dsObj.recordCount(); recno < recCnt; recno++) {
				dsObj.recnoSilence(recno);
				keyValue = dsObj.keyValue();
				level = 0;
				pnode = null;
				pId = dsObj.parentValue();
				for(var m = pnodes.length - 1; m>=0; m--) {
					tmpNode = pnodes[m];
					tmpKeyValue = tmpNode.keyvalue; 
					if (tmpKeyValue !== null && 
						tmpKeyValue !== undefined && 
						tmpKeyValue !== '' && 
						tmpKeyValue == pId) {
						level = tmpNode.level + 1;
						pnode = tmpNode;
						break;
					}
				}
				if (pnode){
					for(var k = pnodes.length - 1; k > m; k--) {
						pnodes.pop();
					}
				}
				currRec = dsObj.getRecord();
				var expanded = true;
				if(expandLevel >= 0 && level <= expandLevel) {
					expanded = true;
				} else { 
					expanded = dsObj.expanded();
				}
				node = { parent: pnode, recno: recno, keyvalue: keyValue, expanded: expanded, isbold: 0, level: level };
				pnodes.push(node);
								
				if (pnode){
					if (!pnode.children) {
						pnode.children = [];
					}
					pnode.children.push(node);
					this._updateParentNodeBoldByChecked(node);
				} else {
					result.push(node);
				}
				
			} //end for recno
		} finally {
			dsObj.recnoSilence(oldRecno);
		}
		allRows = result;
		this._setLastFlag(result);
		this._refreshNeedShowRows();
	};
		
	this._updateParentNodeBoldByChecked = function(node){
		if (!dataset.selectedByRecno(node.recno) || !node.parent) {
			return;
		}
		var pnode = node.parent;
		while(true){
			if (pnode.isbold) {
				return;
			}
			pnode.isbold = 1;
			pnode = pnode.parent;
			if (!pnode) {
				return;
			}
		}
	};

	this._updateParentNodeBoldByNotChecked = function(node){
		if (dataset.selectedByRecno(node.recno) || !node.parent) {
			return;
		}
		var pnode = node.parent, cnode;
		while(true){
			if (pnode.children){
				for(var i = 0, cnt = pnode.children.length; i < cnt; i++){
					cnode = pnode.children[i];
					if (dataset.selectedByRecno(cnode.recno)) {
						return;
					}
				}
				pnode.isbold = 0;
			}
			pnode = pnode.parent;
			if (!pnode) {
				return;
			}
		}
	};
		
	this._setLastFlag = function (nodes) {
		if (!nodes || nodes.length === 0) {
			return;
		}
		var node;
		nodes[nodes.length - 1].islast = true;
		for (var i = 0, cnt = nodes.length; i < cnt; i++) {
			node = nodes[i];
			if (node.children && node.children.length > 0) {
				this._setLastFlag(node.children);
			}
		}
		return null;
	};
	
	this._refreshNeedShowRows = function (notFireChangedEvent) {
		if (!isTree) {
			return;
		}
		var result = [], node;
		if (!allRows) {
			this.refreshModel();
			return;
		}
		var preCnt = needShowRows ? needShowRows.length: 0;
		needShowRows = [];
		this._findVisibleNode(allRows);
		var currCnt = needShowRows.length;
		if (!notFireChangedEvent && this.onNeedShowRowsCountChanged){
			this.onNeedShowRowsCountChanged(currCnt);
		}
	};
	
	this.hasChildren = function (recno) {
		if (!isTree) {
			return false;
		}
		if (!recno) {
			recno = dataset.recno();
		}
		var node = this._innerFindNode(allRows, recno);
		if (node === null) {
			return;
		}
		return node.children && node.children.length > 0;
	};
	
	this.getLevel = function (recno) {
		if (!isTree) {
			return false;
		}
		if (!recno) {
			recno = dataset.recno();
		}
		var node = this._innerFindNode(allRows, recno);
		if (node === null) {
			return;
		}
		return node.level;
	};
	
	this._findVisibleNode = function (nodes) {
		if (!nodes) {
			return;
		}
		var node;
		for (var i = 0, cnt = nodes.length; i < cnt; i++) {
			node = nodes[i];
			needShowRows.push(node);
			if (node.expanded){
				this._findVisibleNode(node.children);
			}
		}
	};
	
	this.rownoToRecno = function (rowno) {
		if (!isTree) {
			return rowno + this.fixedRows;
		}
		if (rowno < 0) {
			rowno = rowno + this.fixedRows;
			return rowno >= 0 ? rowno : -1;
		}
		if (rowno >= needShowRows.length) {
			return -1;
		}
		return needShowRows[rowno].recno;
	};
	
	this.recnoToRowno = function (recno) {
		if (!isTree) {
			return recno - this.fixedRows;
		}
		for(var i = 0, cnt = needShowRows.length; i < cnt; i++){
			if (needShowRows[i].recno == recno) {
				return i;
			}
		}
		return -1;
	};
	
	this.setVisibleStartRow = function (rowno, notFireEvt) {
		if (rowno >= 0) {
			var maxVisibleNo = this.getNeedShowRowCount() + 1 - visibleCount;
			if (rowno > maxVisibleNo) {
				rowno = maxVisibleNo;
			}
		}
		if (rowno < 0) {
			rowno = 0;
		}
		if (visibleStartRow == rowno) {
			return;
		}
		visibleStartRow = rowno;
		visibleEndRow = rowno + visibleCount - 1;
		if (!notFireEvt && this.onTopRownoChanged) {
			this.onTopRownoChanged(rowno);
		}
	};
	
	this.getVisibleStartRow = function () {
		return visibleStartRow;
	};
	
	this.setVisibleEndRow = function(endRow){
		visibleEndRow = endRow;
	};
	
	this.getVisibleEndRow = function(){
		return visibleEndRow;
	};
	
	this.setVisibleCount = function (count, notFireEvt) {
		if (visibleCount == count) {
			return;
		}
		visibleCount = count;
		visibleEndRow = visibleStartRow + count - 1;
		if (!notFireEvt && this.onVisibleCountChanged) {
			this.onVisibleCountChanged(count);
		}
	};
	
	this.getVisibleCount = function () {
		return visibleCount;
	};
	
	this.getNeedShowRowCount = function () {
		if (!isTree) {
			return dataset.recordCount()- this.fixedRows;
		}
		return needShowRows.length;
	};
	
	this.getCurrentRow = function(){
		return needShowRows[currentRowno];
	};
	
	this.skipSetCurrentRowno = function() {
		this._skipSetCurrentRowno = true;
	};
	
	this.setCurrentRowno = function (rowno, notFireEvt, checkVisible) {
		if(this._skipSetCurrentRowno) {
			this._skipSetCurrentRowno = false;
			return null;
		}
		if(rowno === undefined) {
			return null;
		}
		var preRowno = currentRowno, recno = 0, currRow=null;
		if (rowno < 0){//In the fixed row area
			var lowestRowno = -1 * this.fixedRows;
			if (rowno < lowestRowno) {
				rowno = lowestRowno;
			}
			recno = this.fixedRows + rowno;
		} else {
			var maxRow = this.getNeedShowRowCount();
			if(maxRow === 0) {
				currentRowno = 0;
				currentRecno = -1;
				return null;
			}
			if (rowno >= maxRow) {
				rowno = maxRow - 1;
			}
			if (!isTree) {
				recno = rowno + this.fixedRows;
			} else {
				currRow = needShowRows[rowno];
				recno = currRow.recno;
			}
			if (checkVisible) {
				if (rowno >= 0 && rowno < visibleStartRow){
					this.setVisibleStartRow(rowno);
				} else {
					if (rowno >= visibleStartRow + visibleCount) {
						this.setVisibleStartRow(rowno - visibleCount + 1);
					}
				}
			}
		}
//		if (recno >= 0){
//			if(!dataset.recno(recno)) {
//				return null;
//			}
//		}
		currentRowno = rowno;
		currentRecno = recno;
		if (!notFireEvt && this.onCurrentRownoChanged) {
			this.onCurrentRownoChanged(preRowno, currentRowno);
		}
		return currRow;
	};
	
	this.getCurrentRowno = function () {
		return currentRowno;
	};
	
	this.getCurrentRecno = function() {
		return currentRecno;
	};
	
	this.nextRow = function () {
		dataset.confirm();
		this.setCurrentRowno(currentRowno + 1, false, true);
	};
	
	this.priorRow = function (num) {
		dataset.confirm();
		this.setCurrentRowno(currentRowno - 1, false, true);
	};
	
	this.nextPage = function () {
		dataset.confirm();
		this.setVisibleStartRow(visibleStartRow + visibleCount);
		this.setCurrentRowno(visibleStartRow);
	};
	
	this.priorPage = function () {
		dataset.confirm();
		this.setVisibleStartRow(visibleStartRow - visibleCount);
		this.setCurrentRowno(visibleStartRow);
	};
	
	this._innerFindNode = function (nodes, recno) {
		var node, nextNode;
		for (var i = 0, cnt = nodes.length - 1; i <= cnt; i++) {
			node = nodes[i];
			if (node.recno == recno) {
				return node;
			}
			if (node.children) {
				var result = this._innerFindNode(node.children, recno);
				if (result) {
					return result;
				}
			}
		}
		return null;
	};
	
	this.expand = function (callbackFn) {
		if (!isTree) {
			return;
		}
		var node = this._innerFindNode(allRows, dataset.recno());
		if (node === null) {
			return;
		}
		dataset.confirm();
		var oldRecno = dataset.recnoSilence();
		try {
			node.expanded = node.children ? true : false;
			dataset.recnoSilence(node.recno);
			dataset.expanded(node.expanded);
			var p = node;
			while (true) {
				p = p.parent;
				if (!p) {
					break;
				}
				if (!p.expanded) {
					dataset.recnoSilence(p.recno);
					dataset.expanded(true);
					p.expanded = true;
				}
			}
		} finally {
			dataset.recnoSilence(oldRecno);
		}
		this._refreshNeedShowRows();
		if (callbackFn) {
			callbackFn();
		}
	};
	
	this.collapse = function (callbackFn) {
		if (!isTree) {
			return;
		}
		var node = this._innerFindNode(allRows, dataset.recno());
		if (node === null) {
			return;
		}
		dataset.confirm();
		var oldRecno = dataset.recnoSilence();
		try {
			dataset.recnoSilence(node.recno);
			dataset.expanded(false);
			node.expanded = false;
		} finally {
			dataset.recnoSilence(oldRecno);
		}
		
		this._refreshNeedShowRows();
		if (callbackFn) {
			callbackFn();
		}
	};
	
	this._iterateNode = function (nodes, callbackFn) {
		var node;
		for (var i = 0, cnt = nodes.length; i < cnt; i++) {
			node = nodes[i];
			if (node.children) {
				if (callbackFn) {
					callbackFn(node);
				}
				if (node.children && node.children.length > 0) {
					this._iterateNode(node.children, callbackFn);
				}
			}
		}
		return null;
	};
	
	this._callbackFn = function (node, expanded) {
		var oldRecno = dataset.recnoSilence();
		try {
			dataset.recnoSilence(node.recno);
			dataset.expanded(expanded);
			node.expanded = expanded;
		} finally {
			dataset.recnoSilence(oldRecno);
		}
	};
	
	this.expandAll = function (callbackFn) {
		if (!isTree) {
			return;
		}
		
		dataset.confirm();
		var Z = this;
		Z._iterateNode(allRows, function (node) {
			Z._callbackFn(node, true); 
		});
		Z._refreshNeedShowRows();
		if (callbackFn) {
			callbackFn();
		}
	};
	
	this.collapseAll = function (callbackFn) {
		if (!isTree) {
			return;
		}
		dataset.confirm();
		var Z = this;
		Z._iterateNode(allRows, function (node) {
			Z._callbackFn(node, false); 
		});
		Z._refreshNeedShowRows();
		if (callbackFn) {
			callbackFn();
		}
	};
	
	this.syncDataset = function(){
		var recno = dataset.recno();
		if(recno < 0) {
			return;
		}
		var node = this._innerFindNode(allRows, dataset.recno()),
			pnode = node.parent;
		if (pnode && !pnode.expanded){
			while(true){
				if (!pnode.expanded) {
					pnode.expanded = true;
				} else {
						break;
				}
				pnode = pnode.parent;
				if (!pnode) {
					break;
				}
			}
		}
		this._refreshNeedShowRows();
		var rowno = this.recnoToRowno(recno);
		this.setCurrentRowno(rowno, false, true);
	};
	
	this.checkNode = function(state, relativeCheck, onlyCheckChildren){
		var node = this.getCurrentRow();
//		if (node.state == state) {
//			return;
//		}
		dataset.selected(state ? 1 : 0);

		if (relativeCheck){
			if (node.children && node.children.length > 0) {
				this._updateChildState(node, state);
			}
			if (node.parent && !onlyCheckChildren) {
				this._updateParentState(node, state);
			}
		}

		if (state) {
			this._updateParentNodeBoldByChecked(node);
		} else {
			this._updateParentNodeBoldByNotChecked(node);
		}
		
		if (this.onCheckStateChanged) {
			this.onCheckStateChanged();
		}
	};
	
	this.checkChildNodes = function(state, relativeCheck){
		var node = this.getCurrentRow();
		dataset.selected(state ? 1 : 0);

		if (node.children && node.children.length > 0) {
			this._updateChildState(node, state);
		}
		if (relativeCheck){
			if (node.parent) {
				this._updateParentState(node, state);
			}
		}

		if (state) {
			this._updateParentNodeBoldByChecked(node);
		} else {
			this._updateParentNodeBoldByNotChecked(node);
		}
		
		if (this.onCheckStateChanged) {
			this.onCheckStateChanged();
		}
	};
	
	this._updateChildState = function(node, state){
		var oldRecno = dataset.recnoSilence(),
			childNode;
		try{
			for(var i = 0, cnt = node.children.length; i < cnt; i++){
				childNode = node.children[i];
				dataset.recnoSilence(childNode.recno);
				dataset.selected(state);
				if (childNode.children && childNode.children.length > 0) {
					this._updateChildState(childNode, state);
				}
			}
		} finally {
			dataset.recnoSilence(oldRecno);
		}
	};
	
	this._updateParentState = function(node, state){
		var pNode = node.parent;
		if (!pNode) {
			return;
		}
		var childNode, newState, childState;
		if (state != 2){
			for(var i = 0, cnt = pNode.children.length; i < cnt; i++){
				childNode = pNode.children[i];
				childState = dataset.selectedByRecno(childNode.recno);
				if (childState == 2){
					newState = 2;
					break;
				}
				if (i === 0){
					newState = childState;
				} else if (newState != childState){
					newState =2;
					break;
				}
			}//end for
		} else {
			newState = state;
		}
		var pState = dataset.selectedByRecno(pNode.recno);
		if (pState != newState){
			var oldRecno = dataset.recnoSilence();
			try{
				dataset.recnoSilence(pNode.recno);
				dataset.selected(newState);
			}finally{
				dataset.recnoSilence(oldRecno);
			}
		}
		this._updateParentState(pNode, newState);
	};
	
	this.reset = function() {
		visibleCount = 0;
		visibleStartRow = 0;
		visibleEndRow = 0;
		needShowRows = null;
		allRows = null;
		currentRowno = 0;
		currentRecno = 0;
		this.fixedRows = 0;
	};
	
	this.destroy = function(){
		dataset = null;
		allRows = null;
		this.reset();
		this.onTopRownoChanged = null;
		this.onVisibleCountChanged = null;
		this.onCurrentRownoChanged = null;
		this.onNeedShowRowsCountChanged = null;
		this.onCheckStateChanged = null;
	};
};

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
		this._expandChildWidth = expandChildWidth? true: false;
		return this;
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

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBText is a powerful control, it can input any data type, like:
 *		number, date etc. Example:
 * 
 * <pre><code>
 * var jsletParam = {type:&quot;DBText&quot;,field:&quot;name&quot;};
 * //1. Declaring:
 * &lt;input id=&quot;ctrlId&quot; type=&quot;text&quot; data-jslet='jsletParam' /&gt;
 * or
 * &lt;input id=&quot;ctrlId&quot; type=&quot;text&quot; data-jslet='{type:&quot;DBText&quot;,field:&quot;name&quot;}' /&gt;
 * 
 *  //2. Binding
 * &lt;input id=&quot;ctrlId&quot; type=&quot;text&quot; data-jslet='jsletParam' /&gt;
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
jslet.ui.DBText = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,beforeUpdateToDataset,enableInvalidTip,onKeyDown,autoSelectAll';

		/**
		 * @protected
		 */
		Z._beforeUpdateToDataset = null;
		Z._enableInvalidTip = true;
		
		Z._enterProcessed = false;
		
		Z._autoSelectAll = true;

		/**
		 * @private
		 */
		Z.oldValue = null;
		Z.editMask = null;
		Z._position = null;
		$super(el, params);
	},

	beforeUpdateToDataset: function(beforeUpdateToDataset) {
		if(beforeUpdateToDataset === undefined) {
			return this._beforeUpdateToDataset;
		}
		jslet.Checker.test('DBText.beforeUpdateToDataset', beforeUpdateToDataset).isFunction();
		this._beforeUpdateToDataset = beforeUpdateToDataset;
	},

	enableInvalidTip: function(enableInvalidTip) {
		if(enableInvalidTip === undefined) {
			return this._enableInvalidTip;
		}
		this._enableInvalidTip = enableInvalidTip? true: false;
	},

	autoSelectAll: function(autoSelectAll) {
		if(autoSelectAll === undefined) {
			return this._autoSelectAll;
		}
		this._autoSelectAll = autoSelectAll? true: false;
	},

	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return el.tagName.toLowerCase() == 'input' && 
				el.type.toLowerCase() == 'text';
	},

	/**
	 * @override
	 */
	bind: function () {
		var Z = this;
		Z.renderAll();
		var jqEl = jQuery(Z.el);
		jqEl.addClass('form-control');
		
		if (Z.doFocus) {
			jqEl.on('focus', jQuery.proxy(Z.doFocus, Z));
		}
		if (Z.doBlur) {
			jqEl.on('blur', jQuery.proxy(Z.doBlur, Z));
		}
		if (Z.doKeydown) {
			jqEl.on('keydown', Z.doKeydown);
		}
		if (Z.doKeypress) {
			jqEl.on('keypress', Z.doKeypress);
		}
		Z.doMetaChanged('required');
	}, // end bind

	/**
	 * @override
	 */
	doFocus: function () {
		var Z = this;
		if (Z._skipFocusEvent) {
			return;
		}
		jslet.ui.focusManager.activeDataset(Z._dataset.name()).activeField(Z._field).activeValueIndex(Z._valueIndex);
		Z.doValueChanged();
		Z.oldValue = Z.el.value;
		if(Z._autoSelectAll) {
			jslet.ui.textutil.selectText(Z.el);
		}
	},

	/**
	 * @override
	 */
	doBlur: function () {
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		jslet.ui.focusManager.activeDataset(null).activeField(null).activeValueIndex(null);
		Z._position = jslet.ui.textutil.getCursorPos(Z.el);
		if (fldObj.readOnly() || fldObj.disabled()) {
			return;
		}
		var jqEl = jQuery(this);
		if(jqEl.attr('readOnly') || jqEl.attr('disabled')) {
			return;
		}
		Z.updateToDataset();
		Z._isBluring = true;
		try {
			Z.doValueChanged();
		} finally {
			Z._isBluring = false;
		}
	},
	
	/**
	 * @override
	 */
	doKeydown: function(event) {
		event = jQuery.event.fix( event || window.event );
		var keyCode = event.which;
		//When press 'enter', write data to dataset.
		var Z = this.jslet,
			K = jslet.ui.KeyCode;
		if(keyCode === K.ENTER) {
			Z._enterProcessed = true;
			Z.updateToDataset();
		}
		//Process 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown' key when it is editing. 
		var isEditing = Z._dataset.status() > 0;
		if(isEditing && (keyCode === K.UP || keyCode === K.DOWN || keyCode === K.PAGEUP || keyCode === K.PAGEDOWN)) {
			Z._enterProcessed = true;
			Z.updateToDataset();
		}
		var fldObj = Z._dataset.getField(Z._field);
		if (!fldObj.readOnly() && !fldObj.disabled() && (keyCode === K.BACKSPACE || keyCode === K.DELETE)) {
			Z._dataset.editRecord();
		}
		if(keyCode === K.LEFT || keyCode === K.RIGHT) { //Arrow-left, Arrow-right
			var pos = jslet.ui.textutil.getCursorPos(Z.el);
			if((keyCode === K.LEFT && pos.begin > 0) || 
					(keyCode === 39 && pos.begin < Z.el.value.length)) {
	       		event.stopImmediatePropagation();
			}
		}
	},

	/**
	 * @override
	 */
	doKeypress: function (event) {
		var Z = this.jslet,
			fldObj = Z._dataset.getField(Z._field);
		if (fldObj.readOnly() || fldObj.disabled()) {
			return;
		}
		event = jQuery.event.fix( event || window.event );
		var keyCode = event.which,
			existStr = jslet.getRemainingString(Z.el.value, jslet.ui.textutil.getSelectedText(Z.el)),
			cursorPos = jslet.ui.textutil.getCursorPos(Z.el);
		if (!Z._dataset.fieldValidator().checkInputChar(fldObj, String.fromCharCode(keyCode), existStr, cursorPos.begin)) {
			event.preventDefault();
			return false;
		}
		Z._dataset.editRecord();
		//When press 'enter', write data to dataset.
		if(keyCode === jslet.ui.KeyCode.ENTER) {
			if(!Z._enterProcessed) {
				Z.updateToDataset();
			} else {
				Z._enterProcessed = false;
			}
		}
	},

	/**
	 * Select text.
	 * 
	 * @param {Integer} start (Optional) start of cursor position
	 * @param {Integer} end (Optional) end of cursor position
	 */
	selectText: function(start, end){
		jslet.ui.textutil.selectText(this.el, start, end);
	},
	
	/**
	 * Input a text into text control at current cursor position.
	 * 
	 * @param {String} text the text need to be input.
	 */
	inputText: function(text) {
		if(!text) {
			return;
		}
		jslet.Checker.test('DBText.inputText#text', text).isString();
		
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if(fldObj.getType() !== jslet.data.DataType.STRING) {
			console.warn('Only String Field can be input!');
			return;
		}
		var ch, chs = [];
		for(var i = 0, len = text.length; i < len; i++) {
			ch = text[i];
			if (Z._dataset.fieldValidator().checkInputChar(fldObj, ch)) {
				chs.push(ch);
			}
		}
		if(!Z._position) {
			Z._position = jslet.ui.textutil.getCursorPos(Z.el);
		}
		var subStr = chs.join(''),
			value =Z.el.value,
			begin = Z._position.begin,
			end = Z._position.end;
		var prefix = value.substring(0, begin), 
			suffix = value.substring(end); 
		Z.el.value = prefix + text + suffix;
		Z._position = jslet.ui.textutil.getCursorPos(Z.el);		
		Z.updateToDataset();
	},
	
	/**
	 * @override
	 */
	refreshControl: function ($super, evt, isForce) {
		if($super(evt, isForce) && this.afterRefreshControl) {
			this.afterRefreshControl(evt);
		}
	}, 

	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName){
		$super(metaName);
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if(!metaName || metaName == "disabled" || metaName == "readOnly") {
			jslet.ui.setEditableStyle(Z.el, fldObj.disabled(), fldObj.readOnly(), false, fldObj.required());
		}
		
		if(metaName && metaName == 'required') {
			var jqEl = jQuery(Z.el);
			if (fldObj.required()) {
				jqEl.addClass('jl-ctrl-required');
			} else {
				jqEl.removeClass('jl-ctrl-required');
			}
		}
		if(!metaName || metaName == 'editMask') {
			var editMaskCfg = fldObj.editMask();
			if (editMaskCfg) {
				if(!Z.editMask) {
					Z.editMask = new jslet.ui.EditMask();
					Z.editMask.attach(Z.el);
				}
				var mask = editMaskCfg.mask,
					keepChar = editMaskCfg.keepChar,
					transform = editMaskCfg.transform;
				Z.editMask.setMask(mask, keepChar, transform);
			} else {
				if(Z.editMask) {
					Z.editMask.detach();
					Z.editMask = null;
				}
			}
		}
		
		if(!metaName || metaName == 'tabIndex') {
			Z.setTabIndex();
		}
		
		Z.el.maxLength = fldObj.getEditLength();
	},
	
	/**
	 * @override
	 */
	doValueChanged: function() {
		var Z = this;
		if (Z._keep_silence_) {
			return;
		}
		var errObj = Z.getFieldError();
		if(errObj && errObj.message) {
			Z.el.value = errObj.inputText || '';
			Z.renderInvalid(errObj);
			return;
		} else {
			Z.renderInvalid(null);
		}
		var fldObj = Z._dataset.getField(Z._field);
		var align = fldObj.alignment();
	
		if (jslet.locale.isRtl){
			if (align == 'left') {
				align= 'right';
			} else {
				align = 'left';
			}
		}
		Z.el.style.textAlign = align;
		var value;
		if (Z.editMask){
			value = Z.getText();
			Z.editMask.setValue(value);
		} else {
			if (document.activeElement != Z.el || Z.el.readOnly || Z._isBluring) {
				value = Z.getText(false);
			} else {
				value = Z.getText(true);
			}
			if(fldObj.getType() === jslet.data.DataType.STRING && fldObj.antiXss()) {
				value = jslet.htmlDecode(value);
			}
			Z.el.value = value;
		}
		Z.oldValue = Z.el.value;
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
			return true;
		}
		var value = Z.el.value;
		if(Z.oldValue == value) {
			return true;
		}
		Z._dataset.editRecord();
		if (this.editMask && !this.editMask.validateValue()) {
			return false;
		}
		if (Z._beforeUpdateToDataset) {
			if (!Z._beforeUpdateToDataset.call(Z)) {
				return false;
			}
		}

		Z._keep_silence_ = true;
		try {
			if (Z.editMask) {
				value = Z.editMask.getValue();
			}
			Z._dataset.setFieldText(Z._field, value, Z._valueIndex);
		} finally {
			Z._keep_silence_ = false;
		}
		Z.refreshControl(jslet.data.RefreshEvent.updateRecordEvent(Z._field));
		return true;
	}, // end updateToDataset

	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this;
		jQuery(Z.el).off();
		if (Z.editMask){
			Z.editMask.detach();
			Z.editMask = null;
		}
		Z._beforeUpdateToDataset = null;
		Z.onKeyDown = null;
		$super();
	}
});
jslet.ui.register('DBText', jslet.ui.DBText);
jslet.ui.DBText.htmlTemplate = '<input type="text"></input>';

/**
 * DBPassword
 */
jslet.ui.DBPassword = jslet.Class.create(jslet.ui.DBText, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		$super(el, params);
	},

	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return el.tagName.toLowerCase() == 'input' &&
			el.type.toLowerCase() == 'password';
	}
});

jslet.ui.register('DBPassword', jslet.ui.DBPassword);
jslet.ui.DBPassword.htmlTemplate = '<input type="password"></input>';

/**
 * DBTextArea
 */
jslet.ui.DBTextArea = jslet.Class.create(jslet.ui.DBText, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		$super(el, params);
	},

	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return el.tagName.toLowerCase() == 'textarea';
	}
});

jslet.ui.register('DBTextArea', jslet.ui.DBTextArea);
jslet.ui.DBTextArea.htmlTemplate = '<textarea></textarea>';


/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
* @class DBCustomComboBox: used in jslet.ui.DBComboDlg and jslet.ui.DBDatePicker
*/
"use strict";
jslet.ui.DBCustomComboBox = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,textReadOnly';
		Z._textReadOnly = false;
		Z.enableInvalidTip = false;

		$super(el, params);
	},

	textReadOnly: function(textReadOnly) {
		if(textReadOnly === undefined) {
			return this._textReadOnly;
		}
		this._textReadOnly = textReadOnly ? true: false;
	},
	
	/**
	 * @override
	 */
	afterBind: function ($super) {
		$super();
		
		if (this._textReadOnly) {
			this.el.childNodes[0].readOnly = true;
		}
	},

	/**
	 * @override
	 */
	bind: function () {
		var Z = this;
		var jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('input-group')) {
			jqEl.addClass('input-group input-group-sm');
		}
		var btnCls = Z.comboButtonCls ? Z.comboButtonCls:'fa-caret-down'; 
		var s = '<input type="text" class="form-control">' + 
    	'<span class="input-group-btn jl-comb-btn-group"><button class="btn btn-default btn-sm " tabindex="-1"><i class="fa ' + btnCls + '"></i></button></span>'; 
		jqEl.html(s);
		var dbtext = jqEl.find('[type="text"]')[0];
		Z.textCtrl = new jslet.ui.DBText(dbtext, {
			type: 'dbtext',
			dataset: Z._dataset,
			field: Z._textField || Z._field,
			enableInvalidTip: true,
			valueIndex: Z._valueIndex,
			tabIndex: Z._tabIndex
		});
		jQuery(dbtext).on('keydown', function(event) {
			var keyCode = event.which;
			if(keyCode === jslet.ui.KeyCode.BACKSPACE && !this.value) {
				Z.buttonClick();
			}
		});
		
		Z.addChildControl(Z.textCtrl);
		
		var jqBtn = jqEl.find('button');
		if (this.buttonClick) {
			
			jqBtn.on('click', function(event){
				Z.buttonClick(jqBtn[0]);
			});
			jqBtn.focus(function(event) {
				jslet.ui.focusManager.activeDataset(Z._dataset.name()).activeField(Z._field).activeValueIndex(Z._valueIndex);
			});
			jqBtn.blur(function(event) {
				jslet.ui.focusManager.activeDataset(null).activeField(null).activeValueIndex(null);
			});
			
		}
	},


	/**
	 * @override
	 */
	tableId: function ($super, tableId) {
		$super(tableId);
		this.textCtrl.tableId(tableId);
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		this.refreshControl();
	},
	
	/**
	 * @override
	 */
	innerFocus: function() {
		var Z = this;
		if(Z._textReadOnly) {
			jQuery(Z.el).find('button').focus();
		} else {
			Z.textCtrl.focus();
		}
	},
	
	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName){
		$super(metaName);
		var Z = this;
		if(!metaName || metaName == "disabled" || metaName == "readOnly") {
			var fldObj = Z._dataset.getField(Z._field),
				flag = fldObj.disabled() || fldObj.readOnly();
			var jqEl = jQuery(Z.el);
			jqEl.find('button').attr("disabled", flag);
		}
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this;
		var dbbtn = Z.el.childNodes[1];
		dbbtn.onclick = null;
		jQuery(Z.textCtrl.el).off('keydown', this.popupUp);
		Z.textCtrl.destroy();
		Z.textCtrl = null;
		$super();
	}
});




/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBAutoComplete. Example:
 * <pre><code>
 * var jsletParam = {type:"DBAutoComplete",field:"department", matchType:"start"};
 * //1. Declaring:
 *      &lt;input id="cboAuto" type="text" data-jslet='jsletParam' />
 *      
 *  //2. Binding
 *      &lt;input id="cboAuto" type="text" data-jslet='jsletParam' />
 *      //Js snippet
 *      var el = document.getElementById('cboAuto');
 *      jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *      jslet.ui.createControl(jsletParam, document.body);
 *
 * </code></pre>
 */
"use strict";
jslet.ui.DBAutoComplete = jslet.Class.create(jslet.ui.DBText, {
	
	MatchModes: ['start','end', 'any'],
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		if (!Z.allProperties) {
			Z.allProperties = 'styleClass,dataset,field,lookupField,minChars,minDelay,displayTemplate,matchMode,beforePopup,onGetFilterField,filterFields';
		}
		
		Z._lookupField = null;
		
		Z._minChars = 0;

		Z._minDelay = 0;
		
		Z._beforePopup = null;
		
		Z._filterFields = null;
		
		Z._defaultFilterFields = null;
		
		Z._onGetFilterField = null;
		
		Z._matchMode = 'start';
		
		Z._timeoutHandler = null; 
		$super(el, params);
	},

	/**
	 * Get or set lookup field name.
	 * 
	 * @Param {String} lookup field name.
	 * @return {this or String}
	 */
	lookupField: function(lookupField) {
		if(lookupField === undefined) {
			return this._lookupField;
		}
		jslet.Checker.test('DBAutoComplete.lookupField', lookupField).isString();
		this._lookupField = lookupField;
		return this;
	},
   
	/**
	 * Get or set minimum characters before searching.
	 * 
	 * @Param {Integer} Minimum character before searching.
	 * @return {this or Integer}
	 */
	minChars: function(minChars) {
		if(minChars === undefined) {
			return this._minChars;
		}
		jslet.Checker.test('DBAutoComplete.minChars', minChars).isGTEZero();
		this._minChars = parseInt(minChars);
		return this;
	},
   
	/**
	 * Get or set delay time(ms) before auto searching.
	 * 
	 * @param {Integer} minDelay Delay time.
	 * @return {this or Integer}
	 */
	minDelay: function(minDelay) {
		if(minDelay === undefined) {
			return this._minDelay;
		}
		jslet.Checker.test('DBAutoComplete.minDelay', minDelay).isGTEZero();
		this._minDelay = parseInt(minDelay);
		return this;
	},
   
	/**
	 * Get or set delay time(ms) before auto searching.
	 * 
	 * @param {String} matchMode match mode,optional values: 'start', 'end', 'any', default: 'start'
	 * @return {this or String}
	 */
	matchMode: function(matchMode) {
		if(matchMode === undefined) {
			return this._matchMode;
		}
		matchMode = jQuery.trim(matchMode);
		var checker = jslet.Checker.test('DBAutoComplete.matchMode', matchMode).isString();
		matchMode = matchMode.toLowerCase();
		checker.testValue(matchMode).inArray(this.MatchModes);
		this._matchMode = matchMode;
		return this;
	},
   
	/**
	 * {Function} Before pop up event handler, you can use this to customize the display result.
	 * Pattern: 
	 *   function(dataset, inputValue){}
	 *   //dataset: jslet.data.Dataset; 
	 *   //inputValue: String
	 */
	beforePopup: function(beforePopup) {
		if(beforePopup === undefined) {
			return this._beforePopup;
		}
		this._beforePopup = beforePopup;
		return this;
	},
	
	/**
	 * Get or set filter fields, more than one fields are separated with ','.
	 * 
	 * @param {String} filterFields filter fields.
	 * @return {this or String}
	 */
	filterFields: function(filterFields) {
		var Z = this;
		if(filterFields === undefined) {
			return Z._filterFields;
		}
		jslet.Checker.test('DBAutoComplete.filterFields', filterFields).isString();
		Z._filterFields = filterFields;
		return this;
	},
	
	/**
	 * {Function} Get filter field event handler, you can use this to customize the display result.
	 * Pattern: 
	 *   function(dataset, inputValue){}
	 *   //dataset: jslet.data.Dataset; 
	 *   //inputValue: String
	 *   //return: String Field name
	 */
	onGetFilterField: function(onGetFilterField) {
		if(onGetFilterField === undefined) {
			return this._onGetFilterField;
		}
		this._onGetFilterField = onGetFilterField;
		return this;
	},
	
	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return el.tagName.toLowerCase() == 'input' &&
			el.type.toLowerCase() == 'text';
	},

	/**
	 * @override
	 */
	doBlur: function () {
		var Z = this;
		if (Z.el.disabled || Z.el.readOnly) {
			return;
		}
		var	fldObj = Z._dataset.getField(Z._field);
		if (fldObj.readOnly() || fldObj.disabled()) {
			return;
		}
		if (Z.contentPanel && Z.contentPanel.isShowing()) {
			if(Z._isSelecting) {
				return;
			}
			var value = Z.el.value, canBlur = true;
			if(!Z._lookupField) {
				fldObj = Z._dataset.getField(Z._field);
				var	lkf = fldObj.lookup(),
					lkds = lkf.dataset();
				if(value.length > 0 && lkds.recordCount() === 0) {
					canBlur = false;
				}
			}
			if (Z.contentPanel && Z.contentPanel.isShowing()) {
				Z.contentPanel.closePopup();
			}
			Z.updateToDataset();
			Z.refreshControl(jslet.data.RefreshEvent.updateRecordEvent(Z._field));
			if(!canBlur) {
				Z.el.focus();
			}
		} else {
			Z.updateToDataset();
			Z.refreshControl(jslet.data.RefreshEvent.updateRecordEvent(Z._field));
		}
	},

	/**
	 * @override
	 */
	doChange: null,

	/**
	 * @override
	 */
	doKeydown: function (event) {
		if (this.disabled || this.readOnly) {
			return;
		}
		event = jQuery.event.fix( event || window.event );

		var keyCode = event.which, 
			Z = this.jslet,
			K = jslet.ui.KeyCode;
		if(keyCode >= K.F1 && keyCode <= K.F12 || keyCode === K.SHIFT || keyCode === K.CONTROL || keyCode === K.ALT || 
				keyCode === K.CAPSLOCK || keyCode === K.INSERT || keyCode === K.HOME || keyCode === K.END || 
				keyCode === K.PAGEUP || keyCode === K.PAGEDOWN || keyCode === K.LEFT || keyCode === K.RIGHT) { 
			return;
		}
		if(keyCode === K.ESCAPE && Z.contentPanel) {
			Z.contentPanel.closePopup();
			return;
		}
		if (keyCode === K.UP || keyCode === K.DOWN) {
			if(Z.contentPanel && Z.contentPanel.isPop) {
				var fldObj = Z._dataset.getField(Z._lookupField || Z._field),
				lkf = fldObj.lookup(),
				lkds = lkf.dataset();
				if (keyCode === K.UP) { //up arrow
					lkds.prior();
					event.preventDefault();
		       		event.stopImmediatePropagation();
				}
				if (keyCode === K.DOWN) {//down arrow
					lkds.next();
					event.preventDefault();
		       		event.stopImmediatePropagation();
				}
			} else {
				if(!Z.tableId()) {
					Z._invokePopup();
				}
			}
			return;
		} 

		if (keyCode === K.DELETE || keyCode === K.BACKSPACE || keyCode === K.IME) {
			Z._invokePopup();
			return;
		}
		if (keyCode !== K.ENTER && keyCode !== K.TAB) {
			Z._invokePopup();
		} else if (Z.contentPanel) {
			if(Z.contentPanel.isShowing()) {
				Z.contentPanel.confirmSelect();
			}
		}
	},

	/**
	 * @override
	 */
	doKeypress: function (event) {
		if (this.disabled || this.readOnly) {
			return;
		}
//		var keyCode = event.keyCode ? event.keyCode : 
//			event.which	? event.which: event.charCode;
//		var Z = this.jslet;
//		if (keyCode != 13 && keyCode != 9) {
//			Z._invokePopup();
//		} else if (Z.contentPanel) {
//			if(Z.contentPanel.isShowing()) {
//				Z.contentPanel.confirmSelect();
//			}
//		}
	},

	_invokePopup: function () {
		var Z = this;
		if (Z._timeoutHandler) {
			clearTimeout(Z._timeoutHandler);
		}
		var delayTime = 100;
		if (Z._minDelay) {
			delayTime = parseInt(Z._minDelay);
		}
		
		Z._timeoutHandler = setTimeout(function () {
			Z._populate(Z.el.value); 
		}, delayTime);
	},

	_getDefaultFilterFields: function(lookupFldObj) {
		var Z = this;
		if(Z._defaultFilterFields) {
			return Z._defaultFilterFields;
		}
		var codeFld = lookupFldObj.codeField(),
			nameFld = lookupFldObj.nameField(),
			lkDs = lookupFldObj.dataset(),
			codeFldObj = lkDs.getField(codeFld),
			nameFldObj = lkDs.getField(nameFld),
			arrFields = [];
		if(codeFldObj && codeFldObj.visible()) {
			arrFields.push(codeFld);
		}
		if(codeFld != nameFld && nameFldObj && nameFldObj.visible()) {
			arrFields.push(nameFld);
		}
		Z._defaultFilterFields = arrFields;
		return arrFields;
	},
	
	_getFilterFields: function(lkFldObj, inputValue) {
		var Z = this;
		var filterFlds = null;
		
		var eventFunc = jslet.getFunction(Z._onGetFilterField);
		if (eventFunc) {
			filterFlds = eventFunc.call(Z, lkFldObj.dataset(), inputValue);
			jslet.Checker.test('DBAutoComplete.onGetFilterField#return', filterFlds).isString();
		}
		filterFlds = filterFlds || Z._filterFields;
		var arrFields;
		if (filterFlds) {
			arrFields = filterFlds.split(',');
		} else {
			arrFields = Z._getDefaultFilterFields(lkFldObj);
		}
		if(arrFields.length === 0) {
			throw new Error('Not specified [filter fields]!');
		}
		var filterValue = inputValue;
		if (Z._matchMode == 'start') {
			filterValue = filterValue + '%';
		} else {
			if (Z._matchMode == 'end') {
				filterValue = '%' + filterValue;
			} else {
				filterValue = '%' + filterValue + '%';
			}
		}
		var fldName, result = '';
		for(var i = 0, len = arrFields.length; i < len; i++) {
			fldName = arrFields[i];
			if(i > 0) {
				result += ' || ';
			}
			result += 'like([' + fldName + '],"' + filterValue + '")';
		}
		return result;
	},
	
	_populate: function (inputValue) {
		var Z = this;
		if (Z._minChars > 0 && inputValue && inputValue.length < Z._minChars) {
			return;
		}
		var fldObj = Z._dataset.getField(Z._lookupField || Z._field),
			lkFld = fldObj.lookup();
		if (!lkFld) {
			console.error(Z._field + ' is NOT a lookup field!');
			return;
		}
		
		var lkds = lkFld.dataset(),
			oldFlag = lkds.autoRefreshHostDataset();
		lkds.autoRefreshHostDataset(false);
		try {
			var	editFilter = lkFld.editFilter();
			var eventFunc = jslet.getFunction(Z._beforePopup);
			if (eventFunc) {
				eventFunc.call(Z, lkds, inputValue, editFilter);
			} else if (inputValue) {
				var filter = Z._getFilterFields(lkFld, inputValue);
				if(editFilter) {
					if(filter) {
						filter = '(' + editFilter + ') && (' + filter + ')';
					} else {
						filter = editFilter;
					}
				}
				lkds.filter(filter);
				lkds.filtered(true);
			} else {
				if(editFilter) {
					lkds.filter(editFilter);
					lkds.filtered(true);
				} else {
					lkds.filter(null);
					if(!lkds.fixedFilter()) {
						lkds.filtered(false);
					}
				}
			}
		} finally {
			lkds.autoRefreshHostDataset(oldFlag);
		}
		//Clear field value which specified by 'lookupField'.
		if(Z._lookupField) {
			Z._dataset.getRecord()[Z._lookupField] = null;
		}
		if (!Z.contentPanel) {
			Z.contentPanel = new jslet.ui.DBAutoCompletePanel(Z);
		} else {
			if(Z.contentPanel.isShowing()) {
				return;
			}
		}
		jslet.ui.PopupPanel.excludedElement = Z.el;
		var jqEl = jQuery(Z.el),
			r = jqEl.offset(),
			h = jqEl.outerHeight(),
			x = r.left,
			y = r.top + h;
		
		if (jslet.locale.isRtl){
			x = x + jqEl.outerWidth() - Z.contentPanel.dlgWidth;
		}
		Z.contentPanel.showPopup(x, y, 0, h);
	},
	
	_destroyPopPanel: function() {
		var Z = this;
		if (Z.contentPanel){
			Z.contentPanel.destroy();
			Z.contentPanel = null;
		}
	},
		
	/**
	 * @override
	 */
	doLookupChanged: function (isMetaChanged) {
		if(isMetaChanged) {
			this._destroyPopPanel();
		}
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		this._destroyPopPanel();
		jQuery(this.el).off();
		$super();
	}
	
});

/**
 * @private
 * @class DBAutoCompletePanel
 * 
 */
jslet.ui.DBAutoCompletePanel = function (autoCompleteObj) {
	var Z = this;
	Z.dlgWidth = 320;
	Z.dlgHeight = 180;

	var lkf, lkds;
	Z.comboCfg = autoCompleteObj;
	Z.dataset = autoCompleteObj.dataset();
	Z.field = autoCompleteObj.lookupField() || autoCompleteObj.field();
	
	Z.panel = null;
	Z.lkDataset = null;
	Z.popup = new jslet.ui.PopupPanel();
	Z.isPop = false;

	Z.create = function () {
		if (!Z.panel) {
			Z.panel = document.createElement('div');
			Z.panel.style.width = '100%';
			Z.panel.style.height = '100%';
			jQuery(Z.panel).on("mousedown", function(event){
				Z.comboCfg._isSelecting = true;
				event.stopPropagation();
			});
		}
		//process variable
		var fldObj = Z.dataset.getField(Z.field),
			lkfld = fldObj.lookup(),
			lkds = lkfld.dataset();
		Z.lkDataset = lkds;
		var fields = lkds.getNormalFields(),
			totalChars = 0;
		for(var i = 0, len = fields.length; i < len; i++) {
			fldObj = fields[i];
			if(fldObj.visible()) {
				totalChars += fldObj.displayWidth();
			}
		}
		var totalWidth = totalChars * (jslet.global.defaultCharWidth || 12) + 30;
		Z.dlgWidth = totalWidth;
		if(Z.dlgWidth < 150) {
			Z.dlgWidth = 150;
		}
		if(Z.dlgWidth > 500) {
			Z.dlgWidth = 500;
		}

		Z.panel.innerHTML = '';

		var cntw = Z.dlgWidth - 4,
			cnth = Z.dlgHeight - 4,
			tableparam = { type: 'DBTable', dataset: lkds, readOnly: true, noborder:true, hasSelectCol: false, hasSeqCol: false, hideHead: true };
		tableparam.onRowClick = Z.confirmSelect;

		Z.otable = jslet.ui.createControl(tableparam, Z.panel, '100%', cnth);
		Z.otable.el.focus();
		Z.otable.el.style.border = "0";
		
		return Z.panel;
	};

	Z.confirmSelect = function () {
		Z.comboCfg._isSelecting = true;
		var fldValue = Z.lkDataset.keyValue();
		if (fldValue || fldValue === 0) {
			Z.dataset.setFieldValue(Z.field, fldValue, Z.valueIndex);			
			Z.comboCfg.el.focus();
		}
		if (Z.comboCfg.afterSelect) {
			Z.comboCfg.afterSelect(Z.dataset, Z.lkDataset);
		}
		Z.closePopup();
	};

	Z.showPopup = function (left, top, ajustX, ajustY) {
		if (!Z.panel) {
			Z.panel = Z.create();
		}
		Z.comboCfg._isSelecting = false;
		Z.isPop = true;
		var p = Z.popup.getPopupPanel();
		p.style.padding = '0';
		Z.popup.setContent(Z.panel);
		Z.popup.onHidePopup = Z.doClosePopup;
		Z.popup.show(left, top, Z.dlgWidth, Z.dlgHeight, ajustX, ajustY);
	};

	Z.doClosePopup = function () {
		Z.isPop = false;
		var oldRecno = Z.lkDataset.recno() || 0;
		try {
			Z.lkDataset.filter(null);
		} finally {
			if(oldRecno >= 0) {
				Z.lkDataset.recno(oldRecno);
			}
		}
	};
	
	Z.closePopup = function () {
		Z.popup.hide();
	};
	
	Z.isShowing = function(){
		if (Z.popup) {
			return Z.popup.isShowing;
		} else {
			return false;
		}
	};
	
	Z.destroy = function(){
		jQuery(Z.panel).off();
		Z.otable.onRowClick = null;
		Z.otable.destroy();
		Z.otable = null;
		Z.panel = null;
		Z.popup.destroy();
		Z.popup = null;
		Z.comboCfg = null;
		Z.dataset = null;
		Z.field = null;
		Z.lkDataset = null;
	};
};

jslet.ui.register('DBAutoComplete', jslet.ui.DBAutoComplete);
jslet.ui.DBAutoComplete.htmlTemplate = '<input type="text"></input>';

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBBetweenEdit. 
 * It implements "From ... To ..." style editor. This editor usually use in query parameter editor.
 * Example:
 * <pre><code>
 * var jsletParam = {type:"DBBetweenEdit","field":"dateFld"};
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
jslet.ui.DBBetweenEdit = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		this.allProperties = 'styleClass,dataset,field';
		this._minEleId = null;
		this._maxEleId = null;

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

	/**
	 * @override
	 */
	refreshControl: function (evt) {
		return;
	}, // end refreshControl

	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this;
		Z.removeAllChildControls();
		jslet.ui.textMeasurer.setElement(Z.el);
		var lbl = jslet.locale.Dataset.betweenLabel;
		if (!lbl) {
			lbl = '-';
		}
		lbl = '&nbsp;' + lbl + '&nbsp;';
		var w = jslet.ui.textMeasurer.getWidth(lbl);

		var template = ['<table style="width:100%;margin:0px" cellspacing="0" cellpadding="0"><col /><col width="', w,
				'px" /><col /><tbody><tr><td></td><td>', lbl,
				'</td><td></td></tr></tbody></table>'];
		Z.el.innerHTML = template.join('');
		var arrTd = jQuery(Z.el).find('td'),
			minTd = arrTd[0],
			maxTd = arrTd[2],
			fldObj = Z._dataset.getField(Z._field),
			param = fldObj.editControl();

		param.dataset = Z._dataset;
		param.field = Z._field;
		param.valueIndex = 0;
		var dbctrl = jslet.ui.createControl(param, minTd);
		Z._minEleId = dbctrl.el.id;
		
		dbctrl.el.style.width = '98%';
		Z.addChildControl(dbctrl);
		
		param.valueIndex = 1;
		dbctrl = jslet.ui.createControl(param, maxTd);
		dbctrl.el.style.width = '98%';
		Z._maxEleId = dbctrl.el.id;
		Z.addChildControl(dbctrl);
	},
	
	/**
	 * @override
	 */
	tableId: function($super, tableId){
		$super(tableId);
		jslet('#'+ this._minEleId).tableId(tableId);
		jslet('#'+ this._maxEleId).tableId(tableId);
	},
	
	/**
	 * @override
	 */
	innerFocus: function() {
		jslet('#'+ this._minEleId).focus();
	}
	
});

jslet.ui.register('DBBetweenEdit', jslet.ui.DBBetweenEdit);
jslet.ui.DBBetweenEdit.htmlTemplate = '<div></div>';

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


/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBCheckBoxGroup. 
 * Display a group of checkbox. Example:
 * <pre><code>
 * var jsletParam = {type:"DBCheckBoxGroup",dataset:"employee",field:"department", columnCount: 3};
 * 
 * //1. Declaring:
 * &lt;div data-jslet='type:"DBCheckBoxGroup",dataset:"employee",field:"department", columnCount: 3' />
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
jslet.ui.DBCheckBoxGroup = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,columnCount,hasSelectAllBox';
		/**
		 * {Integer} Column count
		 */
		Z._columnCount = 99999;
		
		Z._itemIds = null;
		
		$super(el, params);
	},

	columnCount: function(columnCount) {
		if(columnCount === undefined) {
			return this._columnCount;
		}
		jslet.Checker.test('DBCheckBoxGroup.columnCount', columnCount).isGTEZero();
		this._columnCount = parseInt(columnCount);
	},
	
	hasSelectAllBox: function(hasSelectAllBox) {
		if(hasSelectAllBox === undefined) {
			return this._hasSelectAllBox;
		}
		this._hasSelectAllBox = hasSelectAllBox? true: false;
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
		var jqEl = jQuery(Z.el);
		jqEl.on('keydown', function(event) {
			var keyCode = event.which, idx, activeEle, activeId;
			
			if(keyCode === jslet.ui.KeyCode.LEFT) { //Arrow Left
				if(!Z._itemIds || Z._itemIds.length === 0) {
					return;
				}
				activeEle = document.activeElement;
				activeId = activeEle && activeEle.id;
				
				idx = Z._itemIds.indexOf(activeId);
				if(idx === 0) {
					return;
				}
				document.getElementById(Z._itemIds[idx - 1]).focus();
				event.preventDefault();
	       		event.stopImmediatePropagation();
			} else if( keyCode === jslet.ui.KeyCode.RIGHT) { //Arrow Right
				if(!Z._itemIds || Z._itemIds.length === 0) {
					return;
				}
				activeEle = document.activeElement;
				activeId = activeEle && activeEle.id;
				
				idx = Z._itemIds.indexOf(activeId);
				if(idx === Z._itemIds.length - 1) {
					return;
				}
				document.getElementById(Z._itemIds[idx + 1]).focus();
				event.preventDefault();
	       		event.stopImmediatePropagation();
			}
		});
		
		jqEl.on('click', 'input[type="checkbox"]', function (event) {
			var ctrl = this;
			window.setTimeout(function(){ //Defer firing 'updateToDataset' when this control is in DBTable to make row changed firstly.
				event.delegateTarget.jslet.updateToDataset(ctrl);
			}, 5);
		});
		jqEl.on('focus', 'input[type="checkbox"]', function (event) {
			jslet.ui.focusManager.activeDataset(Z._dataset.name()).activeField(Z._field).activeValueIndex(Z._valueIndex);
		});
		jqEl.on('blur', 'input[type="checkbox"]', function (event) {
			jslet.ui.focusManager.activeDataset(null).activeField(null).activeValueIndex(null);
		});
		jqEl.addClass('form-control');//Bootstrap class
		jqEl.css('height', 'auto');
	},

	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName){
		$super(metaName);
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if(!metaName || metaName == "disabled" || metaName == "readOnly" || metaName == 'tabIndex') {
			var disabled = fldObj.disabled(),
				readOnly = fldObj.readOnly();
			disabled = disabled || readOnly;
			var chkBoxes = jQuery(Z.el).find('input[type="checkbox"]'),
				chkEle, 
				tabIndex = fldObj.tabIndex(),
				required = fldObj.required();
			for(var i = 0, cnt = chkBoxes.length; i < cnt; i++){
				chkEle = chkBoxes[i];
				jslet.ui.setEditableStyle(chkEle, disabled, readOnly, false, required);
				chkEle.tabIndex = tabIndex;
			}
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
		var checkboxs = jQuery(Z.el).find('input[type="checkbox"]'),
			chkcnt = checkboxs.length, 
			checkbox, i;
		for (i = 0; i < chkcnt; i++) {
			checkbox = checkboxs[i];
			if(jQuery(checkbox).hasClass('jl-selectall')) {
				continue;
			}
			checkbox.checked = false;
		}
		var values = Z.getValue();
		if(values && values.length > 0) {
			var valueCnt = values.length, value;
			for (i = 0; i < chkcnt; i++) {
				checkbox = checkboxs[i];
				for (var j = 0; j < valueCnt; j++) {
					value = values[j];
					if (value == checkbox.value) {
						checkbox.checked = true;
					}
				}
			}
		}
	},
	
	/**
	 * @override
	 */
	doLookupChanged: function () {
		var Z = this,
			fldObj = Z._dataset.getField(Z._field), 
			lkf = fldObj.lookup();
		if (!lkf) {
			console.error(jslet.formatMessage(jslet.locale.Dataset.lookupNotFound,
					[fldObj.name()]));
			return;
		}
		if(fldObj.valueStyle() != jslet.data.FieldValueStyle.MULTIPLE) {
			fldObj.valueStyle(jslet.data.FieldValueStyle.MULTIPLE);
		}
		
		var lkds = lkf.dataset(),
			lkCnt = lkds.recordCount();
		if(lkCnt === 0) {
			Z.el.innerHTML = jslet.locale.DBCheckBoxGroup.noOptions;
			return;
		}
		Z._itemIds = [];
		var template = ['<table cellpadding="0" cellspacing="0">'],
			isNewRow = false;
		var editFilter = lkf.editFilter();
		Z._innerEditFilterExpr = null;
		var editItemDisabled = lkf.editItemDisabled();
		if(editFilter) {
			Z._innerEditFilterExpr = new jslet.Expression(lkds, editFilter);
		}
		var disableOption = false,
			k = -1,
			itemId;
		if(Z._hasSelectAllBox && lkCnt > 0) {
			template.push('<tr>');
			itemId = jslet.nextId();
			template.push('<td style="white-space: nowrap;vertical-align:middle"><input type="checkbox" class="jl-selectall"');
			template.push(' id="');
			template.push(itemId);
			template.push('"/><label for="');
			template.push(itemId);
			template.push('">');
			template.push(jslet.locale.DBCheckBoxGroup.selectAll);
			template.push('</label></td>');
			k = 0;
			Z._itemIds.push(itemId);
		}
		Z.el.innerHTML = '';
		var oldRecno = lkds.recnoSilence();
		try {
			for (var i = 0; i < lkCnt; i++) {
				lkds.recnoSilence(i);
				disableOption = false;
				if(Z._innerEditFilterExpr && !Z._innerEditFilterExpr.eval()) {
					if(!editItemDisabled) {
						continue;
					} else {
						disableOption = true;
					}
				}
				k++;
				isNewRow = (k % Z._columnCount === 0);
				if (isNewRow) {
					if (k > 0) {
						template.push('</tr>');
					}
					template.push('<tr>');
				}
				itemId = jslet.nextId();
				Z._itemIds.push(itemId);
				template.push('<td style="white-space: nowrap; "><input type="checkbox" value="');
				template.push(lkds.getFieldValue(lkf.keyField()));
				template.push('" id="');
				template.push(itemId);
				template.push('" ' + (disableOption? ' disabled': '') + '/><label for="');
				template.push(itemId);
				template.push('">');
				template.push(lkf.getCurrentDisplayValue());
				template.push('</label></td>');
				isNewRow = (k % Z._columnCount === 0);
			} // end for
			if (lkCnt > 0) {
				template.push('</tr>');
			}
			template.push('</table>');
			Z.el.innerHTML = template.join('');
		} finally {
			lkds.recnoSilence(oldRecno);
		}
		Z.doMetaChanged();
	}, // end renderOptions

	updateToDataset: function(currCheckBox) {
		var Z = this;
		if (Z._is_silence_) {
			return;
		}
		var allBoxes = jQuery(Z.el).find('input[type="checkbox"]'), chkBox, j, allCnt;
		if(jQuery(currCheckBox).hasClass('jl-selectall')) {
			var isAllSelected = currCheckBox.checked;
			for(j = 0, allCnt = allBoxes.length; j < allCnt; j++){
				chkBox = allBoxes[j];
				if(chkBox == currCheckBox) {
					continue;
				}
				if (!chkBox.disabled) {
					chkBox.checked = isAllSelected;
				}
			} //end for j
			
		}
		var fldObj = Z._dataset.getField(Z._field),
			limitCount = fldObj.valueCountLimit();
		
		var values = [], count = 0;
		for(j = 0, allCnt = allBoxes.length; j < allCnt; j++){
			chkBox = allBoxes[j];
			if(jQuery(chkBox).hasClass('jl-selectall')) {
				continue;
			}
			if (chkBox.checked) {
				values.push(chkBox.value);
				count ++;
			}
		} //end for j

		if (limitCount && count > limitCount) {
			currCheckBox.checked = !currCheckBox.checked;
			jslet.showInfo(jslet.formatMessage(jslet.locale.DBCheckBoxGroup.invalidCheckedCount,
					[''	+ limitCount]));
			return;
		}

		Z._is_silence_ = true;
		try {
			Z._dataset.setFieldValue(Z._field, values);
		} finally {
			Z._is_silence_ = false;
		}
	},
	
	/**
	 * @override
	 */
	innerFocus: function() {
		var itemIds = this._itemIds;
		if (itemIds && itemIds.length > 0) {
			document.getElementById(itemIds[0]).focus();
		}
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this, 
			jqEl = jQuery(Z.el);
		if(!jqEl.hasClass("jl-checkboxgroup")) {
			jqEl.addClass("jl-checkboxgroup");
		}
		Z.refreshControl(jslet.data.RefreshEvent.updateAllEvent(), true);
	},

	/**
	 * @override
	 */
	destroy: function($super){
		var jqEl = jQuery(this.el);
		jqEl.off();
		$super();
	}
});

jslet.ui.register('DBCheckBoxGroup', jslet.ui.DBCheckBoxGroup);
jslet.ui.DBCheckBoxGroup.htmlTemplate = '<div></div>';


/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBCombodlg. 
 * Show data on a popup panel, it can display tree style or table style. 
 * Example:
 * <pre><code>
 * var jsletParam = {type:"DBCombodlg",dataset:"employee",field:"department", textReadOnly:true};
 * 
 * //1. Declaring:
 * &lt;div data-jslet='type:"DBCombodlg",dataset:"employee",field:"department", textReadOnly:true' />
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
jslet.ui.DBComboSelect = jslet.Class.create(jslet.ui.DBCustomComboBox, {
	showStyles: ['auto', 'table', 'tree'],
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,textField,searchField,popupHeight,popupWidth,showStyle,textReadOnly,onGetSearchField,correlateCheck,autoSelected';
		Z._textField = null;
		
		Z._showStyle = 'auto';
		
		Z._popupWidth = 300;

		Z._popupHeight = 300;
		
		Z._contentPanel = null;
		
		Z._pickupField = null;
		
		Z._onGetSearchField = null;
		
		Z._correlateCheck = false;
		
		Z._autoSelected = true;
		
		$super(el, params);
	},

	/**
	 * Get or set the field name of text box.
	 * 
	 * @param textField {String} Field name of text box.
	 * @return {String or this}
	 */
	textField: function(textField) {
		if(textField === undefined) {
			return this._textField;
		}
		jslet.Checker.test('DBComboSelect.textField', textField).required().isString();
		this._textField = textField.trim();
	},
	
	/**
	 * Get or set popup panel height.
	 * 
	 * @param popupHeight {Integer} Popup panel height.
	 * @return {Integer or this}
	 */
	popupHeight: function(popupHeight) {
		if(popupHeight === undefined) {
			return this._popupHeight;
		}
		jslet.Checker.test('DBComboSelect.popupHeight', popupHeight).isGTEZero();
		this._popupHeight = parseInt(popupHeight);
	},

	/**
	 * Get or set popup panel width.
	 * 
	 * @param popupHeight {Integer} Popup panel width.
	 * @return {Integer or this}
	 */
	popupWidth: function(popupWidth) {
		if(popupWidth === undefined) {
			return this._popupWidth;
		}
		jslet.Checker.test('DBComboSelect.popupWidth', popupWidth).isGTEZero();
		this._popupWidth = parseInt(popupWidth);
	},
		
	/**
	 * Get or set panel content style.
	 * 
	 * @param {String} Optional value: auto, table, tree.
	 * @return {String or this}
	 */
	showStyle: function(showStyle) {
		if(showStyle === undefined) {
			return this._showStyle;
		}
		showStyle = jQuery.trim(showStyle);
		var checker = jslet.Checker.test('DBComboSelect.showStyle', showStyle).isString();
		showStyle = showStyle.toLowerCase();
		checker.testValue(showStyle).inArray(this.showStyles);
		this._showStyle = showStyle;
	},
	
	/**
	 * Get or set onGetSearchField event handler.
	 * 
	 * @param {Function} Optional onGetSearchField event handler.
	 * @return {Function or this}
	 */
	onGetSearchField: function(onGetSearchField) {
		if(onGetSearchField === undefined) {
			return this._onGetSearchField;
		}
		this._onGetSearchField = onGetSearchField;
	},
	
	/**
	 * Identify if correlate check the tree nodes or not.
	 * 
	 * @param {Boolean} correlateCheck 
	 * @return {Boolean or this}
	 */
	correlateCheck: function(correlateCheck) {
		if(correlateCheck === undefined) {
			return this._correlateCheck;
		}
		this._correlateCheck = correlateCheck;
	},
	
	/**
	 * Automatically select the finding record when searching record.
	 * 
	 * @param {Boolean} autoSelected true - Automatically select record, false - otherwise.
	 * @return {Boolean or this}
	 */
	autoSelected: function(autoSelected) {
		if(autoSelected === undefined) {
			return this._autoSelected;
		}
		this._autoSelected = autoSelected;
	},
	
	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return true;
	},

	/**
	 * @override
	 */
	afterBind: function ($super) {
		$super();
		
		if (this._contentPanel) {
			this._contentPanel = null;
		}
	},

	buttonClick: function (btnEle) {
		var Z = this, 
			el = Z.el, 
			fldObj = Z._dataset.getField(Z._field), 
			lkf = fldObj.lookup(),
			jqEl = jQuery(el);
		if (fldObj.readOnly() || fldObj.disabled()) {
			return;		
		}
		if (lkf === null || lkf === undefined) {
			throw new Error(Z._field + ' is NOT a lookup field!');
		}
		var style = Z._showStyle;
		if (Z._showStyle == 'auto') {
			style = lkf.parentField() ? 'tree' : 'table';
		}
		if (!Z._contentPanel) {
			Z._contentPanel = new jslet.ui.DBComboSelectPanel(Z);
			Z._contentPanel.showStyle = style;
			Z._contentPanel.customButtonLabel = Z.customButtonLabel;
			Z._contentPanel.onCustomButtonClick = Z.onCustomButtonClick;
			if (Z._popupWidth) {
				Z._contentPanel.popupWidth = Z._popupWidth;
			}
			if (Z._popupHeight) {
				Z._contentPanel.popupHeight = Z._popupHeight;
			}
		}
		jslet.ui.PopupPanel.excludedElement = btnEle;
		var r = jqEl.offset(), h = jqEl.outerHeight(), x = r.left, y = r.top + h;
		if (jslet.locale.isRtl){
			x = x + jqEl.outerWidth();
		}
		Z._contentPanel.showPopup(x, y, 0, h);
	},
	
	closePopup: function(){
		if(this._contentPanel) {
			this._contentPanel.closePopup();
		}
		this._contentPanel = null;
	},
	
	/**
	 * @override
	 */
	doLookupChanged: function (isMetaChanged) {
		if(isMetaChanged) {
			this._destroyPopPanel();
		}
	},
	
	_destroyPopPanel: function() {
		var Z = this;
		if (Z._contentPanel){
			Z._contentPanel.destroy();
			Z._contentPanel = null;
		}
		jslet.ui.PopupPanel.excludedElement = null;		
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		this._destroyPopPanel();
		$super();
	}
});

jslet.ui.DBComboSelectPanel = function (comboSelectObj) {
	var Z = this;

	Z.showStyle = 'auto';

	Z.customButtonLabel = null;
	Z.onCustomButtonClick = null;
	Z.popupWidth = 350;
	Z.popupHeight = 350;
	Z._isShowing = false;
	
	var otree, otable, showType, valueSeperator = ',', lkf, lkds, self = this;
	Z.comboSelectObj = comboSelectObj;

	Z.dataset = comboSelectObj._dataset;
	Z.field = comboSelectObj._field;
	Z.fieldObject = Z.dataset.getField(Z.field);
	Z.panel = null;
	Z.searchBoxEle = null;
	
	Z.popup = new jslet.ui.PopupPanel();
	Z.popup.onHidePopup = function() {
		Z._isShowing = false;
		Z._restoreLkDsEvent();
		if(Z.comboSelectObj) {
			Z.comboSelectObj.focus();
		}
	};
	Z._confirmSelectDebounce = jslet.debounce(this._confirmSelect, 50);
};

jslet.ui.DBComboSelectPanel.prototype = {
		
	lookupDs: function() {
		return this.fieldObject.lookup().dataset();
	},
	
	isMultiple: function() {
		return this.fieldObject && this.fieldObject.valueStyle() === jslet.data.FieldValueStyle.MULTIPLE;
	},
		
	showPopup: function (left, top, ajustX, ajustY) {
		var Z = this;
		if(Z._isShowing) {
			return;
		}
		Z._initSelected();
		var showType = Z.showStyle.toLowerCase();
		if (!Z.panel) {
			Z.panel = Z._create();
		} else {
			var ojslet = Z.otree ? Z.otree : Z.otable;
			ojslet.dataset().addLinkedControl(ojslet);
			window.setTimeout(function(){
				ojslet.renderAll();
			}, 1);
		}
		if(showType == 'table') {
			var fields = Z.lookupDs().getNormalFields(),
				fldObj, totalChars = 0;
			for(var i = 0, len = fields.length; i < len; i++) {
				fldObj = fields[i];
				if(fldObj.visible()) {
					totalChars += fldObj.displayWidth();
				}
			}
			var totalWidth = totalChars * (jslet.global.defaultCharWidth || 12) + 40;
			Z.popupWidth = totalWidth;
			if(Z.popupWidth < 150) {
				Z.popupWidth = 150;
			}
			if(Z.popupWidth > 500) {
				Z.popupWidth = 500;
			}
		}
		Z._setLookupDsEvent();
		Z._isShowing = true;
		Z.popup.setContent(Z.panel, '100%', '100%');
		Z.popup.show(left, top, Z.popupWidth, Z.popupHeight, ajustX, ajustY);
		Z._showTips(jslet.locale.DBComboSelect.find);
		Z._focus();
	},

	closePopup: function () {
		var Z = this;
		Z.popup.hide();
		var dispCtrl = Z.otree ? Z.otree : Z.otable;
		if(dispCtrl) {
			dispCtrl.dataset().removeLinkedControl(dispCtrl);
		}
	},
	
	_setLookupDsEvent: function() {
		var Z = this;
		if(Z.isMultiple()) {
			var fldObj = Z.dataset.getField(Z.field),
				lkfld = fldObj.lookup();
			var lkDs = lkfld.dataset();
			Z._oldLkDsCheckSelectable = null;
			if(lkfld.onlyLeafLevel()) {
				Z._oldLkDsCheckSelectable = lkDs.onCheckSelectable();
				lkDs.onCheckSelectable(function(){
					return !this.hasChildren();
				});
			}

			lkDs = Z.lookupDs();
			Z._oldLkDsListener = lkDs.datasetListener();
			lkDs.datasetListener(function(eventType) {
				if(Z._oldLkDsListener) {
					Z._oldLkDsListener.call(lkDs, eventType);
				}
				if(eventType === jslet.data.DatasetEvent.AFTERSELECT) {
					Z._confirmSelectDebounce.call(Z);
				}
			});
		}
		
	},
	
	_restoreLkDsEvent: function() {
		var Z = this;
		if(Z.isMultiple()) {
			var fldObj = Z.dataset.getField(Z.field),
				lkfld = fldObj.lookup();
			var lkDs = lkfld.dataset();
			lkDs.onCheckSelectable(Z._oldLkDsCheckSelectable? Z._oldLkDsCheckSelectable: null);
			lkDs.datasetListener(Z._oldLkDsListener? Z._oldLkDsListener: null);
		}
		
	},
	
	_create: function () {
		var Z = this;
		if (!Z.panel) {
			Z.panel = document.createElement('div');
		}

		//process variable
		var fldObj = Z.dataset.getField(Z.field),
			lkfld = fldObj.lookup(),
			pfld = lkfld.parentField(),
			showType = Z.showStyle.toLowerCase(),
			lkds = Z.lookupDs();

		var template = ['<div class="jl-combopnl-tip" style="display:none"></div>',
		                '<div class="jl-combopnl-head"><label class="col-xs-4"></label>',
		                '<div class="col-xs-8 input-group input-group-sm">',
		                '<input class="form-control" type="text" size="10"></input>',
		                '<span class="input-group-btn">',
		                '<button class="jl-combopnl-search btn btn-secondary" type="button"><i class="fa fa-search"></i></button>',
		                '<button class="jl-combopnl-closesearch btn btn-secondary" type="button"><i class="fa fa-times"></i></button>',
		                '</span>',
		                '</div></div>',
		                '<div class="jl-combopnl-content"></div>'];

		Z.panel.innerHTML = template.join('');
		var jqPanel = jQuery(Z.panel),
			jqPh = jqPanel.find('.jl-combopnl-head');
		jqPanel.on('keydown', function(event){
			var keyCode = event.which;
			if(keyCode === jslet.ui.KeyCode.ESCAPE) {
				Z.closePopup();
			}
			if(event.ctrlKey && keyCode === jslet.ui.KeyCode.F) {
				jqPanel.find('.jl-combopnl-head').slideDown();
				Z.searchBoxEle.focus();
				event.preventDefault();
	       		event.stopImmediatePropagation();
				return false;
			}
		});
		Z.searchBoxEle = jqPh.find('input')[0];
		jQuery(Z.searchBoxEle).on('keydown', jQuery.proxy(Z._findData, Z));
		
		jqPanel.find('.jl-combopnl-closesearch').click(function() {
			jqPanel.find('.jl-combopnl-head').slideUp();
			Z._focus();
		});
		var contentPanel = jqPanel.find('.jl-combopnl-content')[0];

		//create popup content
		if (showType == 'tree') {
			var treeParam = { 
				type: 'DBTreeView', 
				dataset: lkds, 
				readOnly: false, 
				displayFields: lkfld.displayFields(), 
				hasCheckBox: Z.isMultiple(),
				expandLevel:1
			};

			if (!Z.isMultiple()) {
				treeParam.onItemClick = jQuery.proxy(Z._confirmAndClose, Z);
			}
			treeParam.correlateCheck = Z.comboSelectObj.correlateCheck();
			window.setTimeout(function(){
				Z.otree = jslet.ui.createControl(treeParam, contentPanel, '100%', '100%');
			}, 1);
		} else {
			var tableParam = { type: 'DBTable', dataset: lkds, readOnly: true, hasSelectCol: Z.isMultiple(), hasSeqCol: false, 
					hasFindDialog: false, hasFilterDialog: false };
			if (!Z.isMultiple()) {
				tableParam.onRowClick = jQuery.proxy(Z._confirmAndClose, Z);
			}
			window.setTimeout(function(){
				Z.otable = jslet.ui.createControl(tableParam, contentPanel, '100%', '100%');
			}, 1);
		}
		return Z.panel;
	},

	_initSelected: function () {
		var Z = this;
		var fldValue = Z.comboSelectObj.getValue(), 
			lkds = Z.lookupDs();

		var fldObj = Z.dataset.getField(Z.field),
			lkfld = fldObj.lookup();

		if(lkfld.onlyLeafLevel()) {
			lkds.onCheckSelectable(function(){
				return !this.hasChildren();
			});
		}
		if (!Z.isMultiple()) {
			if (fldValue) {
				lkds.findByKey(fldValue);
			}
			return;
		}
		lkds.disableControls();
		try {
			lkds.selectAll(false);
			if (fldValue) {
				var arrKeyValues = fldValue;
				if(!jslet.isArray(fldValue)) {
					arrKeyValues = fldValue.split(jslet.global.valueSeparator);
				}
				for (var i = 0, len = arrKeyValues.length; i < len; i++){
					lkds.selectByKeyValue(true, arrKeyValues[i]);
				}
			}
		} finally {
			lkds.enableControls();
		}
	},

	_findData: function (event) {
		event = jQuery.event.fix( event || window.event );
		if (event.which != 13) {//enter
			return;
		}
		var Z = this;
		var findFldName = Z.comboSelectObj.searchField, 
			findingValue = this.searchBoxEle.value;
		if (!findingValue) {
			return;
		}
		var eventFunc = jslet.getFunction(Z.comboSelectObj.onGetSearchField);
		if (eventFunc) {
			findFldName = eventFunc.call(findingValue);
		}
		var findFldNames = null;
		var lkds = Z.lookupDs();
		if(!findFldName) {
			findFldNames = [];
			var fields = lkds.getNormalFields(), fldObj;
			for(var i = 0, len = fields.length; i < len; i++) {
				fldObj = fields[i];
				if(fldObj.visible()) {
					findFldNames.push(fldObj.name());
				}
			}
		} else {
			findFldNames = findFldName.split(',');
		}
		if(!findFldNames || findFldNames.length === 0) {
			console.warn('Search field NOT specified! Can\'t search data!');
			return;
		}
		var	currRecno = lkds.recno() + 1;
		var found = lkds.findByField(findFldNames, findingValue, currRecno, true, 'any');
		if(!found) {
			found = lkds.findByField(findFldNames, findingValue, 0, true, 'any');
		}
		if(found && Z.comboSelectObj.autoSelected()) {
			lkds.select(true);
		}
		if(!found) {
			Z._showTips(jslet.locale.DBComboSelect.notFound);
		}
		event.currentTarget.focus();
		return;
		
	},

	_focus: function() {
		var Z = this;
		window.setTimeout(function(){
			var dbCtrl = Z.otable || Z.otree;
			if(dbCtrl) {
				dbCtrl.el.focus();
			}
		}, 10);
	},
	
	_showTips: function (tips) {
		var jqPanel = jQuery(this.panel);
		jqPanel.find('.jl-combopnl-tip').html(tips).slideDown();
		window.setTimeout(function() {
			jqPanel.find('.jl-combopnl-tip').slideUp();
		}, 1500);
	},
	
	_confirmSelect: function () {
		var Z = this;
		var fldValue = Z.comboSelectObj.getValue(),
			fldObj = Z.dataset.getField(Z.field),
			lkfld = fldObj.lookup(),
			isMulti = Z.isMultiple(),
			lookupDs = Z.lookupDs();
		
		if (isMulti) {
			fldValue = lookupDs.selectedKeyValues();
		} else {
			fldValue = lookupDs.keyValue();
		}

		Z.dataset.setFieldValue(Z.field, fldValue, Z._valueIndex);
		if (!isMulti && Z.comboSelectObj._afterSelect) {
			Z.comboSelectObj._afterSelect(Z.dataset, lookupDs);
		}
	},
	
	_confirmAndClose: function () {
		this._confirmSelect();
		this.closePopup();
	},

	destroy: function(){
		var Z = this;
		Z._restoreLkDsEvent();
		Z.popup.onHidePopup = null;
		if (Z.otree){
			Z.otree.destroy();
			Z.otree = null;
		}
		if (Z.otable){
			Z.otable.destroy();
			Z.otable = null;
		}
		Z.comboSelectObj = null;
		
		jQuery(Z.searchBoxEle).off();
		Z.fieldObject = null;
		
		Z.searchBoxEle = null;
		Z.popup = null;
		Z.panel = null;
	}
};

jslet.ui.register('DBComboSelect', jslet.ui.DBComboSelect);
jslet.ui.DBComboSelect.htmlTemplate = '<div></div>';

/*!
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
		jQuery(this.el).addClass('form-control-static jl-datalabel');//Bootstrap class
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


/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBDatePicker. Example:
 * <pre><code>
 * var jsletParam = {type:"DBDatePicker",dataset:"employee",field:"birthday", textReadOnly:true};
 * 
 * //1. Declaring:
 * &lt;div data-jslet='type:"DBDatePicker",dataset:"employee",field:"birthday", textReadOnly:true' />
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
jslet.ui.DBDatePicker = jslet.Class.create(jslet.ui.DBCustomComboBox, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,textReadOnly,popupWidth, popupHeight';
		
		/**
		 * {Integer} Popup panel width
		 */
		Z._popupWidth = 260;

		/**
		 * {Integer} Popup panel height
		 */
		Z._popupHeight = 226;

		Z.popup = new jslet.ui.PopupPanel();
		
		Z.popup.onHidePopup = function() {
			Z.focus();
		};
		
		Z.comboButtonCls = 'fa-calendar';

		$super(el, params);
	},

	popupHeight: function(popupHeight) {
		if(popupHeight === undefined) {
			return this._popupHeight;
		}
		jslet.Checker.test('DBDatePicker.popupHeight', popupHeight).isGTEZero();
		this._popupHeight = parseInt(popupHeight);
	},

	popupWidth: function(popupWidth) {
		if(popupWidth === undefined) {
			return this._popupWidth;
		}
		jslet.Checker.test('DBDatePicker.popupWidth', popupWidth).isGTEZero();
		this._popupWidth = parseInt(popupWidth);
	},
		
	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return true;
	},

	buttonClick: function (btnEle) {
		var el = this.el, 
			Z = this, 
			fldObj = Z._dataset.getField(Z._field),
			jqEl = jQuery(el);
		if (fldObj.readOnly() || fldObj.disabled()) {
			return;
		}
		var width = Z._popupWidth,
			height = Z._popupHeight,
			dateValue = Z.getValue(),
			range = fldObj.dataRange(),
			minDate = null,
			maxDate = null;
		
		if (range){
			if (range.min) {
				minDate = range.min;
			}
			if (range.max) {
				maxDate = range.max;
			}
		}
		if (!Z.contentPanel) {
			Z.contentPanel = jslet.ui.createControl({ type: 'Calendar', value: dateValue, minDate: minDate, maxDate: maxDate,
				onDateSelected: function (date) {
					Z._dataset.setFieldValue(Z._field, new Date(date.getTime()), Z._valueIndex);
					Z.popup.hide();
					try {
						Z.el.focus();
					} catch(e) {
						//Ignore
					}
				}
			}, null, width + 'px', height + 'px', true); //Hide panel first
		}
		
		jslet.ui.PopupPanel.excludedElement = btnEle;//event.element();
		var r = jqEl.offset(), 
			h = jqEl.outerHeight(), 
			x = r.left, y = r.top + h;
		if (jslet.locale.isRtl){
			x = x + jqEl.outerWidth();
		}
		Z.popup.setContent(Z.contentPanel.el, '100%', '100%');
		Z.contentPanel.el.style.display = 'block';
		Z.contentPanel.setValue(dateValue);
		Z.popup.show(x, y, width + 3, height + 3, 0, h);
		Z.contentPanel.focus();
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this;
		if(Z.contentPanel) {
			Z.contentPanel.destroy();
			Z.contentPanel = null;
		}
		Z.popup.destroy();
		Z.popup = null;
		$super();
	}
	
});

jslet.ui.register('DBDatePicker', jslet.ui.DBDatePicker);
jslet.ui.DBDatePicker.htmlTemplate = '<div></div>';

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

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBImage. 
 * Display an image which store in database or which's path store in database. 
 * Example:
 * <pre><code>
 * var jsletParam = {type:"DBImage",dataset:"employee",field:"photo"};
 * 
 * //1. Declaring:
 * &lt;img data-jslet='{type:"DBImage",dataset:"employee",field:"photo"}' />
 * or
 * &lt;img data-jslet='jsletParam' />
 *
 *  //2. Binding
 * &lt;img id="ctrlId"  />
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
jslet.ui.DBImage = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,locked,baseUrl,altField';
		/**
		 * Stop refreshing image when move dataset's cursor.
		 */
		Z._locked = false;
		/**
		 * {String} The base url
		 */
		Z._baseUrl = null;
		
		Z._altField = null;
		$super(el, params);
	},

	baseUrl: function(baseUrl) {
		if(baseUrl === undefined) {
			return this._baseUrl;
		}
		baseUrl = jQuery.trim(baseUrl);
		jslet.Checker.test('DBImage.baseUrl', baseUrl).isString();
		this._baseUrl = baseUrl;
	},
   
	altField: function(altField) {
		if(altField === undefined) {
			return this._altField;
		}
		altField = jQuery.trim(altField);
		jslet.Checker.test('DBImage.altField', altField).isString();
		this._altField = altField;
	},
   
	locked: function(locked) {
		if(locked === undefined) {
			return this._locked;
		}
		this._locked = locked;
	},
   
	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return el.tagName.toLowerCase() == 'img';
	},

	/**
	 * @override
	 */
	bind: function () {
		this.renderAll();
		jQuery(this.el).addClass('img-responsive img-rounded');
		
	}, // end bind

	/**
	 * @override
	 */
	doValueChanged: function() {
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if (Z._locked) {
			Z.el.alt = jslet.locale.DBImage.lockedImageTips;
			Z.el.src = '';
			return;
		}

		var srcURL = Z.getValue();
		if (!srcURL) {
			srcURL = '';
		} else {
			if (Z._baseUrl) {
				srcURL = Z._baseUrl + srcURL;
			}
		}
		if (Z.el.src != srcURL) {
			var altText = srcURL;
			if(Z._altField) {
				altText = Z._dataset.getFieldText(Z._altField);
			}
			Z.el.alt = altText;
			Z.el.src = srcURL;
		}
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

jslet.ui.register('DBImage', jslet.ui.DBImage);
jslet.ui.DBImage.htmlTemplate = '<img></img>';

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBLabel. 
 * Display field name, use this control to void hard-coding field name, and you can change field name dynamically. 
 * Example:
 * <pre><code>
 * var jsletParam = {type:"DBLabel",dataset:"employee",field:"department"};
 * 
 * //1. Declaring:
 * &lt;label data-jslet='type:"DBLabel",dataset:"employee",field:"department"' />
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
jslet.ui.DBLabel = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		this.allProperties = 'styleClass,dataset,field';
		this.isLabel = true;
		$super(el, params);
	},

	/**
	 * @override
	 */
	bind: function () {
		jQuery(this.el).addClass('control-label');
		this.renderAll();
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
	doMetaChanged: function(metaName) {
		if(metaName && jslet.ui.DBLabel.METANAMES.indexOf(metaName) < 0) {
			return;
		}
		var Z = this, subType = Z._fieldMeta,
			fldObj = Z._dataset.getField(Z._field),
			content = '';
		if(!fldObj) {
			throw new Error('Field: ' + this._field + ' NOT exist!');
		}
		if((!subType || subType == 'label') && (!metaName || metaName == 'label' || metaName == 'required')) {
			if (fldObj.required()) {
				content += '<span class="jl-lbl-required">' + 
					jslet.ui.DBLabel.REQUIREDCHAR + '</span>';
			}
			content += fldObj.displayLabel();
			Z.el.innerHTML = content || '';
			return;
		}
		if(subType && subType == 'tip' && 
			(!metaName || metaName == subType)) {
			content = fldObj.tip();
			Z.el.innerHTML = content || '';
			return;
		}
		if(subType  && subType == 'error' && 
			(metaName && metaName == subType)) {
			var errObj = Z.getFieldError();
			content = errObj && errObj.message;
			Z.el.innerHTML = content || '';
			return;
		}
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		var jqEl = jQuery(this.el),
			subType = this.fieldMeta();
		
		this.refreshControl(jslet.data.RefreshEvent.updateAllEvent());
		if(subType == 'error') {
			if(!jqEl.hasClass('jl-lbl-error')) {
				jqEl.addClass('jl-lbl-error');
			}
		} else 
		if(subType == 'tip') {
			if(!jqEl.hasClass('jl-lbl-tip')) {
				jqEl.addClass('jl-lbl-tip');
			}
		} else {
			if(!jqEl.hasClass('jl-lbl')) {
				jqEl.addClass('jl-lbl');
			}
		}
	}
});

jslet.ui.DBLabel.REQUIREDCHAR = '*';
jslet.ui.DBLabel.METANAMES = ['label', 'required', 'tip', 'error'];
jslet.ui.register('DBLabel', jslet.ui.DBLabel);
jslet.ui.DBLabel.htmlTemplate = '<label></label>';


/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBList. 
 * Show data on list, it can display tree style or table style. 
 * Example:
 * <pre><code>
 * var jsletParam = {type:"DBList",dataset:"employee",field:"department"};
 * 
 * //1. Declaring:
 * &lt;div data-jslet='type:"DBList",dataset:"employee",field:"department"' />
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
jslet.ui.DBList = jslet.Class.create(jslet.ui.DBFieldControl, {
	showStyles: ['auto', 'table', 'tree'],
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,showStyle,correlateCheck';
		
		Z._showStyle = 'auto';
		
		Z._correlateCheck = false;
		
		$super(el, params);
	},

	/**
	 * Get or set panel content style.
	 * 
	 * @param {String} Optional value: auto, table, tree.
	 * @return {String or this}
	 */
	showStyle: function(showStyle) {
		if(showStyle === undefined) {
			return this._showStyle;
		}
		showStyle = jQuery.trim(showStyle);
		var checker = jslet.Checker.test('DBComboSelect.showStyle', showStyle).isString();
		showStyle = showStyle.toLowerCase();
		checker.testValue(showStyle).inArray(this.showStyles);
		this._showStyle = showStyle;
	},
	
	correlateCheck: function(correlateCheck) {
		if(correlateCheck === undefined) {
			return this._correlateCheck;
		}
		this._correlateCheck = correlateCheck;
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
	bind: function () {
		this.renderAll();
	},
	
	renderAll: function() {
		var Z = this,
			jqEl = jQuery(Z.el);
		if(jqEl.hasClass('jl-dblist')) {
			jqEl.addClass('jl-dblist');
		}
		var fldObj = Z._dataset.getField(Z._field),
			lkfld = fldObj.lookup(),
			pfld = lkfld.parentField(),
			showType = Z._showStyle.toLowerCase(),
			lkds = lkfld.dataset(),
			isMulti = fldObj.valueStyle() === jslet.data.FieldValueStyle.MULTIPLE;
		if(showType == 'auto' && pfld) {
			showType = 'tree';
		}
		if (showType == 'tree') {
			var treeParam = { 
				type: 'DBTreeView', 
				dataset: lkds, 
				readOnly: false, 
				displayFields: lkfld.displayFields(), 
				hasCheckBox: isMulti,
				correlateCheck: Z._correlateCheck,
				expandLevel: 99
			};
			if(isMulti) {
				treeParam.afterCheckBoxClick = function() {
					Z.updateToDataset();
				};
			} else {
				treeParam.onItemClick = function() {
					Z.updateToDataset();
				};
			}
	
			window.setTimeout(function() {
				jslet.ui.createControl(treeParam, Z.el, '100%', '100%');
				jQuery(Z.el.childNodes[0]).on('focus', function(event) {
					jslet.ui.focusManager.activeDataset(Z._dataset.name()).activeField(Z._field).activeValueIndex(Z._valueIndex);
				}).on('blur', function(event) {
					jslet.ui.focusManager.activeDataset(null).activeField(null).activeValueIndex(null);
				});
			}, 1);
		} else {
			var tableParam = { type: 'DBTable', dataset: lkds, readOnly: true, hasSelectCol: isMulti, hasSeqCol: false, hasFindDialog: false, hasFilterDialog: false};
			if(isMulti) {
				tableParam.afterSelect = tableParam.afterSelectAll = function() {
					Z.updateToDataset();
				};
			} else {
				tableParam.onRowClick = function() {
					Z.updateToDataset();
				};
			}
			window.setTimeout(function() {
				jslet.ui.createControl(tableParam, Z.el, '100%', '100%');
			}, 1);
		}
		
	},
	
	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName) {
		$super(metaName);
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if(!metaName || metaName == "disabled" || metaName == "readOnly") {
			Z.el.disabled = true;
		} else {
			Z.el.disabled = false;
		}
		
		if(metaName && metaName == 'required') {
			var jqEl = jQuery(Z.el);
			if (fldObj.required()) {
				jqEl.addClass('jl-ctrl-required');
			} else {
				jqEl.removeClass('jl-ctrl-required');
			}
		}
		
		if(!metaName || metaName == 'tabIndex') {
			Z.setTabIndex();
		}
		
	},
	
	updateToDataset: function () {
		var Z = this;
		if (Z._keep_silence_) {
			return true;
		}
		
		var fldObj = Z._dataset.getField(Z._field),
			lkfld = fldObj.lookup(),
			lkds = lkfld.dataset(),
			isMulti = fldObj.valueStyle() === jslet.data.FieldValueStyle.MULTIPLE,
			value;
		if(!isMulti) {
			value = lkds.keyValue();
		} else {
			value = lkds.selectedKeyValues();
		}
		Z._dataset.editRecord();
		Z._keep_silence_ = true;
		try {
			Z._dataset.setFieldValue(Z._field, value, Z._valueIndex);
		} finally {
			Z._keep_silence_ = false;
		}
		Z.refreshControl(jslet.data.RefreshEvent.updateRecordEvent(Z._field));
		return true;
	}, // end updateToDataset
	
	/**
	 * @override
	 */
	doValueChanged: function() {
		var Z = this;
		if (Z._keep_silence_) {
			return;
		}
		var errObj = Z.getFieldError();
		if(errObj && errObj.message) {
			Z.el.value = errObj.inputText || '';
			Z.renderInvalid(errObj);
			return;
		} else {
			Z.renderInvalid(null);
		}
		var fldObj = Z._dataset.getField(Z._field),
			fldValue = fldObj.getValue(),
			lkfld = fldObj.lookup(),
			pfld = lkfld.parentField(),
			lkds = lkfld.dataset(),
			isMulti = fldObj.valueStyle() === jslet.data.FieldValueStyle.MULTIPLE;
		if(!isMulti) {
			lkds.findByKey(fldValue);
		} else {
			lkds.disableControls();
			try {
				lkds.selectAll(false);
				if(fldValue) {
					for(var i = 0, len = fldValue.length; i < len; i++) {
						lkds.findByKey(fldValue[i]);
						lkds.selected(true);
					}
				}
			} finally {
				lkds.enableControls();
			}
		}
	},

	/**
	 * @override
	 */
	destroy: function($super) {
		var Z = this;
		$super();
	}
});

jslet.ui.register('DBList', jslet.ui.DBList);
jslet.ui.DBList.htmlTemplate = '<div></div>';

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


/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBRadioGroup. 
 * Display a group of radio that user can select one option. Example:
 * <pre><code>
 * var jsletParam = {type:"DBRadioGroup",dataset:"employee",field:"department"};
 * 
 * //1. Declaring:
 * &lt;div data-jslet='type:"DBRadioGroup",dataset:"employee",field:"department"'' />
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
jslet.ui.DBRadioGroup = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,columnCount';
		/**
		 * {Integer} Column count
		 */
		Z._columnCount = 99999;
		
		Z._itemIds = null;
		
		$super(el, params);
	},

	columnCount: function(columnCount) {
		if(columnCount === undefined) {
			return this._columnCount;
		}
		jslet.Checker.test('DBRadioGroup.columnCount', columnCount).isGTEZero();
		this._columnCount = parseInt(columnCount);
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
		var jqEl = jQuery(Z.el);
		jqEl.on('keydown', function(event) {
			var keyCode = event.which, idx, activeEle, activeId;
			
			if(keyCode === jslet.ui.KeyCode.LEFT) { //Arrow Left
				if(!Z._itemIds || Z._itemIds.length === 0) {
					return;
				}
				activeEle = document.activeElement;
				activeId = activeEle && activeEle.id;
				
				idx = Z._itemIds.indexOf(activeId);
				if(idx === 0) {
					return;
				}
				document.getElementById(Z._itemIds[idx - 1]).focus();
				event.preventDefault();
	       		event.stopImmediatePropagation();
			} else if( keyCode === jslet.ui.KeyCode.RIGHT) { //Arrow Right
				if(!Z._itemIds || Z._itemIds.length === 0) {
					return;
				}
				activeEle = document.activeElement;
				activeId = activeEle && activeEle.id;
				
				idx = Z._itemIds.indexOf(activeId);
				if(idx === Z._itemIds.length - 1) {
					return;
				}
				document.getElementById(Z._itemIds[idx + 1]).focus();
				event.preventDefault();
	       		event.stopImmediatePropagation();
			}
		});
		jqEl.on('click', 'input[type="radio"]', function(event){
			var ctrl = this;
			window.setTimeout(function(){ //Defer firing 'updateToDataset' when this control is in DBTable to make row changed firstly.
				event.delegateTarget.jslet.updateToDataset(ctrl);
			}, 5);
		});
		jqEl.on('focus', 'input[type="radio"]', function (event) {
			jslet.ui.focusManager.activeDataset(Z._dataset.name()).activeField(Z._field).activeValueIndex(Z._valueIndex);
		});
		jqEl.on('blur', 'input[type="radio"]', function (event) {
			jslet.ui.focusManager.activeDataset(null).activeField(null).activeValueIndex(null);
		});
		jqEl.addClass('form-control');
		jqEl.css('height', 'auto');
	},

	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName) {
		$super(metaName);
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if(!metaName || metaName == "disabled" || metaName == "readOnly" || metaName == 'tabIndex') {
			var disabled = fldObj.disabled(),
				readOnly = fldObj.readOnly();
		
			Z.disabled = disabled || readOnly;
			disabled = Z.disabled;
			var radios = jQuery(Z.el).find('input[type="radio"]'),
				required = fldObj.required(),
				radioEle,
				tabIdx = fldObj.tabIndex();
			
			for(var i = 0, cnt = radios.length; i < cnt; i++){
				radioEle = radios[i];
				jslet.ui.setEditableStyle(radioEle, disabled, readOnly, false, required);
				radioEle.tabIndex = tabIdx;
			}
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
		var value = Z.getValue(),
			radios = jQuery(Z.el).find('input[type="radio"]'), 
			radio;
		for(var i = 0, cnt = radios.length; i < cnt; i++){
			radio = radios[i];
			radio.checked = (value == jQuery(radio.parentNode).attr('value'));
		}
	},
	
	/**
	 * @override
	 */
	doLookupChanged: function () {
		var Z = this;
		var fldObj = Z._dataset.getField(Z._field), lkf = fldObj.lookup();
		if (!lkf) {
			console.error(jslet.formatMessage(jslet.locale.Dataset.lookupNotFound,
					[fldObj.name()]));
			return;
		}
		var lkds = lkf.dataset(),
			cnt = lkds.recordCount();
		if(cnt === 0) {
			Z.el.innerHTML = jslet.locale.DBRadioGroup.noOptions;
			return;
		}
		var oldRecno = lkds.recno();
		try {
			var template = ['<table cellpadding="0" cellspacing="0">'],
				isNewRow = false, 
				itemId;
			var editFilter = lkf.editFilter();
			Z._innerEditFilterExpr = null;
			var editItemDisabled = lkf.editItemDisabled();
			if(editFilter) {
				Z._innerEditFilterExpr = new jslet.Expression(lkds, editFilter);
			}
			var disableOption = false, k = -1;
			
			Z._itemIds = [];
			for (var i = 0; i < cnt; i++) {
				lkds.recnoSilence(i);
				disableOption = false;
				if(Z._innerEditFilterExpr && !Z._innerEditFilterExpr.eval()) {
					if(!editItemDisabled) {
						continue;
					} else {
						disableOption = true;
					}
				}
				k++;
				isNewRow = (k % Z._columnCount === 0);
				if (isNewRow) {
					if (k > 0) {
						template.push('</tr>');
					}
					template.push('<tr>');
				}
				itemId = jslet.nextId();
				Z._itemIds.push(itemId);
				template.push('<td style="white-space: nowrap;vertical-align:middle" value="');
				template.push(lkds.getFieldValue(lkf.keyField()));
				template.push('"><input name="');
				template.push(Z._field);
				template.push('" type="radio" id="');
				template.push(itemId);
				template.push('" ' + (disableOption? ' disabled': '') + '/><label for="');
				template.push(itemId);
				template.push('">');
				template.push(lkf.getCurrentDisplayValue());
				template.push('</label></td>');
			} // end while
			if (cnt > 0) {
				template.push('</tr>');
			}
			template.push('</table>');
			Z.el.innerHTML = template.join('');
		} finally {
			lkds.recnoSilence(oldRecno);
		}
		Z.doMetaChanged();
	}, // end renderOptions

	updateToDataset: function(currCheckBox) {
		var Z = this;
		if (Z._keep_silence_ || Z.disabled) {
			return;
		}
		Z._keep_silence_ = true;
		try {
			Z._dataset.setFieldValue(Z._field, jQuery(currCheckBox.parentNode).attr('value'));
			currCheckBox.checked = true;
		} finally {
			Z._keep_silence_ = false;
		}
	},
	
	/**
	 * @override
	 */
	innerFocus: function() {
		var itemIds = this._itemIds;
		if (itemIds && itemIds.length > 0) {
			document.getElementById(itemIds[0]).focus();
		}
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this, 
			jqEl = jQuery(Z.el);
		if(!jqEl.hasClass("jl-radiogroup")) {
			jqEl.addClass("jl-radiogroup");
		}
		Z.refreshControl(jslet.data.RefreshEvent.updateAllEvent(), true);
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var jqEl = jQuery(this.el);
		jqEl.off();
		$super();
	}
});

jslet.ui.register('DBRadioGroup', jslet.ui.DBRadioGroup);
jslet.ui.DBRadioGroup.htmlTemplate = '<div></div>';

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBRangeSelect. 
 * Display a select which options produce with 'beginItem' and 'endItem'. Example:
 * <pre><code>
 * var jsletParam = {type:"DBRangeSelect",dataset:"employee",field:"age",beginItem:10,endItem:100,step:5};
 * 
 * //1. Declaring:
 * &lt;select data-jslet='type:"DBRangeSelect",dataset:"employee",field:"age",beginItem:10,endItem:100,step:5' />
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
"use strict";
jslet.ui.DBRangeSelect = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,beginItem,endItem,step';
		if (!Z.requiredProperties) {
			Z.requiredProperties = 'field,beginItem,endItem,step';
		}

		/**
		 * {Integer} Begin item 
		 */
		Z._beginItem = 0;
		/**
		 * {Integer} End item
		 */
		Z._endItem = 10;
		/**
		 * {Integer} Step
		 */
		Z._step = 1;
		
		$super(el, params);
	},

	beginItem: function(beginItem) {
		if(beginItem === undefined) {
			return this._beginItem;
		}
		jslet.Checker.test('DBRangeSelect.beginItem', beginItem).isNumber();
		this._beginItem = parseInt(beginItem);
	},

	endItem: function(endItem) {
		if(endItem === undefined) {
			return this._endItem;
		}
		jslet.Checker.test('DBRangeSelect.endItem', endItem).isNumber();
		this._endItem = parseInt(endItem);
	},

	step: function(step) {
		if(step === undefined) {
			return this._step;
		}
		jslet.Checker.test('DBRangeSelect.step', step).isNumber();
		this._step = parseInt(step);
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
		var jqEl = jQuery(Z.el);
		jqEl.on('change', Z._doChanged);// end observe
		jqEl.focus(function(event) {
			jslet.ui.focusManager.activeDataset(Z._dataset.name()).activeField(Z._field).activeValueIndex(Z._valueIndex);
		});
		jqEl.blur(function(event) {
			jslet.ui.focusManager.activeDataset(null).activeField(null).activeValueIndex(null);
		});
		if(Z.el.multiple) {
			jqEl.on('click', 'option', function () {
				Z._currOption = this;
			});// end observe
		}
		jqEl.addClass('form-control');//Bootstrap class
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
				var values = Z.getValue(),
					count = 1;
				if(jslet.isArray(values)) {
					count = values.length;
				}
				if (count >= limitCount) {
					jslet.showInfo(jslet.formatMessage(jslet.locale.DBCheckBoxGroup.invalidCheckedCount,
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
		
	renderOptions: function () {
		var Z = this,
			arrhtm = [];
		
		var fldObj = Z._dataset.getField(Z._field);
		if (!fldObj.required()){
			arrhtm.push('<option value="_null_">');
			arrhtm.push(fldObj.nullText());
			arrhtm.push('</option>');
		}

		for (var i = Z._beginItem; i <= Z._endItem; i += Z._step) {
			arrhtm.push('<option value="');
			arrhtm.push(i);
			arrhtm.push('">');
			arrhtm.push(i);
			arrhtm.push('</option>');
		}
		jQuery(Z.el).html(arrhtm.join(''));
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
			jslet.ui.setEditableStyle(Z.el, disabled, disabled, true, fldObj.required());
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
		if (Z._keep_silence_) {
			return;
		}

		if (!Z.el.multiple) {
			var value = Z.getValue();
			if (value !== null) {
				Z.el.value = value;
			} else {
				Z.el.value = null;
			}
		} else {
			var arrValue = Z.getValue(),
				optCnt = Z.el.options.length, opt, selected, i;
			Z._keep_silence_ = true;
			try {
				for (i = 0; i < optCnt; i++) {
					opt = Z.el.options[i];
					if (opt) {
						opt.selected = false;
					}
				}

				var j, vcnt = arrValue.length - 1;
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
	},
	
	focus: function() {
		this.el.focus();
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		this.renderOptions();
		this.refreshControl(jslet.data.RefreshEvent.updateAllEvent(), true);
	},

	updateToDataset: function () {
		var Z = this;
		if (Z._keep_silence_) {
			return;
		}
		var value,
			isMulti = Z.el.multiple;
		if (!isMulti) {
			value = Z.el.value;
			var fldObj = Z._dataset.getField(Z._field);
			if (value == '_null_' && !fldObj.required()) {
				value = null;
			}
		} else {
			var opts = jQuery(Z.el).find('option'),
				optCnt = opts.length - 1, opt;
			value = [];
			for (var i = 0; i <= optCnt; i++) {
				opt = opts[i];
				if (opt.selected) {
					value.push(opt.value);
				}
			}
		}
		Z._keep_silence_ = true;
		try {
			if (!isMulti) {
				Z._dataset.setFieldValue(Z._field, value, Z._valueIndex);
			} else {
				Z._dataset.setFieldValue(Z._field, value);
			}
		} finally {
			Z._keep_silence_ = false;
		}
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		jQuery(this.el).off();
		$super();
	}
});

jslet.ui.register('DBRangeSelect', jslet.ui.DBRangeSelect);
jslet.ui.DBRangeSelect.htmlTemplate = '<select></select>';

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBRating. 
 * A control which usually displays some star to user, and user can click to rate something. Example:
 * <pre><code>
 * var jsletParam = {type:"DBRating",dataset:"employee",field:"grade", itemCount: 5};
 * 
 * //1. Declaring:
 * &lt;div data-jslet='type:"DBRating",dataset:"employee",field:"grade"', itemCount: 5' />
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
jslet.ui.DBRating = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,itemCount,splitCountitemWidth';
		/**
		 * {Integer} Rate item count, In other words, the count of 'Star' sign.
		 */
		Z._itemCount = 5;
		/**
		 * {Integer} You can use it to split the 'Star' sign to describe decimal like: 1.5, 1.25.
		 * SplitCount equals 2, that means cut 'Star' sign into two part, it can express: 0, 0.5, 1, 1.5, ...
		 */
		Z._splitCount = 1;
		/**
		 * {Integer} The width of one 'Star' sign.
		 */
		Z._itemWidth = 20;
		/**
		 * {Boolean} Required or not. If it is not required, you can rate 0 by double clicking first item. 
		 */
		Z._required = false;
		/**
		 * {Boolean} read only or not.
		 */
		Z._readOnly = false;
		
		$super(el, params);
	},

	itemCount: function(itemCount) {
		if(itemCount === undefined) {
			return this._itemCount;
		}
		jslet.Checker.test('DBRating.itemCount', itemCount).isGTZero();
		this._itemCount = parseInt(itemCount);
	},

	splitCount: function(splitCount) {
		if(splitCount === undefined) {
			return this._splitCount;
		}
		jslet.Checker.test('DBRating.splitCount', splitCount).isGTZero();
		this._splitCount = parseInt(splitCount);
	},

	itemWidth: function(itemWidth) {
		if(itemWidth === undefined) {
			return this._itemWidth;
		}
		jslet.Checker.test('DBRating.itemWidth', itemWidth).isGTZero();
		this._itemWidth = parseInt(itemWidth);
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
	bind: function () {
		var Z = this;

		Z.renderAll();
		var jqEl = jQuery(Z.el);
		jqEl.on('mousedown', 'td', Z._mouseDown);
		jqEl.on('mousemove', 'td', Z._mouseMove);
		jqEl.on('mouseout', 'td', Z._mouseOut);
		jqEl.on('mouseup', 'td', Z._mouseUp);
	}, // end bind

	_mouseMove: function domove(event) {
		event = jQuery.event.fix( event || window.event );
		var rating = event.delegateTarget, Z = rating.jslet;
		if (Z._readOnly) {
			return;
		}
		var jqRating = jQuery(rating),
			x1 = event.pageX - jqRating.offset().left,
			k = Math.ceil(x1 / Z.splitWidth), offsetW,
			oRow = rating.firstChild.rows[0],
			itemCnt = oRow.cells.length;

		var valueNo = this.cellIndex + 1;
		for (var i = 0; i < itemCnt; i++) {
			var oitem = oRow.cells[i];
			Z._setBackgroundPos(oitem, Z._getPosX(i % Z._splitCount, i < valueNo ? 1: 2));
		}
	},

	_mouseOut: function doout(event) {
		event = jQuery.event.fix( event || window.event );
		var Z = event.delegateTarget.jslet;
		if (Z._readOnly) {
			return;
		}
		Z.doValueChanged();
	},

	_mouseDown: function dodown(event) {
		event = jQuery.event.fix( event || window.event );
		var rating = event.delegateTarget,
		Z = rating.jslet;
		if (Z._readOnly) {
			return;
		}
		var oRow = rating.firstChild.rows[0],
			itemCnt = oRow.cells.length;
		
		//if can set zero and current item is first one, then clear value
		var k = this.cellIndex+1;
		if (!Z._required && k == 1) {
			k = (Z.value * Z._splitCount) == 1 ? 0 : 1;
		}
		Z.value = k / Z._splitCount;
		Z._dataset.setFieldValue(Z._field, Z.value, Z._valueIndex);
		Z.doValueChanged();
	},

	_mouseUp: function(event) {
		event = jQuery.event.fix( event || window.event );
		var rating = event.delegateTarget,
			oRow = rating.firstChild.rows[0],
			Z = rating.jslet;
		if (Z._readOnly) {
			return;
		}
		if (Z._selectedItem >= 0) {
			var oitem = oRow.cells[Z._selectedItem];
			Z._setBackgroundPos(oitem, Z._selectedPx);
		}
	},

	_getPosX: function(index, status){
		var Z = this, isRtl = jslet.locale.isRtl,bgX;
		bgX = 0 - status * Z._itemWidth;
		if (isRtl){
			bgX += (index+1)*Z.splitWidth - Z._itemWidth;
		} else {
			bgX -= index * Z.splitWidth;
		}
		return bgX;
	},
	
	_setBackgroundPos: function (oitem, posX) {
		if (oitem.style.backgroundPositionX !== undefined) {
			oitem.style.backgroundPositionX = posX + 'px';
		} else {
			oitem.style.backgroundPosition = posX + 'px 0px';
		}
	},

	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName){
		$super(metaName);
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if(!metaName || metaName == "disabled" || metaName == "readOnly") {
			Z._readOnly = fldObj.disabled() || fldObj.readOnly();
		}
		if(!metaName || metaName == "required") {
			Z._required = fldObj.required();
		}
	},
	
	/**
	 * @override
	 */
	doValueChanged: function() {
		var Z = this,
			fldObj = Z._dataset.getField(Z._field),
			value = Z.getValue(),
			itemCnt = Z._itemCount * Z._splitCount,
			valueNo = Math.ceil(value * Z._splitCount),
			oitem, offsetW, bgX, ratingRow = Z.el.firstChild.rows[0],
			bgW = Z._itemWidth * 2,
			isRtl = jslet.locale.isRtl;
		
		Z.value = value;
		for (var i = 0; i < itemCnt; i++) {
			oitem = ratingRow.childNodes[i];
			Z._setBackgroundPos(oitem, Z._getPosX(i % Z._splitCount, i < valueNo ? 0: 2));
		}
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this, 
			fldObj = Z._dataset.getField(Z._field);
		var jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-rating')) {
			jqEl.addClass('jl-rating');
		}
		jqEl.html('<table border="0" cellspacing="0" cellpadding="0" style="table-layout:fixed;border-collapse:collapse"><tr></tr></table>');

		var oitem, itemCnt = Z._itemCount * Z._splitCount,
			otr = Z.el.firstChild.rows[0];
			
		Z.splitWidth = parseInt(Z._itemWidth / Z._splitCount);
		for (var i = 1; i <= itemCnt; i++) {
			oitem = document.createElement('td');
			oitem.className = 'jl-rating-item';
			oitem.style.width = Z.splitWidth + 'px';
			oitem.style.height = Z._itemWidth + 'px';
			oitem.title = i / Z._splitCount;
			otr.appendChild(oitem);
		}
		jqEl.width(Z._itemCount * Z._itemWidth);
		Z.refreshControl(jslet.data.RefreshEvent.updateAllEvent(), true);
	}, // end renderAll

	/**
	 * @override
	 */
	destroy: function($super){
		var jqEl = jQuery(this.el);
		jqEl.off();
		
		$super();
	},
	
	/**
	 * @override
	 */
	canFocus: function() {
		return false;
	}
	
});

jslet.ui.DBRating.CHECKED = 0;
jslet.ui.DBRating.UNCHECKED = 1;
jslet.ui.DBRating.FOCUS = 2;

jslet.ui.register('DBRating', jslet.ui.DBRating);
jslet.ui.DBRating.htmlTemplate = '<Div></Div>';

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
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
"use strict";
jslet.ui.DBSelect = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,groupField,lookupDataset';

		Z._groupField = null;
		
		Z._lookupDataset = null;
		
		Z._enableInvalidTip = true;
		
		Z._innerEditFilterExpr = null;
		
		$super(el, params);
	},

	/**
	 * {String} Group field name, you can use this to group options.
	 * Detail to see html optgroup element.
	 */
	groupField: function(groupField) {
		if(groupField === undefined) {
			return this._groupField;
		}
		groupField = jQuery.trim(groupField);
		jslet.Checker.test('DBSelect.groupField', groupField).isString();
		this._groupField = groupField;
	},
	
	/**
	 * {String or jslet.data.Dataset} It will use this dataset to render Select Options.
	 */
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

		var jqEl = jQuery(Z.el);
		jqEl.on('change', Z._doChanged);
		jqEl.focus(function(event) {
			jslet.ui.focusManager.activeDataset(Z._dataset.name()).activeField(Z._field).activeValueIndex(Z._valueIndex);
		});
		jqEl.blur(function(event) {
			jslet.ui.focusManager.activeDataset(null).activeField(null).activeValueIndex(null);
		});
		if(Z.el.multiple) {
			jqEl.on('click', 'option', Z._doCheckLimitCount);
		}
		jqEl.addClass('form-control');//Bootstrap class
		Z.doMetaChanged('required');
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
					jslet.showInfo(jslet.formatMessage(jslet.locale.DBCheckBoxGroup.invalidCheckedCount,
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

	_setDefaultValue: function(fldObj, firstItemValue) {
		if(!firstItemValue || !fldObj.required()) {
			return;
		}
		var dftValue = fldObj.defaultValue();
		if(dftValue) {
			var lkds = fldObj.lookup().dataset();
			var found = lkds.findByKey(dftValue);
			if(found) {
				return;
			} else {
				dftValue = null;
			}
		}
		
		if(!dftValue) {
			fldObj.defaultValue(firstItemValue);
		}
		if(this._dataset.changedStatus() && !fldObj.getValue()) {
			fldObj.setValue(firstItemValue);
		}
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
			groupIsLookup = false,
			groupLookup, 
			groupFldObj, 
			extraIndex;

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
		var preGroupValue = null, groupValue, groupDisplayValue, content = [];

		if (!Z.el.multiple && !fldObj.required()){
			content.push('<option value="_null_">');
			content.push(fldObj.nullText());
			content.push('</option>');
		}
		var oldRecno = lkds.recno(),
			optValue, optDispValue, 
			firstItemValue = null,
			editFilter = lkf.editFilter();
		Z._innerEditFilterExpr = null;
		var editItemDisabled = lkf.editItemDisabled();
		if(editFilter) {
			Z._innerEditFilterExpr = new jslet.Expression(lkds, editFilter);
		}
		var disableOption = false;
		try {
			for (var i = 0, cnt = lkds.recordCount(); i < cnt; i++) {
				lkds.recnoSilence(i);
				disableOption = false;
				if(Z._innerEditFilterExpr && !Z._innerEditFilterExpr.eval()) {
					if(!editItemDisabled) {
						continue;
					} else {
						disableOption = true;
					}
				}
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
				optValue = lkds.getFieldValue(lkf.keyField());
				if(firstItemValue === null) {
					firstItemValue = optValue;
				}
				content.push(optValue);
				content.push('"'+ (disableOption? ' disabled': '') +  '>');
				content.push(lkf.getCurrentDisplayValue());
				content.push('</option>');
			} // end for
			if (preGroupValue !== null) {
				content.push('</optgroup>');
			}
			jQuery(Z.el).html(content.join(''));
			Z._setDefaultValue(fldObj, firstItemValue);
			Z.doValueChanged();
		} finally {
			lkds.recnoSilence(oldRecno);
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
			jslet.ui.setEditableStyle(Z.el, disabled, disabled, true, fldObj.required());
		}
		if(metaName && metaName == 'required') {
			var jqEl = jQuery(Z.el);
			if (fldObj.required()) {
				jqEl.addClass('jl-ctrl-required');
			} else {
				jqEl.removeClass('jl-ctrl-required');
			}
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
		if (Z._skipRefresh) {
			return;
		}
		var errObj = Z.getFieldError();
		if(errObj && errObj.message) {
			Z.el.value = errObj.inputText;
			Z.renderInvalid(errObj);
			return;
		} else {
			Z.renderInvalid(null);
		}
		var value = Z.getValue();
		if(!Z.el.multiple && value === Z.el.value) {
			return;
		}
		var i, optCnt = Z.el.options.length, 
			opt;
		for (i = 0; i < optCnt; i++) {
			opt = Z.el.options[i];
			if (opt) {
				opt.selected = false;
			}
		}
		
		var fldObj = Z._dataset.getField(Z._field);
		if (!Z.el.multiple) {
			if(!Z._checkOptionEditable(fldObj, value)) {
				value = null;
			}
			if (value === null){
				if (!fldObj.required()) {
					value = '_null_';
				}
			}
			Z.el.value = value;
		} else {
			var arrValue = value;
			if(arrValue === null || arrValue.length === 0) {
				return;
			}
				
			var vcnt = arrValue.length - 1, selected;
			Z._skipRefresh = true;
			try {
				for (i = 0; i < optCnt; i++) {
					opt = Z.el.options[i];

					for (var j = vcnt; j >= 0; j--) {
						selected = (arrValue[j] == opt.value);
						if (selected) {
							opt.selected = selected;
						}
					} // end for j
				} // end for i
			} finally {
				Z._skipRefresh = false;
			}
		}
	},
 
	_checkOptionEditable: function(fldObj, fldValue) {
		var Z = this;
		if(!Z._innerEditFilterExpr || fldValue === null || fldValue === undefined || fldValue === '') {
			return true;
		}
		var lkDs = fldObj.lookup().dataset(); 
		if(lkDs.findByKey(fldValue) && !Z._innerEditFilterExpr.eval()) {
			return false;
		} else {
			return true;
		}
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		this.refreshControl(jslet.data.RefreshEvent.updateAllEvent(), true);
	},

	updateToDataset: function () {
		var Z = this;
		if (Z._skipRefresh) {
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

		Z._skipRefresh = true;
		try {
			if (!isMulti) {
				var fldObj = Z._dataset.getField(Z._field);
				if (value == '_null_' && !fldObj.required()) {
					value = null;
				}
				Z._dataset.setFieldValue(Z._field, value, Z._valueIndex);
			} else {
				Z._dataset.setFieldValue(Z._field, value);
			}
			
		} finally {
			Z._skipRefresh = false;
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

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBSpinEdit. 
 * <pre><code>
 * var jsletParam = {type:"DBSpinEdit",dataset:"employee",field:"age", minValue:18, maxValue: 100, step: 5};
 * 
 * //1. Declaring:
 * &lt;div data-jslet='type:"DBSpinEdit",dataset:"employee",field:"age", minValue:18, maxValue: 100, step: 5' />
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
jslet.ui.DBSpinEdit = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,step';

		Z._step = 1;
		
		$super(el, params);
	},

	/**
	 * {Integer} Step value.
	 */
	step: function(step) {
		if(step === undefined) {
			return this._step;
		}
		jslet.Checker.test('DBSpinEdit.step', step).isNumber();
		this._step = step;
	},

	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		var tag = el.tagName.toLowerCase();
		return tag == 'div';
	},

	/**
	 * @override
	 */
	bind: function () {
		var Z = this,
			jqEl = jQuery(Z.el);
		if(!jqEl.hasClass('jl-spinedit')) {
			jqEl.addClass('input-group jl-spinedit');
		}
		Z._createControl();
		Z.renderAll();
	}, // end bind

	_createControl: function() {
		var Z = this,
			jqEl = jQuery(Z.el),
			s = '<input type="text" class="form-control">' + 
		    	'<div class="jl-spinedit-btn-group">' +
		    	'<button class="btn btn-default jl-spinedit-up" tabindex="-1"><i class="fa fa-caret-up"></i></button>' + 
		    	'<button class="btn btn-default jl-spinedit-down" tabindex="-1"><i class="fa fa-caret-down"></i></button>';
		jqEl.html(s);
		
		var editor = jqEl.find('input')[0],
			upButton = jqEl.find('.jl-spinedit-up')[0],
			downButton = jqEl.find('.jl-spinedit-down')[0];
		Z.editor = editor;
		jQuery(Z.editor).on("keydown", function(event){
			if(Z._isDisabled()) {
				return;
			}
			var keyCode = event.keyCode;
			if(keyCode === jslet.ui.KeyCode.UP) {
				Z.decValue();
				event.preventDefault();
				return;
			}
			if(keyCode === jslet.ui.KeyCode.DOWN) {
				Z.incValue();
				event.preventDefault();
				return;
			}
		});
		new jslet.ui.DBText(editor, {
			dataset: Z._dataset,
			field: Z._field,
			beforeUpdateToDataset: Z.beforeUpdateToDataset,
			valueIndex: Z._valueIndex,
			tabIndex: Z._tabIndex
		});
		
		var jqBtn = jQuery(upButton);
		jqBtn.on('click', function () {
			Z.incValue();
		});
		
		jqBtn.focus(function(event) {
			jslet.ui.focusManager.activeDataset(Z._dataset.name()).activeField(Z._field).activeValueIndex(Z._valueIndex);
		});
		jqBtn.blur(function(event) {
			jslet.ui.focusManager.activeDataset(null).activeField(null).activeValueIndex(null);
		});
		
		jqBtn = jQuery(downButton);
		jqBtn.on('click', function () {
			Z.decValue();
		});
		
		jqBtn.focus(function(event) {
			jslet.ui.focusManager.activeDataset(Z._dataset.name()).activeField(Z._field).activeValueIndex(Z._valueIndex);
		});
		jqBtn.blur(function(event) {
			jslet.ui.focusManager.activeDataset(null).activeField(null).activeValueIndex(null);
		});
	},
	
	_isDisabled: function() {
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		return fldObj.disabled() || fldObj.readOnly();
	},
	
	/**
	 * @override
	 */
	beforeUpdateToDataset: function () {
		var Z = this,
			val = Z.el.value;
		var fldObj = Z._dataset.getField(Z._field),
			range = fldObj.dataRange(),
			minValue = Number.NEGATIVE_INFINITY, 
			maxValue = Number.POSITIVE_INFINITY;
		
		if(range) {
			if(range.min) {
				minValue = parseFloat(range.min);
			}
			if(range.max) {
				maxValue = parseFloat(range.max);
			}
		}
		if (val) {
			val = parseFloat(val);
//			if (val) {
//				if (val > maxValue)
//					val = maxValue;
//				else if (val < minValue)
//					val = minValue;
//				val = String(val);
//			}
		}
		jQuery(Z.el).attr('aria-valuenow', val);
		Z.el.value = val;
		return true;
	}, // end beforeUpdateToDataset

	setValueToDataset: function (val) {
		var Z = this;
		if (Z.silence) {
			return;
		}
		Z.silence = true;
		if (val === undefined) {
			val = Z.value;
		}
		try {
			Z._dataset.setFieldValue(Z._field, val, Z._valueIndex);
		} finally {
			Z.silence = false;
		}
	}, // end setValueToDataset

	incValue: function () {
		var Z = this,
			val = Z.getValue();
		if (!val) {
			val = 0;
		}
		var maxValue = Z._getRange().maxValue;
		if (val == maxValue) {
			return;
		} else if (val < maxValue) {
			val += Z._step;
		} else {
			val = maxValue;
		}
		if (val > maxValue) {
			val = maxValue;
		}
		jQuery(Z.el).attr('aria-valuenow', val);
		Z.setValueToDataset(val);
	}, // end incValue

	_getRange: function() {
		var Z = this,
			fldObj = Z._dataset.getField(Z._field),
			range = fldObj.dataRange(),
			minValue = Number.NEGATIVE_INFINITY, 
			maxValue = Number.POSITIVE_INFINITY;
		
		if(range) {
			if(range.min) {
				minValue = parseFloat(range.min);
			}
			if(range.max) {
				maxValue = parseFloat(range.max);
			}
		}
		return {minValue: minValue, maxValue: maxValue};
	},
	
	decValue: function () {
		var Z = this,
			val = Z.getValue();
		if (!val) {
			val = 0;
		}
		var minValue = Z._getRange().minValue;
		if (val == minValue) {
			return;
		} else if (val > minValue) {
			val -= Z._step;
		} else {
			val = minValue;
		}
		if (val < minValue)
			val = minValue;
		jQuery(Z.el).attr('aria-valuenow', val);
		Z.setValueToDataset(val);
	}, // end decValue
	
	/**
	 * @override
	 */
	innerFocus: function() {
		this.editor.focus();
	},
	
	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName) {
		$super(metaName);
		var Z = this,
			jqEl = jQuery(this.el),
			fldObj = Z._dataset.getField(Z._field);
		
		if(!metaName || metaName == 'disabled' || metaName == 'readOnly') {
			var disabled = fldObj.disabled() || fldObj.readOnly(),
				jqUpBtn = jqEl.find('.jl-spinedit-up'),
				jqDownBtn = jqEl.find('.jl-spinedit-down');
				
			if (disabled) {
				jqUpBtn.attr('disabled', 'disabled');
				jqDownBtn.attr('disabled', 'disabled');
			} else {
				jqUpBtn.attr('disabled', false);
				jqDownBtn.attr('disabled', false);
			}
		}
		if(!metaName || metaName == 'dataRange') {
			var range = fldObj.dataRange();
			jqEl.attr('aria-valuemin', range && (range.min || range.min === 0) ? range.min: '');
			jqEl.attr('aria-valuemin', range && (range.max || range.max === 0) ? range.max: '');
		}
		if(!metaName || metaName == 'tabIndex') {
			Z.setTabIndex();
		}
	},
	
	/**
	 * @override
	 */
	renderAll: function(){
		this.refreshControl(jslet.data.RefreshEvent.updateAllEvent(), true);
	},
	
	/**
	 * @override
	 */
	tableId: function($super, tableId){
		$super(tableId);
		this.editor.jslet.tableId(tableId);
	},
	
	/**
	 * @override
	 */
	destroy: function(){
		var jqEl = jQuery(this.el);
		jQuery(this.editor).off();
		this.editor = null;
		jqEl.find('.jl-upbtn-up').off();
		jqEl.find('.jl-downbtn-up').off();
	}
	
});
jslet.ui.register('DBSpinEdit', jslet.ui.DBSpinEdit);
jslet.ui.DBSpinEdit.htmlTemplate = '<div></div>';


/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBTimePicker is used for time inputting. Example:
 * <pre><code>
 * var jsletParam = {type:"DBTimePicker",field:"time"};
 * //1. Declaring:
 *  &lt;input id="ctrlId" type="text" data-jslet='jsletParam' />
 *  or
 *  &lt;input id="ctrlId" type="text" data-jslet='{type:"DBTimePicker",field:"time"}' />
 *  
 *  //2. Binding
 *  &lt;input id="ctrlId" type="text" data-jslet='jsletParam' />
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
jslet.ui.DBTimePicker = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,is12Hour,hasSecond';
		
		Z._is12Hour = false;
		
		Z._hasSecond = false;
		
		$super(el, params);
	},

	is12Hour: function(is12Hour) {
		if(is12Hour === undefined) {
			return this._is12Hour;
		}
		this._is12Hour = is12Hour? true: false;
	},

	hasSecond: function(hasSecond) {
		if(hasSecond === undefined) {
			return this._hasSecond;
		}
		this._hasSecond = hasSecond? true: false;
	},

	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		var tagName = el.tagName.toLowerCase();
		return tagName == 'div' || tagName == 'span';
	},

	/**
	 * @override
	 */
	bind: function () {
		var Z = this,
			jqEl = jQuery(Z.el);
		if(!jqEl.hasClass('jl-timepicker')) {
			jqEl.addClass('form-control jl-timepicker');
		}
		Z.renderAll();
		jqEl.on('change', 'select', function(event){
			Z.updateToDataset();
		});
	}, // end bind

	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this,
			jqEl = jQuery(Z.el),
			fldObj = Z._dataset.getField(Z._field),
			range = fldObj.dataRange(),
			minTimePart = {hour: 0, minute: 0, second: 0},
			maxTimePart = {hour: 23, minute: 59, second: 59};
		
		if(range) {
			if(range.min) {
				minTimePart = Z._splitTime(range.min);
			}
			if(range.max) {
				maxTimePart = Z._splitTime(range.max);
			}
		}
		var	tmpl = [];
		
		tmpl.push('<select class="jl-time-hour">');
		if(Z._is12Hour) {
			var minHour = minTimePart.hour;
			var maxHour = maxTimePart.hour;
			var min = 100, max = 0, hour;
			for(var k = minHour; k < maxHour; k++) {
				hour = k;
				if( k > 11) {
					hour = k - 12;
				}
				min = Math.min(min, hour);
				max = Math.max(max, hour);
			}
			tmpl.push(Z._getOptions(min, max));
		} else {
			tmpl.push(Z._getOptions(minTimePart.hour, maxTimePart.hour || 23));
		}
		tmpl.push('</select>');
		
		tmpl.push('<select class="jl-time-minute">');
		tmpl.push(Z._getOptions(0, 59));
		tmpl.push('</select>');
		
		if(Z._hasSecond) {
			tmpl.push('<select class="jl-time-second">');
			tmpl.push(Z._getOptions(0, 59));
			tmpl.push('</select>');
		}
		
		if(Z._is12Hour) {
			tmpl.push('<select class="jl-time-ampm"><option value="am">AM</option><option value="pm">PM</option></select>');
		}
		jqEl.html(tmpl.join(''));
		Z.refreshControl(jslet.data.RefreshEvent.updateAllEvent(), true);
	}, // end renderAll

	_getOptions: function(begin, end) {
		var result = [], value;
		for(var i = begin; i <= end; i++) {
			if( i < 10) {
				value = '0' + i;
			} else {
				value = '' + i;
			}
			result.push('<option value="');
			result.push(i);
			result.push('">');
			result.push(value);
			result.push('</option>');
		}
		return result.join('');
	},
	
	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName){
		$super(metaName);
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if(!metaName || metaName == "disabled" || metaName == "readOnly" || metaName == 'tabIndex') {
			var disabled = fldObj.disabled() || fldObj.readOnly();
			var items = jQuery(Z.el).find("select"), item,
				required = fldObj.required(),
				tabIdx = fldObj.tabIndex();
			for(var i = 0, cnt = items.length; i < cnt; i++){
				item = items[i];
				item.disabled = disabled;
				jslet.ui.setEditableStyle(item, disabled, disabled, true, required);
				item.tabIndex = tabIdx;
			}
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
		var value = Z.getValue(),
			timePart = Z._splitTime(value),
			hour = timePart.hour,
			jqEl = jQuery(Z.el),
			jqHour = jqEl.find('.jl-time-hour'),
			jqMinute = jqEl.find('.jl-time-minute');
		
		if(Z._is12Hour) {
			var jqAmPm = jqEl.find('.jl-time-ampm');
			jqAmPm.prop('selectedIndex', hour < 12 ? 0: 1);
			if(hour > 11) {
				hour -= 12;
			}
		}
		jqHour.val(hour);
		jqMinute.val(timePart.minute);
		if(Z._hasSecond) {
			jqMinute = jqEl.find('.jl-time-second');
			jqMinute.val(timePart.second);
		}
	},
	 
	_splitTime: function(value) {
		var	hour = 0,
			minute = 0,
			second = 0;
		if(value) {
			if(jslet.isDate(value)) {
				hour = value.getHours();
				minute = value.getMinutes();
				second = value.getSeconds();
			} else if(jslet.isString(value)) {
				var parts = value.split(":");
				hour = parseInt(parts[0]);
				if(parts.length > 1) {
					minute = parseInt(parts[1]);
				}
				if(parts.length > 2) {
					second = parseInt(parts[2]);
				}
			}
		}
		return {hour: hour, minute: minute, second: second};
	},
	
	_prefix: function(value) {
		if(parseInt(value) < 10) {
			return '0' + value;
		}
		return value;
	},
	
	updateToDataset: function () {
		var Z = this;
		if (Z._keep_silence_) {
			return true;
		}

		Z._keep_silence_ = true;
		try {
			var jqEl = jQuery(Z.el),
				fldObj = Z._dataset.getField(Z._field),
				value = null, hour;
			if(fldObj.getType() != jslet.data.DataType.DATE) {
				value = [];
				if(Z._is12Hour && jqEl.find('.jl-time-ampm').prop("selectedIndex") > 0) {
					hour = parseInt(jqEl.find('.jl-time-hour').val()) + 12;
					value.push(hour);
				} else {
					value.push(Z._prefix(jqEl.find('.jl-time-hour').val()));
				}
				value.push(':');
				value.push(Z._prefix(jqEl.find('.jl-time-minute').val()));
				if(Z._hasSecond) {
					value.push(':');
					value.push(Z._prefix(jqEl.find('.jl-time-second').val()));
				}
				value = value.join('');
			} else {
				value = Z.getValue();
				if(!value) {
					value = new Date();
				}
				hour = parseInt(jqEl.find('.jl-time-hour').val());
				if(Z._is12Hour && jqEl.find('.jl-time-ampm').prop("selectedIndex") > 0) {
					hour += 12;
				}
				var minute = parseInt(jqEl.find('.jl-time-minute').val());
				var second = 0;
				if(Z._hasSecond) {
					second = parseInt(jqEl.find('.jl-time-second').val());
				}
				
				value.setHours(hour);
				value.setMinutes(minute);
				value.setSeconds(second);
			}
			Z._dataset.setFieldValue(Z._field, value, Z._valueIndex);
		} finally {
			Z._keep_silence_ = false;
		}
		return true;
	}, // end updateToDataset

	/**
	 * @override
	 */
	innerFocus: function() {
		var jqEl = jQuery(this.el);
		jqEl.find('.jl-time-hour').focus();
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		jQuery(this.el).off();
		$super();
	}
});
jslet.ui.register('DBTimePicker', jslet.ui.DBTimePicker);
jslet.ui.DBTimePicker.htmlTemplate = '<div></div>';

/*!
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

/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBPageBar. 
 * Functions:
 * 1. First page, Prior Page, Next Page, Last Page;
 * 2. Can go to specified page;
 * 3. Can specify page size on runtime;
 * 4. Need not write any code;
 * 
 * Example:
 * <pre><code>
 *  var jsletParam = {type:"DBPageBar",dataset:"bom",pageSizeList:[20,50,100,200]};
 *  
 * //1. Declaring:
 *  &lt;div data-jslet='type:"DBPageBar",dataset:"bom",pageSizeList:[20,50,100,200]' />
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
jslet.ui.DBPageBar = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,showPageSize,pageSizeList';
		Z._showPageSize = true;
		
		Z._pageSizeList = [100, 200, 500];

		Z._currPageCount = 0;
		
		$super(el, params);
	},

	/**
	 * {Boolean} Identify if the "Page Size" part shows or not
	 */
	showPageSize: function(showPageSize) {
		if(showPageSize === undefined) {
			return this._showPageSize;
		}
		this._showPageSize = showPageSize ? true: false;
	},
	
	/**
	 * {Integer[]) Array of integer, like: [50,100,200]
	 */
	pageSizeList: function(pageSizeList) {
		if(pageSizeList === undefined) {
			return this._pageSizeList;
		}
		jslet.Checker.test('DBPageBar.pageSizeList', pageSizeList).isArray();
		var size;
		for(var i = 0, len = pageSizeList.length; i < len; i++) {
			size = pageSizeList[i];
			jslet.Checker.test('DBPageBar.pageSizeList', size).isGTZero();
		}
		this._pageSizeList = pageSizeList;
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
		if (!jqEl.hasClass('jl-pagebar')) {
			jqEl.addClass('jl-pagebar');
		}
		var template = [
		'<div class="form-inline form-group">',
	  	'<select class="form-control input-sm jl-pb-pagesize" title="', jslet.locale.DBPageBar.pageSize, '"></select>',
	    '<button class="btn btn-default btn-sm jl-pb-first" title="', jslet.locale.DBPageBar.first, '"><i class="fa fa-angle-double-left" aria-hidden="true"></i></button>',
	    '<button class="btn btn-default btn-sm jl-pb-prior" title="', jslet.locale.DBPageBar.prior, '"><i class="fa fa-angle-left" aria-hidden="true"></i></button>',
	    '<button class="btn btn-default btn-sm jl-pb-next" title="', jslet.locale.DBPageBar.next, '"><i class="fa fa-angle-right" aria-hidden="true"></i></button>',
	    '<button class="btn btn-default btn-sm jl-pb-last" title="', jslet.locale.DBPageBar.last, '"><i class="fa fa-angle-double-right" aria-hidden="true"></i></button>',
	    '<button class="btn btn-default btn-sm jl-pb-refresh" title="', jslet.locale.DBPageBar.refresh, '"><i class="fa fa-refresh" aria-hidden="true"></i></button>',
	  	'<select class="form-control input-sm jl-pb-pagenum" title="', jslet.locale.DBPageBar.pageNum, '"></select>',
	    '</div>'];
		
		jqEl.html(template.join(''));

		Z._jqPageSize = jqEl.find('.jl-pb-pagesize');
		if (Z._showPageSize) {
			Z._jqPageSize.removeClass('jl-hidden');
			var pgSizeList = Z._pageSizeList;
			var cnt = pgSizeList.length, s = '', pageSize;
			for (var i = 0; i < cnt; i++) {
				pageSize = pgSizeList[i];
				s += '<option value="' + pageSize + '">' + pageSize + '</option>';
			}

			Z._jqPageSize.html(s);
			if(cnt > 0) {
				Z._dataset.pageSize(parseInt(pgSizeList[0]));
			}
			Z._jqPageSize.on('change', function (event) {
				var dsObj = Z.dataset();
				dsObj.pageNo(1);
				dsObj.pageSize(parseInt(this.value));
				dsObj.requery();
			});
		} else {
			Z._jqPageSize.addClass('jl-hidden');
		}

		Z._jqFirstBtn = jqEl.find('.jl-pb-first');
		Z._jqPriorBtn = jqEl.find('.jl-pb-prior');
		Z._jqNextBtn = jqEl.find('.jl-pb-next');
		Z._jqLastBtn = jqEl.find('.jl-pb-last');
		Z._jqRefreshBtn = jqEl.find('.jl-pb-refresh');
		Z._jqPageNum = jqEl.find('.jl-pb-pagenum');
		
		Z._jqFirstBtn.on('click', function (event) {
			if(this.disabled) {
				return;
			}
			var dsObj = Z.dataset();
			dsObj.pageNo(1);
			dsObj.requery();
		});

		Z._jqPriorBtn.on('click', function (event) {
			if(this.disabled) {
				return;
			}
			var dsObj = Z.dataset(),
				num = dsObj.pageNo();
			if (num == 1) {
				return;
			}
			dsObj.pageNo(num - 1);
			dsObj.requery();
		});

		Z._jqPageNum.on('change', function (event) {
			var dsObj = Z.dataset();
			var num = parseInt(this.value);
			dsObj.pageNo(num);
			dsObj.requery();
		});

		Z._jqNextBtn.on('click', function (event) {
			if(this.disabled) {
				return;
			}
			var dsObj = Z.dataset(),
				num = dsObj.pageNo();
			if (num >= dsObj.pageCount()) {
				return;
			}
			dsObj.pageNo(++num);
			dsObj.requery();
		});

		Z._jqLastBtn.on('click', function (event) {
			if(this.disabled) {
				return;
			}
			var dsObj = Z.dataset();

			if (dsObj.pageCount() < 1) {
				return;
			}
			dsObj.pageNo(dsObj.pageCount());
			dsObj.requery();
		});

		Z._jqRefreshBtn.on('click', function (event) {
			Z.dataset().requery();
		});

		Z.renderAll();
	},

	/**
	 * @override
	 */
	refreshControl: function (evt) {
		if (evt && evt.eventType != jslet.data.RefreshEvent.CHANGEPAGE) {
			return;
		}
		this._refreshPageNum();
		this._refreshButtonStatus();
	},

	_refreshPageNum: function() {
		var Z = this,
			num = Z._dataset.pageNo(), 
			count = Z._dataset.pageCount();
		if(count !== Z._currPageCount) {
			var s = '';
			for(var i = 1; i <= count; i++) {
				s += '<option value="' + i + '">' + i + '</option>';
			}
			Z._jqPageNum.html(s);
			Z._currPageCount = count;
		}
		Z._jqPageNum.val(num);
	},
	
	_refreshButtonStatus: function() {
		var Z = this, 
			ds = Z._dataset,
			pageNo = ds.pageNo(),
			pageCnt = ds.pageCount(),
			prevDisabled = true,
			nextDisabled = true;
		if(pageNo > 1) {
			prevDisabled = false;
		}
		if(pageNo < pageCnt) {
			nextDisabled = false;
		}
		Z._jqFirstBtn.attr('disabled', prevDisabled);
		Z._jqPriorBtn.attr('disabled', prevDisabled);
		Z._jqNextBtn.attr('disabled', nextDisabled);
		Z._jqLastBtn.attr('disabled', nextDisabled);
	},
	
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
		if(Z._jqPageSize) {
			Z._jqPageSize.off();
			Z._jqPageSize = null;
		}
		Z._jqFirstBtn.off();
		Z._jqPriorBtn.off();
		Z._jqNextBtn.off();
		Z._jqLastBtn.off();
		Z._jqPageNum.off();
		Z._jqRefreshBtn.off();

		Z._jqFirstBtn = null;
		Z._jqPriorBtn = null;
		Z._jqNextBtn = null;
		Z._jqLastBtn = null;
		Z._jqPageNum = null;
		Z._jqRefreshBtn = null;
		
		$super();
	}

});

jslet.ui.register('DBPageBar', jslet.ui.DBPageBar);
jslet.ui.DBPageBar.htmlTemplate = '<div></div>';

/* jshint ignore:start */
	return jslet;
});//end of define
/* jshint ignore:end */