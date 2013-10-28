/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
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
 * 		var jsletParam = { type: "DBTreeView", 
 *			dataset: "dsAgency", 
 *			displayFields: "[code]+'-'+[name]",
 *          keyField: "id", 
 *			parentField: "parentid",
 *          hasCheckBox: true, 
 *			iconClassField: "iconcls", 
 *			onCreateContextMenu: doCreateContextMenu, 
 *			correlateCheck: true
 *         };
 * //1. Declaring:
 *      &lt;div id="ctrlId" data-jslet="jsletParam">
 *      or
 *      &lt;div data-jslet='jsletParam' />
 *      
 *  //2. Binding
 *      &lt;div id="ctrlId"  />
 *  	//Js snippet
 * 		var el = document.getElementById('ctrlId');
 *  	jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *  	jslet.ui.createControl(jsletParam, document.body);
 *  	
 * </code></pre>
 */
jslet.ui.DBTreeView = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        var Z = this;
        Z.allProperties = 'dataset,displayFields,hasCheckBox,correlateCheck,expandLevel,codeField,codeFormat,keyField,parentField,iconWidth,readOnly,onItemClick,onItemDblClick,iconClassField,onGetIconClass,onCreateContextMenu';
        Z.requiredProperties = 'displayFields,keyField,parentField';
        
        Z.dataset = null;
        /**
         * {String} Display fields, it's a js expresssion, like: "[code]+'-'+[name]"
         */
        Z.displayFields = null;
        /**
         * {Boolean} Identify if there is checkbox on tree node.
         */
        Z.hasCheckBox = false;
        /**
         * {Boolean} Checkbox is readonly or not, ignored if hasCheckBox = false
         */
        Z.readOnly = false;
        
        /**
         * {Integer} Identify the nodes which level is from 0 to "expandLevel" will be expanded when initialize tree.
         */
        Z.expandLevel = -1;
        /**
         * {Boolean} if true, when you check one tree node, its children and its parent will check too;
         */
        Z.correlateCheck = false;
        /**
         * {String} Key field, it will use 'keyField' and 'parentField' to construct tree nodes.
         */
        Z.keyField = null;
        /**
         * {String} Parent field, it will use 'keyField' and 'parentField' to construct tree nodes.
         */
        Z.parentField = null;
        /**
         * {String} If icon class is stored one field, you can set this property to display different tree node icon.
         */
        Z.iconClassField;
        /**
         * {Event} You can use this event to customize your tree node icon flexibly.
         * Pattern: 
         *   function(keyValue, level, isLeaf){}
         *   //keyValue: String, key value of tree node;
         *   //level: Integer, tree node level;
         *   //isLeaf: Boolean, Identify if the tree node is the leaf node.
         */
        Z.onGetIconClass;

        /**
         * {Event} Identify every node has checkbox.
         * Pattern: 
         *   function(keyValue, level, isLeaf){}
         *   //keyValue: String, key value of tree node;
         *   //level: Integer, tree node level;
         *   //isLeaf: Boolean, Identify if the tree node is the leaf node.
         */
        Z.onNodeHasCheckBox;
        
        Z.iconWidth = null;

        $super(el, params)
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
        Z.hasCheckBox = Z.hasCheckBox ? true : false;

        Z.correlateCheck = Z.correlateCheck ? true : false;
		Z.scrBarSize = jslet.scrollbarSize() + 1;

        if (Z.keyField == undefined) {
            Z.keyField = Z.dataset.keyField();
        }
        var ti = jqEl.attr('tabindex');
        if (!ti) {
        	jqEl.attr('tabindex', 0);
        }
		jqEl.keydown(function(event){
			if (Z._doKeydown(event.which)) {
				event.preventDefault();
			}
		});
		jqEl.on('mouseenter', 'table.jl-tree-nodes', function(event){
			$(this).addClass('jl-tree-nodes-hover');
		});
		jqEl.on('mouseleave', 'table.jl-tree-nodes', function(event){
			$(this).removeClass('jl-tree-nodes-hover');
		});
        if (!jqEl.hasClass('jl-tree')) {
        	jqEl.addClass('jl-tree');
        }
        Z.renderAll();
        Z.refreshControl(new jslet.data.UpdateEvent(jslet.data.UpdateEvent.SCROLL, {
            recno: this.dataset.recno()
        }))
        Z._createContextMenu();		
		jslet.resizeEventBus.subscribe(Z);
    }, // end bind

	/**
	 * @override
	 */
    renderAll: function () {
        var Z = this,
			jqEl = jQuery(Z.el);
        Z.evaluator = new jslet.FormulaParser(Z.dataset, Z.displayFields);

        jqEl.html('');
		Z.oldWidth = jqEl.width();
		Z.oldHeight = jqEl.height();
		Z.nodeHeight = Z.iconWidth =  parseInt(jslet.ui.getCssValue('jl-tree-lines', 'width'));
		Z.treePanelHeight = jqEl.height();
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
			
		var lines = [];
		for(var i = 0; i < 5; i++){//Default cells for lines is 5
			lines.push('<td class="jl-tree-lines" ');
			lines.push(jslet.ui.DBTreeView.NODETYPE);
			lines.push('="0"></td>');
		}
		var s = lines.join(''),
			tmpl = ['<table border="0" cellpadding="0" cellspacing="0" style="table-layout:fixed;width:100%;height:100%"><tr><td style="vertical-align:top"><div class="jl-tree-container">'];
		for(var i = 0, cnt = Z.nodeCount; i < cnt; i++){
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
		tmpl.push('</div></td><td class="jl-tree-scroll-col"><div class="jl-tree-scrollbar"><div class="jl-tree-tracker"></div></div></td></tr></table>');
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
			var numb=Math.round(this.scrollTop/Z.nodeHeight);
			if (numb!=Z.listvm.getVisibleStartRow()){
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
		Z.listvm = new jslet.ui.ListViewModel(Z.dataset, true);
		Z.listvm.refreshModel(Z.expandLevel);
		Z.listvm.fixedRows=0;
		
		Z.listvm.onTopRownoChanged=function(rowno){
			var rowno = Z.listvm.getCurrentRowno();
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
			jQuery(Z.el).find('.jl-tree-tracker').height(Z.nodeHeight * allCount);
		}
		
		Z.listvm.onCheckStateChanged = function(){
			Z._fillData();
		}
	},
	
	_doKeydown: function(keyCode){
		var Z = this, result = false;
		if (keyCode == 32){//space
			Z._doCheckBoxClick();
			result = true;
		} else if (keyCode == 38) {//KEY_UP
			Z.listvm.priorRow();
			result = true;
		} else if (keyCode == 40) {//KEY_DOWN
			Z.listvm.nextRow();
			result = true;
		} else if (keyCode == 37) {//KEY_LEFT
			if (jslet.locale.isRtl) {
				Z.listvm.expand();
			} else {
				Z.listvm.collapse();
			}
			result = true;
		} else if (keyCode == 39) {//KEY_RIGHT
			if (jslet.locale.isRtl) {
				Z.listvm.collapse();
			} else {
				Z.listvm.expand();
			}
			result = true;
		} else if (keyCode == 33) {//KEY_PAGEUP
			Z.listvm.priorPage();
			result = true;
		} else if (keyCode == 34) {//KEY_PAGEDOWN
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
	
	_doRowClick: function(node){
		var Z = this,
			nodeType = node.getAttribute(jslet.ui.DBTreeView.NODETYPE);
		if(!nodeType) {
			return;
		}
		if (nodeType != '0') {
			Z._syncToDs(node);
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
		if(nodeType == '9' && Z.onItemClick) {
			Z.onItemClick.call(Z);
		}
	},
	
	_doRowDblClick: function(node){
		this._syncToDs(node);
		var nodeType = node.getAttribute(jslet.ui.DBTreeView.NODETYPE);
		if (this.onItemDblClick && nodeType == '9') {
			this.onItemDblClick.call(this);
		}
	},
	
	_doCheckBoxClick: function(){
		var Z = this;
		if (Z.readOnly) {
			return;
		}
		if (Z.beforeCheckBoxClick) {
			if (!Z.beforeCheckBoxClick()) {
				return;
			}
		}
		var node = Z.listvm.getCurrentRow();
		Z.listvm.checkNode(!node.state? 1:0, Z.correlateCheck);
	},
	
	_syncToDs: function(otr){
		var rowno = -1, k;
		while(true){
			k = otr.jsletrowno
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
	},
	
	_fillData: function(){
		var Z = this,
			vCnt = Z.listvm.getVisibleCount(), 
			topRowno = h=Z.listvm.getVisibleStartRow(),
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
			var b=Z.dataset.startSilenceMove(),
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
				var sb = jqEl.find('.jl-tree-scrollbar');
				if (ajustScrBar) {
					sb.height(Z.treePanelHeight - Z.scrBarSize - 2);
				} else {
					sb.height(Z.treePanelHeight - 2);
				}
			} finally {
				Z.listvm.setCurrentRowno(preRowNo, false);
				Z.dataset.endSilenceMove(b);
				Z._isRendering = false;
				Z._skip_ = false;
			}
	},

	_getCheckClassName: function(expanded){
		if (!expanded) {
			return jslet.ui.htmlclass.TREECHECKBOXCLASS.unChecked;
		}
		if (expanded == 2) { //partial checked
			return jslet.ui.htmlclass.TREECHECKBOXCLASS.partialChecked;
		}
		return jslet.ui.htmlclass.TREECHECKBOXCLASS.checked;
	},
	
	_fillNode: function(node, rowNo){
		var row = node.rows[0],
			Z = this,
			item = Z.listvm.setCurrentRowno(rowNo, true),
			text = Z.evaluator.evalExpr(),
			cells = row.cells, 
			cellCnt = cells.length, 
			reqiredCnt = item.level + 4,
			otd;
		row.jsletrowno = rowNo;
		if (cellCnt < reqiredCnt){
			for(var i = 1, cnt = requiredCnt - cellCnt; i < cnt; i++){
				otd = row.insertCell(0);
				jQuery(otd).addClass('jl-tree-lines').attr('jsletline', 1);
			}
		}
		if (cellCnt > reqiredCnt){
			for( var i = 0, cnt = cellCnt - reqiredCnt; i < cnt; i++){
				cells[i].style.display = 'none';
			}
			for(var i = cellCnt - reqiredCnt; i < reqiredCnt; i++){
				cells[i].style.display = '';
			}
		}
		cellCnt = cells.length;
		//Line
		var pitem = item, k = 1, totalWidth = Z.iconWidth * item.level;
		for(var i = item.level; i >0; i--){
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
		var flag = Z.hasCheckBox && Z.dataset.checkSelectable();
        var ocheckbox = row.cells[cellCnt- 3];
        if (flag) {
            ocheckbox.noWrap = true;
            ocheckbox.className = Z._getCheckClassName(Z.dataset.selected());
			ocheckbox.style.display = '';
			totalWidth += Z.iconWidth;
        } else {
			ocheckbox.style.display = 'none';
        }
        //Icon
		var oicon = row.cells[cellCnt- 2],
			clsName = 'jl-tree-icon',
			iconClsId = null;

		if(Z.iconClassField || Z.onGetIconClass) {
			if(Z.iconClassField) {
				iconClsId = Z.dataset.getFieldValue(Z.iconClassField);
			} else if (Z.onGetIconClass) {
            	var isLeaf = !(item.children && item.children.length > 0);
                iconClsId = Z.onGetIconClass.call(Z, Z.dataset.keyValue(), item.level, isLeaf); //keyValue, level, isLeaf
	        }
            if (iconClsId) {
				clsName += ' '+ iconClsId;
            }
			if (oicon.className != clsName) {
               oicon.className = clsName;
			}
			oicon.style.display = '';
			totalWidth += Z.iconWidth;
		} else {
			oicon.style.display = 'none';
        }
		//Text
		var text = Z.evaluator.evalExpr();
		jslet.ui.textMeasurer.setElement(Z.el);
        var width = Math.round(jslet.ui.textMeasurer.getWidth(text));
		totalWidth += width + 10;
		node.style.width = totalWidth + 'px';
        jslet.ui.textMeasurer.setElement();
		var otd = row.cells[cellCnt- 1];
		otd.style.width = width + 'px';
		otd.innerHTML = text;
		if (item.isbold) {
			jQuery(otd).addClass('jl-tree-child-checked');
		} else {
			jQuery(otd).removeClass('jl-tree-child-checked');
		}
		return totalWidth;
	},
	
	_updateCheckboxState: function(){
			var Z = this, b=Z.dataset.startSilenceMove(),
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
						row.cells[cellCnt- 3].className = Z._getCheckClassName(Z.dataset.selected());
					}
				}
			} finally {
				Z.dataset.endSilenceMove(b);
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
        var menuCfg = { type: 'Menu', onItemClick: Z._menuItemClick, items: [
	        { id: 'expandAll', name: jslet.locale.DBTreeView.expandAll },
	        { id: 'collapseAll', name: jslet.locale.DBTreeView.collapseAll}]
        };
        if (Z.hasCheckBox && !Z.correlateCheck) {
            menuCfg.items.push({ name: '-' });
            menuCfg.items.push({ id: 'checkAll', name: jslet.locale.DBTreeView.checkAll });
            menuCfg.items.push({ id: 'uncheckAll', name: jslet.locale.DBTreeView.uncheckAll });
        }
        if (Z.onCreateContextMenu) {
            Z.onCreateContextMenu.call(Z, menuCfg.items);
        }
        if (menuCfg.items.length == 0) {
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
        	this.listvm.checkNode(true, true);
        } else if (menuid == 'uncheckAll') {
        	this.listvm.checkNode(false, true);
        }
    },

    refreshControl: function (evt) {
        var Z = this,
			evtType = evt.eventType;
        if (evtType == jslet.data.UpdateEvent.METACHANGE) {
        	;
        } else if (evtType == jslet.data.UpdateEvent.UPDATEALL ||
				evtType == jslet.data.UpdateEvent.INSERT ||
				evtType == jslet.data.UpdateEvent.DELETE){
			Z.listvm.refreshModel();
			if(evtType == jslet.data.UpdateEvent.INSERT) {
				Z.listvm.syncDataset();
			}
        } else if (evtType == jslet.data.UpdateEvent.UPDATERECORD ||
				evtType == jslet.data.UpdateEvent.UPDATECOLUMN){
			Z._fillData();
        } else if (evtType == jslet.data.UpdateEvent.SELECTALLCHANGE || 
			evtType == jslet.data.UpdateEvent.SELECTCHANGE) {
			if (Z.hasCheckBox) {
				Z._updateCheckboxState();
			}
        } else if (evtType == jslet.data.UpdateEvent.SCROLL) {
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
		partialChecked : 'jl-tree-checkbox jl-tree-partialchecked'
	};

	jslet.ui.htmlclass.TREENODECLASS = {
		selected : 'jl-tree-selected',
		childChecked : 'jl-tree-child-checked',
		treeNodeLevel : 'jl-tree-child-level'
	};

jslet.ui.DBTreeView.NODETYPE = 'data-nodetype';

jslet.ui.register('DBTreeView', jslet.ui.DBTreeView);
jslet.ui.DBTreeView.htmlTemplate = '<div></div>';


