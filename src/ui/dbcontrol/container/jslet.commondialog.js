/* ========================================================================
 * Jslet framework: jslet.listviewmodel.js
 *
 * Copyright (c) 2014 Jslet Group(https://github.com/jslet/jslet/)
 * Licensed under MIT (https://github.com/jslet/jslet/LICENSE.txt)
 * ======================================================================== */

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
		var opt = { type: 'window', caption: jslet.formatString(jslet.locale.findDialog.caption, ['']), isCenter: false, resizable: true, minimizable: false, maximizable: false, 
				stopEventBubbling: true, styleClass: 'jl-finddlg'};
		_dialog = jslet.ui.createControl(opt, _containerEl);
		_dialog.onClosed(function(){
			return 'hidden';
		});
			
		var content = '<div class="input-group input-group-sm" style="width:150px"><input class="form-control jl-finddlg-value" placeholder="' + 
		jslet.locale.findDialog.placeholder + '"/>' + 
		'<div class="input-group-btn"><button class="btn btn-default jl-finddlg-find"><i class="fa fa-search" /></button></div></div>';
		
		_dialog.setContent(content);
		_dialog.onPositionChanged(function(left, top) {
			_left = (left > 0? left: 0);
			_top = (top > 0? top: 0);
		});
		var dlgEl = _dialog.el;

		var jqFindingValue = jQuery(dlgEl).find('.jl-finddlg-value');
		jqFindingValue.on('keydown', function(event){
			if(event.keyCode === 13) {
				findData();
	       		event.stopImmediatePropagation();
				event.preventDefault();
				return false;
			}
		});
		
		var jqFind = jQuery(dlgEl).find('.jl-finddlg-find');
		jqFind.on('click', function(event) {
			findData();
		});

		var isStart = false;
		function findData() {
			if(_dataset.recordCount() < 2) {
				return;
			}
			var found = _dataset.findByField(_findingField, jqFindingValue.val(), true, true, 'any');
			if(!found && !isStart) {
				_dataset.first();
				isStart = true;
				findData();
			}
			isStart = false;
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
		_findingField = findingField;
		if(_findingField) {
			var fldObj = _dataset.getField(_findingField);
			if(fldObj) {
				_dialog.changeCaption(jslet.formatString(jslet.locale.findDialog.caption, [fldObj.label()]));
				jQuery(_dialog.el).find('.jl-finddlg-value').val('');
			}
		}
	};
	
	this.focus = function() {
		jQuery(_dialog.el).find('.jl-finddlg-value').focus();
	};
	
	initialize();
	this.hide();
};

/**
 * Filter dialog for DBTable and DBTreeView control
 */
jslet.ui.FilterDialog = function (dataset, fields) {
	
};

jslet.ui.DBTableFilterPanel = function(tblCtrl) {
	var Z = this;
	Z._width = 300;
	Z._height = 150;
	Z.fieldName = null;
	Z._filterDatasetObj = new jslet.data.FilterDataset(tblCtrl.dataset());
	Z._filterDataset = Z._filterDatasetObj.filterDataset();
//	Z._filterDataset.getField('field').editControl('DBSelect');
	Z._filterDataset.getField('lParenthesis').visible(false);
	Z._filterDataset.getField('rParenthesis').visible(false);
	Z._filterDataset.getField('logicalOpr').visible(false);
	Z._filterDataset.getField('valueExprInput').visible(false);
	Z._dbtable = tblCtrl;
}

jslet.ui.DBTableFilterPanel.prototype = {
		
	changeField: function(fldName) {
		var dsFilter = this._filterDataset,
			fldObj = dsFilter.getField('field'),
			lkDs = fldObj.lookup().dataset();
		dsFilter.cancel();
		lkDs.filter('[name] == "' + fldName +'" || like([name],"'+ fldName + '.%' + '")');
		lkDs.filtered(true);
		fldObj.visible(lkDs.recordCount() > 1);
		if(!dsFilter.findByField('field', fldName)) {
			dsFilter.appendRecord();
			dsFilter.setFieldValue('field', fldName);
		}
	},
	
	show: function (left, top, ajustX, ajustY) {
		var Z = this;
		if (!Z._panel) {
			Z._panel = Z._create();
		}
		Z._panel.style.left = left + 'px';
		Z._panel.style.top = top + 'px';
		Z._panel.style.display = "block";
	},

	hide: function () {
		this._filterDataset.cancel();
		this._panel.style.display = "none";
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
		'<div><button class="btn btn-default btn-sm jl-filter-panel-ok">' + jslet.locale.FilterPanel.ok +
		'</button><button class="btn btn-default btn-sm jl-filter-panel-cancel">' + jslet.locale.FilterPanel.cancel + 
		'</button><button class="btn btn-default btn-sm jl-filter-panel-clear">' + jslet.locale.FilterPanel.clear + 
		'</button><button class="btn btn-default btn-sm jl-filter-panel-clearall">' + jslet.locale.FilterPanel.clearAll + 
		'</button></div>';
		jslet.ui.install(Z._panel);
		var jqPanel = jQuery(Z._panel);
		jqPanel.find('.jl-filter-panel-ok').on('click', function(){
			Z._filterDataset.confirm();
			var filter = Z._filterDatasetObj.convertToFilterExpr();
			Z._dbtable.dataset().filter(filter).filtered(true);
			Z.hide();
		});
		jqPanel.find('.jl-filter-panel-cancel').on('click', function(){
			Z._filterDataset.cancel();
			Z.hide();
		});
		jqPanel.find('.jl-filter-panel-clear').on('click', function(){
			Z._filterDataset.deleteRecord();
			var filter = Z._filterDatasetObj.convertToFilterExpr();
			Z._dbtable.dataset().filter(filter).filtered(true);
			Z.hide();
		});
		jqPanel.find('.jl-filter-panel-clearall').on('click', function(){
			Z._filterDataset.dataList(null);
			Z._dbtable.dataset().filter(null).filtered(false);
			Z.hide();
		});
		return Z._panel;
	},

	destroy: function(){
		jslet.ui.uninstall(Z._panel);
		Z._panel.innerHTML = '';
		Z._panel = null;
		Z._dbtable = null;
	}
};
