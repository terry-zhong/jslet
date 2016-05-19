/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

"use strict";
jslet.ui.TableCellEditor = function(tableCtrl) { 
	var _tableCtrl = tableCtrl; 
	var _editPanel;
	var _currField;
	
	function _create() { 
		var html = '<div class="form-group form-group-sm jl-tbl-editpanel"><table class="jl-tbl-edittable"><tbody><tr class="jl-tbl-editrow">';
		var columns = _tableCtrl._sysColumns, colCfg,
			tblDataset = tableCtrl.dataset(),
			dsName = tblDataset.name(),
			left = 1, i, len;
			
		for(i = 0, len = columns.length; i < len; i++) {
			colCfg = columns[i];
			left += colCfg.width + 1;
		}
		columns = _tableCtrl.innerColumns;
		var tableId = tableCtrl.el.id,
			editorTabIndex = tableCtrl.editorTabIndex(),
			isBool,
			alignStr = ';text-align: center';
		for(i = 0, len = columns.length; i < len; i++) {
			colCfg = columns[i];
			if(colCfg.field) {
				isBool = (tblDataset.getField(colCfg.field).dataType() === jslet.data.DataType.BOOLEAN);
				html += '<td class="jl-edtfld-' + colCfg.field +  '" style="display:none;vertical-align: middle' + (isBool? alignStr: '') + 
				'"><div data-jslet=\'type:"DBPlace",dataset:"' + dsName + 
				'",field:"' + colCfg.field + 
				'", tableId: "' + tableId + 
				'", expandChildWidth: ' + (isBool? 'false': 'true') + 
				(editorTabIndex? ', tabIndex: ' + editorTabIndex: '') + 
				'\' class="' + colCfg.widthCssName + '"></div></td>';
			}
		}
		html += '</tr></tbody></table></div>';
		var jqPanel = jQuery(html);
		jqPanel.appendTo(jQuery(_tableCtrl.el));
		jqPanel.css('left', left + 'px');
		jslet.ui.install(jqPanel[0]);
		_editPanel = jqPanel;
		jqPanel.height(_tableCtrl.rowHeight());
		jqPanel.on('keydown', function(event) {
			var keyCode = event.which;
			//prevent to fire dbtable's ctrl+c
			if(event.ctrlKey && keyCode === jslet.ui.KeyCode.C) { //ctrl + c
	       		event.stopImmediatePropagation();
			}
		});
	}
	
	_create();
	
	this.showEditor = function(fldName, otd) {
		var dataset = _tableCtrl.dataset();
		if(!fldName) {
			_tableCtrl.dataset().focusEditControl(_currField);
			return;
		}
		var fldObj = dataset.getField(fldName);
		if(!fldObj || fldObj.disabled() || fldObj.readOnly()) {
			_editPanel.hide();
			return;
		}
		var cellPos = jQuery(otd).offset();
		if(_currField) {
			_editPanel.show().find('.jl-edtfld-' + _currField).hide();
		}
		var jqEditor = _editPanel.find('.jl-edtfld-' + fldName);
		_editPanel.offset(cellPos);
		jqEditor.show();
		_tableCtrl.dataset().focusEditControl(fldName);
		_currField = fldName;
	};
	
	this.currentField = function() {
		return _currField;
	};
	
	this.hideEditor = function() {
		_editPanel.hide();
	};
	
	this.destroy = function() { 
		_tableCtrl = null; 
	};
};

/**
 * Find dialog for DBTable and DBTreeView control
 */
jslet.ui.FindDialog = function (dbContainer) {
	var _dialog;
	var _dataset = dbContainer.dataset();
	var _containerEl = dbContainer.el;
	var _currfield = null;
	var _findingField = null;
	var _left = -1;
	var _top = -1;
	function initialize() {
		var opt = { type: 'window', caption: jslet.formatMessage(jslet.locale.findDialog.caption, ['']), isCenter: false, resizable: true, minimizable: false, maximizable: false, 
				stopEventBubbling: true, styleClass: 'jl-finddlg'};
		_dialog = jslet.ui.createControl(opt, _containerEl);
		_dialog.onClosed(function(){
			return 'hidden';
		});
			
		var content = '<div class="input-group input-group-sm"><input class="form-control jl-finddlg-value" placeholder="' + 
		jslet.locale.findDialog.placeholder + '"/>' + 
		'<div class="input-group-btn"><button class="btn btn-default jl-finddlg-find"><i class="fa fa-search" /></button></div></div>';
		
		_dialog.setContent(content);
		_dialog.onPositionChanged(function(left, top) {
			_left = (left > 0? left: 0);
			_top = (top > 0? top: 0);
		});
		var dlgEl = _dialog.el;

		var jqFindingValue = jQuery(dlgEl).find('.jl-finddlg-value');
		var isStart = true;
		jqFindingValue.on('keydown', function(event){
			if(event.keyCode === jslet.ui.KeyCode.ENTER) {
				findData();
	       		event.stopImmediatePropagation();
				event.preventDefault();
				return false;
			}
			isStart = true;
		});
		
		var jqFind = jQuery(dlgEl).find('.jl-finddlg-find');
		jqFind.on('click', function(event) {
			findData();
		});

		function findData() {
			if(_dataset.recordCount() < 2) {
				return;
			}
			var findingValue = jqFindingValue.val(),
				currRecno = 0;
			if(!isStart) {
				currRecno = _dataset.recno() + 1;
			}
			var found = _dataset.findByField(_findingField, findingValue, currRecno, true, 'any');
			isStart = !found;
			if(!found) {
				if(currRecno > 0) { //If not found, find from the first position.
					findData();
				}
			}
			return found;
		}
	}
	
	this.show = function(left, top) {
		if(_left >= 0) {
			left = _left;
		}
		if(_top >= 0) {
			top = _top;
		}
		left = left || 0;
		top = top || 0;
		_dialog.show(left, top);
		this.focus();
	};
	
	this.hide = function() {
		_dialog.hide();
	};
	
	this.findingField = function(findingField) {
		if(findingField === undefined) {
			return _findingField;
		}
		var oldField = _findingField;
		_findingField = findingField;
		if(_findingField) {
			var fldObj = _dataset.getField(_findingField);
			if(fldObj) {
				_dialog.changeCaption(jslet.formatMessage(jslet.locale.findDialog.caption, [fldObj.label()]));
				if(oldField != findingField) {
					jQuery(_dialog.el).find('.jl-finddlg-value').val('');
				}
			}
		}
	};
	
	this.focus = function() {
		jQuery(_dialog.el).find('.jl-finddlg-value').focus();
	};
	
	this.destroy = function() {
		_dialog.destroy();
	};
	
	initialize();
};

/**
 * Filter dialog for DBTable and DBTreeView control
 */
jslet.ui.FilterDialog = function (dataset, fields) {
	
};

/**
 * Filter panel for DBTable
 */
jslet.ui.DBTableFilterPanel = function(tblCtrl) {
	var Z = this;
	Z._width = 300;
	Z._height = 150;
	Z.fieldName = null;
	Z._filterDatasetObj = new jslet.data.FilterDataset(tblCtrl.dataset());
	Z._filterDataset = Z._filterDatasetObj.filterDataset();
	Z._filterDataset.getField('lParenthesis').visible(false);
	Z._filterDataset.getField('rParenthesis').visible(false);
	Z._filterDataset.getField('logicalOpr').visible(false);
	Z._filterDataset.getField('valueExprInput').visible(false);
	Z._dbtable = tblCtrl;
	Z._jqFilterBtn = null;
	Z._currFieldName = null;
	Z._currFilterExpr = null;
};

jslet.ui.DBTableFilterPanel.prototype = {
	
	jqFilterBtn: function(jqFilterBtn) {
		this._jqFilterBtn = jqFilterBtn;
	},
		
	changeField: function(fldName) {
		var dsFilter = this._filterDataset,
			fldObj = dsFilter.getField('field'),
			lkDs = fldObj.lookup().dataset();
		dsFilter.cancel();
		lkDs.filter('[name] == "' + fldName +'" || like([name],"'+ fldName + '.%' + '")');
		lkDs.filtered(true);
		fldObj.visible(lkDs.recordCount() > 1);
		if(!dsFilter.find('[field] == "' + fldName + '" || like([field], "' + fldName + '.%' + '")')) {
			dsFilter.appendRecord();
			dsFilter.setFieldValue('field', fldName);
		}
		this._currFieldName = fldName;
	},
	
	show: function (left, top, ajustX, ajustY) {
		var Z = this;
		if (!Z._panel) {
			Z._panel = Z._create();
		}
		Z._panel.style.left = left + 'px';
		Z._panel.style.top = top + 'px';
		jQuery(Z._panel).show('fast');
		window.setTimeout(function(){
			Z._filterDataset.focusEditControl('value');
		},5);
	},

	hide: function () {
		this._filterDataset.cancel();
		jQuery(this._panel).hide('fast');
	},
	
	cancelFilter: function() {
		this._filterDataset.cancel();
	},
	
	_create: function () {
		var Z = this;
		if (!Z._panel) {
			Z._panel = document.createElement('div');
			Z._dbtable.el.appendChild(Z._panel);
		}
		jQuery(Z._panel).addClass('panel panel-default jl-filter-panel');
		Z._panel.innerHTML = '<div class=""><div data-jslet="type: \'DBEditPanel\', dataset: \'' + Z._filterDataset.name() + 
		'\', columnCount: 1,hasLabel:false " style="width:100%;height:100%" ></div></div>' +
		'<div><button class="btn btn-default btn-sm jl-filter-panel-ok" tabIndex="90990">' + jslet.locale.FilterPanel.ok +
		'</button><button class="btn btn-default btn-sm jl-filter-panel-cancel" tabIndex="90991">' + jslet.locale.FilterPanel.cancel + 
		'</button><button class="btn btn-default btn-sm jl-filter-panel-clear" tabIndex="90992">' + jslet.locale.FilterPanel.clear + 
		'</button><button class="btn btn-default btn-sm jl-filter-panel-clearall" tabIndex="90993">' + jslet.locale.FilterPanel.clearAll + 
		'</button></div>';
		jslet.ui.install(Z._panel);
		var jqPanel = jQuery(Z._panel);
		jqPanel.find('.jl-filter-panel-ok').on('click', function(){
			var dsFilter = Z._filterDataset;
			dsFilter.confirm();
			if(jslet.isEmpty(dsFilter.getFieldValue('value'))) {
				dsFilter.deleteRecord();
			}
			var filter = Z._filterDatasetObj.getFilterExpr();
			Z._dbtable.dataset().filter(filter).filtered(true);
			Z._currFilterExpr = filter;
			
			Z.hide();
			Z._setFilterBtnStyle();
		});
		jqPanel.find('.jl-filter-panel-cancel').on('click', function(){
			Z._filterDataset.cancel();
			Z.hide();
		});
		jqPanel.find('.jl-filter-panel-clear').on('click', function(){
			Z._filterDataset.deleteRecord();
			var filter = Z._filterDatasetObj.getFilterExpr();
			Z._dbtable.dataset().filter(filter).filtered(true);
			Z.hide();
			Z._currFilterExpr = filter;
			Z._setFilterBtnStyle();
		});
		jqPanel.find('.jl-filter-panel-clearall').on('click', function(){
			Z._filterDataset.dataList(null);
			Z._dbtable.dataset().filter(null).filtered(false);
			Z.hide();
			Z._clearFilterBtnStyle();
		});
		//prevent to fire the dbtable's keydown event.
		jqPanel.on('keydown', function(event) {
       		event.stopImmediatePropagation();
		});
		return Z._panel;
	},

	_clearFilterBtnStyle: function() {
		var jqPanel = jQuery(this._panel);
		jQuery(this._dbtable.el).find('.jl-tbl-filter-hasfilter').attr('title', '').removeClass('jl-tbl-filter-hasfilter');
		jqPanel.find('.jl-filter-panel-clearall').attr('title', '');
		this._currFilterExpr = null;
	},
	
	checkFilterBtnStyle: function() {
		var Z = this;
		if(!Z._currFilterExpr) {
			return;
		}
		var dsHost = Z._dbtable.dataset(),
			dsFilterExpr = dsHost.filter();
		if(dsHost.filtered() && dsFilterExpr == Z._currFilterExpr) {
			return;
		}
		Z._clearFilterBtnStyle();
		var dsFilter = Z._filterDataset;
		if(!dsFilterExpr || !dsHost.filtered()) {
			dsFilter.dataList(null);
		}
		var filterText = Z._filterDatasetObj.getFilterExprText();
		jQuery(Z._dbtable.el).find('button.jl-tbl-filter').each(function(){
			var fldName = this.getAttribute('jsletfilterfield');
			var jqFilterBtn = jQuery(this);
			if(dsFilter.find('[field] == "' + fldName + '" || like([field], "' + fldName + '.%' + '")')) {
				jqFilterBtn.addClass('jl-tbl-filter-hasfilter');
			} else {
				jqFilterBtn.removeClass('jl-tbl-filter-hasfilter');
			}
			jqFilterBtn.attr('title', filterText || '');
		});
		jQuery(Z._panel).find('.jl-filter-panel-clearall').attr('title', filterText || '');
	},
	
	_setFilterBtnStyle: function() {
		var Z = this;
		var filterText = Z._filterDatasetObj.getFilterExprText();
		
		var dsFilter = Z._filterDataset;
		if(dsFilter.find('[field] == "' + Z._currFieldName + '" || like([field], "' + Z._currFieldName + '.%' + '")')) {
			Z._jqFilterBtn.addClass('jl-tbl-filter-hasfilter');
		} else {
			Z._jqFilterBtn.removeClass('jl-tbl-filter-hasfilter');
		}
		Z._jqFilterBtn.attr('title', filterText || '');
		jQuery(Z._dbtable.el).find('.jl-tbl-filter-hasfilter').attr('title', filterText || '');
		jQuery(Z._panel).find('.jl-filter-panel-clearall').attr('title', filterText || '');
	},
	
	destroy: function(){
		var Z = this;
		jslet.ui.uninstall(Z._panel);
		Z._panel.innerHTML = '';
		Z._panel = null;
		Z._dbtable = null;
		Z._jqFilterBtn = null;
	}
};
