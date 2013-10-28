/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

jslet.ui.htmlclass.TABLECLASS = {
    currentrow: 'jl-tbl-current',
    celldiv: 'jl-tbl-cell',
    scrollBarWidth: 17,
    selectColWidth: 22,
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
    Z.cellRender = null //Function, column cell render for customized column  
}

/**
 * Sub group, use this class to implement complex requirement in one table row, like master-detail style row
 */
jslet.ui.TableSubgroup = function(){
    var Z = this;
	Z.hasExpander = true; //Boolean, true - will add a new column automatically, click this column will expand or collapse subgroup panel
	Z.template = null;//String, html template 
	Z.height = 0; //Integer, subgroup panel height
}

/**
 * Table column header, use this class to implement hierarchical header
 */
jslet.ui.TableHead = function(){
    var Z = this;
	Z.label = null; //String, Head label
	Z.title = null; //String, Head title
	Z.id = null;    //String, Head id
	Z.rowSpan = 0;  //@private
	Z.colSpan = 0;  //@private
	
	Z.subHeads = null; //array of jslet.ui.TableHead
}

jslet.ui.AbstractDBTable = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        var Z = this;

        Z.allProperties = 'dataset,fixedRows,fixedCols,hasSeqCol,hasSelectCol,noborder,readOnly,hideHead,disableHeadSort,onlySpecifiedCol,selectBy,rowHeight,onRowClick,onRowDblClick,onSelect,onSelectAll,onCustomSort,onFillRow,onFillCell,treeField,columns,subgroup,totalFields';
        Z.requiredProperties = null;

        Z.dataset = null;
        /**
         * {Integer} Fixed row count.
         */
        Z.fixedRows = 0;
        /**
         * {Integer} Fixed column count.
         */
        Z.fixedCols = 0;
        /**
         * {Boolean} Identify if there is sequence column in DBTable.
         */
        Z.hasSeqCol = true;
        /**
         * {Boolean} Identify if there is select column in DBTable.
         */
        Z.hasSelectCol = false;
        
        /**
         * {Boolean} Identify if table cell has border
         */
        Z.noborder = false;
        
        /**
         * {Boolean} Identify if DBTable is readonly.
         */
        Z.readOnly = true;
        /**
         * {Boolean} Identify if there is table header in DBTable.
         */
        Z.hideHead = false;
        /**
         * {Boolean} Identify if DBTable disable user to click header to sort.
         */
        Z.disableHeadSort = false;
        /**
         * {String} one or more fields' name concatenated with ','
         * @see jslet.data.Dataset.select(selected, selectBy).
         */
        Z.selectBy = null;
        /**
         * {Integer} Row height.
         */
        Z.rowHeight = null;
        /**
         * {Integer} Row height of table header.
         */
        Z.headRowHeight = 25;
        /**
         * {String} Display table as tree style, only one field name allowed. If this property is set, the dataset must be a tree style dataset, 
         *  means dataset.parentField() and dataset.levelField() can not be empty.
         * Only one field allowed.
         */
        Z.treeField;
        /**
         * {jslet.ui.TableColumn[]} Array of jslet.ui.TableColumn
         */
        Z.columns;
        
        /**
         * {String} One or more number fields concatenated with ',', 
         * If this property is set, the "total" section will be shown at the bottom of DBTable.
         */
        Z.totalFields;
        
        /**
         * {Event} Fired when user clicks table row.
         *  Pattern: 
         *    function(event}{}
         *    //event: Js mouse event
         */
        Z.onRowClick = null;
        /**
         * {Event} Fired when user double clicks table row.
         * Pattern: 
         *    function(event}{}
         *    //event: Js mouse event
         */
        Z.onRowDblClick = null;
        /**
         * {Event} Fired when user click table header to sort data. You can use it to sort data instead of default, like sending request to server to sort data.  
         * Pattern: 
         *   function(indexFlds}{}
         *   //indexFlds: String, format: fieldName desc/asce(default), fieldName,..., desc - descending order, asce - ascending order, like: "field1 desc,field2,field3"
         */
        Z.onCustomSort; 
        
        /**
         * {Event} Fired when user selects one row.
         * Pattern: 
         *   function(selected}{}
         *   //selected: Boolean
         *   //return: true - allow user to select this row, false - otherwise.
         */
        Z.onSelect;
        /**
         * {Event} Fired when user click select all by clicking "Select Column" header.
         * Pattern: 
         *   function(dataset, Selected}{}
         *   //dataset: jslet.data.Dataset
         *   //Selected: Boolean
         *   //return: true - allow user to select, false - otherwise.
         */
        Z.onSelectAll;
        
        /**
         * {Event} Fired when fill row, user can use this to customize each row style like background color, font color
         * Pattern:
         *   function(otr, dataset){)
         *   //otr: Html element: TR
         *   //dataset: jslet.data.Dataset
         */
        Z.onFillRow;
        
        /**
         * {Event} Fired when fill cell, user can use this to customize each cell style like background color, font color
         * Pattern:
         *   function(otd, dataset, fieldName){)
         *   //otd: Html element: TD
         *   //dataset: jslet.data.Dataset
         *   //fieldName: String
         */
        Z.onFillCell;
        
        //@private
        Z.contentHeight = 0;
        Z._sortFields = null; //object:{field:'xx',isAsce:true}
		Z.subgroup = null;//jslet.ui.TableSubgroup
		
		Z._sysColumns = null;//all system column like sequence column, select column, sub-group column
		Z._isHoriOverflow = false;
		Z._hoverRowIndex = -1;
		Z._oldHoverRowClassName;
		Z._oldHeight;
        $super(el, params);
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
        Z.fixedRows = Z.fixedRows ? parseInt(Z.fixedRows) : 0;
        Z.fixedCols = Z.fixedCols ? parseInt(Z.fixedCols) : 0;
        Z.hasSeqCol = Z.hasSeqCol ? true : false;
        Z.hasSelectCol = Z.hasSelectCol ? true : false;
        Z.readOnly = Z.readOnly ? true : false;
        Z.hideHead = Z.hideHead ? true : false;
        Z.disableHeadSort = Z.disableHeadSort ? true : false;
        Z.onlySpecifiedCol = Z.onlySpecifiedCol ? true : false;

        jslet.ui.textMeasurer.setElement(Z.el);
//        Z.charWidth = jslet.ui.textMeasurer.getWidth('M');
		Z.charHeight = jslet.ui.textMeasurer.getHeight('M')+4;
		jslet.ui.textMeasurer.setElement();
		Z.charWidth = 12;
		
		if (!Z.rowHeight) {
			Z.rowHeight = 25;
		} else {
			Z.rowHeight = parseInt(Z.rowHeight);
		}
		if (!Z.headRowHeight) {
			Z.headRowHeight = 25;
		} else {
			Z.headRowHeight = parseInt(Z.headRowHeight);
		}
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
				//if (Z.readOnly)
					Z.listvm.priorRow();
                event.preventDefault()
            } else if (keyCode == 40) {//KEY_DOWN
				//if (Z.readOnly)
					Z.listvm.nextRow();
                event.preventDefault()
            } else if (keyCode == 33) {//KEY_PAGEUP
                Z.listvm.priorPage();
                event.preventDefault()
            } else if (keyCode == 34) {//KEY_PAGEDOWN
                Z.listvm.nextPage();
                event.preventDefault()
            }
        });		
    }, // end bind

    _initializeVm: function () {
        var Z = this;
				
        Z.listvm = new jslet.ui.ListViewModel(Z.dataset, Z.treeField ? true : false);

        Z.listvm.onTopRownoChanged = function (rowno) {
            if (rowno < 0) {
                return;
            }
            var context = Z.dataset.startSilenceMove();
            try {
                Z._fillData();
            } finally {
                Z.dataset.endSilenceMove(context);
            }

            Z._syncScrollBar(rowno);
            Z._showCurrentRow();
        };

        Z.listvm.onVisibleCountChanged = function () {
            Z.renderAll();
        };

        Z.listvm.onCurrentRownoChanged = function (preRowno, rowno) {
            if (Z.dataset.recordCount() == 0) {
                return;
            }
            Z._oldHoverRowClassName = '';
            if (Z.prevRow) {
                if (Z.prevRow.fixed) {
                    jQuery(Z.prevRow.fixed).removeClass(jslet.ui.htmlclass.TABLECLASS.currentrow);
                }
                jQuery(Z.prevRow.content).removeClass(jslet.ui.htmlclass.TABLECLASS.currentrow)
            }
            var currRow = Z._getTrByRowno(rowno), otr;
            if (!currRow) {
                return;
            }
            otr = currRow.fixed;
            var recno = Z.dataset.recno();
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
        }
    },

	/**
	 * @override
	 */
    renderAll: function () {
        var Z = this;
        Z.listvm.fixedRows = Z.fixedRows;
        Z._calcParams();
        Z.listvm.refreshModel();
        Z._createFrame();
        Z._fillData();
        Z._showCurrentRow();
        Z._oldHeight = jQuery(Z.el).height();
    }, // end renderAll

	_prepareColumn: function(){
        var Z = this, cobj;
		Z._sysColumns = [];
		//prepare system columns
		if (Z.hasSeqCol){
			cobj = {label:'&nbsp;',width: Z.seqColWidth, disableHeadSort:true,isSeq:true, cellRender:jslet.ui.DBTable.sequenceCellRender};
			Z._sysColumns.push(cobj);
		}
		if (Z.hasSelectCol){
			cobj = {label:'<input type="checkbox" />', width: Z.selectColWidth, disableHeadSort:true,isSelect:true, cellRender:jslet.ui.DBTable.selectCellRender};
			Z._sysColumns.push(cobj);
		}
		
		if (Z.subgroup && Z.subgroup.hasExpander){
			cobj = {label:'&nbsp;', width: Z.selectColWidth, disableHeadSort:true, isSubgroup: true, cellRender:jslet.ui.DBTable.subgroupCellRender};
			Z._sysColumns.push(cobj);
		}
		//prepare data columns
        var tmpColumns = [];
        if (!Z.onlySpecifiedCol) {
			var fldObj, fldName,fields = Z.dataset.getFields();
            for (var i = 0, fldcnt = fields.length; i < fldcnt; i++) {
            	fldObj = fields[i];
                fldName = fldObj.name();
                if (fldObj.visible()) { 
                    cobj = new jslet.ui.TableColumn();
                    cobj.field = fldObj.name()
                    tmpColumns.push(cobj);
                } // end if visible
            } // end for
            if (Z.columns){
            	for(var i = 0, colCnt = Z.columns.length; i < colCnt; i++){
            		cobj = Z.columns[i];
            		if (!cobj.field){
            			tmpColumns.push(cobj);
            			continue;
            		}
                    fldObj = Z.dataset.getTopField(cobj.field);
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
			for(var i = 0, colCnt = Z.columns.length; i < colCnt; i++){
				tmpColumns.push(Z.columns[i]);
			}
		}
        Z.innerHeads = [];
        Z.innerColumns = [];
        var ohead, fldName, label, context = {lastColNum: 0, depth: 0};
        
        for(var i = 0, colCnt = tmpColumns.length; i < colCnt; i++){
        	colObj = tmpColumns[i];
        	fldName = colObj.field;
        	if (!fldName){
    			ohead = new jslet.ui.TableHead();
    			label = colObj.label;
    			ohead.label = label? label: "";
    			ohead.level = 0;
    			ohead.colNum = context.lastColNum++;
    			ohead.id = jslet.nextId();
    			Z.innerHeads.push(ohead);
    			Z.innerColumns.push(colObj);
    			continue;
    		}
        	fldObj = Z.dataset.getField(fldName);
        	Z._convertField2Head(context, fldObj);
        }
        
		Z.maxHeadRows = context.depth + 1;
		Z._calcHeadSpan();
	
		//check fixedCols property
		var colCnt = 0, preColCnt = 0, 
		    fixedColNum = Z.fixedCols - Z._sysColumns.length;
		for(var i = 1, len = Z.innerHeads.length; i < len; i++){
			ohead = Z.innerHeads[i];
			colCnt += ohead.colSpan;
			if (fixedColNum <= preColCnt || fixedColNum == colCnt) {
				break;
			}
			if (fixedColNum < colCnt && fixedColNum > preColCnt) {
				Z.fixedCols = preColCnt + Z._sysColumns.length;
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
			var len = Z.columns ? Z.columns.length: 0;
			for(var i = 0; i < len; i++){
				cobj = Z.columns[i];
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
        			if (!Z._isCellEditable(cobj))// Not in edit mode
        				cobj.cellRender = jslet.ui.DBTable.boolCellRender;
                }else{
                    if (cobj.field == Z.treeField) {
                        cobj.cellRender = jslet.ui.DBTable.treeCellRender;
                    }
				}
            }
            Z.innerColumns.push(cobj);
		}
        return true;
	},
	
    _calcParams: function () {
        var Z = this;
        if (Z.treeField) {//if tree table, then can't sort by clicking column header
            Z.disableHeadSort = true;
        }
        // calculate Sequence column width
        if (Z.hasSeqCol) {
            Z.seqColWidth = ('' + Z.dataset.recordCount()).length * Z.charWidth + 5;
            var sWidth = jslet.ui.htmlclass.TABLECLASS.selectColWidth;
            Z.seqColWidth = Z.seqColWidth > sWidth ? Z.seqColWidth: sWidth;
        } else {
            Z.seqColWidth = 0;
        }
        // calculate Select column width
        if (Z.hasSelectCol) {
            Z.selectColWidth = jslet.ui.htmlclass.TABLECLASS.selectColWidth;
        } else {
            Z.selectColWidth = 0;
        }
		//calculate Fixed row section's height
		if (Z.fixedRows > 0) {
			Z.fixedSectionHt = Z.fixedRows * Z.rowHeight;
		} else {
			Z.fixedSectionHt = 0;
		}
		//Calculate Foot section's height
		Z.innerTotalFields = null;
		if (Z.totalFields){
			Z.footSectionHt = Z.rowHeight;
			Z.innerTotalFields = Z.totalFields.split(',');
		} else {
			Z.footSectionHt = 0;
		}
		Z._prepareColumn();

        // fixed Column count must be less than total columns
        if (Z.fixedCols) {
            if (Z.fixedCols > Z.innerColumns.length) {
                Z.fixedCols = Z.innerColumns.length;
            }
        }
		Z.hasFixedCol = Z._sysColumns.length > 0 || Z.fixedCols > 0;
		if (Z.hasFixedCol){
			var w = 0;
			for(var i = 0, cnt = Z._sysColumns.length; i < cnt; i++){
				w += Z._sysColumns[i].width;
			}
			for(var i = 0; i < Z.fixedCols; i++){
				w += Z.innerColumns[i].width;
			}
			Z.fixedColWidth = w;
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
		var ocol = Z.innerColumns[index];
		if (ocol.width + deltaW <= 0) {
			return;
		}
		ocol.width += deltaW;
		var w = ocol.width + 'px',
		    k = ocol.colNum - Z.fixedCols,
			oheadRow = jQuery(Z.rightHeadTbl).find('.jl-tbl-row4width')[0];
		oheadRow.cells[k].style.width = w;

		if (Z.rightFixedTbl){
			oheadRow = jQuery(Z.rightFixedTbl).find('.jl-tbl-row4width')[0];
			oheadRow.cells[k].style.width = w;
		}
		oheadRow = jQuery(Z.rightContentTbl).find('.jl-tbl-row4width')[0];
		oheadRow.cells[k].style.width = w;

		if (Z.footSectionHt) {
			oheadRow = jQuery(Z.rightFootTbl).find('.jl-tbl-row4width')[0];
			oheadRow.cells[k].style.width = w;
		}
		Z._changeContentWidth(deltaW);
	},

	_changeContentWidth: function (deltaW) {
		var Z = this,
			totalWidth = Z.getTotalWidth() + 'px';
		
		Z.rightHeadTbl.parentNode.style.width = totalWidth;
		if (Z.footSectionHt) {
			Z.rightFootTbl.style.width = totalWidth;
		}
		Z.rightFixedTbl.parentNode.style.width = totalWidth;
		Z.rightContentTbl.parentNode.style.width = totalWidth;
		Z._checkHoriOverflow();
	},

	_createFrame: function () {
		var Z = this;
		Z.el.style.position = 'relative';
		var jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-table')) {
			jqEl.addClass('jl-table jl-border-box');
		}
		if(Z.noborder){
			jqEl.addClass('jl-tbl-noborder');
		}
//		var dbtableframe = [
//				'<div class="jl-tbl-splitter" style="display: none"></div>',
//				'<div class="jl-tbl-norecord">',
//				jslet.locale.DBTable.norecord,
//				'</div>',
//				'<table class="jl-tbl-container" style="width:100%"><tr>',
//				'<td class="jl-tbl-fixedcol-td jl-tbl-header-cell"><div class="jl-tbl-fixedcol"><table class="jl-tbl-data"><tbody /></table><table class="jl-tbl-data"><tbody /></table><div class="jl-tbl-content-div"><table class="jl-tbl-data"><tbody /></table></div><table><tbody /></table></div></td>',
//				'<td><div class="jl-tbl-contentcol"><div><table class="jl-tbl-data jl-tbl-content-table"><tbody /></table></div><div><table class="jl-tbl-data jl-tbl-content-table"><tbody /></table></div><div class="jl-tbl-content-div"><table class="jl-tbl-data jl-tbl-content-table"><tbody /></table></div><table class="jl-tbl-content-table jl-tbl-fixedcol-td"><tbody /></table></div></td>',
//				'<td class="jl-scrollbar-width"><div class="jl-tbl-vscroll-head"></div><div class="jl-tbl-vscroll"><div /></div></td></tr></table>'];

		var dbtableframe = [
		    				'<div class="jl-tbl-splitter" style="display: none"></div>',
		    				'<div class="jl-tbl-norecord">',
		    				jslet.locale.DBTable.norecord,
		    				'</div>',
		    				'<table class="jl-tbl-container" style="width:100%"><tr>',
		    				'<td class="jl-tbl-fixedcol-td jl-tbl-header-cell"><div class="jl-tbl-fixedcol"><table class="jl-tbl-data"><tbody /></table><table class="jl-tbl-data"><tbody /></table><div class="jl-tbl-content-div"><table class="jl-tbl-data"><tbody /></table></div><table><tbody /></table></div></td>',
		    				'<td><div class="jl-tbl-contentcol"><div><table class="jl-tbl-data jl-tbl-content-table"><tbody /></table></div><div><table class="jl-tbl-data jl-tbl-content-table"><tbody /></table></div><div class="jl-tbl-content-div"><table class="jl-tbl-data jl-tbl-content-table"><tbody /></table></div><table class="jl-tbl-content-table jl-tbl-fixedcol-td"><tbody /></table></div></td>',
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
		if (Z.hideHead){
			Z.leftHeadTbl.style.display = 'none';
			Z.rightHeadTbl.style.display = 'none';
			jqEl.find('.jl-tbl-vscroll-head').css('display', 'none');
		}
		if (Z.fixedRows <= 0){
			Z.leftFixedTbl.style.display = 'none';
			Z.rightFixedTbl.style.display = 'none';
		}
		if (!Z.totalFields){
			Z.leftFootTbl.style.display = 'none';
			Z.rightFootTbl.style.display = 'none';
		}
		Z.leftHeadTbl.parentNode.parentNode.style.width = Z.fixedColWidth + 'px';
		
		var jqRightHead = jQuery(Z.rightHeadTbl);
		jqRightHead.off();
		var x = jqRightHead.on('mousedown', Z._doSplitHookDown);
		var y = jqRightHead.on('mouseup', Z._doSplitHookUp);
		
		jQuery(Z.leftHeadTbl).on('mousedown', '.jl-tbl-header-cell', function(event){
			event = jQuery.event.fix( event || window.event );
			var el = event.target;
			if (el.className == 'jl-tbl-splitter-hook') {
				return;
			}
			if (Z._head_label_cliecked){
				Z._head_label_cliecked = false;
				return;
			}
			Z._doHeadClick(this.jsletcolcfg, event.ctrlKey);
		});
		
		jqRightHead.on('mousedown', '.jl-tbl-header-cell', function(event){
			event = jQuery.event.fix( event || window.event );
			var el = event.target;
			if (el.className == 'jl-tbl-splitter-hook') {
				return;
			}
			if (Z._head_label_cliecked){
				Z._head_label_cliecked = false;
				return;
			}
			Z._doHeadClick(this.jsletcolcfg, event.ctrlKey)								
		});

		jQuery(Z.leftHeadTbl).on('click', '.jl-focusable-item', function(event){
			Z._doHeadClick(this.parentNode.parentNode.parentNode.jsletcolcfg);
			Z._head_label_cliecked = true;
			event.stopPropagation();
		});
		
		jqRightHead.on('click', '.jl-focusable-item', function(event){
			Z._doHeadClick(this.parentNode.parentNode.parentNode.jsletcolcfg);
			Z._head_label_cliecked = true;
			event.stopPropagation();
		});
		
		var jqLeftFixedTbl = jQuery(Z.leftFixedTbl),
			jqRightFixedTbl = jQuery(Z.rightFixedTbl),
			jqLeftContentTbl = jQuery(Z.leftContentTbl),
			jqRightContentTbl = jQuery(Z.rightContentTbl);
		
		jqLeftFixedTbl.off();
		jqLeftFixedTbl.on('mouseenter', 'tr', function(){
			Z._oldHoverRowClassName = this.className;
			Z._hoverRowIndex = this.rowIndex;
			this.className = jslet.ui.htmlclass.TABLECLASS.hoverrow;
			jqRightFixedTbl[0].rows[this.rowIndex].className = jslet.ui.htmlclass.TABLECLASS.hoverrow;
		});
		jqLeftFixedTbl.on('mouseleave', 'tr', function(){
			this.className = Z._oldHoverRowClassName;
			jqRightFixedTbl[0].rows[this.rowIndex].className = Z._oldHoverRowClassName;
		});

		jqRightFixedTbl.off();
		jqRightFixedTbl.on('mouseenter', 'tr', function(){
			Z._oldHoverRowClassName = this.className;
			Z._hoverRowIndex = this.rowIndex;
			this.className = jslet.ui.htmlclass.TABLECLASS.hoverrow;
			jqLeftFixedTbl[0].rows[this.rowIndex].className = jslet.ui.htmlclass.TABLECLASS.hoverrow;
		});
		jqRightFixedTbl.on('mouseleave', 'tr', function(){
			this.className = Z._oldHoverRowClassName;
			jqLeftFixedTbl[0].rows[this.rowIndex].className = Z._oldHoverRowClassName;
		});
		
		jqLeftContentTbl.off();
		jqLeftContentTbl.on('mouseenter', 'tr', function(){
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
			var hasLeft = (Z.fixedRows > 0 || Z._sysColumns.length > 0);
			if(hasLeft) {
				jqLeftContentTbl[0].rows[this.rowIndex].className = jslet.ui.htmlclass.TABLECLASS.hoverrow;
			}
		});
		jqRightContentTbl.on('mouseleave', 'tr', function(){
			this.className = Z._oldHoverRowClassName;
			var hasLeft = (Z.fixedRows > 0 || Z._sysColumns.length > 0);
			if(hasLeft) {
				jqLeftContentTbl[0].rows[this.rowIndex].className = Z._oldHoverRowClassName;
			}
		});
		
		Z.jqVScrollBar = jqEl.find('.jl-tbl-vscroll');

		Z.noRecordDiv = jqEl.find('.jl-tbl-norecord')[0];
		
		Z.jqVScrollBar.on('scroll', function () {
			if (Z._keep_silence_) {
				return;
			}
			var num = Math.round(this.scrollTop / Z.rowHeight);// + Z.fixedRows;
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
		}
		
		splitter._doDragging = function (oldX, oldY, x, y, deltaX, deltaY) {
			var bodyMleft = parseInt(jQuery(document.body).css('margin-left'));

			var ojslet = splitter.parentNode.jslet;
			var ocol = ojslet.innerColumns[ojslet.currColId];
			if (ocol.width + deltaX <= 40) {
				return;
			}
			splitter.style.left = x - jQuery(splitter.parentNode).offset().left - bodyMleft + 'px';
		}

		splitter._doDragEnd = function (oldX, oldY, x, y, deltaX,
			deltaY) {
			var Z = splitter.parentNode.jslet;
			Z._changeColWidth(Z.currColId, deltaX);
			splitter.style.display = 'none';
			splitter.parentNode.jslet.isDraggingColumn = false;
		}

		splitter._doDragCancel = function () {
			splitter.style.display = 'none';
			splitter.parentNode.jslet.isDraggingColumn = false;
		}

		Z._setScrollBarMaxValue(Z.listvm.getNeedShowRowCount() * Z.rowHeight);
		Z._createWidthHiddenRow(Z.leftHeadTbl, true);
		Z._createWidthHiddenRow(Z.leftFixedTbl, true);
		Z._createWidthHiddenRow(Z.leftContentTbl, true);
		Z._createWidthHiddenRow(Z.leftFootTbl, true);

		Z._createWidthHiddenRow(Z.rightHeadTbl);
		Z._createWidthHiddenRow(Z.rightFixedTbl);
		Z._createWidthHiddenRow(Z.rightContentTbl);
		Z._createWidthHiddenRow(Z.rightFootTbl);
		if (Z.totalFields){
			Z.leftFootTbl.style.display = '';
			Z.rightFootTbl.style.display = '';
		}
		Z._renderHeader();
		
		if (Z.hideHead) {
			Z.headSectionHt = 0;
		} else {
			Z.headSectionHt = Z.maxHeadRows * Z.headRowHeight;//jQuery(Z.rightHeadTbl.parentNode).outerHeight();
		}
		Z._checkHoriOverflow();
		Z._calcAndSetContentHeight();

		Z.noRecordDiv.style.top = Z.headSectionHt + 'px';
		Z.noRecordDiv.style.left = jqEl.find('.jl-tbl-fixedcol').width() + 5 + 'px';
		jqEl.find('.jl-tbl-vscroll-head').height(Z.headSectionHt + Z.fixedSectionHt);
		Z._renderBody();
		//Z._ajustTableBorder()
	},

	_calcAndSetContentHeight: function(){
		var Z = this,
			jqEl = jQuery(Z.el);

		Z.contentSectionHt = Z.height - Z.headSectionHt - Z.fixedSectionHt - Z.footSectionHt;
		if (Z._isHoriOverflow){
			Z.contentSectionHt -= jslet.ui.htmlclass.TABLECLASS.scrollBarWidth;
		}
		
		Z.listvm.setVisibleCount(Math.floor((Z.contentSectionHt) / Z.rowHeight), true);
		Z._repairHeight = Z.contentSectionHt - Z.listvm.getVisibleCount() * Z.rowHeight;
		
		jqEl.find('.jl-tbl-contentcol').height(Z.height);
		jqEl.find('.jl-tbl-content-div').height(Z.contentSectionHt);

		Z.jqVScrollBar.height(Z.contentSectionHt + Z.footSectionHt);
	},
	
	_checkHoriOverflow: function(){
		var Z = this,
			contentWidth = Z.getTotalWidth();
		
		if(Z.hideHead) {
			Z._isHoriOverflow = contentWidth > jQuery(Z.rightContentTbl.parentNode.parentNode).innerWidth();
		} else {
			Z._isHoriOverflow = contentWidth > Z.rightHeadTbl.parentNode.parentNode.clientWidth;
		}
		Z.jqVScrollBar.height(Z.contentSectionHt - (Z._isHoriOverflow ? jslet.ui.htmlclass.TABLECLASS.scrollBarWidth: 0));

	},
	
	_createWidthHiddenRow: function(oTable, isFixedCol){
		var Z = this;
		if (isFixedCol && !Z.hasFixedCol) {
			return;
		}
		var oTHead = oTable.createTHead(),
			otr = oTHead.insertRow(-1),
			colCfg, oth, start, end;
		jQuery(otr).addClass('jl-tbl-row4width');
		
		if (isFixedCol && Z._sysColumns.length > 0){
			for (var j = 0, cnt = Z._sysColumns.length; j < cnt; j++) {
				colCfg = Z._sysColumns[j];
				oth = document.createElement('th');
				oth.style.width = colCfg.width + 'px';
				otr.appendChild(oth);
			}
		}
		if (isFixedCol){
			start = 0;
			end = Z.fixedCols;
		} else {
			start = Z.fixedCols;
			end = Z.innerColumns.length;
		}
		
		for (var j = start; j < end; j++) {
			colCfg = Z.innerColumns[j];
			oth = document.createElement('th');
			oth.style.width = colCfg.width + 'px';
			otr.appendChild(oth);
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
		oth.className = 'jl-tbl-header-cell jl-unselectable' + (otr.rowIndex == 1 ? ' jl-first-row' : '');
		oth.noWrap = true;
		oth.jsletcolcfg = cobj;
		if (rowSpan && rowSpan > 1) {
			oth.rowSpan = rowSpan;
		}
		if (colSpan && colSpan > 1) {
			oth.colSpan = colSpan;
		}
		if (cobj.cellRender && cobj.cellRender.createHeader){
			cobj.cellRender.createHeader.call(Z, oth, cobj);
		} else {
			var sh = cobj.label || '&nbsp;';
			oth.innerHTML = '<div style="position: relative" unselectable="on" class="jl-unselectable jl-tbl-cell jl-border-box"><span id="'+
				cobj.id + '" unselectable="on" style="width:100%;padding:0px 2px">'
				+((!Z.disableHeadSort && !cobj.disableHeadSort) ? '<a class="jl-focusable-item" href="javascript:void(0)" >' + sh +'</a>': sh)
				+ '</span><span unselectable="on" class="jl-tbl-sorter" title="'+
				jslet.locale.DBTable.sorttitle
				+'">&nbsp;</span><div  unselectable="on" class="jl-tbl-splitter-hook" colid="'
				+ cobj.colNum
				+ '">&nbsp;</div></div>';
		}
		otr.appendChild(oth);	
	}, // end _createHeadCell

	_renderHeader: function () {
		var Z = this;
		if (Z.hideHead) {
			return;
		}
		var otr, otrLeft = null, cobj, otrRight, otd, oth,
			leftHeadObj = Z.leftHeadTbl.createTHead(),
			rightHeadObj = Z.rightHeadTbl.createTHead();
		for(var i = 0; i < Z.maxHeadRows; i++){
			leftHeadObj.insertRow(-1);
			rightHeadObj.insertRow(-1);
		}
		otr = leftHeadObj.rows[1];
		for(var i = 0, cnt = Z._sysColumns.length; i < cnt; i++){
			cobj = Z._sysColumns[i];
			cobj.rowSpan = Z.maxHeadRows;
			Z._createHeadCell(otr, cobj);
		}
		function travHead(arrHeadCfg){
			var cobj, otr;
			for(var m = 0, ccnt = arrHeadCfg.length; m < ccnt; m++){
				cobj = arrHeadCfg[m];
				if (cobj.colNum < Z.fixedCols) {
					otr = leftHeadObj.rows[cobj.level + 1];
				} else {
					otr = rightHeadObj.rows[cobj.level + 1];
				}
				Z._createHeadCell(otr, cobj);
				if (cobj.subHeads) {
					travHead(cobj.subHeads);
				}
			}
		}
		travHead(Z.innerHeads);
		var jqTr1, jqTr2, h= Z.headRowHeight;
		for(var i = 1; i <= Z.maxHeadRows; i++){
			jqTr1 = jQuery(leftHeadObj.rows[i]);
			jqTr2 = jQuery(rightHeadObj.rows[i]);
			jqTr1.height(h);
			jqTr2.height(h);
		}
		
		var totalWidth = Z.getTotalWidth();
//		var totalWidth = jQuery(Z.rightHeadTbl).width();
		jQuery(Z.rightHeadTbl.parentNode).width(totalWidth);
		jQuery(Z.rightFixedTbl.parentNode).width(totalWidth);
		jQuery(Z.rightContentTbl.parentNode).width(totalWidth);
		jQuery(Z.rightTotalTbl).width(totalWidth);
		Z.sortedCell = null;
		Z.indexField = null;
	}, // end renderHead

	getTotalWidth: function(){
		var Z= this,
		    totalWidth = 0;
		for(var i = Z.fixedCols, cnt = Z.innerColumns.length; i < cnt; i++){
			totalWidth += Z.innerColumns[i].width;
		}
		return totalWidth;
	},
	
	_ajustTableBorder: function () {
		var Z = this;

		function setTopBorder(row) {
			if (!row) {
				return;
			}
			var cells, cell;
			cells = row.cells;
			for (var i = 0, cnt = cells.length; i < cnt; i++) {
				cell = cells[i];
				cell.style.borderTopWidth = '0';
				if (i == 0) {
					cell.style.borderLeftWidth = '0';
				}
			}
		}
		var hasHead = !Z.hideHead;
		var hasLeft = (Z.fixedRows > 0 || Z._sysColumns.length > 0);
		if (hasHead) {
			if (hasLeft) {
				setTopBorder(Z.leftHeadTbl.createTHead().rows[1]);
			}
			setTopBorder(Z.rightHeadTbl.createTHead().rows[1])
		}
		if (hasLeft) {
			setTopBorder(Z.leftContentTbl.tBodies[0].rows[0]);
		}
		setTopBorder(Z.rightContentTbl.tBodies[0].rows[0]);

		function setLeftRightBorder(tbl) {
			var rows = tbl.rows;
			var row, cell;
			for (var i = 0, cnt = rows.length; i < cnt; i++) {
				row = rows[i];
				if (row.cells.length == 0) {
					continue;
				}
				cell = row.cells[0];
				cell.style.borderLeftWidth = '0px';
				
				cell = row.cells[row.cells.length - 1];
				cell.style.borderRightWidth = '0px';
			}
		}

		if (hasHead) {
			if (hasLeft) {
				setLeftRightBorder(Z.leftHeadTbl);
			}
			setLeftRightBorder(Z.rightHeadTbl);
		}
		if (hasLeft) {
			setLeftRightBorder(Z.leftContentTbl);
		}
		setLeftRightBorder(Z.rightContentTbl);
	},

	_doSplitHookDown: function (event) {
		event = jQuery.event.fix( event || window.event );
		var ohook = event.target;
		if (ohook.className != 'jl-tbl-splitter-hook') {
			return;
		}
		var tblContainer = jslet.ui.findFirstParent(ohook, function (el) {
			return el.tagName.toLowerCase() == 'div' && el.jslet && el.jslet.dataset
		});
		var jqTblContainer = jQuery(tblContainer);
		
		var jqBody = jQuery(document.body); 
//		jqBody.css('cursor','e-resize');
		var bodyMTop = parseInt(jqBody.css('margin-top'));
		var bodyMleft = parseInt(jqBody.css('margin-left'));
		var y = jqTblContainer.position().top - bodyMTop; ;
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
			return el.tagName.toLowerCase() == 'div' && el.jslet && el.jslet.dataset
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
		if (Z.disableHeadSort || colCfg.disableHeadSort || Z.isDraggingColumn) {
			return;
		}
		Z._doSort(colCfg.field, ctrlKeyPressed);
		Z._updateSortFlag();
	}, // end _doHeadClick

	_doSort: function (sortField, isMultiSort) {
		var Z = this;
		if (!Z._sortFields) {
			Z._sortFields = [];
		}
		var sortObj;
		if (!isMultiSort && Z._sortFields.length > 0) {
			if (Z._sortFields.length > 1) {
				Z._sortFields = [];
			} else {
				sortObj = Z._sortFields[0];
				if (sortObj.field != sortField) {
					Z._sortFields = [];
				}
			}
		}

		var found = 0;
		for (var i = 0, len = Z._sortFields.length; i < len; i++) {
			sortObj = Z._sortFields[i];
			if (sortField == sortObj.field) {
				sortObj.isAsce = !sortObj.isAsce;
				found = 1;
				break;
			}
		}
		if (!found) {
			Z._sortFields[len] = { field: sortField, isAsce: true };
		}
		var indexFlds = '', fldObj, lkf, fldName;
		for (var i = 0, len = Z._sortFields.length; i < len; i++) {
			if (i > 0) {
				indexFlds += ',';
			}
			sortObj = Z._sortFields[i];

			var arrFlds = sortObj.field.split(','), fldCnt = arrFlds.length;
			for (var j = 0; j < fldCnt; j++) {
				fldName = arrFlds[j]
				fldObj = Z.dataset.getField(fldName);
				lkf = fldObj.lookupField();
				if (lkf != null && fldObj.valueStyle() != jslet.data.FieldValueStyle.MULTIPLE //if field can hold multiple values, it can't use code field to sort
					&& lkf.keyField() != lkf.codeField())
					fldName += '.' + lkf.codeField();

				indexFlds += (j > 0 ? ',' : '') + fldName + (sortObj.isAsce ? '' : ' desc');
			}
		}
		Z.dataset.disableControls();
		try {
			if (!Z.onCustomSort) {
				Z.dataset.indexFields(indexFlds);
			} else {
				Z.onCustomSort.call(Z, indexFlds);
			}
			Z.listvm.refreshModel();
		} finally {
			Z.dataset.enableControls();
		}
	},

	_updateSortFlag: function () {
		var Z = this;
		if (Z.hideHead) {
			return;
		}
		var leftHeadObj = Z.leftHeadTbl.createTHead(),
			rightHeadObj = Z.rightHeadTbl.createTHead(),
			leftHeadCells = jQuery(leftHeadObj).find('th'),
			allHeadCells = jQuery(rightHeadObj).find('th'), oth;

		for (var i = 0, cnt = leftHeadCells.length; i < cnt; i++){
			oth = leftHeadCells[i];
			if (oth.jsletcolcfg) {
				allHeadCells[allHeadCells.length] = oth;
			}
		}
		   
		for(var i = allHeadCells.length - 1; i >=0; i--){
			oth = allHeadCells[i];
			if (!oth.jsletcolcfg) {
				allHeadCells.splice(i,1);
			}
		}

		var len = Z._sortFields.length, sortDiv, fldName, sortFlag,
			sortObj, k = 1, cellCnt = allHeadCells.length;
		for (var i = 0; i < cellCnt; i++) {
			oth = allHeadCells[i];
			sortDiv = jQuery(oth).find('.jl-tbl-sorter')[0];
			if (sortDiv) {
				sortDiv.innerHTML = '&nbsp;';
			}
		}

		for (var i = 0; i < len; i++) {
			sortObj = Z._sortFields[i];
			for (var j = 0; j < cellCnt; j++) {
				oth = allHeadCells[j];
				fldName = oth.jsletcolcfg.field;
				if (!fldName) {
					continue;
				}
				sortDiv = jQuery(oth).find('.jl-tbl-sorter')[0];
				sortFlag = '&nbsp;';
				if (fldName == sortObj.field) {
					sortFlag = sortObj.isAsce ? jslet.ui.htmlclass.TABLECLASS.sortAscChar : jslet.ui.htmlclass.TABLECLASS.sortDescChar;
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
			jQuery(otr).click()// tr click
		} finally {
			try {
				var otable = jslet.ui.findFirstParent(otr, function (node) {
					return node.jslet != null;
				});
				var oJslet = otable.jslet;

				if (oJslet.onSelect) {
					var flag = oJslet.onSelect.call(oJslet, ocheck.checked);
					if (flag != undefined && !flag) {
						ocheck.checked = !ocheck.checked;
						return;
					}
				}

				oJslet.dataset.select(ocheck.checked ? 1 : 0, oJslet.selectBy);
			} catch (e) {
				jslet.showInfo(e.message);
			}
		}
	}, // end _doSelectBoxClick

	_doRowDblClick: function (event) {
		var otable = jslet.ui.findFirstParent(this, function (node) {
			return node.jslet != null;
		});

		var Z = otable.jslet;
		//Z.showEditPanel();
		if (Z.onRowDblClick) {
			Z.onRowDblClick.call(Z, event);
		}
	},

	_doRowClick: function (event) {
		var otable = jslet.ui.findFirstParent(this, function (node) {
			return node.jslet != null;
		});

		var Z = otable.jslet;
		var rowno = Z.listvm.recnoToRowno(this.jsletrecno);
		Z.listvm.setCurrentRowno(rowno);
		if (Z.onRowClick) {
			Z.onRowClick.call(Z, event);
		}
	},

	_renderCell: function (otr, colCfg, isFirstCol) {
		var Z = this;
		var otd = document.createElement('td');
		otd.noWrap = true;
		otd.jsletColCfg = colCfg;
		if (isFirstCol) {
			otd.className = 'jl-first-col';
		}
		if (colCfg.cellRender) {
			colCfg.cellRender.createCell.call(Z, otd, colCfg);
		} else if (!Z._isCellEditable(colCfg)) {
				jslet.ui.DBTable.defaultCellRender.createCell.call(Z, otd, colCfg);
		} else {
				jslet.ui.DBTable.editableCellRender.createCell.call(Z, otd, colCfg);
		}
		otr.appendChild(otd);
	},

	_renderRow: function (sectionNum, onlyRefreshContent) {
		var Z = this;
		var rowCnt = 0, leftBody = null, rightBody,
			hasLeft = Z.fixedCols > 0 || Z._sysColumns.length > 0;
		switch (sectionNum) {
			case 1:
				{//fixed data
					rowCnt = Z.fixedRows;
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
			case 3:
				{ //footer
					if (!Z.footSectionHt) {
						return;
					}
					rowCnt = 1;
					if (hasLeft) {
						leftBody = Z.leftFootTbl.tBodies[0];
					}
					rightBody = Z.rightFootTbl.tBodies[0];
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
				otr.style.height = Z.rowHeight + 'px';

				if (sectionNum != 3) {//Not total section
					otr.ondblclick = Z._doRowDblClick;
					otr.onclick = Z._doRowClick;
				}
				var sysColLen = Z._sysColumns.length;
				for(var j = 0; j < sysColLen; j++){
					colCfg = Z._sysColumns[j];
					Z._renderCell(otr, colCfg, j == 0);
				}
				
				isfirstCol = sysColLen == 0;
				for (var j = 0; j < Z.fixedCols; j++) {
					colCfg = Z.innerColumns[j];
					Z._renderCell(otr, colCfg, isfirstCol && j == 0);
				}
			}
			isfirstCol = !hasLeft;
			otr = rightBody.insertRow(-1);
			otr.style.height = Z.rowHeight + 'px';
			if (sectionNum != 3) {//Not total section
				otr.ondblclick = Z._doRowDblClick;
				otr.onclick = Z._doRowClick;
			}
			for (var j = Z.fixedCols; j < fldCnt; j++) {
				colCfg = Z.innerColumns[j];
				Z._renderCell(otr, colCfg, j == Z.fixedCols);
			}
		}
	},

	_sumTotal: function () {
		var Z = this, cobj, fldName, len = Z.innerColumns.length;
		for (var i = 0; i < len; i++) {
			cobj = Z.innerColumns[i];
			if (Z.innerTotalFields.indexOf(cobj.field) < 0) {
				continue;
			}
			cobj.totalValue = 0;
		}
		var recCnt = Z.dataset.recordCount(),
			preRecno = Z.dataset.recno();
		try {
			for (var i = 0; i < recCnt; i++) {
				Z.dataset.innerSetRecno(i);
				for (var j = 0; j < len; j++) {
					cobj = Z.innerColumns[j];
					fldName = cobj.field;
					if (Z.innerTotalFields.indexOf(fldName) >= 0){
						cobj.totalValue += Z.dataset.getFieldValue(fldName);
					}
				}
			}
		} finally {
			Z.dataset.innerSetRecno(preRecno);
		}
	},

	_renderBody: function (onlyRefreshContent) {
		var Z = this;
		if (onlyRefreshContent){
			Z._renderRow(2, true);
		} else {
			Z._renderRow(1);
			Z._renderRow(2);
			Z._renderRow(3);
		}

	}, // end _renderBody

	_fillTotalSection: function () {
		var Z = this;
		if (!Z.footSectionHt) {
			return;
		}
		var hasLeft = Z.fixedCols > 0 && Z._sysColumns.length > 0,
			otrLeft, otrRight;
		if (hasLeft) {
			otrLeft = Z.leftFootTbl.tBodies[0].rows[0];
		}
		otrRight = Z.rightFootTbl.tBodies[0].rows[0];
		Z._sumTotal();

		var otd, k = 0, fldObj, cobj;
		for (var i = 0, len = Z.innerColumns.length; i < len; i++) {
			cobj = Z.innerColumns[i];

			if (i < Z.fixedCols) {
				otd = otrLeft.cells[i];
			} else {
				otd = otrRight.cells[i - Z.fixedCols];
			}
			if (Z.innerTotalFields.indexOf(cobj.field) < 0) {
				otd.innerHTML = '&nbsp;';
				continue;
			}
			fldObj = Z.dataset.getField(cobj.field);
			otd.innerHTML =jslet.formatNumber(cobj.totalValue, fldObj
						.displayFormat());
			otd.style.textAlign = fldObj.alignment();
		}
	},

	_fillData: function () {
		var Z = this;
		var contextEnabled = Z.dataset.isContextRuleEnabled();
		if (contextEnabled) {
			Z.dataset.disableContextRule();
		}
		var preRecno = Z.dataset.recno(),
			allCnt = Z.listvm.getNeedShowRowCount(),
			h = allCnt * Z.rowHeight;
			Z._setScrollBarMaxValue(h);
			Z.noRecordDiv.style.display = allCnt==0 ?'block':'none',
		    context = Z.dataset.startSilenceMove();
		try {
			Z._fillRow(true);
			Z._fillRow(false);
			if (Z.footSectionHt) {
				Z._fillTotalSection();
			}
		} finally {
			if (contextEnabled)
				Z.dataset.enableContextRule();
			Z.dataset.endSilenceMove(context);
		}
	},
	
	_fillRow: function (isFixed) {
		var Z = this,
		    rowCnt = 0, start = 0, leftBody = null, rightBody,
			hasLeft = Z.fixedCols > 0 || Z._sysColumns.length > 0;
			
		if (isFixed) {
			rowCnt = Z.fixedRows;
			start = -1 * Z.fixedRows;
			if (rowCnt == 0) {
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
			recNo = Z.dataset.recno();
			if (hasLeft) {
				otr = fixedRows[i];
				otr.jsletrecno = recNo;
				if (Z.onFillRow) {
					Z.onFillRow.call(Z, otr, Z.dataset);
				}
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
			if (Z.onFillRow) {
				Z.onFillRow.call(Z, otr, Z.dataset);
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
		var fldName = colCfg.field;
		if (Z.onFillCell) {
			Z.onFillCell.call(Z, otd, Z.dataset, fldName);
		}
		if (fldName && colCfg.mergeSame) {
			if (isFirst || !Z.dataset.isSameAsPrevious(fldName)) {
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
			colCfg.cellRender.refreshCell.call(Z, otd, colCfg, recNo);
		} else if (!Z._isCellEditable(colCfg)) {
			jslet.ui.DBTable.defaultCellRender.refreshCell.call(Z, otd, colCfg, recNo);
		} else {
			jslet.ui.DBTable.editableCellRender.refreshCell.call(Z, otd, colCfg, recNo);
		}
	},

	refreshCurrentRow: function () {
		var Z = this,
			hasLeft = Z.innerFixedCols > 0,
			fixedBody = null, contentBody, idx,
			recno = Z.dataset.recno();

		if (recno < Z.fixedRows) {
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
			idx = Z.listvm.recnoToRowno(Z.dataset.recno()) - Z.listvm.getVisibleStartRow();
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
					ocheck.checked = Z.dataset.selected();
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
		if (recno < Z.fixedRows) {
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
		var Z = this;
		rowno = Z.listvm.recnoToRowno(Z.dataset.recno());
		Z.listvm.setCurrentRowno(rowno, false, checkVisible);
	},

	_getTrByRowno: function (rowno) {
		var Z = this, 
			hasLeft = Z.fixedCols > 0 || Z._sysColumns.length > 0,
			idx, otr, k, rows;

		if (rowno < 0) {//fixed rows
			rows = Z.rightFixedTbl.tBodies[0].rows,
			k = Z.fixedRows + rowno,
			row = rows[k],
			fixedRow = hasLeft ? Z.leftFixedTbl.tBodies[0].rows[k] : null;
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
		var	sw = rowno * Z.rowHeight;
		Z._keep_silence_ = true;
		try {
			Z.jqVScrollBar[0].scrollTop = sw;
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
		var Z = this;
		if (evt.eventType == jslet.data.UpdateEvent.METACHANGE) {
			// flag = false;
			// if (evt.eventInfo.enabled != undefined)
			// flag = !evt.eventInfo.enabled;
			// else if (evt.eventInfo.readOnly != undefined)
			// flag = evt.eventInfo.readOnly;
		} else if (evt.eventType == jslet.data.UpdateEvent.BEFORESCROLL) {
		} else if (evt.eventType == jslet.data.UpdateEvent.SCROLL) {
			if (Z.dataset.recordCount() == 0) {
				return;
			}
			Z._showCurrentRow(true);
		} else if (evt.eventType == jslet.data.UpdateEvent.UPDATEALL) {
			Z._fillData();
			Z._showCurrentRow(true);
		} else if (evt.eventType == jslet.data.UpdateEvent.UPDATERECORD) {
			Z.refreshCurrentRow();
		} else if (evt.eventType == jslet.data.UpdateEvent.UPDATECOLUMN) {
			Z._fillData();
		} else if (evt.eventType == jslet.data.UpdateEvent.INSERT) {
			Z.listvm.refreshModel();
			var recno = Z.dataset.recno(),
				preRecno = evt.eventInfo.preRecno;
			Z._fillData();

			Z.refreshControl({
				eventType: jslet.data.UpdateEvent.SCROLL,
				eventInfo: {
					preRecno: preRecno,
					recno: recno
				}
			});
		} else if (evt.eventType == jslet.data.UpdateEvent.DELETE) {
			Z.listvm.refreshModel();
			Z._fillData();
		} else if (evt.eventType == jslet.data.UpdateEvent.SELECTCHANGE) {
			if (!Z.hasSelectCol) {
				return;
			}
			var col = 0;
			if (Z.hasSeqCol) {
				col++;
			}
			var recno = evt.eventInfo.recno, otr, otd, checked, ocheckbox;
			for(var i = 0, cnt = recno.length; i < cnt; i++){
				otr = Z._getLeftRowByRecno(recno[i]);
				if (!otr) {
					continue;
				}
				otd = otr.cells[col];
				checked = evt.eventInfo.selected ? true : false;
				ocheckbox = otd.firstChild;
				ocheckbox.checked = checked;
				ocheckbox.defaultChecked = checked;
			}
		} else if (evt.eventType == jslet.data.UpdateEvent.SELECTALLCHANGE) {
			if (!Z.hasSelectCol) {
				return;
			}
			var col = 0;
			if (Z.hasSeqCol) {
				col++;
			}
			var leftFixedBody = Z.leftFixedTbl.tBodies[0],
				leftContentBody = Z.leftContentTbl.tBodies[0],
				checked, recno, otr, otd, ocheckbox, rec,
				oldRecno = Z.dataset.recno();

			try {
				for (var i = 0, cnt = leftFixedBody.rows.length; i < cnt; i++) {
					otr = leftFixedBody.rows[i];
					if (otr.style.display == 'none') {
						break;
					}
					Z.dataset.innerSetRecno(otr.jsletrecno);
					checked = Z.dataset.selected() ? true : false;
					otd = otr.cells[col];
					ocheckbox = otd.firstChild;
					ocheckbox.checked = checked;
					ocheckbox.defaultChecked = checked;
				}

				for (var i = 0, cnt = leftContentBody.rows.length; i < cnt; i++) {
					otr = leftContentBody.rows[i];
					if (otr.style.display == 'none') {
						break;
					}
					Z.dataset.innerSetRecno(otr.jsletrecno);
					checked = Z.dataset.selected() ? true : false;
					otd = otr.cells[col];
					ocheckbox = jQuery(otd).find('[type=checkbox]')[0];
					ocheckbox.checked = checked;
					ocheckbox.defaultChecked = checked;
				}
			} finally {
				Z.dataset.innerSetRecno(oldRecno);
			}
		}
	}, // refreshControl

	_isCellEditable: function(colCfg){
		var Z = this;
		if (Z.readOnly) {
			return false;
		}
		var fldName = colCfg.field;
		if (!fldName) {
			return false;
		}
		var fldObj = Z.dataset.getField(fldName),
			isEditable = fldObj.enabled() && !fldObj.readOnly() ? 1 : 0;
		return isEditable;
	},
	
	_createEditControl: function (colCfg) {
		var Z = this,
			fldName = colCfg.field;
		if (!fldName) {
			return null;
		}
		var fldObj = Z.dataset.getField(fldName),
		isEditable = fldObj.enabled() && !fldObj.readOnly() ? 1 : 0;
		if (!isEditable) {
			return null;
		}
		var param, w, h, fldCtrlCfg = fldObj.editControl();
		fldCtrlCfg.dataset = Z.dataset;
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
})

jslet.ui.DefaultCellRender =  jslet.Class.create(jslet.ui.CellRender, {
    createCell: function (otd, colCfg) {
        var Z = this,
        	fldName = colCfg.field,
        	fldObj = Z.dataset.getField(fldName);
        otd.noWrap = true;
        otd.style.textAlign = fldObj.alignment();
        otd.innerHTML = '';
        var odiv = document.createElement('div');
        otd.appendChild(odiv);
        jQuery(odiv).addClass(jslet.ui.htmlclass.TABLECLASS.celldiv);
        //odiv.style.height = Z.rowHeight - 2 + 'px';
    },

    refreshCell: function (otd, colCfg) {
        if (!colCfg || colCfg.noRefresh) {
            return;
        }
        var jqDiv = jQuery(otd.firstChild);
        jqDiv.html('');
        var Z = this,
        	fldName = colCfg.field;
        if (!fldName) {
        	return;
        }
        var fldObj = Z.dataset.getField(fldName), text;
        try {
            text = Z.dataset.getFieldText(fldName)
        } catch (e) {
            text = 'error: ' + e.message;
        }
        
        otd.title = text;
        if (fldObj.urlExpr()) {
            var url = '<a href=' + fldObj.calcUrl(),
            	target = fldObj.urlTarget();
            if (target) {
                url += ' target=' + target;
            }
            url += '>' + text + '</a>';
            text = url;
        }
        jqDiv.html(text);
    } 
})

jslet.ui.EditableCellRender =  jslet.Class.create(jslet.ui.CellRender, {
    createCell: function (otd, colCfg, rowNum) {
        var Z = this,
        	fldName = colCfg.field,
        	fldObj = Z.dataset.getField(fldName);

        otd.noWrap = true;
        otd.style.textAlign = fldObj.alignment();
        otd.innerHTML = '';
        var editCtrl = Z._createEditControl(colCfg);
        jQuery(editCtrl).css('width', '100%').on('focus', function(){
        	this.jslet.dataset.recno(this.jslet.currRecno);
        });
        editCtrl.style.border = '0px';
        //editCtrl.style.height = '100%';
        otd.style.paddingLeft = '2px';
        otd.style.paddingRight = '2px';
        otd.appendChild(editCtrl);
    },
    
    refreshCell: function (otd, colCfg, recNo) {
        if (!colCfg) {
            return;
        }
        var editCtrl = otd.firstChild.jslet;
        editCtrl.currRecno = recNo;
        editCtrl.forceRefreshControl();
    } 
    
})

jslet.ui.SequenceCellRender = jslet.Class.create(jslet.ui.CellRender, {
	createHeader: function(otd, colCfg) {
		
	},
	
    createCell: function (otd, colCfg) {
        var Z = this;
        otd.noWrap = true;
        otd.innerHTML = '';
        var odiv = document.createElement('div');
        otd.appendChild(odiv);
        odiv.className = jslet.ui.htmlclass.TABLECLASS.celldiv;
        //jQuery(odiv).addClass(jslet.ui.htmlclass.TABLECLASS.celldiv).height(Z.rowHeight - 2);
    },

    refreshCell: function (otd, colCfg) {
        if (!colCfg || colCfg.noRefresh) {
            return;
        }
        var jqDiv = jQuery(otd.firstChild);
        jqDiv.html('');
        var Z = this, text = Z.dataset.recno() + 1;
        otd.title = text;
        jqDiv.html(text);
    }
})

jslet.ui.SelectCellRender = jslet.Class.create(jslet.ui.CellRender, {
	createHeader: function(otd, colCfg) {
		otd.noWrap = true;
		otd.style.textAlign = 'center';
		//jQuery(otd).html('<input type="checkbox" />');
		var ocheckbox = document.createElement('input');
		ocheckbox.type = 'checkbox';
		var Z = this;
		jQuery(ocheckbox).addClass('jl-tbl-select-check').on('click', function (event) {
			Z.dataset.selectAll(this.checked ? 1 : 0, Z.onSelectAll)
		});
		otd.appendChild(ocheckbox);
	},
	
   createCell: function (otd, colCfg) {
		otd.noWrap = true;
		otd.style.textAlign = 'center';
        var Z = this, 
        	ocheck = document.createElement('input'),
        	jqCheck = jQuery(ocheck);
		jqCheck.attr('type', 'checkbox').addClass('jl-tbl-select-check');
		jqCheck.click(Z._doSelectBoxClick);
		otd.appendChild(ocheck);
    },

    refreshCell: function (otd, colCfg) {
        if (!colCfg || colCfg.noRefresh) {
            return;
        }
        var Z = this,
        	ocheck = otd.firstChild;
        if(Z.dataset.checkSelectable()) {
        	ocheck.checked = Z.dataset.selected();
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
    refreshCell: function (otd, colCfg) {
        if (!colCfg || colCfg.noRefresh) {
            return;
        }
        otd.style.textAlign = 'center';
        var jqDiv = jQuery(otd.firstChild);
        jqDiv.html('&nbsp;');
        var Z = this,
        	fldName = colCfg.field, 
        	fldObj = Z.dataset.getField(fldName);
        if (fldObj.trueValue == Z.dataset.getFieldValue(fldName)) {
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

    createCell: function (otd, colCfg) {
        var Z = this;
        otd.noWrap = true;
        jQuery(otd).html('');
        var odiv = document.createElement('div'),
        	jqDiv = jQuery(odiv);
        jqDiv.addClass(jslet.ui.htmlclass.TABLECLASS.celldiv);
        odiv.style.height = Z.rowHeight - 2 + 'px';
        jqDiv.html('<span class="jl-tbltree-indent"></span><span class="jl-tbltree-node"></span><span class="jl-tbltree-icon"></span><span class="jl-tbltree-text"></span>');

        var obtn = odiv.childNodes[1];
        obtn.onclick = function (event) {
            var otr = jslet.ui.findFirstParent(this,function(node){return node.tagName && node.tagName.toLowerCase() == 'tr'})
            Z.dataset.recno(otr.jsletrecno);

            if (this.expanded) {
                Z.listvm.collapse(function(){Z._fillData()});
            } else {
                Z.listvm.expand(function(){Z._fillData()});
            }
        }

        obtn.onmouseover = function (event) {
        	var jqBtn = jQuery(this);
            if (jqBtn.hasClass('jl-tbltree-collapse')) {
            	jqBtn.addClass('jl-tbltree-collapse-hover');
            } else {
            	jqBtn.addClass('jl-tbltree-expand-hover');
            }
        }

        obtn.onmouseout = function (event) {
        	var jqBtn = jQuery(this);
        	jqBtn.removeClass('jl-tbltree-collapse-hover');
        	jqBtn.removeClass('jl-tbltree-expand-hover')
        }

        otd.appendChild(odiv);
    },

    refreshCell: function (otd, colCfg) {
        if (!colCfg || colCfg.noRefresh) {
            return;
        }
        var odiv = otd.firstChild,
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
            expBtn.expanded = Z.dataset.getRecord()._expanded_;
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

        var fldName = colCfg.field, fldObj = Z.dataset.getField(fldName), text;
        try {
            text = Z.dataset.getFieldText(fldName);
        } catch (e) {
            text = 'error: ' + e.message;
        }
        otd.title = text;
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
    }

    this.unattach = function () {
        jslet.ui._splitDiv.style.display = 'none';
        this.onSplitEnd = null;
        this.onSplitCancel = null;
    }

    this.onSplitEnd = null;
    this.onSplitCancel = null;

    this._doDragEnd = function (oldX, oldY, x, y, deltaX, deltaY) {
        jslet.ui.dnd.unbindControl();
        if (this.onSplitEnd) {
            this.onSplitEnd(x - oldX);
        }
        this.unattach();
        this.isDragging = false;
    }

    this._doDragging = function (oldX, oldY, x, y, deltaX, deltaY) {
        this.isDragging = true;
        jslet.ui._splitDiv.style.left = x + 'px';
    }

    this._doDragCancel = function () {
        jslet.ui.dnd.unbindControl();
        if (this.onSplitCancel) {
            this.onSplitCancel();
        }
        this.unattach();
        this.isDragging = false;
    }
}
