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
* popPnl.contentElement(document.getElementById('id'));
* popPnl.show(10, 10, 100, 100);
* 
* popPnl.hide(); //or
* popPnl.destroy();
* </code></pre>
*  
*/
jslet.ui.PopupPanel = function (excludedEl) {
	this._onHidePopup = null;
	this._excludedEl = excludedEl;
	this._contentEl = null;
};

jslet.ui.PopupPanel.prototype = {
	/**
	 * Event handler when hide popup panel: function(){}
	 */
	onHidePopup: function(onHidePopup) {
		if(onHidePopup === undefined) {
			return this._onHidePopup;
		}
		this._onHidePopup = onHidePopup;
		return this;
	},
	
	excludedElement: function(excludedEl) {
		if(excludedEl === undefined) {
			return this._excludedEl;
		}
		this._excludedEl = excludedEl;
		return this;
	},
	
	contentElement: function(contentEl) {
		if(contentEl === undefined) {
			return this._contentEl;
		}
		this._contentEl = contentEl;
		return this;
	},
	
	show: function(left, top, width, height, ajustX, ajustY) {
		jslet.ui.PopupPanel.popupElement.show(this, left, top, width, height, ajustX, ajustY);
	},
	
	hide: function() {
		jslet.ui.PopupPanel.popupElement.hide();
	},
	
	destroy: function() {
		this._onHidePopup = null;
		this._excludedEl = null;
		this._contentEl = null;
	}
};

(function () {
	var PopupElement = function() {
		var sharedPopPnl = null;
		var activePopup = null;
		
		var inPopupPanel = function (htmlElement) {
			if (!htmlElement || htmlElement === document) {
				return false;
			}
			if (jQuery(htmlElement).hasClass('jl-popup-panel')) {
				return true;
			} else {
				return inPopupPanel(htmlElement.parentNode);
			}
		};
		var self = this;
		var documentClickHandler = function (event) {
			if(!activePopup) {
				return;
			}
			event = jQuery.event.fix( event || window.event );
			var srcEle = event.target;
			self.checkAndHide(srcEle);
		};
		
		function createPanel() {
			if(sharedPopPnl) {
				return;
			}
			var p = document.createElement('div');
			p.style.display = 'none';
			p.className = 'jl-popup-panel jl-opaque jl-border-box dropdown-menu';
			p.style.position = 'absolute';
			p.style.zIndex = 99000;
			document.body.appendChild(p);
			
			jQuery(document).on('click', documentClickHandler);
			sharedPopPnl = p;
		}
		
		function changeContent(newPopup) {
			var oldContent = sharedPopPnl.childNodes[0];
			if (oldContent) {
				sharedPopPnl.removeChild(oldContent);
			}
			if(newPopup) {
				var content = newPopup.contentElement();
				if(!content) {
					return;
				}
				sharedPopPnl.appendChild(content);
				content.style.border = 'none';
			}
		}
		
		this.show = function(activePop, left, top, width, height, ajustX, ajustY) {
			createPanel();
			if(activePopup !== activePop) {
				this.hide();
				changeContent(activePop);
			}
			activePopup = activePop;
			
			left = parseInt(left);
			top = parseInt(top);
			
			if (height) {
				sharedPopPnl.style.height = parseInt(height) + 'px';
			}
			if (width) {
				sharedPopPnl.style.width = parseInt(width) + 'px';
			}
			var jqWin = jQuery(window),
				winWidth = jqWin.scrollLeft() + jqWin.width(),
				winHeight = jqWin.scrollTop() + jqWin.height(),
				panel = jQuery(sharedPopPnl),
				w = panel.outerWidth(),
				h = panel.outerHeight();
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
				sharedPopPnl.style.top = top + 'px';
			}
			if (left) {
				sharedPopPnl.style.left = left + 'px';
			}
			sharedPopPnl.style.display = 'block';
		};
		
		this.hide = function() {
			if(activePopup) {
				if (sharedPopPnl) {
					sharedPopPnl.style.display = 'none';
				}
				var hideCallBack = activePopup.onHidePopup();
				if(hideCallBack) {
					hideCallBack.call(activePopup);
				}
				activePopup = null;
			}
		};
		
		/**
		 * Check the specified element is in the active popup panel or not. If it is not in the popup panel, hide the popup panel. 
		 */
		this.checkAndHide = function(el) {
			if(!activePopup) {
				return true;
			}
			if (jslet.ui.isChild(activePopup.excludedElement(), el) ||
					inPopupPanel(el)) {
					return false;
			}
			this.hide();
			return true;
		};
		
		this.destroy = function() {
			if(!sharedPopPnl) {
				return;
			}
			document.body.removeChild(sharedPopPnl);
			jQuery(sharedPopPnl).off();
			jQuery(document).off('click', documentClickHandler);
		}; 
	};
	
	jslet.ui.PopupPanel.popupElement = new PopupElement();
})();

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

