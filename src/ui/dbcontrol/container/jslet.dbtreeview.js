﻿/*!
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
			Z._dataset.recno(Z.listvm.getCurrentRecno());
			result = true;
		} else if (keyCode === jslet.ui.KeyCode.DOWN) {//KEY_DOWN
			Z.listvm.nextRow();
			Z._dataset.recno(Z.listvm.getCurrentRecno());
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
			Z._dataset.recno(Z.listvm.getCurrentRecno());
			result = true;
		} else if (keyCode === jslet.ui.KeyCode.PAGEDOWN) {//KEY_PAGEDOWN
			Z.listvm.nextPage();
			Z._dataset.recno(Z.listvm.getCurrentRecno());
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
		window.setTimeout(function() {
			Z._checkScrollBar();
		}, 5);
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
	
	_checkScrollBar: function() {
		var jqScr = jQuery(this.el).find('.jl-tree-scrollbar');
		var scr = jqScr[0];
		if(scr.scrollHeight > scr.clientHeight) {
			jqScr.removeClass('jl-tree-scrollbar-hidden');
		} else {
			if(!jqScr.hasClass('jl-tree-scrollbar-hidden')) {
				jqScr.addClass('jl-tree-scrollbar-hidden');
			}
		}
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
		var Z = this;
		if (menuid == 'expandAll') {
			Z.expandAll();
		} else if (menuid == 'collapseAll') {
			Z.collapseAll();
		} else if (menuid == 'checkAll') {
			Z.listvm.checkChildNodes(true, Z._correlateCheck);
			if (Z._afterCheckBoxClick) {
				Z._afterCheckBoxClick.call(Z);
			}
		} else if (menuid == 'uncheckAll') {
			Z.listvm.checkChildNodes(false, Z._correlateCheck);
			if (Z._afterCheckBoxClick) {
				Z._afterCheckBoxClick.call(Z);
			}
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


