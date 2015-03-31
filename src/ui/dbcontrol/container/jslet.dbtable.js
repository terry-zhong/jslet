/* ========================================================================
 * Jslet framework: jslet.dbtable.js
 *
 * Copyright (c) 2014 Jslet Group(https://github.com/jslet/jslet/)
 * Licensed under MIT (https://github.com/jslet/jslet/LICENSE.txt)
 * ======================================================================== */

jslet.ui.htmlclass.TABLECLASS = {
	currentrow: 'jl-tbl-current',
	celldiv: 'jl-tbl-cell',
	scrollBarWidth: 17,
	selectColWidth: 30,
	hoverrow: 'jl-tbl-row-hover',
	
	sortAscChar: '&#8593;',
	sortDescChar: '&#8595;'
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
		
		Z.allProperties = 'dataset,fixedRows,fixedCols,hasSeqCol,hasSelectCol,noborder,readOnly,hideHead,disableHeadSort,onlySpecifiedCol,selectBy,rowHeight,onRowClick,onRowDblClick,onSelect,onSelectAll,onCustomSort,onFillRow,onFillCell,treeField,columns,subgroup';
		
		/**
		 * {Integer} Fixed row count.
		 */
		Z._fixedRows = 0;
		/**
		 * {Integer} Fixed column count.
		 */
		Z._fixedCols = 0;
		/**
		 * {Boolean} Identify if there is sequence column in DBTable.
		 */
		Z._hasSeqCol = true;
		/**
		 * {Boolean} Identify if there is select column in DBTable.
		 */
		Z._hasSelectCol = false;
		
		/**
		 * {Boolean} Identify if table cell has border
		 */
		Z._noborder = false;
		
		/**
		 * {Boolean} Identify if DBTable is readonly.
		 */
		Z._readOnly = true;
		/**
		 * {Boolean} Identify if there is table header in DBTable.
		 */
		Z._hideHead = false;
		/**
		 * {Boolean} Identify if DBTable disable user to click header to sort.
		 */
		Z._disableHeadSort = false;
		/**
		 * {String} one or more fields' name concatenated with ','
		 * @see jslet.data.Dataset.select(selected, selectBy).
		 */
		Z._selectBy = null;
		/**
		 * {Integer} Row height.
		 */
		Z._rowHeight = 25;
		/**
		 * {Integer} Row height of table header.
		 */
		Z._headRowHeight = 25;
		/**
		 * {String} Display table as tree style, only one field name allowed. If this property is set, the dataset must be a tree style dataset, 
		 *  means dataset.parentField() and dataset.levelField() can not be empty.
		 * Only one field allowed.
		 */
		Z._treeField = null;
		/**
		 * {jslet.ui.TableColumn[]} Array of jslet.ui.TableColumn
		 */
		Z._columns = null;
		
		/**
		 * {Event} Fired when user clicks table row.
		 *  Pattern: 
		 *function(event}{}
		 *  //event: Js mouse event
		 */
		Z._onRowClick = null;
		/**
		 * {Event} Fired when user double clicks table row.
		 * Pattern: 
		 *function(event}{}
		 *  //event: Js mouse event
		 */
		Z._onRowDblClick = null;
		/**
		 * {Event} Fired when user click table header to sort data. You can use it to sort data instead of default, like sending request to server to sort data.  
		 * Pattern: 
		 *   function(indexFlds}{}
		 *   //indexFlds: String, format: fieldName desc/asce(default), fieldName,..., desc - descending order, asce - ascending order, like: "field1 desc,field2,field3"
		 */
		Z._onCustomSort = null; 
		
		/**
		 * {Event} Fired when user selects one row.
		 * Pattern: 
		 *   function(selected}{}
		 *   //selected: Boolean
		 *   //return: true - allow user to select this row, false - otherwise.
		 */
		Z._onSelect = null;
		/**
		 * {Event} Fired when user click select all by clicking "Select Column" header.
		 * Pattern: 
		 *   function(dataset, Selected}{}
		 *   //dataset: jslet.data.Dataset
		 *   //Selected: Boolean
		 *   //return: true - allow user to select, false - otherwise.
		 */
		Z._onSelectAll = null;
		
		/**
		 * {Event} Fired when fill row, user can use this to customize each row style like background color, font color
		 * Pattern:
		 *   function(otr, dataset){)
		 *   //otr: Html element: TR
		 *   //dataset: jslet.data.Dataset
		 */
		Z._onFillRow = null;
		
		/**
		 * {Event} Fired when fill cell, user can use this to customize each cell style like background color, font color
		 * Pattern:
		 *   function(otd, dataset, fieldName){)
		 *   //otd: Html element: TD
		 *   //dataset: jslet.data.Dataset
		 *   //fieldName: String
		 */
		Z._onFillCell = null;		
		
		//@private
		Z.contentHeight = 0;
		Z.subgroup = null;//jslet.ui.TableSubgroup
		
		Z._sysColumns = null;//all system column like sequence column, select column, sub-group column
		Z._isHoriOverflow = false;
		Z._hoverRowIndex = -1;
		Z._oldHoverRowClassName;
		Z._oldHeight = null;
		Z._fillDataDebounce = jslet.debounce(this._innerFillData, 30);
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
	
	rowHeight: function(rowHeight) {
		if(rowHeight === undefined) {
			return this._rowHeight;
		}
		jslet.Checker.test('DBTable.rowHeight', rowHeight).isGTZero();
		this._rowHeight = parseInt(rowHeight);
	},
	
	headRowHeight: function(rowHeight) {
		if(headRowHeight === undefined) {
			return this._headRowHeight;
		}
		jslet.Checker.test('DBTable.headRowHeight', headRowHeight).isGTZero();
		this._headRowHeight = parseInt(headRowHeight);
	},
	
	hasSeqCol: function(hasSeqCol) {
		if(hasSeqCol === undefined) {
			return this._hasSeqCol;
		}
		this._hasSeqCol = hasSeqCol ? true: false;
	},
	
	hasSelectCol: function(hasSelectCol) {
		if(hasSelectCol === undefined) {
			return this._hasSelectCol;
		}
		this._hasSelectCol = hasSelectCol ? true: false;
	},
	
	noborder: function(noborder) {
		if(noborder === undefined) {
			return this._noborder;
		}
		this._noborder = noborder ? true: false;
	},
	
	readOnly: function(readOnly) {
		var Z = this;
		if(readOnly === undefined) {
			return Z._readOnly;
		}
		Z._readOnly = readOnly ? true: false;
		if(!Z._readOnly) {
			Z._rowHeight = 35;
			Z._headRowHeight = 35;
		}
	},
	
	hideHead: function(hideHead) {
		if(hideHead === undefined) {
			return this._hideHead;
		}
		this._hideHead = hideHead ? true: false;
	},
	
	disableHeadSort: function(disableHeadSort) {
		if(disableHeadSort === undefined) {
			return this._disableHeadSort;
		}
		this._disableHeadSort = disableHeadSort ? true: false;
	},
	
	onlySpecifiedCol: function(onlySpecifiedCol) {
		if(onlySpecifiedCol === undefined) {
			return this._onlySpecifiedCol;
		}
		this._onlySpecifiedCol = onlySpecifiedCol ? true: false;
	},
	
	selectBy: function(selectBy) {
		if(selectBy === undefined) {
			return this._selectBy;
		}
			jslet.Checker.test('DBTable.selectBy', selectBy).isString();
		this._selectBy = selectBy;
	},
	
	treeField: function(treeField) {
		if(treeField === undefined) {
			return this._treeField;
		}
			jslet.Checker.test('DBTable.treeField', treeField).isString();
		this._treeField = treeField;
	},
	
	onRowClick: function(onRowClick) {
		if(onRowClick === undefined) {
			return this._onRowClick;
		}
		jslet.Checker.test('DBTable.onRowClick', onRowClick).isFunction();
		this._onRowClick = onRowClick;
	},
	
	onRowDblClick: function(onRowDblClick) {
		if(onRowDblClick === undefined) {
			return this._onRowDblClick;
		}
		jslet.Checker.test('DBTable.onRowDblClick', onRowDblClick).isFunction();
		this._onRowDblClick = onRowDblClick;
	},
	
	onSelect: function(onSelect) {
		if(onSelect === undefined) {
			return this._onSelect;
		}
		jslet.Checker.test('DBTable.onSelect', onSelect).isFunction();
		this._onSelect = onSelect;
	},
	
	onSelectAll: function(onSelectAll) {
		if(onSelectAll === undefined) {
			return this._onSelectAll;
		}
		jslet.Checker.test('DBTable.onSelectAll', onSelectAll).isFunction();
		this._onSelectAll = onSelectAll;
	},
	
	onCustomSort: function(onCustomSort) {
		if(onCustomSort === undefined) {
			return this._onCustomSort;
		}
		jslet.Checker.test('DBTable.onCustomSort', onCustomSort).isFunction();
		this._onCustomSort = onCustomSort;
	},
	
	onFillRow: function(onFillRow) {
		if(onFillRow === undefined) {
			return this._onFillRow;
		}
		jslet.Checker.test('DBTable.onFillRow', onFillRow).isFunction();
		this._onFillRow = onFillRow;
	},
	
	onFillCell: function(onFillCell) {
		if(onFillCell === undefined) {
			return this._onFillCell;
		}
		jslet.Checker.test('DBTable.onFillCell', onFillCell).isFunction();
		this._onFillCell = onFillCell;
	},
	
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
		jslet.resizeEventBus.subscribe(Z);
		
		jslet.ui.textMeasurer.setElement(Z.el);
		Z.charHeight = jslet.ui.textMeasurer.getHeight('M')+4;
		jslet.ui.textMeasurer.setElement();
		Z.charWidth = 12;
		Z._widthStyleId = jslet.nextId();
				
		Z._initializeVm();
		Z.renderAll();
		var jqEl = jQuery(Z.el);
		var ti = jqEl.attr('tabindex');
		if (!ti) {
			jqEl.attr('tabindex', 0);
		}

        var notFF = ((typeof Z.el.onmousewheel) == 'object'); //firefox or nonFirefox browser
        var wheelEvent = (notFF ? 'mousewheel' : 'DOMMouseScroll');
        jqEl.on(wheelEvent, function (event) {
            var originalEvent = event.originalEvent;
            var num = notFF ? originalEvent.wheelDelta / -120 : originalEvent.detail / 3;
            Z.listvm.setVisibleStartRow(Z.listvm.getVisibleStartRow() + num);
       		event.preventDefault();
        });
        
		jqEl.on('keydown', function (event) {
			var keyCode = event.which;
			if (keyCode == 38) {//KEY_UP
				Z.listvm.priorRow();
				event.preventDefault();
			} else if (keyCode == 40) {//KEY_DOWN
				Z.listvm.nextRow();
				event.preventDefault();
			} else if (keyCode == 33) {//KEY_PAGEUP
				Z.listvm.priorPage();
				event.preventDefault();
			} else if (keyCode == 34) {//KEY_PAGEDOWN
				Z.listvm.nextPage();
				event.preventDefault();
			}
		});		
	}, // end bind
	
	_initializeVm: function () {
		var Z = this;
						
		Z.listvm = new jslet.ui.ListViewModel(Z._dataset, Z._treeField ? true : false);
		
		Z.listvm.onTopRownoChanged = function (rowno) {
			if (rowno < 0) {
				return;
			}
			var context = Z._dataset.startSilenceMove();
			try {
				Z._fillData();
			} finally {
				Z._dataset.endSilenceMove(context);
			}
			
			Z._syncScrollBar(rowno);
			Z._showCurrentRow();
		};
	
		Z.listvm.onVisibleCountChanged = function () {
			Z.renderAll();
		};
		
		Z.listvm.onCurrentRownoChanged = function (preRowno, rowno) {
			if (Z._dataset.recordCount() === 0) {
				return;
			}
			Z._oldHoverRowClassName = '';
			if (Z.prevRow) {
				if (Z.prevRow.fixed) {
					jQuery(Z.prevRow.fixed).removeClass(jslet.ui.htmlclass.TABLECLASS.currentrow);
				}
				jQuery(Z.prevRow.content).removeClass(jslet.ui.htmlclass.TABLECLASS.currentrow);
			}
			var currRow = Z._getTrByRowno(rowno), otr;
			if (!currRow) {
				return;
			}
			otr = currRow.fixed;
			var recno = Z._dataset.recno();
			if (otr) {
				jQuery(otr).addClass(jslet.ui.htmlclass.TABLECLASS.currentrow);
				if(Z._hoverRowIndex == otr.rowIndex) {
					Z._oldHoverRowClassName = jslet.ui.htmlclass.TABLECLASS.currentrow;
				}
			}
			
			otr = currRow.content;
			jQuery(otr).addClass(jslet.ui.htmlclass.TABLECLASS.currentrow);
			if(Z._hoverRowIndex == otr.rowIndex) {
				Z._oldHoverRowClassName = jslet.ui.htmlclass.TABLECLASS.currentrow;
			}
			Z.prevRow = currRow;
		};
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this;
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

	_prepareColumn: function(){
		var Z = this, cobj;
		Z._sysColumns = [];
		//prepare system columns
		if (Z._hasSeqCol){
			cobj = {label:'&nbsp;',width: Z.seqColWidth, disableHeadSort:true,isSeq:true, 
					cellRender:jslet.ui.DBTable.sequenceCellRender, widthCssName: Z._widthStyleId + '-s0'};
			Z._sysColumns.push(cobj);
		}
		if (Z._hasSelectCol){
			cobj = {label:'<input type="checkbox" />', width: Z.selectColWidth, disableHeadSort:true,isSelect:true, 
					cellRender:jslet.ui.DBTable.selectCellRender, widthCssName: Z._widthStyleId + '-s1'};
			Z._sysColumns.push(cobj);
		}
		
		if (Z.subgroup && Z.subgroup.hasExpander){
			cobj = {label:'&nbsp;', width: Z.selectColWidth, disableHeadSort:true, isSubgroup: true, 
					cellRender:jslet.ui.DBTable.subgroupCellRender, widthCssName: Z._widthStyleId + '-s2'};
			Z._sysColumns.push(cobj);
		}
		//prepare data columns
		var tmpColumns = [];
		if (!Z._onlySpecifiedCol) {
			if (Z._columns){
				for(var i = 0, colCnt = Z._columns.length; i < colCnt; i++){
					cobj = Z._columns[i];
					if (!cobj.field){
						tmpColumns.push(cobj);
						cobj.disableHeadSort = true;
					}
				}
			}
			
			function getColumnObj(fldName) {
				if (Z._columns){
					for(var i = 0, colCnt = Z._columns.length; i < colCnt; i++){
						cobj = Z._columns[i];
						if (!cobj.field && cobj.field == fldName){
							return cobj;
						}
					}
				}
				return null;
			}
			
			var fldObj, fldName,fields = Z._dataset.getFields();
			for (var i = 0, fldcnt = fields.length; i < fldcnt; i++) {
				fldObj = fields[i];
				fldName = fldObj.name();
				if (fldObj.visible()) {
					cobj = getColumnObj(fldName);
					if(!cobj) {
						cobj = new jslet.ui.TableColumn();
						cobj.field = fldObj.name();
					}
					tmpColumns.push(cobj);
				} // end if visible
			} // end for
			if (Z._columns){
				for(var i = 0, colCnt = Z._columns.length; i < colCnt; i++){
					cobj = Z._columns[i];
					if (!cobj.field){
						continue;
					}
					fldObj = Z._dataset.getTopField(cobj.field);
					if (!fldObj) {
						throw new Error("Field: " + cobj.field + " doesn't exist!");
					}
					if (fldObj.getType() == jslet.data.DataType.GROUP){
						fldName = fldObj.name();
						var isUnique = true;
						// cobj.field is not a child of a groupfield, we need check if the topmost parent field is duplicate or not 
						if (cobj.field != fldName){
							for(var k = 0; k < tmpColumns.length; k++){
								if (tmpColumns[k].field == fldName){
									isUnique = false;
									break;
								}
							} // end for k
						}
						if (isUnique){
							cobj = new jslet.ui.TableColumn();
							cobj.field = fldName;
							tmpColumns.push(cobj);
						}
					}
				} //end for i
			} //end if Z.columns
		} else{
			for(var i = 0, colCnt = Z._columns.length; i < colCnt; i++){
				cobj = Z._columns[i];
				if (!cobj.field){
					cobj.disableHeadSort = true;
				}
				tmpColumns.push(cobj);
			}
		}
		Z.innerHeads = [];
		Z.innerColumns = [];
		var ohead, fldName, label, context = {lastColNum: 0, depth: 0};
		
		for(var i = 0, colCnt = tmpColumns.length; i < colCnt; i++){
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
		var colCnt = 0, preColCnt = 0, 
		fixedColNum = Z._fixedCols - Z._sysColumns.length;
		for(var i = 1, len = Z.innerHeads.length; i < len; i++){
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
			ohead.rowSpan = Z.maxHeadRows - level;
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
		if (!parentHeadObj){
			level = 0;
			heads = Z.innerHeads;
		} else {
			level = parentHeadObj.level + 1;
			heads = parentHeadObj.subHeads;
		}
		var ohead, fldName = fldObj.name();
		ohead = new jslet.ui.TableHead();
		ohead.label = fldObj.label();
		ohead.field = fldName;
		ohead.level = level;
		ohead.colNum = context.lastColNum;
		ohead.id = jslet.nextId();
		heads.push(ohead);
		context.depth = Math.max(level, context.depth);
		if (fldObj.getType() == jslet.data.DataType.GROUP){
			ohead.subHeads = [];
			var fldChildren = fldObj.children(), added = false;
			for(var i = 0, cnt = fldChildren.length; i< cnt; i++){
				Z._convertField2Head(context, fldChildren[i], ohead);
			}
		} else {
			context.lastColNum ++;
			var cobj, found = false;
			var len = Z._columns ? Z._columns.length: 0;
			for(var i = 0; i < len; i++){
				cobj = Z._columns[i];
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
				cobj.label = fldObj.label();
			}
			cobj.mergeSame = fldObj.mergeSame();
			cobj.colNum = ohead.colNum;
			if (!cobj.width){
				maxWidth = fldObj ? fldObj.displayWidth() : 0;
				if (cobj.label) {
					maxWidth = Math.max(maxWidth, cobj.label.length);
				}
				cobj.width = maxWidth ? (maxWidth * Z.charWidth) : 10;
			}
			//check and set cell render
			if (!cobj.cellRender) {
				if (fldObj.getType() == jslet.data.DataType.BOOLEAN){//data type is boolean
					if (!Z._isCellEditable(cobj)) {// Not in edit mode
						cobj.cellRender = jslet.ui.DBTable.boolCellRender;
					}
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
			Z.fixedSectionHt = Z._fixedRows * Z._rowHeight;
		} else {
			Z.fixedSectionHt = 0;
		}
		//Calculate Foot section's height
		if (Z.dataset().checkAggrated()){
			Z.footSectionHt = Z._rowHeight;
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
			var w = 0;
			for(var i = 0, cnt = Z._sysColumns.length; i < cnt; i++){
				w += Z._sysColumns[i].width;
			}
			for(var i = 0; i < Z._fixedCols; i++){
				w += Z.innerColumns[i].width;
			}
			Z.fixedColWidth = w+3;
		} else {
			Z.fixedColWidth = 0;
		}
	}, // end _calcParams

	_setScrollBarMaxValue: function (maxValue) {
		var Z = this,
			v = maxValue + Z._repairHeight;
		Z.jqVScrollBar.find('div').height(v);
	},

	_changeColWidth: function (index, deltaW) {
		var Z = this;
		var colObj = Z.innerColumns[index];
		if (colObj.width + deltaW <= 0) {
			return;
		}
		colObj.width += deltaW;
		if(colObj.field) {
			Z._dataset.getField(colObj.field).displayWidth(Math.round(colObj.width/Z.charWidth))
		}
		
		 function getRule(cssName){
			var styleEle = document.getElementById(Z._widthStyleId),
				styleObj = styleEle.styleSheet || styleEle.sheet,
				cssRules = styleObj.cssRules || styleObj.rules,
				cssRule;
			cssName = '.' + cssName;
			for(var i = 0, len = cssRules.length; i < len; i++) {
				cssRule = cssRules[i];
				if(cssRule.selectorText == cssName) {
					return cssRule;
				}
			}
			return null;
		};
		var cssRule = getRule(colObj.widthCssName);
		if(cssRule) {
			cssRule.style['width'] = colObj.width + 'px';
		}

		Z._changeContentWidth(deltaW);
	},

	_changeContentWidth: function (deltaW) {
		var Z = this,
			totalWidth = Z.getTotalWidth(),
			totalWidthStr = totalWidth + 'px';
		Z.rightHeadTbl.parentNode.style.width = totalWidthStr;
		Z.rightFixedTbl.parentNode.style.width = totalWidthStr;
		Z.rightContentTbl.parentNode.style.width = totalWidthStr;
		if (Z.footSectionHt) {
			Z.rightFootTbl.style.width = totalWidthStr;
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
			var colObj, cssName,
				styleHtml = ['<style type="text/css" id="' + Z._widthStyleId + '">\n'];
			for(var i = 0, len = Z._sysColumns.length; i < len; i++) {
				colObj = Z._sysColumns[i];
				styleHtml.push('.' + colObj.widthCssName +'{width:' + colObj.width + 'px}\n');
			}
			for(var i = 0, len = Z.innerColumns.length; i< len; i++) {
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
			'<td class="jl-scrollbar-width"><div class="jl-tbl-vscroll-head"></div><div class="jl-tbl-vscroll"><div /></div></td></tr></table>'];
		
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
		});
		
		jqRightHead.on('mousedown', '.jl-tbl-header-cell', function(event){
			event = jQuery.event.fix(event || window.event);
			var el = event.target;
			if (el.className == 'jl-tbl-splitter-hook') {
				return;
			}
		});

		jQuery(Z.leftHeadTbl).on('click', '.jl-focusable-item', function(event){
			event = jQuery.event.fix(event || window.event);
			Z._doHeadClick(this.parentNode.parentNode.parentNode.jsletcolcfg, event.ctrlKey);
			Z._head_label_cliecked = true;
			event.stopImmediatePropagation();
			event.preventDefault();
			return false;
		});
		
		jqRightHead.on('click', '.jl-focusable-item', function(event){
			event = jQuery.event.fix(event || window.event);
			Z._doHeadClick(this.parentNode.parentNode.parentNode.jsletcolcfg, event.ctrlKey);
			Z._head_label_cliecked = true;
			event.stopImmediatePropagation();
			event.preventDefault();
			return false;
		});
		
		dragTransfer = null;
		jqRightHead.on('dragstart', '.jl-focusable-item', function(event){
			var otd = this.parentNode.parentNode.parentNode,
				colCfg = otd.jsletcolcfg,
				e = event.originalEvent,
				transfer = e.dataTransfer;
			transfer.dropEffect = 'link';
			transfer.effectAllowed = 'link';
			dragTransfer = {fieldName: colCfg.field, rowIndex: otd.parentNode.rowIndex, cellIndex: otd.cellIndex};
			transfer.setData('fieldName', colCfg.field); //must has this row otherwise FF does not work.
			return true;
		});

		function checkDropable(currCell) {
			var colCfg = currCell.jsletcolcfg,
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
				currPFldObj = Z._dataset.getField(currFldName).parent();
			result = (srcPFldObj === currPFldObj || (currPFldObj && srcPFldObj.name() == currPFldObj.name()));
			return result;
		}
		
		jqRightHead.on('dragover', '.jl-tbl-header-cell .jl-tbl-cell', function(event){
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

		jqRightHead.on('dragenter', '.jl-tbl-header-cell .jl-tbl-cell', function(event){
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
		
		jqRightHead.on('dragleave', '.jl-tbl-header-cell .jl-tbl-cell', function(event){
			jQuery(event.currentTarget).removeClass('jl-tbl-col-over');
			return  false;
		});
		
		jqRightHead.on('drop', '.jl-tbl-header-cell .jl-tbl-cell', function(event){
			jQuery(event.currentTarget).removeClass('jl-tbl-col-over');
			var currCell = this.parentNode,
				e = event.originalEvent,
				transfer = e.dataTransfer,
				colCfg = currCell.jsletcolcfg,
				srcRowIndex = dragTransfer.rowIndex,
				srcCellIndex = dragTransfer.cellIndex,
				currRowIndex = currCell.parentNode.rowIndex,
				currCellIndex = currCell.cellIndex;
			
			if(!checkDropable(currCell)) { 
				return
			}
			var destField = this.parentNode.jsletcolcfg.field;
			if(!destField) {
				return;
			}
			var	srcField = dragTransfer.fieldName;
			console.log(srcField + ' -> ' + destField);
			Z._moveColumn(srcRowIndex, srcCellIndex, currCellIndex);
	    	return false;
		});
		
		var jqLeftFixedTbl = jQuery(Z.leftFixedTbl),
			jqRightFixedTbl = jQuery(Z.rightFixedTbl),
			jqLeftContentTbl = jQuery(Z.leftContentTbl),
			jqRightContentTbl = jQuery(Z.rightContentTbl);
		
		jqLeftFixedTbl.off();
		jqLeftFixedTbl.on('mouseenter', 'tr', function() {
			Z._oldHoverRowClassName = this.className;
			Z._hoverRowIndex = this.rowIndex;
			this.className = jslet.ui.htmlclass.TABLECLASS.hoverrow;
			jqRightFixedTbl[0].rows[this.rowIndex].className = jslet.ui.htmlclass.TABLECLASS.hoverrow;
		});
		jqLeftFixedTbl.on('mouseleave', 'tr', function() {
			this.className = Z._oldHoverRowClassName;
			jqRightFixedTbl[0].rows[this.rowIndex].className = Z._oldHoverRowClassName;
		});

		jqRightFixedTbl.off();
		jqRightFixedTbl.on('mouseenter', 'tr', function() {
			Z._oldHoverRowClassName = this.className;
			Z._hoverRowIndex = this.rowIndex;
			this.className = jslet.ui.htmlclass.TABLECLASS.hoverrow;
			jqLeftFixedTbl[0].rows[this.rowIndex].className = jslet.ui.htmlclass.TABLECLASS.hoverrow;
		});
		jqRightFixedTbl.on('mouseleave', 'tr', function() {
			this.className = Z._oldHoverRowClassName;
			jqLeftFixedTbl[0].rows[this.rowIndex].className = Z._oldHoverRowClassName;
		});
		
		jqLeftContentTbl.off();
		jqLeftContentTbl.on('mouseenter', 'tr', function() {
			Z._oldHoverRowClassName = this.className;
			Z._hoverRowIndex = this.rowIndex;
			this.className = jslet.ui.htmlclass.TABLECLASS.hoverrow;
			jqRightContentTbl[0].rows[this.rowIndex].className = jslet.ui.htmlclass.TABLECLASS.hoverrow;
		});
		jqLeftContentTbl.on('mouseleave', 'tr', function(){
			this.className = Z._oldHoverRowClassName;
			jqRightContentTbl[0].rows[this.rowIndex].className = Z._oldHoverRowClassName;
		});
		
		jqRightContentTbl.off();
		jqRightContentTbl.on('mouseenter', 'tr', function(){
			Z._oldHoverRowClassName = this.className;
			Z._hoverRowIndex = this.rowIndex;
			this.className = jslet.ui.htmlclass.TABLECLASS.hoverrow;
			var hasLeft = (Z._fixedRows > 0 || Z._sysColumns.length > 0);
			if(hasLeft) {
				jqLeftContentTbl[0].rows[this.rowIndex].className = jslet.ui.htmlclass.TABLECLASS.hoverrow;
			}
		});
		jqRightContentTbl.on('mouseleave', 'tr', function(){
			this.className = Z._oldHoverRowClassName;
			var hasLeft = (Z._fixedRows > 0 || Z._sysColumns.length > 0);
			if(hasLeft) {
				jqLeftContentTbl[0].rows[this.rowIndex].className = Z._oldHoverRowClassName;
			}
		});
		
		Z.jqVScrollBar = jqEl.find('.jl-tbl-vscroll');

		Z.noRecordDiv = jqEl.find('.jl-tbl-norecord')[0];
		//The scrollbar width must be set explicitly, otherwise it doesn't work in IE. 
		Z.jqVScrollBar.width(jslet.scrollbarSize()+1);
		
		Z.jqVScrollBar.on('scroll', function () {
			if (Z._keep_silence_) {
				return;
			}
			var num = Math.round(this.scrollTop / Z._rowHeight);// + Z._fixedRows;
			if (num != Z.listvm.getVisibleStartRow()) {
				Z._keep_silence_ = true;
				try {
					Z.listvm.setVisibleStartRow(num);
				} finally {
					Z._keep_silence_ = false;
				}
			}
		});

		var splitter = jqEl.find('.jl-tbl-splitter')[0];
		splitter._doDragStart = function(){
			this.style.display = 'block';
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
		};

		splitter._doDragCancel = function () {
			splitter.style.display = 'none';
			splitter.parentNode.jslet.isDraggingColumn = false;
		};

		Z._setScrollBarMaxValue(Z.listvm.getNeedShowRowCount() * Z._rowHeight);
		if (Z.footSectionHt){
			Z.leftFootTbl.style.display = '';
			Z.rightFootTbl.style.display = '';
		}
		Z._renderHeader();
		
		if (Z._hideHead) {
			Z.headSectionHt = 0;
		} else {
			Z.headSectionHt = Z.maxHeadRows * Z._headRowHeight;
		}
		Z._checkHoriOverflow();
		Z._calcAndSetContentHeight();

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
				destCells = [];
			
			for(var i = 0, len = cells.length; i < len; i++) {
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
			if(srcStart > destStart) {
				var destCell = destCells[0];
				for(var i = 0, len = srcCells.length; i < len; i++) {
					jQuery(srcCells[i]).insertBefore(destCell);
				}
			} else {
				var destCell = destCells[destCells.length - 1];
				for(var i = srcCells.length; i >= 0; i--) {
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
		console.log('src: ' + srcStart + ':' + srcEnd + ', dest: ' + destStart + ':' + destEnd);
		var srcCell = rowObj.cells[srcCellIndex],
			destCell = rowObj.cells[destCellIndex];
		if(srcCellIndex < destCellIndex) {
			jQuery(srcCell).insertAfter(destCell);
		} else {
			jQuery(srcCell).insertBefore(destCell);
		}
		
		moveOneTableColumn(Z.rightHeadTbl.createTHead().rows, rowIndex + 1, srcStart, srcEnd, destStart, destEnd);
		moveOneTableColumn(Z.rightFixedTbl.tBodies[0].rows, 0, srcStart, srcEnd, destStart, destEnd);
		moveOneTableColumn(Z.rightContentTbl.tBodies[0].rows, 0, srcStart, srcEnd, destStart, destEnd);
		moveOneTableColumn(Z.rightFootTbl.tBodies[0].rows, 0, srcStart, srcEnd, destStart, destEnd);
	},
	
	_calcAndSetContentHeight: function(){
		var Z = this,
			jqEl = jQuery(Z.el);

		Z.contentSectionHt = Z.height - Z.headSectionHt - Z.fixedSectionHt - Z.footSectionHt;
		if (Z._isHoriOverflow){
			Z.contentSectionHt -= jslet.ui.htmlclass.TABLECLASS.scrollBarWidth;
		}
		
		Z.listvm.setVisibleCount(Math.floor((Z.contentSectionHt) / Z._rowHeight), true);
		Z._repairHeight = Z.contentSectionHt - Z.listvm.getVisibleCount() * Z._rowHeight;
		
		jqEl.find('.jl-tbl-contentcol').height(Z.height);
		jqEl.find('.jl-tbl-content-div').height(Z.contentSectionHt);

		Z.jqVScrollBar.height(Z.contentSectionHt + Z.footSectionHt);
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
		oth.jsletcolcfg = cobj;
		if (rowSpan && rowSpan > 1) {
			oth.rowSpan = rowSpan;
		}
		if (colSpan && colSpan > 1) {
			oth.colSpan = colSpan;
		}
		oth.innerHTML = '<div style="position: relative" unselectable="on" class="jl-unselectable jl-tbl-cell jl-border-box ' + 
			(cobj.widthCssName || '') +'">';
		var ochild = oth.childNodes[0];
		if (cobj.cellRender && cobj.cellRender.createHeader){
			cobj.cellRender.createHeader.call(Z, ochild, cobj);
		} else {
			var sh = cobj.label || '&nbsp;';
			if(cobj.field && Z._isCellEditable(cobj)) {
				var fldObj = Z._dataset.getField(cobj.field);
				if(fldObj && fldObj.required()) {
					sh = '<span class="jl-lbl-required">*</span>' + sh;
				}
			} 
			ochild.innerHTML = ['<span id="',
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
		var otr, otrLeft = null, cobj, otrRight, otd, oth,
			leftHeadObj = Z.leftHeadTbl.createTHead(),
			rightHeadObj = Z.rightHeadTbl.createTHead();
		for(var i = 0; i < Z.maxHeadRows; i++){
			leftHeadObj.insertRow(-1);
			rightHeadObj.insertRow(-1);
		}
		otr = leftHeadObj.rows[0];
		for(var i = 0, cnt = Z._sysColumns.length; i < cnt; i++){
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
		var jqTr1, jqTr2, h= Z._headRowHeight;
		for(var i = 0; i <= Z.maxHeadRows; i++){
			jqTr1 = jQuery(leftHeadObj.rows[i]);
			jqTr2 = jQuery(rightHeadObj.rows[i]);
			jqTr1.height(h);
			jqTr2.height(h);
		}
		Z._changeContentWidth(0);
		Z.sortedCell = null;
		Z.indexField = null;
	}, // end renderHead

	getTotalWidth: function(){
		var Z= this,
		totalWidth = 0;
		for(var i = Z._fixedCols, cnt = Z.innerColumns.length; i < cnt; i++){
			totalWidth += Z.innerColumns[i].width;
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
		var jqTblContainer = jQuery(tblContainer);
		
		var jqBody = jQuery(document.body); 
		var bodyMTop = parseInt(jqBody.css('margin-top'));
		var bodyMleft = parseInt(jqBody.css('margin-left'));
		var y = jqTblContainer.position().top - bodyMTop;
		var jqHook = jQuery(ohook);
		var h = jqTblContainer.height() - 20;
		var currLeft = jqHook.offset().left - jqTblContainer.offset().left - bodyMleft;
		var splitDiv = jqTblContainer.find('.jl-tbl-splitter')[0];
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
		if (ohook.className != 'jl-tbl-splitter-hook') {
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
		if(!Z._dataset.confirm()) {
			return;
		} 
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
			leftHeadCells = leftHeadObj.rows[0].cells,// jQuery(leftHeadObj).find('th'),
			rightHeadCells =  rightHeadObj.rows[0].cells,// jQuery(rightHeadObj).find('th'),
			allHeadCells = [], oth;

		for (var i = 0, cnt = leftHeadCells.length; i < cnt; i++){
			oth = leftHeadCells[i];
			if (oth.jsletcolcfg) {
				allHeadCells[allHeadCells.length] = oth;
			}
		}

		for (var i = 0, cnt = rightHeadCells.length; i < cnt; i++){
			oth = rightHeadCells[i];
			if (oth.jsletcolcfg) {
				allHeadCells[allHeadCells.length] = oth;
			}
		}

		var len = sortFields.length, sortDiv, 
			cellCnt = allHeadCells.length;
		for (var i = 0; i < cellCnt; i++) {
			oth = allHeadCells[i];
			sortDiv = jQuery(oth).find('.jl-tbl-sorter')[0];
			if (sortDiv) {
				sortDiv.innerHTML = '&nbsp;';
			}
		}
		var fldName, sortFlag, sortObj, 
			k = 1;
		for (var i = 0; i < len; i++) {
			sortObj = sortFields[i];
			for (var j = 0; j < cellCnt; j++) {
				oth = allHeadCells[j];
				fldName = oth.jsletcolcfg.field;
				if (!fldName) {
					continue;
				}
				sortDiv = jQuery(oth).find('.jl-tbl-sorter')[0];
				sortFlag = '&nbsp;';
				if (fldName == sortObj.fieldName) {
					sortFlag = sortObj.order === 1 ? jslet.ui.htmlclass.TABLECLASS.sortAscChar : jslet.ui.htmlclass.TABLECLASS.sortDescChar;
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

			oJslet._dataset.select(ocheck.checked ? 1 : 0, oJslet._selectBy);
		}
	}, // end _doSelectBoxClick

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
		var rowno = Z.listvm.recnoToRowno(this.jsletrecno);
		Z.listvm.setCurrentRowno(rowno);
		if (Z._onRowClick) {
			Z._onRowClick.call(Z, event);
		}
	},

	_renderCell: function (otr, colCfg, isFirstCol) {
		var Z = this;
		var otd = document.createElement('td');
		otd.noWrap = true;
		otd.jsletColCfg = colCfg;
		otd.innerHTML = '<div class="jl-tbl-cell ' + (colCfg.widthCssName || '') + '"></div>';
		var ochild = otd.firstChild;
		if (colCfg.cellRender) {
			colCfg.cellRender.createCell.call(Z, ochild, colCfg);
		} else if (!Z._isCellEditable(colCfg)) {
				jslet.ui.DBTable.defaultCellRender.createCell.call(Z, ochild, colCfg);
		} else {
				jslet.ui.DBTable.editableCellRender.createCell.call(Z, ochild, colCfg);
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
			startRow = 0,
			fldCnt = Z.innerColumns.length;
		if (onlyRefreshContent){
			startRow = rightBody.rows.length;
		}
		// create date content table row
		for (var i = startRow; i < rowCnt; i++) {
			if (hasLeft) {
				otr = leftBody.insertRow(-1);
				otr.style.height = Z._rowHeight + 'px';

				otr.ondblclick = Z._doRowDblClick;
				otr.onclick = Z._doRowClick;
				var sysColLen = Z._sysColumns.length;
				for(var j = 0; j < sysColLen; j++){
					colCfg = Z._sysColumns[j];
					Z._renderCell(otr, colCfg, j === 0);
				}
				
				isfirstCol = sysColLen === 0;
				for (var j = 0; j < Z._fixedCols; j++) {
					colCfg = Z.innerColumns[j];
					Z._renderCell(otr, colCfg, isfirstCol && j === 0);
				}
			}
			isfirstCol = !hasLeft;
			otr = rightBody.insertRow(-1);
			otr.style.height = Z._rowHeight + 'px';
			otr.ondblclick = Z._doRowDblClick;
			otr.onclick = Z._doRowClick;
			for (var j = Z._fixedCols; j < fldCnt; j++) {
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
			otr, colCfg;
		if (hasLeft) {
			leftBody = Z.leftFootTbl.tBodies[0];
		}
		rightBody = Z.rightFootTbl.tBodies[0];
		
		function createCell(colCfg) {
			var otd = document.createElement('td');
			otd.noWrap = true;
			otd.innerHTML = '<div class="jl-tbl-cell ' + (colCfg.widthCssName || '') + '"></div>';
			otd.jsletColCfg = colCfg;
			return otd;
		}
		
		if (hasLeft) {
			otr = leftBody.insertRow(-1);
			otr.style.height = Z._rowHeight + 'px';

			for(var j = 0, len = Z._sysColumns.length; j < len; j++) {
				colCfg = Z._sysColumns[j];
				otr.appendChild(createCell(colCfg));
			}
			
			for (var j = 0; j < Z._fixedCols; j++) {
				colCfg = Z.innerColumns[j];
				otr.appendChild(createCell(colCfg));
			}
		}
		otr = rightBody.insertRow(-1);
		otr.style.height = Z._rowHeight + 'px';
		for (var j = Z._fixedCols, len = Z.innerColumns.length; j < len; j++) {
			colCfg = Z.innerColumns[j];
			otr.appendChild(createCell(colCfg));
		}
		
	},
	
	_fillTotalSection: function () {
		var Z = this,
			aggrateValues = Z._dataset.aggratedValues();
		if (!Z.footSectionHt || !aggrateValues) {
			return;
		}
		var hasLeft = Z._fixedCols > 0 && Z._sysColumns.length > 0,
			otrLeft, otrRight;
		if (hasLeft) {
			otrLeft = Z.leftFootTbl.tBodies[0].rows[0];
		}
		otrRight = Z.rightFootTbl.tBodies[0].rows[0];

		var otd, k = 0, fldObj, cobj, fldName, totalValue;
		var aggrateValueObj,
			labelDisplayed = false,
			sysColCnt = Z._sysColumns.length;
		for (var i = 0, len = Z.innerColumns.length; i < len; i++) {
			cobj = Z.innerColumns[i];

			if (i < Z._fixedCols) {
				otd = otrLeft.cells[i + sysColCnt];
			} else {
				otd = otrRight.cells[i - Z._fixedCols];
			}
			otd.style.textAlign = 'right';

			fldName = cobj.field;
			aggrateValueObj = aggrateValues[fldName];
			if (!aggrateValueObj) {
				var content;
				if(labelDisplayed) {
					content = '&nbsp;';
				} else {
					content = jslet.locale.DBTable.totalLabel;
					labelDisplayed = true;
				}
				otd.firstChild.innerHTML = content;
				continue;
			}
			fldObj = Z._dataset.getField(fldName);
			if(fldObj.getType() === jslet.data.DataType.NUMBER) {
				totalValue = aggrateValueObj.sum;
			} else {
				totalValue = aggrateValueObj.count;
			}
			otd.firstChild.innerHTML =jslet.formatNumber(totalValue, fldObj.displayFormat());
		}
	},
	
	_innerFillData: function () {
		var Z = this;
		var preRecno = Z._dataset.recno(),
			allCnt = Z.listvm.getNeedShowRowCount(),
			h = allCnt * Z._rowHeight + Z.footSectionHt;
		Z._setScrollBarMaxValue(h);
		Z.noRecordDiv.style.display = (allCnt === 0 ?'block':'none');
		var context = Z._dataset.startSilenceMove();
		try {
			Z._fillRow(true);
			Z._fillRow(false);
			if (Z.footSectionHt) {
				Z._fillTotalSection();
			}
		} finally {
			Z._dataset.endSilenceMove(context);
		}
	},
	
	_fillDataDebounce: jslet.debounce(this._innerFillData, 100),
	
	_fillData: function () {
		this._fillDataDebounce.apply(this);
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
		
		var otr, colCfg, isfirstCol, recNo = -1, cells, clen, otd,
		fldCnt = Z.innerColumns.length,
			allCnt = Z.listvm.getNeedShowRowCount() - Z.listvm.getVisibleStartRow(),
			fixedRows = hasLeft ? leftBody.rows : null,
			contentRows = rightBody.rows,
			sameValueNodes = {},
			isFirst = true;

		for (var i = 0; i < rowCnt; i++) {
			if (i >= allCnt) {
				if (hasLeft) {
					otr = fixedRows[i];
					otr.style.display = 'none';
				}
				otr = contentRows[i];
				otr.style.display = 'none';
				continue;
			}

			Z.listvm.setCurrentRowno(i + start, true);
			recNo = Z._dataset.recno();
			if (hasLeft) {
				otr = fixedRows[i];
				otr.jsletrecno = recNo;
				otr.style.display = '';
				cells = otr.childNodes;
				clen = cells.length;
				for (var j = 0; j < clen; j++) {
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
			for (var j = 0; j < clen; j++) {
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

		if (colCfg.cellRender && colCfg.cellRender.refreshCell) {
			colCfg.cellRender.refreshCell.call(Z, cellPanel, colCfg, recNo);
		} else if (!Z._isCellEditable(colCfg)) {
			jslet.ui.DBTable.defaultCellRender.refreshCell.call(Z, cellPanel, colCfg, recNo);
		} else {
			jslet.ui.DBTable.editableCellRender.refreshCell.call(Z, cellPanel, colCfg, recNo);
		}
	},

	refreshCurrentRow: function () {
		var Z = this,
			hasLeft = Z._fixedCols > 0,
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

		var otr, cells, otd, recNo;

		if (hasLeft) {
			otr = fixedBody.rows[idx];
			if (!otr) {
				return;
			}
			cells = otr.childNodes;
			recNo = otr.jsletrecno;
			for (var j = 0, clen = cells.length; j < clen; j++) {
				otd = cells[j];
				if (otd.isSeqCol) {
					otd.firstChild.innerHTML = recno + 1;
					continue;
				}
				if (otd.isSelectCol) {
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
		// fill content table
		cells = otr.childNodes;
		for (var j = 0, clen = cells.length; j < clen; j++) {
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

	_syncScrollBar: function (rowno) {
		var Z = this;
		if (Z._keep_silence_) {
			return;
		}
		var	sw = rowno * Z._rowHeight;
		Z._keep_silence_ = true;
		try {
			var scrBar = Z.jqVScrollBar[0];
			if(scrBar.scrollTop != sw) {
				scrBar.scrollTop = sw;
			}
		} finally {
			Z._keep_silence_ = false;
		}
	},

	expandAll: function () {
		var Z = this;
		Z.listvm.expandAll(function () {
			Z._fillData(); 
		});
	},

	collapseAll: function () {
		var Z = this;
		Z.listvm.collapseAll(function () {
			Z._fillData(); 
		});
	},

	refreshControl: function (evt) {
		var Z = this, 
			evtType = evt.eventType;
		if (evtType == jslet.data.RefreshEvent.CHANGEMETA) {
			
		} else if (evtType == jslet.data.RefreshEvent.AGGRATED) {
			Z._fillTotalSection();			
		} else if (evtType == jslet.data.RefreshEvent.BEFORESCROLL) {
			
		} else if (evtType == jslet.data.RefreshEvent.SCROLL) {
			if (Z._dataset.recordCount() === 0) {
				return;
			}
			Z._showCurrentRow(true);
		} else if (evtType == jslet.data.RefreshEvent.UPDATEALL) {
			Z.listvm.refreshModel();
			Z.listvm.setVisibleStartRow(0, true);
			Z._updateSortFlag(true);
			Z._fillData();
			Z._showCurrentRow(true);
			//Clear "Select all" checkbox
			if(Z._hasSelectCol) {
				jQuery(Z.el).find('.jl-tbl-select-all')[0].checked = false;
			}
		} else if (evtType == jslet.data.RefreshEvent.UPDATERECORD) {
			Z.refreshCurrentRow();
		} else if (evtType == jslet.data.RefreshEvent.UPDATECOLUMN) {
			Z._fillData();
		} else if (evtType == jslet.data.RefreshEvent.INSERT) {
			Z.listvm.refreshModel();
			var recno = Z._dataset.recno(),
				preRecno = evt.preRecno;
			Z._fillData();

			Z.refreshControl(jslet.data.RefreshEvent.scrollEvent(recno, preRecno));
		} else if (evtType == jslet.data.RefreshEvent.DELETE) {
			Z.listvm.refreshModel();
			Z._fillData();
			var recno = Z._dataset.recno(),
			preRecno = evt.preRecno;
			Z.refreshControl(jslet.data.RefreshEvent.scrollEvent(recno, preRecno));			
		} else if (evtType == jslet.data.RefreshEvent.SELECTRECORD) {
			if (!Z._hasSelectCol) {
				return;
			}
			var col = 0;
			if (Z._hasSeqCol) {
				col++;
			}
			var recno = evt.recno, otr, otd, checked, ocheckbox;
			for(var i = 0, cnt = recno.length; i < cnt; i++){
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
			var col = 0;
			if (Z._hasSeqCol) {
				col++;
			}
			var leftFixedBody = Z.leftFixedTbl.tBodies[0],
				leftContentBody = Z.leftContentTbl.tBodies[0],
				checked, recno, otr, otd, ocheckbox, rec,
				oldRecno = Z._dataset.recno();

			try {
				for (var i = 0, cnt = leftFixedBody.rows.length; i < cnt; i++) {
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

				for (var i = 0, cnt = leftContentBody.rows.length; i < cnt; i++) {
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
		if (Z._readOnly) {
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
	
	_createEditControl: function (colCfg) {
		var Z = this,
			fldName = colCfg.field;
		if (!fldName) {
			return null;
		}
		var fldObj = Z._dataset.getField(fldName),
			isEditable = !fldObj.fieldDisabled() && !fldObj.fieldReadOnly() ? 1 : 0;
		if (!isEditable) {
			return null;
		}
		var param, w, h, fldCtrlCfg = fldObj.editControl();
		fldCtrlCfg.dataset = Z._dataset;
		fldCtrlCfg.field = fldName;
		var editCtrl = jslet.ui.createControl(fldCtrlCfg);
		editCtrl = editCtrl.el;
		editCtrl.id = jslet.nextId();
		return editCtrl;
	}, // end editControl

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
		Z._calcAndSetContentHeight();
		Z._renderBody(true);
		Z._fillData();
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this, jqEl = jQuery(Z.el);
		jslet.resizeEventBus.unsubscribe(Z);
		jqEl.off();
		Z.listvm.onTopRownoChanged = null;
		Z.listvm.onVisibleCountChanged = null;
		Z.listvm.onCurrentRownoChanged = null;
		Z.listvm = null;
		
		Z.prevRow = null;
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
		Z.jqVScrollBar.off();
		Z.jqVScrollBar = null;

		var splitter = jqEl.find('.jl-tbl-splitter')[0];
		splitter._doDragging = null;
		splitter._doDragEnd = null;
		splitter._doDragCancel = null;

		Z.parsedHeads = null;
		jqEl.find('tr').each(function(){
			this.ondblclick = null;
			this.onclick = null;
		});
		
		jqEl.find('.jl-tbl-select-check').off();
		$super();
	} 
});

jslet.ui.DBTable = jslet.Class.create(jslet.ui.AbstractDBTable, {});


jslet.ui.register('DBTable', jslet.ui.DBTable);
jslet.ui.DBTable.htmlTemplate = '<div></div>';

jslet.ui.CellRender = jslet.Class.create({
	createCell: function (otd, colCfg) {
	
	},
	
	refreshCell: function (otd, colCfg) {
	
	}
});

jslet.ui.DefaultCellRender =  jslet.Class.create(jslet.ui.CellRender, {
	createCell: function (cellPanel, colCfg) {
		var Z = this,
			fldName = colCfg.field,
			fldObj = Z._dataset.getField(fldName);
		cellPanel.parentNode.style.textAlign = fldObj.alignment();
	},
								
	refreshCell: function (cellPanel, colCfg) {
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
			text = Z._dataset.getFieldText(fldName);
		} catch (e) {
			text = 'error: ' + e.message;
		}
		
		cellPanel.title = text;
		if (fldObj.urlExpr()) {
			var url = '<a href=' + fldObj.calcUrl(),
				target = fldObj.urlTarget();
			if (target) {
				url += ' target=' + target;
			}
			url += '>' + text + '</a>';
			text = url;
		}
		jQuery(cellPanel).html(text);
	} 
});

jslet.ui.EditableCellRender =  jslet.Class.create(jslet.ui.CellRender, {
	createCell: function (cellPanel, colCfg, rowNum) {
		var Z = this,
			fldName = colCfg.field,
			fldObj = Z._dataset.getField(fldName);
		
		var editCtrl = Z._createEditControl(colCfg);
		jQuery(editCtrl).css('width', '100%').on('focus', function(){
			this.jslet._dataset.recno(this.jslet.currRecno());
		});
		editCtrl.style.border = '0px';
		cellPanel.appendChild(editCtrl);
	},
	
	refreshCell: function (cellPanel, colCfg, recNo) {
		if (!colCfg) {
			return;
		}
		var editCtrl = cellPanel.firstChild.jslet;
		
		editCtrl.currRecno(recNo);
		editCtrl.forceRefreshControl();
	} 

});

jslet.ui.SequenceCellRender = jslet.Class.create(jslet.ui.CellRender, {
	createHeader: function(cellPanel, colCfg) {
		cellPanel.innerHTML = '&nbsp;';
	},
	
	createCell: function (cellPanel, colCfg) {
	},
	
	refreshCell: function (cellPanel, colCfg) {
		if (!colCfg || colCfg.noRefresh) {
			return;
		}
		var jqDiv = jQuery(cellPanel);
		var text = this._dataset.recno() + 1;
		cellPanel.title = text;
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
			Z._dataset.selectAll(this.checked ? 1 : 0, Z._onSelectAll);
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

	refreshCell: function (cellPanel, colCfg) {
		if (!colCfg || colCfg.noRefresh) {
			return;
		}
		var Z = this,
			ocheck = cellPanel.firstChild;
		if(Z._dataset.checkSelectable()) {
			ocheck.checked = Z._dataset.selected();
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
	refreshCell: function (cellPanel, colCfg) {
		if (!colCfg || colCfg.noRefresh) {
			return;
		}
		cellPanel.style.textAlign = 'center';
		var jqDiv = jQuery(cellPanel);
		jqDiv.html('&nbsp;');
		var Z = this,
			fldName = colCfg.field, 
			fldObj = Z._dataset.getField(fldName);
		if (fldObj.trueValue() == Z._dataset.getFieldValue(fldName)) {
			jqDiv.addClass('jl-tbl-checked');
			jqDiv.removeClass('jl-tbl-unchecked');
		}
		else {
			jqDiv.removeClass('jl-tbl-checked');
			jqDiv.addClass('jl-tbl-unchecked');
		}
	}
});
		
jslet.ui.TreeCellRender = jslet.Class.create(jslet.ui.CellRender, {
	initialize: function () {
	},
		
	createCell: function (cellPanel, colCfg) {
		var Z = this;

		var odiv = document.createElement('div'),
			jqDiv = jQuery(odiv);
		jqDiv.addClass(jslet.ui.htmlclass.TABLECLASS.celldiv);
		odiv.style.height = Z._rowHeight - 2 + 'px';
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
	
	refreshCell: function (cellPanel, colCfg) {
		if (!colCfg || colCfg.noRefresh) {
			return;
		}
		var odiv = cellPanel.firstChild,
			arrSpan = odiv.childNodes,
			Z = this,
			level = Z.listvm.getLevel();
		
		if (!jslet.ui.TreeCellRender.iconWidth) {
			jslet.ui.TreeCellRender.iconWidth = parseInt(jslet.ui.getCssValue('jl-tbltree-indent', 'width'));
		}
		var hasChildren = Z.listvm.hasChildren(),
			indentWidth = (!hasChildren ? level + 1 : level) * jslet.ui.TreeCellRender.iconWidth,
			oindent = arrSpan[0];
		oindent.style.width = indentWidth + 'px';
		var expBtn = arrSpan[1]; //expand button
		expBtn.style.display = hasChildren ? 'inline-block' : 'none';
		if (hasChildren) {
			expBtn.expanded = Z._dataset.getRecord()._expanded_;
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
			text = Z._dataset.getFieldText(fldName);
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
	}
});

jslet.ui.DBTable.defaultCellRender = new jslet.ui.DefaultCellRender();
jslet.ui.DBTable.editableCellRender = new jslet.ui.EditableCellRender();

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
