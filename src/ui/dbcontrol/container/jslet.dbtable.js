﻿/*!
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
            Z.listvm.setVisibleStartRow(Z.listvm.getVisibleStartRow() + num);
			var cellEditor = Z.cellEditor();
			if(cellEditor) {
				cellEditor.hideEditor();
			}
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
		jqDiv.html('<span class="jl-tbltree-indent"></span><span class="jl-tbltree-node"></span><span></span><span class="jl-tbltree-text"></span>');
		
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

