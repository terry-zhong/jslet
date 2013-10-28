/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class TabControl. Example:
 * <pre><code>
 * var jsletParam = {type: "TabControl", 
 *		selectedIndex: 1, 
 *		onCreateContextMenu: doCreateContextMenu, 
 *		items: [
 *			{header: "one", userIFrame: true, url: "http://www.google.com", iconClass: "tabIcon"},
 *			{header: "two", closable: true, divId: "p2"},
 *			{header:"three",closable:true,divId:"p3"},
 *		]};
 *  //1. Declaring:
 *     &lt;div data-jslet='jsletParam' style="width: 300px; height: 400px;" />
 *      
 *  //2. Binding
 *  	&lt;div id='ctrlId' />
 *  	//Js snippet
 * 		var el = document.getElementById('ctrlId');
 *  	jslet.ui.bindControl(el, jsletParam);
 *  		
 *  //3. Create dynamically
 *  	jslet.ui.createControl(jsletParam, document.body);
 *  	
 * </code></pre>
 */
jslet.ui.TabControl = jslet.Class.create(jslet.ui.Control, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        var Z = this;
        Z.el = el;
        Z.allProperties = 'selectedIndex,newable,closable,items,onAddTabItem,onSelectedChanged,onRemoveTabItem,onCreateContextMenu';
        
        /**
         * {Integer} Selected tab item index.
         */
        Z.selectedIndex = 0;
        
        /**
         * Identify if user can add tab item on fly. 
         */
        Z.newable = true;
        
        /**
         * Identify if user can close tab item on fly
         */
        Z.closable = true;
        
        /**
         * {Event} Fire when user toggle tab item.
         * Pattern: 
         *   function(oldIndex, newIndex){}
         *   //oldIndex: Integer
         *   //newIndex: Integer
         */
        Z.onSelectedChanged;
        
        /**
         * Fire after add a new tab item.
         * Pattern: 
         *   function(){}
         */
        Z.onAddTabItem;
        
        /**
         * Fire after remove a tab item.
         * Pattern: 
         *  function(tabIndex, selected){}
         *  //tabIndex: Integer
         *  //selected: Boolean Identify if the removing item is active
         *  //return: Boolean, false - cancel removing tab item, true - remove tab item. 
         */
        Z.onRemoveTabItem;
        
        /**
         * (Event) Fire before show context menu
         * Pattern: 
         *   function(menuItems){}
         *   //menuItems: Array of MenuItem, @see menu item configuration in jslet.menu.js.
         */
        Z.onCreateContextMenu;
        
        /**
         * {Array of jslet.ui.TabItem} Tab item configuration.
         */
        Z.items = [];

        Z._leftIndex = 0;
        Z._rightIndex = 0;
        Z._naviBtnWidth = 0;
        Z._tabControlWidth = jQuery(Z.el).width();
        jslet.resizeEventBus.subscribe(this);
        $super(el, params);
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
        	template = [
           '<div class="jl-tab-header jl-unselectable"><div class="jl-tab-container jl-unselectable"><ul class="jl-tab-list">',
           Z.newable ? '<li><a href="javascript:;" class="jl-tab-inner"><span class="jl-tab-new">+</span></a></li>' : '',
           '</ul></div><a class="jl-tab-left jl-tab-left-disabled"></a><a class="jl-tab-right"></a></div><div class="jl-tab-items"></div>'];

        var jqEl = jQuery(Z.el);
        if (!jqEl.hasClass('jl-tabcontrol'))
        	jqEl.addClass('jl-tabcontrol');
        jqEl.html(template.join(''));
        if (Z.newable) {
			oul = jqEl.find('.jl-tab-list')[0];
            var newTab = oul.childNodes[oul.childNodes.length - 1];
            Z._newTabItem = newTab;
            
            newTab.onclick = function () {
                var itemCfg = null;
                if (Z.onAddTabItem) {
                    itemCfg = Z.onAddTabItem.call(Z);
                }
                if (!itemCfg) {
                    itemCfg = new jslet.ui.TabItem();
                    itemCfg.header = 'new tab';
                    itemCfg.closable = true;
                }
                Z.items.push(itemCfg);
                Z.addTabItem(itemCfg);
                Z.setSelectedIndex(Z.items.length - 1);
                if (Z._rightIndex > 0) {
                    Z._changeLeftIndex(1);
                }
            }
        }

        var btnLeft = jqEl.find('.jl-tab-left')[0];
        Z._naviBtnWidth += jQuery(btnLeft).width();

        btnLeft.onclick = function () {
            Z._changeLeftIndex(-1);
        };
        var btnRight = jqEl.find('.jl-tab-right')[0];
        Z._naviBtnWidth += jQuery(btnRight).width();

        btnRight.onclick = function () {
            Z._changeLeftIndex(1);
        };

        if (Z.items && Z.items.length > 0) {
            var oitem, 
            	cnt = Z.items.length;
            for (var i = 0; i < cnt; i++) {
                oitem = Z.items[i];
                Z.addTabItem(oitem, true);
            }
            Z._refreshRightIndex();
            Z.setSelectedIndex(Z.selectedIndex);
        }
        Z._createContextMenu();
    },

    addItem: function (itemCfg) {
        this.items[this.items.length] = itemCfg;
    },

    _createContextMenu: function () {
        var Z = this;
        if (!jslet.ui.Menu || !Z.closable) {
            return;
        }
        var menuCfg = { type: 'Menu', onItemClick: Z._menuItemClick, items: [
	        { id: 'close', name: jslet.locale.TabControl.close},
	        { id: 'closeOther', name: jslet.locale.TabControl.closeOther}]};
        if (Z.onCreateContextMenu) {
            Z.onCreateContextMenu.call(Z, menuCfg.items);
        }

        if (menuCfg.items.length == 0) {
            return;
        }
        Z.contextMenu = jslet.ui.createControl(menuCfg);

        var head = jQuery(Z.el).find('.jl-tab-header')[0];

        head.oncontextmenu = function (event) {
            var evt = event || window.event;
            Z.contextMenu.showContextMenu(evt, Z);
        };
    },

    _menuItemClick: function (menuid, checked) {
        if (menuid == 'close') {
            this.close();
        } else {
            if (menuid == 'closeOther') {
                this.closeOther();
            }
        }
    },

    _changeLeftIndex: function (delta) {
        var Z = this;
        var newIndex = Z._leftIndex + delta;
        if (newIndex < 0 || newIndex > Z._rightIndex + 1) {
            return;
        }
        var odiv = jQuery(Z.el).find('.jl-tab-container')[0];
        var oul = jQuery(odiv).find('.jl-tab-list')[0];
        var nodes = oul.childNodes;
        if (newIndex > 0) {
            var pos = jQuery(nodes[newIndex]).offset();
            odiv.scrollLeft = jslet.locale.isRtl ? (5000 -( pos.left - 15)):(pos.left - 15);
        } else {
            odiv.scrollLeft = jslet.locale.isRtl ? 5000 : 0;
        }
        Z._leftIndex = newIndex;
        var jqBtnLeft = jQuery(Z.el).find('.jl-tab-left');
        var disabledLeft = jqBtnLeft.hasClass('jl-tab-left-disabled');
        if (newIndex == 0) {
            if (!disabledLeft) {
            	jqBtnLeft.addClass('jl-tab-left-disabled');
            }
        } else {
            if (disabledLeft) {
            	jqBtnLeft.removeClass('jl-tab-left-disabled');
            }
        }

        var jqBtnRight = jQuery(Z.el).find('.jl-tab-right');
        var disabledRight = jqBtnRight.hasClass('jl-tab-right-disabled');
        if (newIndex == Z._rightIndex + 1) {
            if (!disabledRight) {
            	jqBtnRight.addClass('jl-tab-right-disabled');
            }
        } else {
            if (disabledRight) {
            	jqBtnRight.removeClass('jl-tab-right-disabled');
            }
        }
    },

    _refreshRightIndex: function () {
        var Z = this,
        	jqEl =jQuery(Z.el),
        	oul = jqEl.find('.jl-tab-list')[0],
        	nodes = oul.childNodes,
        	cnt = nodes.length - 1,
        	w = 0,
        	totalW = jQuery(oul.parentNode).width() - Z._naviBtnWidth;
        Z._rightIndex = 0;
        for (var i = cnt; i >= 0; i--) {
            w += jQuery(nodes[i]).width();
            if (w > totalW) {
                Z._rightIndex = i + 1;
                break;
            }
        }
        if (Z._rightIndex < Z._leftIndex){
        	Z._changeLeftIndex(Z._rightIndex - Z._leftIndex);
        }
        var displayStr = Z._rightIndex > 0 ? 'block' : 'none',
        	btnLeft = jqEl.find('.jl-tab-left')[0],
        	btnRight = jqEl.find('.jl-tab-right')[0];
        btnLeft.style.display = displayStr;
        btnRight.style.display = displayStr;
    },

    _createHeader: function (parent, itemCfg) {
        var Z = this,
        	tmpl = ['<a href="javascript:;" class="jl-tab-inner" onclick="javascript:this.blur();"><span class="jl-tab-title '],
        	canClose = Z.closable && itemCfg.closable;
        if (canClose) {
        	tmpl.push('jl-tab-close-loc ');
        }

        if (itemCfg.iconClass) {
        	tmpl.push('jl-tab-icon-loc ');
        }
        tmpl.push('">');
        tmpl.push(itemCfg.header);
        tmpl.push('</span>');
        if (itemCfg.iconClass){
        	tmpl.push('<span class="jl-tab-icon ');
        	tmpl.push(itemCfg.iconClass);
        	tmpl.push('"></span>');
        }
        tmpl.push('</a>');
        if (canClose) {
        	tmpl.push('<a href="javascript:;" class="jl-tab-close"></a>');
        }
        var oli = document.createElement('li');
        oli.innerHTML = tmpl.join('');

        if (Z.newable) {
            var lastNode = parent.childNodes[parent.childNodes.length - 1];
            parent.insertBefore(oli, lastNode);
        } else {
            parent.appendChild(oli);
        }
        oli.jslet = Z;
        jQuery(oli).on('mousedown', Z._changeTabItem);

        if (canClose) {
            jQuery(oli).find('.jl-tab-close').click(Z._doCloseBtnClick);
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
        this.jslet.setSelectedIndex(index);
    },

    _doCloseBtnClick: function () {
        var oli = this.parentNode,
        	nodes = oli.parentNode.childNodes,
        	index = -1;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i] == oli) {
                index = i;
                break;
            }
        }
        oli.jslet.removeTabItem(index);
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
        	w = jqEl.width() - padding,
        	h = jqEl.height() - padding - jqHead.height();

        if (itemCfg.content || itemCfg.divId) {
            var ocontent = itemCfg.content ? itemCfg.content : jQuery('#'+itemCfg.divId)[0];
            if (ocontent) {
                if (ocontent.parentNode) {
                    ocontent.parentNode.removeChild(ocontent);
                }
                odiv.appendChild(ocontent);
                if (ocontent.style.display == 'none') {
                    ocontent.style.display = 'block';
                }
                return;
            }
        }

        if (itemCfg.url) {
            if (itemCfg.useIFrame) {
                var s = '<iframe scrolling="yes" frameborder="0" src="' + 
                itemCfg.url + 
                '" style="padding-left:5px;padding-top:5px;width: ' + 
                w + 'px;height:' + 
                h + 'px;"></iframe>';
                jqDiv.html(s);
            }
        }
    },

    /**
     * Change selected tab item.
     * 
     * @param {Integer} index Tab item index which will be toggled to.
     */
    setSelectedIndex: function (index) {
        var Z = this,
        	jqEl = jQuery(Z.el),
        	oli, 
        	oul = jqEl.find('.jl-tab-list')[0],
        	nodes = oul.childNodes,
        	cnt = nodes.length - (Z.newable ? 2 : 1);
        if (index > cnt || index < 0) {
            return;
        }

        if (Z.onSelectedChanged) {
            var canChanged = Z.onSelectedChanged.call(Z, Z.selectedIndex, index);
            if (canChanged != undefined && !canChanged) {
                return;
            }
        }

        var itemContainer = jqEl.find('.jl-tab-items')[0],
        	item, 
        	items = itemContainer.childNodes;
        for (var i = 0; i <= cnt; i++) {
            oli = jQuery(nodes[i]);
            item = items[i];
            if (i == index) {
                oli.addClass('jl-tab-selected');
                item.style.display = 'block';
            }
            else {
                oli.removeClass('jl-tab-selected');
                item.style.display = 'none';
            }
        }
        Z.selectedIndex = index;
    },

    /**
     * Add tab item dynamically.
     * 
     * @param {Object} newItemCfg Tab item configuration
     * @param {Boolean} notRefreshRightIdx Improve performance purpose. If you need add a lot of tab item, you can set this parameter to true. 
     */
    addTabItem: function (newItemCfg, notRefreshRightIdx) {
        var Z = this,
        	jqEl = jQuery(Z.el),
        	oul = jqEl.find('.jl-tab-list')[0];
        Z._createHeader(oul, newItemCfg);

        var panelContainer = jqEl.find('.jl-tab-items')[0];
        Z._createBody(panelContainer, newItemCfg);
        if (!notRefreshRightIdx) {
            Z._refreshRightIndex();
        }
    },

    /**
     * Remove tab item with tabIndex
     * 
     * @param {Integer} tabIndex Tab item index
     */
    removeTabItem: function (tabIndex) {
        var Z = this,
        	jqEl = jQuery(Z.el),
        	oli, 
        	oul = jqEl.find('.jl-tab-list')[0],
        	nodes = oul.childNodes,
        	cnt = nodes.length - (Z.newable ? 2 : 1);
        if (tabIndex > cnt || tabIndex < 0) {
            return;
        }
        oli = jQuery(nodes[tabIndex]);
        var selected = oli.hasClass('jl-tab-selected');
        if (Z.onRemoveTabItem) {
            var canRemoved = Z.onRemoveTabItem.call(Z, tabIndex, selected);
            if (!canRemoved) {
                return;
            }
        }
        oul.removeChild(oli[0]);
        Z.items.splice(tabIndex, 1);
        var panelContainer = jqEl.find('.jl-tab-items')[0];
        nodes = panelContainer.childNodes;
        panelContainer.removeChild(nodes[tabIndex]);

        if (selected) {
            cnt--;
            if (tabIndex < cnt) {
                tabIndex++;
            } else {
                tabIndex--;
            }
            if (tabIndex >= 0) {
                Z.setSelectedIndex(tabIndex);
            }
        }
        Z._refreshRightIndex();

        if (Z._leftIndex >= Z._rightIndex) {
            Z._changeLeftIndex(Z._rightIndex - Z._leftIndex);
        }
    },

    /**
     * Close the current active tab item  if this tab item is closable.
     */
    close: function () {
        var Z = this,
        	k = Z.selectedIndex;
        if (k >= 0 && Z.items[k].closable) {
            Z.removeTabItem(k);
        }
    },

    /**
     * Close all closable tab item except current active tab item.
     */
    closeOther: function () {
        var Z = this;
        for (var i = Z.items.length - 1; i >= 0; i--) {
            if (Z.items[i].closable) {
                if (Z.selectedIndex == i) {
                    continue;
                }
                Z.removeTabItem(i);
            }
        }
    },
    
    /**
     * Run when container size changed, it's revoked by jslet.resizeeventbus.
     * 
     */
    checkSizeChanged: function(){
    	var Z = this,
    		currWidth = jQuery(Z.el).width();
        if ( Z._tabControlWidth != currWidth){
        	Z._tabControlWidth = currWidth;
        	Z._refreshRightIndex();
        }
    },
    
    /**
     * @override
     */
    destroy: function($super){
    	var Z = this;
    	Z._newTabItem.onclick = null;
    	Z._newTabItem = null;
    	
        var head = jQuery(Z.el).find('.jl-tab-header')[0];
        head.oncontextmenu = null;
        jQuery(Z.el).find('.jl-tab-close').off();
        var items = jQuery(Z.el).find('.jl-tab-list').find('li');
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

/**
* Tab Item
*/
jslet.ui.TabItem = function () {
    var Z = this;
    Z.id; //{String} Element Id
    Z.index; //{Integer} TabItem index
    Z.iconClass; //{String} The icon class of tab item head 
    Z.header; //{String} Head of tab item
    Z.closable = false; //{Boolean} Can be closed or not
    Z.enable = true; //{Boolean} 
    Z.visible = true; //{Boolean} 
    Z.useIFrame = false; //{Boolean} 
    Z.url = null; //{String} 
    Z.divId = null; //{String} 
    Z.content = null //{String} 
}


