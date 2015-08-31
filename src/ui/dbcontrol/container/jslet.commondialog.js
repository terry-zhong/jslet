/* ========================================================================
 * Jslet framework: jslet.listviewmodel.js
 *
 * Copyright (c) 2014 Jslet Group(https://github.com/jslet/jslet/)
 * Licensed under MIT (https://github.com/jslet/jslet/LICENSE.txt)
 * ======================================================================== */

/**
 * Find dialog for DBTable and DBTreeView control
 */
jslet.ui.FindDialog = function (dataset, container) {
	var _dialog;
	var _dataset = dataset;
	var _currfield = null;
	var _container = container;
	var _findingField = null;
	
	function initialize() {
		var opt = { type: 'window', caption: 'Find', isCenter: false, resizable: true, minimizable: false, maximizable: false, stopEventBubling: true, height: 58, width: 320 };
		_dialog = jslet.ui.createControl(opt);
		_dialog.onClosed(function(){
			return 'hidden';
		});
		var content = '<div class="form-horizontal"><div class="form-group form-group-sm jl-nogap"><div class="col-sm-9 jl-nogap"><input class="form-control jl-finddlg-value jl-nogap"/></div>' + 
		'<div class="col-sm-2 jl-nogap"><select class="form-control jl-finddlg-opt jl-nogap">' + 
		'<option title="' + jslet.locale.findDialog.matchFirst + '">=*</option>' + 
		'<option>=</option>' + 
		'<option title="' + jslet.locale.findDialog.matchLast + '">*=</option>' + 
		'<option title="' + jslet.locale.findDialog.matchAny + '">*=*</option></select></div>' +
		'<div class="col-sm-1 btn-group btn-group-sm jl-nogap"><button class="btn jl-finddlg-find fa fa-search"></button></div></div>'
			
		_dialog.setContent(content);
		var dlgEl = _dialog.el;
		var jqOptions = jQuery(dlgEl).find('.jl-finddlg-opt');

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
			var matchType = jqOptions.val();
			if(matchType == '=*') {
				matchType = 'first';
			} else if(matchType == '*=') {
				matchType = 'last';
			} else if(matchType == '*=*') {
				matchType = 'any';
			} else {
				matchType = null;
			}
			_dataset.findByField(_findingField, jqFindingValue.val(), true, true, matchType);
		}
	}
	
	this.show = function(findingField) {
		if(_container) {
			var pos = jQuery(_container).offset();
		}
		_dialog.show(pos.left, pos.top);
		this.findingField(findingField);
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
			}
		}
	};
	
	initialize();
	this.hide();
};

/**
 * Filter dialog for DBTable and DBTreeView control
 */
jslet.ui.FilterDialog = function (dataset, fields) {
	
};


