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
}

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
		if(this._containerIds == null) {
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
			var jqContainer = jQuery('#' + containerId);
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
}
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
"use strict";

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
