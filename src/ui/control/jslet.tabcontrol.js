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
			Z._setVisiTabItems(Z._leftIndex + 1)
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
		var Z = this, w;
		if(!leftIndex && leftIndex !== 0) {
			if(!rightIndex) {
				return;
			}
			if(Z._newable) {
				rightIndex++;
			}
			w = Z._itemsWidth[rightIndex];
			Z._leftIndex = rightIndex;
			for(var i = rightIndex - 1; i >= 0; i--) {
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
		for(var i = leftIndex, len = Z._itemsWidth.length; i < len; i++) {
			w += Z._itemsWidth[i];
			if(w > Z._containerWidth) {
				Z._rightIndex = i - 1;
				break;
			}
			Z._rightIndex = i;
		}
		var leftPos = 0;
		for(var i = 0; i < Z._leftIndex; i++) {
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
		var isHidden = jqBtnRight.hasClass('jl-hidden');
		var totalCnt = Z._itemsWidth.length;
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
			tmpl = ['<a href="javascript:;" class="jl-tab-inner' + (canClose? ' jl-tab-close-loc': '')
			        + '" onclick="javascript:this.blur();" title="' + itemCfg.header + '"><span class="jl-tab-title '];

		tmpl.push('">');
		tmpl.push(itemCfg.header);
		tmpl.push('</span>');
		tmpl.push('<span class="fa fa-times close jl-tab-close' + (!canClose || itemCfg.disabled? ' jl-hidden': '') + '"></span>');
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
			itemCfg.url = url + (url.indexOf('?') >= 0 ? '&': '?') + 'jlTabItemId=' + itemCfg.id;
			if (itemCfg.useIFrame || itemCfg.useIFrame === undefined) {
				var id = jslet.nextId(); 
				var s = '<iframe id="' + id + '"scrolling="yes" frameborder="0" allowtransparency="true" src="' + 
				itemCfg.url + 
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
		if((noDuplicate === undefined || noDuplicate) && newId) {
			for(var i = 0, len = tabItems.length; i < len; i++) {
				if(newId === tabItems[i].id) {
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
				tabItemIndex = Z._getNextValidIndex(tabItemIndex, tabItemIndex >= cnt)
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
		var Z = this;
		if(isLeft) {
			for(var i = start - 1; i >= 0; i--) {
				if(!Z._items[i].disabled) {
					return i;
				}
			}
		} else {
			for(var i = start, len = Z._items.length; i < len; i++) {
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
		if(itemCfg && itemCfg.contentId) {
			var jqFrame = jQuery('#' + itemCfg.contentId);
			if(Z._onContentLoading) {
				Z._onContentLoading.call(Z, jqFrame.attr('id'), itemCfg);
			}
			
			if(jqFrame.attr('src')) {
				jqFrame.attr('src', itemCfg.url);
			}
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

