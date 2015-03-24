/* ========================================================================
 * Jslet framework: jslet.window.js
 *
 * Copyright (c) 2014 Jslet Group(https://github.com/jslet/jslet/)
 * Licensed under MIT (https://github.com/jslet/jslet/LICENSE.txt)
 * ======================================================================== */

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
jslet.ui.Window = jslet.Class.create(jslet.ui.Control, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.el = el;
		Z.allProperties = 'caption,resizable,minimizable,maximizable,closable,iconClass,onSizeChanged,onClosed,onPositionChanged,onActive,width,height,minWidth,maxWidth,minHeight,maxHeight,isCenter,stopEventBubling';
		/**
		 * {String} Window caption
		 */
		Z._caption = null;
		
		/**
		 * {Boolean} Identify if user can change window size with dragging.
		 */
		Z._resizable = true;
		
		/**
		 * {Boolean} Identify if window can be minimized or not.
		 */
		Z._minimizable = true;

		/**
		 * {Boolean} Identify if window can be maximized or not.
		 */
		Z._maximizable = true;
		
		/**
		 * {Boolean} Identify if window can be closed or not.
		 */
		Z._closable = true;
		
		/**
		 * Window caption icon style class.
		 */
		Z._iconClass = null;
		
		/**
		 * {Integer} Window width
		 */
		Z._width = 0;
		/**
		 * {Integer} Window width
		 */
		Z._height = 0;
		/**
		 * {Integer} Window height
		 */
		Z._minWidth = 20;
		/**
		 * {Integer} Window maximized width
		 */
		/**
		 * {Integer} Window minimized height
		 */
		Z._minHeight = 30;
		/**
		 * {Integer} Window maximized width
		 */
		Z._maxWidth = -1;
		/**
		 * {Integer} Window maximized height
		 */
		Z._maxHeight = -1;

		/**
		 * {Boolean} Identify if window is showing at center of offset parent or not.
		 */
		Z._isCenter = false;
 
		/**
		 * {Event} Fired when user changes the window's size.
		 * Pattern: 
		 *   function(width, height){}
		 *   //width: Integer Window width
		 *   //height: Integer Window height
		 */
		Z._onSizeChanged = null;
		
		/**
		 * {Event} Fired when user changes the window's position.
		 * Pattern: 
		 *   function(left, top){}
		 *   //left: Integer Window position left
		 *   //top: Integer Window position top 
		 */
		Z._onPositionChanged = null;
		
		/**
		 * {Event} Fired when uses activates window.
		 * Pattern: 
		 *	function(windObj){}
		 *	//windObj: jslet.ui.Window Window Object
		 */
		Z._onActive = null;
		
		/**
		 * {Event} Fired when uses closes window.
		 * Pattern: 
		 *	function(windObj){}
		 *	//windObj: jslet.ui.Window Window Object
		 *	//return: String If return value equals 'hidden', then hide window instead of closing.
		 */
		Z._onClosed = null;

		/**
		 * @private
		 */
		Z._stopEventBubling = false;
		
		//@private
		Z.isModal = false;
		//@private
		Z.state = null; //min,max
		$super(el, params);
	},

	caption: function(caption) {
		if(caption === undefined) {
			return this._caption;
		}
		jslet.Checker.test('Window.caption', caption).isString();
		this._caption = caption;
	},
	
	iconClass: function(iconClass) {
		if(iconClass === undefined) {
			return this._iconClass;
		}
		jslet.Checker.test('Window.iconClass', iconClass).isString();
		this._iconClass = iconClass;
	},
	
	resizable: function(resizable) {
		if(resizable === undefined) {
			return this._resizable;
		}
		this._resizable = resizable? true: false;
	},
	
	minimizable: function(minimizable) {
		if(minimizable === undefined) {
			return this._minimizable;
		}
		this._minimizable = minimizable? true: false;
	},
	
	maximizable: function(maximizable) {
		if(maximizable === undefined) {
			return this._maximizable;
		}
		this._maximizable = maximizable? true: false;
	},
	
	closable: function(closable) {
		if(closable === undefined) {
			return this._closable;
		}
		this._closable = closable? true: false;
	},
	
	isCenter: function(isCenter) {
		if(isCenter === undefined) {
			return this._isCenter;
		}
		this._isCenter = isCenter? true: false;
	},
	
	stopEventBubling: function(stopEventBubling) {
		if(stopEventBubling === undefined) {
			return this._stopEventBubling;
		}
		this._stopEventBubling = stopEventBubling? true: false;
	},
	
	width: function(width) {
		if(width === undefined) {
			return this._width;
		}
		jslet.Checker.test('Window.width', width).isGTZero();
		this._width = width;
	},

	height: function(height) {
		if(height === undefined) {
			return this._height;
		}
		jslet.Checker.test('Window.height', height).isGTZero();
		this._height = height;
	},

	minWidth: function(minWidth) {
		if(minWidth === undefined) {
			return this._minWidth;
		}
		jslet.Checker.test('Window.minWidth', minWidth).isGTZero();
		this._minWidth = minWidth;
	},

	minHeight: function(minHeight) {
		if(minHeight === undefined) {
			return this._minHeight;
		}
		jslet.Checker.test('Window.minHeight', minHeight).isGTZero();
		this._minHeight = minHeight;
	},

	maxWidth: function(maxWidth) {
		if(maxWidth === undefined) {
			return this._maxWidth;
		}
		jslet.Checker.test('Window.maxWidth', maxWidth).isNumber();
		this._maxWidth = maxWidth;
	},

	maxHeight: function(maxHeight) {
		if(maxHeight === undefined) {
			return this._maxHeight;
		}
		jslet.Checker.test('Window.maxHeight', maxHeight).isNumber();
		this._maxHeight = maxHeight;
	},

	onSizeChanged: function(onSizeChanged) {
		if(onSizeChanged === undefined) {
			return this._onSizeChanged;
		}
		jslet.Checker.test('Window.onSizeChanged', onSizeChanged).isFunction();
		this._onSizeChanged = onSizeChanged;
	},
	
	onPositionChanged: function(onPositionChanged) {
		if(onPositionChanged === undefined) {
			return this._onPositionChanged;
		}
		jslet.Checker.test('Window.onPositionChanged', onPositionChanged).isFunction();
		this._onPositionChanged = onPositionChanged;
	},

	onActive: function(onActive) {
		if(onActive === undefined) {
			return this._onActive;
		}
		jslet.Checker.test('Window.onActive', onActive).isFunction();
		this._onActive = onActive;
	},
	
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
		if (Z._minWidth < 20) {
			Z._minWidth = 20;
		}
		if (Z.minHeight < 30) {
			Z.minheight = 30;
		}
		var jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-window')) {
			jqEl.addClass('jl-window jl-border-box jl-unselectable jl-bgcolor jl-round5');
		}
		if (!Z._width) {
			Z._width = parseInt(Z.el.style.width);
		}
		if (!Z._height) {
			Z._height = parseInt(Z.el.style.height);
		}
		if (!Z._width) {
			Z._width = 300;
		}
		if (!Z._height) {
			Z._height = 300;
		}
		Z.el.style.width = Z._width + 'px';
		Z.el.style.height = Z._height + 'px';

		var template = [
		'<div class="jl-win-header jl-unselectable" style="position:relative;width: 100%;cursor:move">',
			Z._iconClass ? '<div class="jl-win-header-icon ' + Z._iconClass + '"></div>' : '',

			'<div class="jl-win-title jl-unselectable">', Z._caption ? Z._caption : '', '</div>',
			'<div class="jl-win-tool jl-unselectable">'];
		if (!jslet.locale.isRtl){
			template.push(Z._minimizable ? '<a href="javascript:;" class="jl-win-min" onfocus="this.blur();"></a>' : '');
			template.push(Z._maximizable ? '<a href="javascript:;" class="jl-win-max" onfocus="this.blur();"></a>' : '');
			template.push(Z._closable ? '<a href="javascript:;" class="jl-win-close" onfocus="this.blur();"></a>' : '');
		}else{
			template.push(Z._closable ? '<a href="javascript:;" class="jl-win-close" onfocus="this.blur();"></a>' : '');
			template.push(Z._maximizable ? '<a href="javascript:;" class="jl-win-max" onfocus="this.blur();"></a>' : '');
			template.push(Z._minimizable ? '<a href="javascript:;" class="jl-win-min" onfocus="this.blur();"></a>' : '');
		}
		template.push('</div></div>');
		template.push('<div class="jl-win-body jl-unselectable" title="" style="width: 100%;cursor:default"></div>');

		jqEl.html(template.join(''));
		jqEl.on('mousemove', Z._doWinMouseMove);
		jqEl.on('mousedown', Z._doWinMouseDown);
		jqEl.on('dblclick', function(event){
			event.stopPropagation();
			event.preventDefault();
		});

		jqEl.on('click', function(event){
			if(Z.isModal || Z._stopEventBubling) {
				event.stopPropagation();
				event.preventDefault();
			}
		});
		
		var jqHeader = jqEl.find('.jl-win-header'),
			header = jqHeader[0];
		Z._headerHeight = jqHeader.height();
		var bodyDiv = jqEl.find('.jl-win-body')[0],
			bh = Z._height - Z._headerHeight - 12;
		if (bh < 0) {
			bh = 0;
		}
		bodyDiv.style.height = bh + 'px';
		jqBody = jQuery(bodyDiv);
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
			if (Z.state == 'max') {
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
			if (Z.state != 'max') {
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
				if (Z.state == 'max') {
					var btnMax = jqEl.find('.jl-win-restore')[0];
					if (btnMax) {
						btnMax.className = 'jl-win-max';
					}
				}
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
				if (Z.state != 'max') {
					btnMax.className = 'jl-win-restore';
					Z.maximize();
				} else {
					btnMax.className = 'jl-win-max';
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
	 * @param {Integer} left Position left.
	 * @param {Integer} top Position top.
	 */
	show: function (left, top) {
		var Z = this;
		if (Z._isCenter) {
			var offsetP = jQuery(Z.el).offsetParent()[0],
				jqOffsetP = jQuery(offsetP),
				pw = jqOffsetP.width(),
				ph = jqOffsetP.height();
			left = offsetP.scrollLeft + Math.round((pw - Z._width) / 2);
			top = offsetP.scrollTop + Math.round((ph - Z._height) / 2);
		}

		Z.top = top ? top : 0;
		Z.left = left ? left : 0;
		Z.el.style.left = Z.left + 'px';
		Z.el.style.top = Z.top + 'px';
		Z.el.style.display = 'block';

		if (Z.hasShadow) {
			Z._createShadow();
			Z.shadow.style.top = Z.top + 'px';
			Z.shadow.style.left = Z.left + 'px';
			Z.shadow.style.display = 'block';
		}
		Z.activate();
	},

	/**
	 * Show modal window at specified position
	 * 
	 * @param {Integer} left Position left.
	 * @param {Integer} top Position top.
	 */
	showModal: function (left, top) {
		var Z = this;
		Z.isModal = true;
		if (!Z.overlay) {
			Z.overlay = new jslet.ui.OverlayPanel(Z.el.parentNode);
		}
		jslet.ui.GlobalZIndex += 10;
		var k = jslet.ui.GlobalZIndex;
		Z.el.style.zIndex = k;
		if (Z.shadow) {
			Z.shadow.style.zIndex = k - 1; 
		}
		Z.show(left, top);
		Z.overlay.setZIndex(k - 2);
		Z.overlay.show();
	},

	/**
	 * Hide window
	 */
	hide: function () {
		var Z = this;
		Z.el.style.display = 'none';
		if (Z.shadow) {
			Z.shadow.style.display = 'none';
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
		if (Z.shadow) {
			pnode.removeChild(Z.shadow);
			Z.shadow = null;
		}
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
		if (Z.state == 'min') {
			Z.restore();
			return;
		}
		if (Z.state == 'max') {
			Z.restore();
		}
		Z.changeSize(null, Z._headerHeight + 8, true);
		Z.state = 'min';
	},

	/**
	 * Maximize window
	 */
	maximize: function () {
		var Z = this;
		var offsetP = jQuery(Z.el).offsetParent();
		var width = offsetP.width(); // -12;
		var height = offsetP.height(); // -12;
		Z.setPosition(0, 0, true);
		Z.changeSize(width, height, true);
		Z.state = 'max';
	},

	/**
	 * Restore window
	 */
	restore: function () {
		var Z = this;
		Z.setPosition(Z.left, Z.top, true);
		Z.changeSize(Z._width, Z._height, true);
		Z.state = null;
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
		if (Z.shadow) {
			Z.shadow.style.top = top + 'px';
			Z.shadow.style.left = left + 'px';
		}
	},

	/**
	 * Change window size.
	 * 
	 * @param {Integer} width Window width
	 * @param {Integer} height Window height
	 * @param {Boolean} notUpdateSize True - Only change html element size, 
	 *		not change the inner size of Window object, it is usually use for moving action
	 */
	changeSize: function (width, height, notUpdateSize) {
		var Z = this;
		if (!width) {
			width = Z._width;
		}
		if (!height) {
			height = Z._height;
		}

		if (Z._onSizeChanged) {
			Z._onSizeChanged.call(Z, width, height);
		}

		if (!notUpdateSize) {
			Z._width = width;
			Z._height = height;
		}
		Z.el.style.width = width + 'px';
		Z.el.style.height = height + 'px';
		if (Z.shadow) {
			Z.shadow.style.width = width + 3 + 'px';
			Z.shadow.style.height = height + 3 + 'px';
		}

		var jqEl = jQuery(Z.el);
		var bodyDiv = jqEl.find('.jl-win-body')[0];
		var bh = height - Z._headerHeight - 12;
		if (bh < 0) {
			bh = 0;
		}
		bodyDiv.style.height = bh + 'px';
	},

	/**
	 * Get window caption element. You can use it to customize window caption.
	 * 
	 * @return {Html Element}
	 */
	getCaptionDiv: function () {
		return jQuery(this.el).find('.jl-win-title')[0];
	},

	/**
	 * Set window caption
	 * 
	 * @param {String} caption Window caption
	 */
	changeCaption: function (caption) {
		this.caption = caption;
		var captionDiv = jQuery(this.el).find('.jl-win-title');
		captionDiv.html(caption);
	},

	/**
	 * Get window content element. You can use it to customize window content.
	 * 
	 * @return {Html Element}
	 */
	getContentDiv: function () {
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
		var maxIndex = 0, jqNode;
		for (var i = 0, cnt = p.childNodes.length; i < cnt; i++) {
			node = p.childNodes[i];
			if (node.nodeType != 1 || node == Z.el) {
				if (!Z.isModal) {
					jqEl.addClass('jl-window-active');
				}
				continue;
			}
			jqNode = jQuery(node);
			if (jqNode.hasClass('jl-window')) {
				if (maxIndex < node.style.zIndex) {
					maxIndex = node.style.zIndex;
				}
				if (!Z.isModal) {
					jqNode.removeClass('jl-window-active');
				}
			}
		}
		if (Z.el.style.zIndex < maxIndex || maxIndex === 0) {
			Z.setZIndex(maxIndex + 3);
		}
	},

	/**
	 * Set window Z-Index
	 * 
	 * @param {Integer} zIndex Z-Index
	 */
	setZIndex: function (zIndex) {
		this.el.style.zIndex = zIndex;
		if (this.shadow) {
			this.shadow.style.zIndex = zIndex - 1;
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
		var w = Z.el.offsetWidth, h = Z.el.offsetHeight, top = null, left = null;

		if (Z.cursor == 'nw') {
			w = Z._width - deltaX;
			h = Z._height - deltaY;
			top = Z.top + deltaY;
			left = Z.left + deltaX;
		} else if (Z.cursor == 'n') {
			h = Z._height - deltaY;
			top = Z.top + deltaY;
		} else if (Z.cursor == 'ne') {
			h = Z._height - deltaY;
			w = Z._width + deltaX;
			top = Z.top + deltaY;
		} else if (Z.cursor == 'e') {
			w = Z._width + deltaX;
		} else if (Z.cursor == 'se') {
			w = Z._width + deltaX;
			h = Z._height + deltaY;
		} else if (Z.cursor == 's'){
			h = Z._height + deltaY;
		} else if (Z.cursor == 'sw') {
			h = Z._height + deltaY;
			w = Z._width - deltaX;
			left = Z.left + deltaX;
		} else if (Z.cursor == 'w') {
			w = Z._width - deltaX;
			left = Z.left + deltaX;
		}

		if (!Z._checkSize(w, h)) {
			return;
		}
		if (w) {
			Z.tracker.style.width = w + 'px';
		}
		if (h) {
			Z.tracker.style.height = h + 'px';
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
		if (!srcEl.jslet._resizable || srcEl.jslet.state) {
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
		Z.tracker = document.createElement('div');
		jQuery(Z.tracker).addClass('jl-win-tracker');
		Z.tracker.style.top = Z.top + 'px';
		Z.tracker.style.left = Z.left + 'px';
		Z.tracker.style.zIndex = 99999;
		Z.tracker.style.width = Z._width + 'px';
		Z.tracker.style.height = Z._height + 'px';
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

	_createShadow: function () {
		var Z = this;
		if (Z.shadow) {
			return;
		}
		Z.shadow = document.createElement('div');
		jQuery(Z.shadow).addClass('jl-win-shadow');
		Z.shadow.style.zIndex = Z.el.style.zIndex - 1;
		Z.shadow.style.width = Z._width + 3 + 'px';
		Z.shadow.style.height = Z._height + 3 + 'px';

		Z.el.parentNode.appendChild(Z.shadow);
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
		Z.shadow = null;
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
		jslet.ui.textMeasurer.setElement(document.body);
		var arrMsg = message.split('\n'),
			msgLen = arrMsg.length;
		var mh = jslet.ui.textMeasurer.getHeight(message),
			mw = 0;
		for(var i = 0; i < msgLen; i++) {
			mw = Math.max(mw, jslet.ui.textMeasurer.getWidth(message[i]));
		}
		mh = mh * arrMsg.length + 100;
		jslet.ui.textMeasurer.setElement();
		if (mw < 200) {
			mw = 200;
		}
		message = message.replace('\n', '<br />');
		var btnWidth = parseInt(jslet.ui.getCssValue('jl-msg-button', 'width'));
		var btnCount = buttons.length;
		var toolWidth = (btnWidth + 10) * btnCount - 10;
		if (mw < toolWidth) {
			mw = toolWidth;
		}
		mw += 100;
		if (hasInput == 1)  {
			mh += 25;
		} else if (hasInput == 2) {
				mh += 100;
		}
		var opt = { type: 'window', caption: caption, isCenter: true, resizable: false, minimizable: false, maximizable: false, stopEventBubling: true, height: mh, width: mw };
		var owin = jslet.ui.createControl(opt);
		var iconHtml = '';
		if (iconClass) {
			iconHtml = '<div class="jl-msg-icon ';
			if (iconClass == 'info' || iconClass == 'error' || iconClass == 'question' || iconClass == 'warning') {
				iconHtml += 'jl-msg-icon-' + iconClass;
			} else {
				iconHtml += iconClass;
			}
			iconHtml += '"></div>';
		}

		var btnHtml = [], btnName, left, k = 0, i;
		if (jslet.locale.isRtl){
			for (i = btnCount - 1; i >=0; i--) {
				btnName = buttons[i];
				left = (k++) * (btnWidth + 10);
				btnHtml.push('<button class="jl-msg-button" ');
				btnHtml.push(' data-jsletname="');
				btnHtml.push(btnName);
				btnHtml.push('" style="left: ');
				btnHtml.push(left);
				btnHtml.push('px">');
				btnHtml.push(jslet.locale.MessageBox[btnName]);
				btnHtml.push('</button>');
			}
		} else {
			for (i = 0; i < btnCount; i++) {
				btnName = buttons[i];
				left = i * (btnWidth + 10);
				btnHtml.push('<button class="jl-msg-button" ');
				btnHtml.push('" data-jsletname="');
				btnHtml.push(btnName);
				btnHtml.push('" style="left: ');
				btnHtml.push(left);
				btnHtml.push('px">');
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
		var html = ['<div class="jl-msg-container">', iconHtml, '<div class="jl-msg-message">',
					message, inputHtml.join(''), '</div>', '</div>',
					'<div class="jl-msg-tool"><div style="position:relative;width:', toolWidth, 'px;margin:0px auto;">', btnHtml.join(''), '</div></div>'
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
		var obtn;
		for (i = 0; i < btnCount; i++) {
			obtn = toolBar.childNodes[i];
			obtn.onclick = function () {
				btnName = jQuery(this).attr('data-jsletname');
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
			};
		}

		owin.onClosed(function () {
			if (callbackFn) {
				callbackFn(btnName);
			}
		});
		
		owin.showModal();
		owin.setZIndex(99981);
		k = 0;
		if (jslet.locale.isRtl) {
			k = btnCount - 1;
		}
		toolBar.childNodes[k].focus();
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
		if(timeout !== NaN) {
			window.setTimeout(function() {
				owin.close()
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
jslet.ui.MessageBox.error = function (message, caption, callbackFn) {
	var omsgBox = new jslet.ui.MessageBox();
	if (!caption) {
		caption = jslet.locale.MessageBox.error;
	}
	omsgBox.show(message, caption, 'error', ['ok'], callbackFn);
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
