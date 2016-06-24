/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

"use strict";
/**
 * Import dialog for specified Dataset object;
 * 
 * @param {jslet.data.Dataset or String} dataset - Dataset object or dataset name.
 */
jslet.ui.ImportDialog = function(dataset) {
	this._dataset = jslet.data.getDataset(dataset);
	this._importDataset = null;
	
	this._parsedData = null;
	
	this._dlgId = null;
	
	this._onImporting = null;
	
	this._onImported = null;
	
	this._initialize();
};

jslet.ui.ImportDialog.prototype = {
	/**
	 * Show import dialog
	 */
	show: function() {
		var Z = this;
		Z._refreshFields();
		var jqEl = jQuery('#' + this._dlgId);
		jqEl.find('#jltxtImportFile').val('');
		var owin = jqEl[0].jslet;
		owin.showModal();
		owin.setZIndex(999);
		return owin;
	},
	
	onImporting: function(onImporting) {
		if(onImporting === undefined) {
			return this._onImporting;
		}
		jslet.Checker.test('ImportDialog#onImporting', onImporting).isFunction();
		this._onImporting = onImporting;
	},
	
	onImported: function(onImported) {
		if(onImported === undefined) {
			return this._onImported;
		}
		jslet.Checker.test('ImportDialog#onImported', onImported).isFunction();
		this._onImported = onImported;
	},
	
	_initialize: function() {
		var fldCfg = [
		    	      {name: 'colNum', type: 'N', length: 10, label: 'Column Num.', visible: false}, 
		    	      {name: 'colHeader', type: 'S', length: 100, label: 'Column Header', displayWidth: 16}
		    	    ];
		var exportLKDs = jslet.data.createDataset('exportLKDs' + jslet.nextId(), fldCfg, 
				{keyField: 'colHeader', codeField: 'colHeader', nameField: 'colHeader', autoRefreshHostDataset: true});
		
		var expFldCfg = [
       	      {name: 'field', type: 'S', length: 100, label: 'Field Name', visible: false}, 
	   	      {name: 'label', type: 'S', length: 100, visible: false},
	   	      {name: 'displayLabel', type: 'S', length: 100, label: jslet.locale.ImportDialog.fieldLabel, displayWidth: 20, readOnly: true},
    	      {name: 'colNum', type: 'N', length: 10, label: 'colNum', visible: false}, 
    	      {name: 'colHeader', type: 'S', length: 100, label: jslet.locale.ImportDialog.columnHeader, displayWidth: 20, editControl: 'DBSelect',
    	    	  lookup: {dataset: exportLKDs, returnFieldMap: {colNum: 'colNum'}}},
    	      {name: 'required', type: 'B', length: 10, label: 'required', visible: false}
    	    ];
    	this._importDataset = jslet.data.createDataset('importDs' + jslet.nextId(), expFldCfg, {keyField: 'schema', nameField: 'schema', isFireGlobalEvent: false});
		var opt = { type: 'window', caption: jslet.locale.ImportDialog.caption, isCenter: true, resizable: false, minimizable: false, maximizable: false, animation: 'fade'};
		var owin = jslet.ui.createControl(opt);
		var expHtml = '';
		var html = ['<div class="form-horizontal jl-impdlg-content">',
		            '<div class="input-group input-group-sm"><span class="input-group-addon">',
		            jslet.locale.ImportDialog.fileName,
		            '</span>',
					'<input id="jltxtImportFile" title="*.xls|*.xlsx|*.xlsb|*.xlsm|*.ods" class="form-control" type="file"></input>',
					'</div>',
		            '<div class="col-sm-12 jl-impdlg-fieldmap" style="">',
		            '<div data-jslet="type:\'DBTable\', dataset: \'', 
		            this._importDataset.name(), 
		            '\', editable: true, hasFilterDialog:false"></div></div>',

		            '<div class="form-group form-group-sm" style="margin-bottom:0"><label class="control-label col-sm-6">&nbsp</label>',
		            '<div class="col-sm-6"><button id="jlbtnCancel" class="btn btn-default btn-sm jl-impdlg-toolbutton">',
		            jslet.locale.ImportDialog.cancel,
		            '</button><button id="jlbtnImport" class="btn btn-default btn-sm jl-impdlg-toolbutton">',
		            jslet.locale.ImportDialog.importData,
		            '</button></div></div>',
		            '</div>'];
		owin.setContent(html.join(''));
		owin.onClosed(function () {
			return 'hidden';
		});
		var Z = this;
		jslet.ui.install(owin.el);
		this._dlgId = owin.el.id;
		var jqEl = jQuery(owin.el);
		jqEl.find('#jltxtImportFile').on('change', function(event) {
			var files = event.delegateTarget.files;
			if(files.length > 0) {
				Z._readFile(files[0]);
			}
		});
		jqEl.find('#jlbtnImport').click(function(event) {
			if(Z._importData()) {
				owin.close();
			}
		});
		
		jqEl.find('#jlbtnCancel').click(function(event) {
			owin.close();
		});
	},
	
	_refreshFields: function() {
		var dataList = [];
		var fields = this._dataset.getNormalFields(), fldObj, fldName, required, label;
		for(var i = 0, len = fields.length; i < len; i++) {
			fldObj = fields[i];
			fldName = fldObj.name();
			var detailDs = fldObj.detailDataset();
			if(!fldObj.visible()) {
				continue;
			}
			required = fldObj.required();
			label = fldObj.label();
			dataList.push({field: fldName, label: label, displayLabel: label + (required? '<span class="jl-lbl-required">*</span>': ''), required: required});
		}
		this._importDataset.dataList(dataList);
		this._importDataset.first();
	},

	_readFile: function(fileObj) {
		var Z = this,
			name = fileObj.name,
			suffix = name.substring(name.lastIndexOf('.') + 1) || '';
		suffix = suffix.toLowerCase();
		if(suffix != 'xls' && suffix != 'xlsx' && suffix != 'xlsb' && suffix != 'xlsm' && suffix != 'ods') {
			jslet.showError(jslet.locale.ImportDialog.notSupportFile);
			return;
		}
	    var	reader = new window.FileReader();
		reader.onload = function(e) {
			var fileContent = e.target.result,
				parsedResult = null;
			try {
				parsedResult = jslet.data.defaultXPorter.excelXPorter().importData(Z._dataset, fileContent);
			} catch(e) {
				console.error(e);
				jslet.showError(jslet.locale.ImportDialog.notSupportFile);
			}
			if(parsedResult) {
				Z._addColumnHeader(parsedResult.header);
				Z._parsedData = parsedResult.data;
			} else {
				jslet.showError(jslet.locale.ImportDialog.noData);
			}
		};
		reader.readAsBinaryString(fileObj);
	},
	
	_addColumnHeader: function(header) {
		if(!header) {
			return;
		}
		var dataList = [], i, len;
		for(i = 0, len = header.length; i < len; i++) {
			dataList.push({colNum: i, colHeader: header[i]});
		}
		this._importDataset.getField('colHeader').lookup().dataset().dataList(dataList);
		dataList = this._importDataset.dataList();
		var label, rec, found = false;
		for(i = 0, len = dataList.length; i < len; i++) {
			rec = dataList[i];
			label = rec.label;
			if(header.indexOf(label) >= 0) {
				rec.colHeader = label;
				found = true;
			}
		}
		if(found) {
			this._importDataset.dataList(dataList);
		}
	},
	
	_importData: function() {
		var Z = this,
			dataList = this._importDataset.dataList(), 
			row, i, len,
			fields = [];
		for(i = 0, len = dataList.length; i< len; i++) {
			row = dataList[i];
			if(row.colHeader) {
				fields.push(row);
			} else if(row.required) {
				jslet.showInfo(jslet.locale.ImportDialog.noColHeader);
				return false;
			}
		}
		var fldCnt = fields.length;
		if(fldCnt === 0) {
			jslet.showInfo(jslet.locale.ImportDialog.noColHeader);
			return false;
		}
		if(!Z._parsedData || Z._parsedData.length === 0) {
			jslet.showInfo(jslet.locale.ImportDialog.noData);
			return true;
		}
		
		if(Z._onImporting) {
			Z._onImporting(Z._dataset, Z._parsedData);
		} else {
			var fldMap, text,
				masterDs = Z._dataset, 
				parsedData = Z._parsedData,
				textList = [], textRec;
			len = parsedData.length;
			
			for(i = 0; i < len; i++) {
				row = parsedData[i];
				textRec = {};
				for(var j = 0; j < fldCnt; j++) {
					fldMap = fields[j];
					text = row[fldMap.colHeader];
					if(text) {
						textRec[fldMap.field] = text;
					}
				}
				textList.push(textRec);
			}
		Z._dataset.importTextList(textList);
		}
		
		if(Z._onImported) {
			Z._onImported.call(Z, Z._dataset);
		}
		return true;
	},
	
	destroy: function() {
		this._dataset = null;
		if(this._importDataset) {
    		var lkds = this._importDataset.getField('colHeader').lookup().dataset();
    		lkds.destroy();
    		this._importDataset.destroy();
    		this._importDataset = null;
		}
	}
};


