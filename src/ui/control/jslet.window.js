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
