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
		var opt = { type: 'window', caption: jslet.formatString(jslet.locale.findDialog.caption, ['']), isCenter: false, resizable: true, minimizable: false, maximizable: false, 
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
				_dialog.changeCaption(jslet.formatString(jslet.locale.findDialog.caption, [fldObj.label()]));
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

/**
 * Export dialog;
 */
jslet.ui.ExportDialog = function(dataset, hasSchemaSection) {
	this._dataset = jslet.data.getDataset(dataset);
	this._exportDataset = null;
	this._hasSchemaSection = (hasSchemaSection === undefined || hasSchemaSection ? true: false);
	
	this._dlgId = null;
	
	this._initialize();
};

jslet.ui.ExportDialog.prototype = {
	_initialize: function() {
		var fldCfg = [
		    	      {name: 'field', type: 'S', length: 100, label: 'Field Name', nullText: 'default'}, 
		    	      {name: 'label', type: 'S', length: 50, label: 'Field Label'},
		    	      {name: 'parent', type: 'S', length: 100, label: 'Field Name'}, 
		    	    ];
		var exportLKDs = jslet.data.createDataset('exportLKDs' + jslet.nextId(), fldCfg, 
				{keyField: 'field', codeField: 'field', nameField: 'label', parentField: 'parent', isFireGlobalEvent: false});
		exportLKDs.onCheckSelectable(function(){
	        return !this.hasChildren(); 
	    });
		
		var expFldCfg = [
    	      //{name: 'schemaId', type: 'S', length: 30, label: 'Export Schema ID'}, 
    	      {name: 'schema', type: 'S', length: 30, label: 'Export Schema'}, 
    	      {name: 'fields', type: 'S', length: 500, label: 'Export Fields', visible: false, valueStyle: jslet.data.FieldValueStyle.MULTIPLE, lookup: {dataset: exportLKDs}}
    	    ];
    	this._exportDataset = jslet.data.createDataset('exportDs' + jslet.nextId(), expFldCfg, {keyField: 'schema', nameField: 'schema', isFireGlobalEvent: false});
    	if(this._hasSchemaSection) {
	    	var exportDsClone = this._exportDataset;
	    	var lkObj = new jslet.data.FieldLookup();
	    	lkObj.dataset(exportDsClone);
	    	this._exportDataset.getField('schema').lookup(lkObj);
    	}
		var opt = { type: 'window', caption: jslet.locale.ExportDialog.caption, isCenter: true, resizable: true, minimizable: false, maximizable: false, animation: 'fade'};
		var owin = jslet.ui.createControl(opt);
		var html = ['<div class="form-horizontal jl-expdlg-content" data-jslet="dataset: \'', this._exportDataset.name(),
		            '\'"><div class="form-group form-group-sm">',
		            '<div class="col-sm-6"><div data-jslet="type:\'DBComboSelect\',field:\'schema\'"></div></div>',
		            '<div class="col-sm-6"><button class="btn btn-default btn-sm" id="jlbtnSave">',
		            jslet.locale.ExportDialog.saveSchema,
		            '</button><button class="btn btn-default btn-sm">',
		            jslet.locale.ExportDialog.deleteSchema,
		            '</button></div></div>',
		            
		            '<div class="form-group form-group-sm">',
		            '<div class="col-sm-12 jl-expdlg-fields" data-jslet="type:\'DBList\',field:\'fields\',correlateCheck:true"></div></div>',

		            '<div class="form-group form-group-sm"><label class="control-label col-sm-3">',
		            jslet.locale.ExportDialog.fileName,
		            '</label>',
					'<div class="col-sm-9"><input id="jltxtExportFile" class="form-control" type="text"></input></div></div>',
		            '<div class="form-group form-group-sm"><label class="control-label col-sm-8">&nbsp</label>',
		            '<div class="col-sm-4"><button id="jlbtnExport" class="btn btn-default btn-sm">',
		            jslet.locale.ExportDialog.exportData,
		            '</button><button id="jlbtnCancel" class="btn btn-default btn-sm">',
		            jslet.locale.ExportDialog.cancel,
		            '</button></div></div>',
		            '</div>'];
		owin.setContent(html.join(''));
		owin.onClosed(function () {
			return 'hidden';
		});
		var Z = this;
		this._dlgId = owin.el.id;
		var jqEl = jQuery(owin.el);
		jqEl.find('#jlbtnExport').click(function(event) {
			var jqExpportFile = jqEl.find('#jltxtExportFile');
			var fileName = jqExpportFile.val();
			if(!fileName || !fileName.trim()) {
				jslet.showInfo('FileName required!');
				event.stopPropagation();
				event.preventDefault();
				return false;
			}
			var fields = Z._exportDataset.getFieldValue('fields');
			
			Z._dataset.exportCsvFile(fileName, {includeFields: fields});
			owin.close();
		});
		jqEl.find('#jlbtnSave').click(function(event) {
			jslet.ui.MessageBox.prompt('Please input exportting shema: ', 'Input Export Schema', function(button, value){
				if(button === 'ok' && value) {
					var fields = Z._exportDataset.getFieldValue('fields');
					Z._exportDataset.appendRecord();
					Z._exportDataset.setFieldValue('schema', value);
					Z._exportDataset.setFieldValue('fields', fields);
					Z._exportDataset.confirm();
				}
			});
		});
		
		jqEl.find('#jlbtnCancel').click(function(event) {
			owin.close();
		});
	},
	
	exportDataset: function(exportDs) {
		return this._exportDataset;
	},
	
	_refreshFields: function() {
		var dataList = [{field: '_all_', label: jslet.locale.ExportDialog.all}];
		var fieldNames = [];
		
		function addFields(dataList, fieldNames, fields, parentField, isDetailDs) {
			var fldObj, fldName;
			for(var i = 0, len = fields.length; i < len; i++) {
				fldObj = fields[i];
				fldName = fldObj.name();
				if(parentField && isDetailDs) {
					fldName = parentField + '.' + fldName;
				}
				var detailDs = fldObj.subDataset();
				if(detailDs) {
					dataList.push({field: fldName, label: fldObj.label(), parent: parentField || '_all_'});
					addFields(dataList, fieldNames, detailDs.getNormalFields(), fldName, true);
					continue;
				}
				if(!fldObj.visible()) {
					continue;
				}
				dataList.push({field: fldName, label: fldObj.label(), parent: parentField || '_all_'});
				var fldChildren = fldObj.children();
				if(fldChildren) {
					addFields(dataList, fieldNames, fldChildren, fldName);
				} else {
					fieldNames.push(fldName);
				}
			}
		}
		addFields(dataList, fieldNames, this._dataset.getFields());
		var exportLKDs = this._exportDataset.getField('fields').lookup().dataset();
		exportLKDs.dataList(dataList);
		this._exportDataset.setFieldValue('fields', fieldNames);
		exportLKDs.first();
	},

	show: function() {
		var Z = this;
		Z._refreshFields();
		var jqEl = jQuery('#' + this._dlgId);
		var owin = jqEl[0].jslet;
		var fileName = Z._dataset.description() + '.csv';
		var jqExpportFile = jqEl.find('#jltxtExportFile');
		jqExpportFile.val(fileName);
		owin.showModal();
		owin.setZIndex(999);
		return owin;
	}
};

jslet.ui.InputSettingDialog = function() {
	this._inputSettingDs = null;
	
	this._hostDataset = null;
	
	this._onClosed = null;
	
	this._onRestoreDefault = null;
	
	this._settings = null;
	var Z = this;
	
	function doProxyFieldChanged(dataRec, proxyFldName, proxyFldObj) {
		var hostFldObj = jslet.data.getDataset(dataRec.dataset).getField(proxyFldName);
		proxyFldObj.dataType(hostFldObj.dataType());
		proxyFldObj.length(hostFldObj.length());
		proxyFldObj.scale(hostFldObj.scale());
		proxyFldObj.editMask(hostFldObj.editMask());

		proxyFldObj.displayFormat(hostFldObj.displayFormat());
		proxyFldObj.dateFormat(hostFldObj.dateFormat());
		proxyFldObj.displayControl(hostFldObj.displayControl());
		proxyFldObj.validChars(hostFldObj.validChars());
		if(hostFldObj.lookup()) {
			var hostLkObj = hostFldObj.lookup();
			var lkObj = new jslet.data.FieldLookup();
			lkObj.dataset(hostLkObj.dataset());
			lkObj.keyField(hostLkObj.keyField());
			lkObj.codeField(hostLkObj.codeField());
			lkObj.nameField(hostLkObj.nameField());
			lkObj.displayFields(hostLkObj.displayFields());
			lkObj.parentField(hostLkObj.parentField());
			lkObj.onlyLeafLevel(false);
			proxyFldObj.lookup(lkObj);
			proxyFldObj.editControl('DBComboSelect');
		} else {
			proxyFldObj.lookup(null);
			var editorObj = hostFldObj.editControl();
			if(jslet.compareValue(editorObj.type,'DBTextArea') === 0) {
				editorObj = {type: 'DBText'};
			}
			proxyFldObj.editControl(editorObj);
		}
		proxyFldObj.valueStyle(jslet.data.FieldValueStyle.NORMAL);
	}

	function initialize() {
		var fldCfg = [{name: 'dataset', type: 'S', length: 30, visible: false},
		              {name: 'field', type: 'S', length: 30, displayWidth: 20, visible: false},
		              {name: 'label', type: 'S', label: jslet.locale.InputSettingDialog.labelLabel, length: 50, displayWidth: 20, disabled: true},
		              {name: 'parentField', type: 'S', length: 30, visible: false},
		              {name: 'tabIndex', type: 'N', label: 'tabIndex', length: 3, visible: false},
		              {name: 'defaultValue', type: 'P', label: jslet.locale.InputSettingDialog.labelDefaultValue, length: 200, displayWidth:30, proxyHostFieldName: 'field', proxyFieldChanged: doProxyFieldChanged},
		              {name: 'focused', type: 'B', label: jslet.locale.InputSettingDialog.labelFocused, displayWidth: 6},
		              {name: 'valueFollow', type: 'B', label: jslet.locale.InputSettingDialog.labelValueFollow, displayWidth: 6},
		              {name: 'isDatasetField', type: 'B', label: '', visible: false},
		              ];
		
		Z._inputSettingDs = jslet.data.createDataset('custDs' + jslet.nextId(), fldCfg, 
				{keyField: 'field', nameField: 'label', parentField: 'parentField', logChanges: false, indexFields: 'tabIndex', isFireGlobalEvent: false});
		
		var custContextFn = function(fldObj, changingFldName){
			var dataset = fldObj.dataset();
			fldObj.disabled(dataset.getFieldValue('isDatasetField'));
		};
		
		Z._inputSettingDs.contextRules([{"condition": "true", "rules": [
		     {"field": 'defaultValue', "customized": custContextFn},
		     {"field": 'focused', "customized": custContextFn},
		     {"field": 'valueFollow', "customized": custContextFn}
		]}]);
		Z._inputSettingDs.enableContextRule();
		Z._inputSettingDs.onFieldChanged(function(propName, propValue){
			if(Z._isInit) {
				return;
			}
			if(!Z._settings) {
				Z._settings = {};
			}
			var hostDsName = this.getFieldValue('dataset'),
				hostFldName = this.getFieldValue('field'),
				dsSetting = Z._settings[hostDsName];
			if(!dsSetting) {
				dsSetting = {};
				Z._settings[hostDsName] = dsSetting;
			}
			var fldSetting = dsSetting[hostFldName];
			if(!fldSetting) {
				fldSetting = {};
				dsSetting[hostFldName] = fldSetting; 
			}
			fldSetting[propName] = propValue;
		});
	}
	
	initialize.call(this);
};

jslet.ui.InputSettingDialog.prototype = {
		
	hostDataset: function(hostDataset) {
		if(hostDataset === undefined) {
			return this._hostDataset;
		}
		this._hostDataset = hostDataset;
	},
	
	onClosed: function(onClosedFn) {
		if(onClosedFn === undefined) {
			return this._onClosed;
		}
		this._onClosed = onClosedFn;
	},
	
	onRestoreDefault: function(onRestoreDefaultFn) {
		if(onRestoreDefaultFn === undefined) {
			return this._onRestoreDefault;
		}
		this._onRestoreDefault = onRestoreDefaultFn;
	},
	
	show: function(hostDataset) {
		jslet.Checker.test('InputSettingDialog.show#hostDataset', hostDataset).required();
		var Z = this;
		Z._hostDataset = hostDataset;
		Z._isInit = true;
		Z._settings = null;
		Z._inputSettingDs.disableControls();
		try {
			Z._initializeFields();
		} finally {
			Z._isInit = false;
			Z._inputSettingDs.first();
			Z._inputSettingDs.enableControls();
		}
		var creating = false;
		if(!Z._dlgId) {
			Z._createDialog();
			creating = true;
		}
		var tblFields = jQuery('#' + Z._dlgId).find('.jl-isdlg-fields')[0].jslet;
		tblFields.expandAll();
		if(creating) {
			tblFields.onRowClick(function() {
				if(this.dataset().getFieldValue('isDatasetField')) {
					this.toggle();
				}
			});
		}
		var owin = jslet('#' + Z._dlgId);
		owin.showModal();
		owin.setZIndex(999);
	},
	
	_initializeFields: function(hostDs, isKeepFields, parentField) {
		var Z = this,
			dataset = Z._inputSettingDs,
			fldObj;
		if(!hostDs) {
			hostDs = jslet.data.getDataset(Z._hostDataset);
		}
		var fields = hostDs.getNormalFields();
		if(!isKeepFields) {
			dataset.dataList(null);
		}
		var isDsFld;
		for(var i = 0, len = fields.length; i < len; i++) {
			fldObj = fields[i];
			isDsFld = fldObj.subDataset()? true: false;
			if(!isDsFld && !fldObj.visible()) {
				continue;
			}
			dataset.appendRecord();
			dataset.setFieldValue('isDatasetField', isDsFld);
			
			dataset.setFieldValue('dataset', hostDs.name());
			dataset.setFieldValue('field', fldObj.name());
			dataset.setFieldValue('label', fldObj.label());
			dataset.setFieldValue('tabIndex', fldObj.tabIndex());
			if(parentField) {
				dataset.setFieldValue('parentField', parentField);
			}
			if(!isDsFld) {
				dataset.setFieldValue('defaultValue', fldObj.defaultValue());
				dataset.setFieldValue('focused', fldObj.focused());
				dataset.setFieldValue('valueFollow', fldObj.valueFollow());
			}
			dataset.confirm();
			if(isDsFld) {
				this._initializeFields(fldObj.subDataset(), true, fldObj.name());
			}
		}
	},
	
	_createDialog: function() {
		var opt = { type: 'window', caption: jslet.locale.InputSettingDialog.caption, isCenter: true, resizable: true, minimizable: false, maximizable: false, animation: 'fade', styleClass: 'jl-isdlg'};
		var owin = jslet.ui.createControl(opt);
		var html = [
		            '<div class="form-group form-group-sm">',
		            '<div class="jl-isdlg-fields" data-jslet="type:\'DBTable\',dataset:\'', this._inputSettingDs.name(), 
		            '\',treeField:\'label\',readOnly:false,hasFilterDialog:false"></div></div>',

//		            '<div class="form-group form-group-sm">',
//		            '<div class="col-sm-3"><button id="jlbtnSave" class="btn btn-default btn-sm">',
//		            '<button id="jlbtnUp" class="btn btn-default btn-sm">', jslet.locale.InputSettingDialog.save, '</button>',
//		            '<button id="jlbtnDown" class="btn btn-default btn-sm">', jslet.locale.InputSettingDialog.save, '</button>',
//		            '</div>',
//		            '<label class="control-label col-sm-6">&nbsp</label>',
//		            '<div class="col-sm-3"><button id="jlbtnSave" class="btn btn-default btn-sm">',
		            
		            '<div class="form-group form-group-sm"><label class="control-label col-sm-9">&nbsp</label>',
		            '<div class="col-sm-3"><button id="jlbtnSave" class="btn btn-default btn-sm">',		            
		            jslet.locale.InputSettingDialog.save,
		            '</button><button id="jlbtnCancel" class="btn btn-default btn-sm">',
		            jslet.locale.InputSettingDialog.cancel,
		            '</button></div></div>',
		            '</div>'];
		owin.setContent(html.join(''));
		owin.onClosed(function () {
			return 'hidden';
		});
		this._dlgId = owin.el.id;
		var jqEl = jQuery(owin.el), 
			Z = this;
		
//		jqEl.find('#jlbtnUp').on('click', function(event) {
//			var dataset = Z._inputSettingDs;
//			if(dataset.recordCount() === 0) {
//				return;
//			}
//			var idx = dataset.getFieldValue('tabIndex');
//			if(!idx) {
//				idx = dataset.recno();
//			}
//			if(idx === 0) {
//				return;
//			}
//			var context = dataset.startSilenceMove();
//			try {
//				dataset.setFieldValue('tabIndex', idx - 1);
//				dataset.prior();
//				dataset.setFieldValue('tabIndex', idx);
//				dataset.confirm();
//			} finally {
//				dataset.endSilenceMove(context);
//			}
//			dataset.indexFields(dataset.indexFields());
//		});
		
		jqEl.find('#jlbtnSave').on('click', function(event) {
			if(Z._settings) {
				var hostDs, fldObj, fldSetting, propSetting;
				for(var dsName in Z._settings) {
					hostDs = jslet.data.getDataset(dsName);
					fldSetting = Z._settings[dsName]; 
					for(var fldName in fldSetting) {
						fldObj = hostDs.getField(fldName);
						propSetting = fldSetting[fldName];
						for(var propName in propSetting) {
							fldObj[propName](propSetting[propName]);
						}
					}
				}
				if(Z._onClosed) {
					Z._onClosed(Z._settings);
				}
			}
			owin.close();
		});
		jqEl.find('#jlbtnCancel').on('click', function(event) {
			owin.close();
		});
		
		jslet.ui.install(owin.el);
	}
};

jslet.ui.defaultInputSettingDialog = new jslet.ui.InputSettingDialog();
