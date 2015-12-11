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
			
		var content = '<div class="input-group input-group-sm" style="width:200px"><input class="form-control jl-finddlg-value" placeholder="' + 
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

		function findData() {
			_dataset.findByField(_findingField, jqFindingValue.val(), true, true, 'any');
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


