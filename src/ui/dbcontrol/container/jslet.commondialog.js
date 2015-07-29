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
	
	function initialize() {
		var opt = { type: 'window', caption: 'Find', isCenter: false, resizable: true, minimizable: false, maximizable: false, stopEventBubling: true, height: 64, width: 350 };
		_dialog = jslet.ui.createControl(opt);
		_dialog.onClosed(function(){
			return 'hidden';
		});
		var content = '<table style="width:100%"><tr><td><input class="form-control jl-finddlg-value" /></td><td style="width:20%"><select class="form-control jl-finddlg-opt"><option>=</option><option title="Match First">=*</option><option>*=*</option><option>*=</option></select></td><td style="width:15%"><button class="btn jl-finddlg-find" style="width:100%">Find</button></td></tr></table>'
		_dialog.setContent(content);
		var dlgEl = _dialog.el;
		var jqFindingValue = jQuery(dlgEl).find('.jl-finddlg-value');
		jqFindingValue.on('keydown', function(event){
			
		});
		var jqOptions = jQuery(dlgEl).find('.jl-finddlg-opt');
		jqOptions.on('change', function(event){
			
		});
		
		var jqFind = jQuery(dlgEl).find('.jl-finddlg-find');
		jqFind.on('click', function(event) {
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
		});

	}
	initialize();
	
	this.show = function(findingField) {
		if(_container) {
			var pos = jQuery(_container).position();
		}
		_dialog.show(pos.left, pos.top);
		if(findingField) {
			_findingField = findingField;
		}
	},
	
	this.hide = function() {
		_dialog.hide();
	},
	
	this.findingField = function(findingField) {
		_findingField = findingField;
	}
};

/**
 * Filter dialog for DBTable and DBTreeView control
 */
jslet.ui.FilterDialog = function (dataset, fields) {
	
};


