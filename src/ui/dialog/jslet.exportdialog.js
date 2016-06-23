/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

"use strict";
/**
 * Export dialog;
 */
jslet.ui.ExportDialog = function(dataset, hasSchemaSection) {
	this._dataset = jslet.data.getDataset(dataset);
	this._exportDataset = null;
	this._hasSchemaSection = (hasSchemaSection ? true: false);
	this._dlgId = null;
	this._onExported = null;
	
	this._initialize();
};

jslet.ui.ExportDialog.prototype = {
	/**
	 * Show export dialog.
	 */	
	show: function(fileName) {
		var Z = this;
		Z._refreshFields();
		var jqEl = jQuery('#' + this._dlgId);
		var owin = jqEl[0].jslet;
		fileName = (fileName || Z._dataset.description()) + '.xlsx';
		var jqExpportFile = jqEl.find('#jltxtExportFile');
		jqExpportFile.val(fileName);
		owin.showModal();
		owin.setZIndex(999);
		return owin;
	},
	
	onExported: function(onExported) {
		if(onExported === undefined) {
			return this._onExported;
		}
		jslet.Checker.test('ExportDialog#onExported', onExported).isFunction();
		this._onExported = onExported;
	},
	
	_initialize: function() {
		var fldCfg = [
		    	      {name: 'field', type: 'S', length: 100, label: 'Field Name', nullText: 'default'}, 
		    	      {name: 'label', type: 'S', length: 50, label: 'Field Label'},
		    	      {name: 'parent', type: 'S', length: 100, label: 'Field Name'}, 
		    	      {name: 'required', type: 'B', length: 8, visible: false} 
		    	    ];
		var exportLKDs = jslet.data.createDataset('exportLKDs' + jslet.nextId(), fldCfg, 
				{keyField: 'field', codeField: 'field', nameField: 'label', parentField: 'parent', isFireGlobalEvent: false});
		exportLKDs.onCheckSelectable(function(){
	        return !this.hasChildren(); 
	    });
		
		var expFldCfg = [
    	      {name: 'schema', type: 'S', length: 30, label: 'Export Schema'}, 
    	      {name: 'fields', type: 'S', length: 500, label: 'Export Fields', visible: false, valueStyle: jslet.data.FieldValueStyle.MULTIPLE, lookup: {dataset: exportLKDs}}
    	    ];
		var Z = this;
    	Z._exportDataset = jslet.data.createDataset('exportDs' + jslet.nextId(), expFldCfg, {keyField: 'schema', nameField: 'schema', isFireGlobalEvent: false});
    	if(Z._hasSchemaSection) {
	    	var exportDsClone = Z._exportDataset;
	    	var lkObj = new jslet.data.FieldLookup();
	    	lkObj.dataset(exportDsClone);
	    	Z._exportDataset.getField('schema').lookup(lkObj);
			Z._exportDataset.onFieldChanged(function(fldName, fldValue) {
				if(fldName === 'schema' && !Z._isProgChanged) {
					this.cancel();
					this.findByKey(fldValue);
				}
			});
			Z._querySchema();
    	}
		var opt = { type: 'window', caption: jslet.locale.ExportDialog.caption, isCenter: true, resizable: false, minimizable: false, maximizable: false, animation: 'fade'};
		var owin = jslet.ui.createControl(opt);
		var expHtml = '';
    	if(Z._hasSchemaSection) {
    		expHtml = '<div class="form-group form-group-sm jl-exp-schema">' +
            '<div class="col-sm-6"><select data-jslet="type:\'DBSelect\',field:\'schema\'"></select></div>' + 
            '<div class="col-sm-6"><button class="btn btn-default btn-sm" id="jlbtnDelete" style="float:right">' + 
            jslet.locale.ExportDialog.deleteSchema + 
            '</button><button class="btn btn-default btn-sm" id="jlbtnSave" style="float:right">' + 
            jslet.locale.ExportDialog.saveSchema +
            '</button><button class="btn btn-default btn-sm" id="jlbtnSaveAs" style="float:right">' + 
            jslet.locale.ExportDialog.saveAsSchema +
            '</button></div></div>';
    	}
		var html = ['<div class="form-horizontal jl-expdlg-content" data-jslet="dataset: \'', Z._exportDataset.name(),
		            '\'">',
		            expHtml,
		            '<div class="form-group form-group-sm">',
		            '<div class="col-sm-12 jl-expdlg-fields" data-jslet="type:\'DBList\',field:\'fields\',correlateCheck:true"></div></div>',

		            '<div class="input-group input-group-sm"><span class="input-group-addon">',
		            jslet.locale.ExportDialog.fileName,
		            '</span>',
					'<input id="jltxtExportFile" class="form-control"></input>',
		            '<span class="input-group-addon"><input id="jlOnlySelected" type="checkbox" aria-label="...">',
		            '</span>',
		            '<label class="input-group-addon" for="jlOnlySelected">',
		            jslet.locale.ExportDialog.onlySelected,
		            '</label>',
					'</div>',

		            '<div class="form-group form-group-sm jl-expdlg-toolbar" style="margin-bottom:0"><label class="control-label col-sm-6">&nbsp</label>',
		            '<div class="col-sm-6"><button id="jlbtnCancel" class="btn btn-default btn-sm jl-expdlg-toolbutton">',
		            jslet.locale.ExportDialog.cancel,
		            '</button><button id="jlbtnExport" class="btn btn-default btn-sm jl-expdlg-toolbutton">',
		            jslet.locale.ExportDialog.exportData,
		            '</button></div></div>',
		            '</div>'];
		owin.setContent(html.join(''));
		owin.onClosed(function () {
			return 'hidden';
		});
		Z._dlgId = owin.el.id;
		jslet.ui.install(owin.el);
		var jqEl = jQuery(owin.el);
		jqEl.find('#jlbtnExport').click(function(event) {
			if(Z._exportData()) {
				owin.close();
			}
		});
		jqEl.find('#jlbtnSave').click(function(event) {
			Z._saveSchema();
		});
		
		jqEl.find('#jlbtnSaveAs').click(function(event) {
			Z._saveAsSchema();
		});
		
		jqEl.find('#jlbtnDelete').click(function(event) {
			Z._deleteSchema();
		});
		
		jqEl.find('#jlbtnCancel').click(function(event) {
			owin.close();
		});
	},
	
	_saveSchema: function(fileName) {
		this._exportDataset.confirm();
		this._submitSchema();
	},
	
	_saveAsSchema: function() {
		var Z = this;
		jslet.ui.MessageBox.prompt(jslet.locale.ExportDialog.inuputSchemaLabel, null, function(button, value){
			if(button === 'ok' && value) {
				var fields = Z._exportDataset.getFieldValue('fields');
				var dsObj = Z._exportDataset;
				dsObj.disableControls();
				Z._isProgChanged = true;
				try {
					dsObj.cancel();
					dsObj.appendRecord();
					dsObj.setFieldValue('schema', value);
					dsObj.setFieldValue('fields', fields);
					dsObj.confirm();
				} finally {
					Z._isProgChanged = false;
					dsObj.enableControls();
				}
				Z._submitSchema();
			}
		});
	},
	
	_deleteSchema: function() {
		var Z = this;
		Z._exportDataset.deleteRecord();
		Z._submitSchema();
	},	

	_querySchema: function() {
		var Z = this;
		if(jslet.global.queryExportSchema) {
	    	try {
	    		jslet.global.queryExportSchema(Z._exportDataset, Z._dataset);
			} catch (e) {
				//Do nothing
			}
		} else {
			console.warn('jslet.global.queryExportSchema NOT set, can not query export schema!');
		}
	},
	
	_submitSchema: function() {
		var Z = this;
		if(jslet.global.submitExportSchema) {
			jslet.global.submitExportSchema(Z._exportDataset, Z._dataset);
		} else {
			console.warn('jslet.global.exportSchemaSubmitUrl NOT set, can not save export schema!');
		}
	},
	
	_exportData: function() {
		var Z = this;
		var jqEl = jQuery('#' + Z._dlgId);
		var jqExpportFile = jqEl.find('#jltxtExportFile');
		var fileName = jqExpportFile.val();
		if(!fileName || !fileName.trim()) {
			jslet.showInfo(jslet.locale.ExportDialog.fileAndFieldsRequired);
			return false;
		}
		var fields = Z._exportDataset.getFieldValue('fields');
		if(!fields || fields.length === 0) {
			jslet.showInfo(jslet.locale.ExportDialog.fileAndFieldsRequired);
			return false;
		}
		var onlySelected = jqEl.find('#jlOnlySelected').prop('checked');
		jslet.data.defaultXPorter.excelXPorter().exportData(Z._dataset, fileName, 
				{includeFields: fields, onlySelected: onlySelected});
		if(Z._onExported) {
			Z._onExported.call(Z, Z._dataset);
		}
		return true;
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
				var detailDs = fldObj.detailDataset();
				if(detailDs) {
					dataList.push({field: fldName, label: fldObj.label(), parent: parentField || '_all_'});
					addFields(dataList, fieldNames, detailDs.getNormalFields(), fldName, true);
					continue;
				}
				if(!fldObj.visible()) {
					continue;
				}
				var required = fldObj.required();
				dataList.push({field: fldName, label: fldObj.label() + (required? '<span class="jl-lbl-required">*</span>': ''), 
					parent: parentField || '_all_', required: required});
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

	destroy: function() {
    	if(this._exportDataset) {
    		var lkds = this._exportDataset.getField('fields').lookup().dataset();
    		lkds.destroy();
    		this._exportDataset.destroy();
    		this._exportDataset = null;
    	}
    	this._dataset = null;
	}
};
