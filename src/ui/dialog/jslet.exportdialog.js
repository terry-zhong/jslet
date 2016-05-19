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
		var fileName = (fileName || Z._dataset.description()) + '.xlsx';
		var jqExpportFile = jqEl.find('#jltxtExportFile');
		jqExpportFile.val(fileName);
		owin.showModal();
		owin.setZIndex(999);
		return owin;
	},
	
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
		var expHtml = '';
    	if(this._hasSchemaSection) {
    		expHtml = '<div class="form-group form-group-sm jl-exp-schema">' +
            '<div class="col-sm-7"><div data-jslet="type:\'DBComboSelect\',field:\'schema\'"></div></div>' + 
            '<div class="col-sm-5"><button class="btn btn-default btn-sm" id="jlbtnSave" style="float:right">' + 
            jslet.locale.ExportDialog.deleteSchema + 
            '</button><button class="btn btn-default btn-sm" id="jlbtnDelete" style="float:right">' + 
            jslet.locale.ExportDialog.saveSchema +
            '</button></div></div>';
    	}
		var html = ['<div class="form-horizontal jl-expdlg-content" data-jslet="dataset: \'', this._exportDataset.name(),
		            '\'">',
		            expHtml,
		            '<div class="form-group form-group-sm">',
		            '<div class="col-sm-12 jl-expdlg-fields" data-jslet="type:\'DBList\',field:\'fields\',correlateCheck:true"></div></div>',

		            '<div class="form-group form-group-sm col-sm-12">',
					'<input id="jlOnlySelected" class="checkbox-inline" type="checkbox"></input>',
		            '<label class="control-label" for="jlOnlySelected">',
		            jslet.locale.ExportDialog.onlySelected,
		            '</label>',
					'</div>',

					'<div class="form-group form-group-sm col-sm-12"><label class="control-label jl-expdlg-filename">',
		            jslet.locale.ExportDialog.fileName,
		            '</label>',
					'<div class="col-sm-8"><input id="jltxtExportFile" class="form-control" type="text"></input></div>',
					'</div>',
		            '<div class="form-group form-group-sm" style="margin-bottom:0"><label class="control-label col-sm-6">&nbsp</label>',
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
		var Z = this;
		this._dlgId = owin.el.id;
		jslet.ui.install(owin.el);
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
			var onlySelected = jqEl.find('#jlOnlySelected').val();
			jslet.data.defaultXPorter.excelXPorter().exportData(Z._dataset, fileName, {includeFields: fields, onlySelected: onlySelected});
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
