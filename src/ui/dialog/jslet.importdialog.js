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
 * @param {Boolean} hasSchemaSection - Identify whether import schema section is visible or not. 
 */
jslet.ui.ImportDialog = function(dataset, hasSchemaSection) {
	this._dataset = jslet.data.getDataset(dataset);
	this._importDataset = null;
	
	this._parsedData = null;
	
	this._dlgId = null;
	
	this._onCustomImport = null;
	this._onImporting = null;
	this._onImported = null;
	
	this._hasSchemaSection = hasSchemaSection;
	
	this._onQuerySchema = null;
	this._onSubmitSchema = null;
	
	this._schemaDsName = null;
	this._schemaLkDsName = null;
	
	this._colHeaders = null;
	
	this._initialize();
};

jslet.ui.ImportDialog.prototype = {
	/**
	 * Show import dialog
	 */
	show: function() {
		var Z = this;
		if(Z._hasSchemaSection) {
			Z._querySchema();
		}
		Z._refreshFields();
		var jqEl = jQuery('#' + this._dlgId);
		jqEl.find('#jltxtImportFile').val('');
		var owin = jqEl[0].jslet;
		owin.showModal();
		owin.setZIndex(999);
		return owin;
	},

	/**
	 * Query import schema event handler. Pattern:
	 * 
	 * var importDialog = new jslet.ui.ImportDialog(importingDataset, true);
	 * var querySchemaFn = function(callBackFn) {
	 * 	  var importSchemaData = [{schema: '', fieldMaps: '[{"field": "", "colHeader": "", "fixedValue": ""}]];
	 * 	  callBackFn(importSchemaData); //For asynchronous operation.
	 * 	  //return importSchemaData; 	//For synchronous operation.
	 * };
	 * 
	 * importDialog.onQuerySchema(querySchemaFn);
	 */
	onQuerySchema: function(onQuerySchema) {
		if(onQuerySchema === undefined) {
			return this._onQuerySchema;
		}
		jslet.Checker.test('ImportDialog#onQuerySchema', onQuerySchema).isFunction();
		this._onQuerySchema = onQuerySchema;
	},	
	
	/**
	 * Submit export schema event handler. Pattern:
	 * 
	 * var importDialog = new jslet.ui.ImportDialog(importingDataset, true);
	 * var submitSchemaFn = function(action, changedRec) {
	 * 	  if(action == 'insert') {
	 * 		
	 * 	  }
	 * 	  if(action == 'update') {
	 * 		
	 * 	  }
	 * 	  if(action == 'delete') {
	 * 		
	 * 	  }
	 * };
	 * 
	 * importDialog.onSubmitSchema(submitSchemaFn);
	 */
	onSubmitSchema: function(onSubmitSchema) {
		if(onSubmitSchema === undefined) {
			return this._onSubmitSchema;
		}
		jslet.Checker.test('ImportDialog#onSubmitSchema', onSubmitSchema).isFunction();
		this._onSubmitSchema = onSubmitSchema;
	},
	
	/**
	 * Customized importing event handler. Pattern:
	 * 
	 * var onCustomImportFn = function(importingDataset, parsedData, fieldMaps) {
	 * 
	 * }
	 * importDialog.onCustomImport(onCustomImportFn);
	 */
	onCustomImport: function(onCustomImport) {
		if(onCustomImport === undefined) {
			return this._onCustomImport;
		}
		jslet.Checker.test('ImportDialog#onCustomImport', onCustomImport).isFunction();
		this._onCustomImport = onCustomImport;
	},
	
	/**
	 * Data Importing event handler. Pattern:
	 * 
	 * @param {String} fldName - Field name;
	 * @param {String} colText - Excel column value;
	 * var onImportingFn = function(fldMap.field, colText) {
	 * 
	 * }
	 * importDialog.onImporting(onImportingFn);
	 */
	onImporting: function(onImporting) {
		if(onImporting === undefined) {
			return this._onImporting;
		}
		jslet.Checker.test('ImportDialog#onImporting', onImporting).isFunction();
		this._onImporting = onImporting;
	},
	
	/**
	 * Imported event handler. Pattern:
	 * 
	 * var onImportedFn = function(importingDataset) {
	 * 
	 * }
	 * importDialog.onImported(onImportedFn);
	 */
	onImported: function(onImported) {
		if(onImported === undefined) {
			return this._onImported;
		}
		jslet.Checker.test('ImportDialog#onImported', onImported).isFunction();
		this._onImported = onImported;
	},
	
	_initialize: function() {
		var Z = this;
		var fldCfg = [
		              {name: 'schema', type: 'S', length: 100, label: 'Schema'},
		              {name: 'fieldMaps', type: 'S', length: 5000, label: 'fieldMaps', visible: false}
		              ];
		var schemaLKDs = jslet.data.createDataset('schemaLKDs' + jslet.nextId(), fldCfg, 
				{keyField: 'schema', codeField: 'schema', nameField: 'schema', autoRefreshHostDataset: true, auditLogEnabled: false, logChanges: false});
		
		this._schemaLkDsName = schemaLKDs.name();
		var fldCfg = [
		              {name: 'schema', type: 'S', length: 100, label: 'Schema', lookup: {dataset: schemaLKDs}}
		              ];		
		this._schemaDsName = 'schemaDs' + jslet.nextId();
		var schemaDs = jslet.data.createDataset(this._schemaDsName, fldCfg); 
		schemaDs.onFieldChanged(function(fldName, fldValue) {
			Z._doSchemaChanged(this, fldValue);
		});
		
		var fldCfg = [
		    	      {name: 'colNum', type: 'N', length: 10, label: 'Column Num.', visible: false}, 
		    	      {name: 'colHeader', type: 'S', length: 100, label: 'Column Header', displayWidth: 16}
		    	    ];
		var exportLKDs = jslet.data.createDataset('exportLKDs' + jslet.nextId(), fldCfg, 
				{keyField: 'colHeader', codeField: 'colHeader', nameField: 'colHeader', autoRefreshHostDataset: true});
		
		var expFldCfg = [
       	      {name: 'field', type: 'S', length: 100, label: 'Field Name', visible: false}, 
	   	      {name: 'label', type: 'S', length: 100, visible: false},
	   	      {name: 'displayLabel', type: 'S', length: 100, label: jslet.locale.ImportDialog.fieldLabel, displayWidth: 16, readOnly: true},
    	      {name: 'colNum', type: 'N', length: 10, label: 'colNum', visible: false}, 
	   	      {name: 'schemaColHeader', type: 'S', length: 100, visible: false},
    	      {name: 'colHeader', type: 'S', length: 100, label: jslet.locale.ImportDialog.columnHeader, displayWidth: 16, editControl: 'DBSelect',
    	    	  lookup: {dataset: exportLKDs, returnFieldMap: {colNum: 'colNum'}}},
    	      {name: 'required', type: 'B', length: 10, label: 'required', visible: false},
    	      {name: 'fixedValue', type: 'S', length: 50, label: jslet.locale.ImportDialog.fixedValue, displayWidth: 16}
    	    ];
    	this._importDataset = jslet.data.createDataset('importDs' + jslet.nextId(), expFldCfg, {keyField: 'schema', nameField: 'schema', isFireGlobalEvent: false});
		var opt = { type: 'window', caption: jslet.locale.ImportDialog.caption, isCenter: true, resizable: false, minimizable: false, maximizable: false, animation: 'fade'};
		var owin = jslet.ui.createControl(opt);
		var expHtml = '';
    	if(this._hasSchemaSection) {
    		expHtml = 
	            '<div class="input-group input-group-sm" style="margin-bottom: 10px"><span class="input-group-addon">' +
	            jslet.locale.ImportDialog.schemaName + 
	            '</span>' + 
	            '<select data-jslet="type:\'DBSelect\',dataset: \'' + schemaDs.name() + '\', field:\'schema\'"></select>' + 

	            '<span class="input-group-btn"><button class="btn btn-default btn-sm" id="jlbtnSaveAs">' + 
	            jslet.locale.ImportDialog.saveAsSchema + 
	            '</button></span>' +
	            '<span class="input-group-btn"><button class="btn btn-default btn-sm" id="jlbtnSave">' + 
	            jslet.locale.ImportDialog.saveSchema + 
	            '</button></span>' +
	            '<span class="input-group-btn"><button class="btn btn-default btn-sm" id="jlbtnDelete">' + 
	            jslet.locale.ImportDialog.deleteSchema + 
	            '</button></span>' +
	            '</div>';
    	}

		var html = ['<div class="form-horizontal jl-impdlg-content">',
		            expHtml,
		            '<div class="input-group input-group-sm"><span class="input-group-addon">',
		            jslet.locale.ImportDialog.fileName,
		            '</span>',
					'<input id="jltxtImportFile" title="*.xls|*.xlsx|*.xlsb|*.xlsm|*.ods" class="form-control" type="file"></input>',
					'</div>',
					
		            '<div class="col-sm-12 jl-impdlg-fieldmap" style="">',
		            '<div data-jslet="type:\'DBTable\', dataset: \'', 
		            this._importDataset.name(), 
		            '\', editable: true, hasFilterDialog:false, disableHeadSort: true"></div></div>',

		            '<div class="form-group form-group-sm" style="margin-bottom:0"><label class="control-label col-sm-6">&nbsp</label>',
		            '<div class="col-sm-6"><button id="jlbtnCancel" class="btn btn-default btn-sm jl-impdlg-toolbutton">',
		            jslet.locale.ImportDialog.cancel,
		            '</button><button id="jlbtnImport" class="btn btn-default btn-sm jl-impdlg-toolbutton">',
		            jslet.locale.ImportDialog.importData,
		            '</button></div></div>',
		            '</div>'];
		owin.setContent(html.join(''));
		var Z = this;
		owin.onClosed(function () {
			Z.destroy();
		});
		jslet.ui.install(owin.el);
		this._dlgId = owin.el.id;
		var jqEl = jQuery(owin.el);
		jqEl.find('#jlbtnSaveAs').click(function(event) {
			Z._saveAsSchema();
		});
		
		jqEl.find('#jlbtnSave').click(function(event) {
			Z._saveSchema();
		});
		
		jqEl.find('#jlbtnDelete').click(function(event) {
			Z._deleteSchema();
		});
		
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
	
	_querySchema: function() {
		var Z = this;
		var queryFn = this._onQuerySchema || jslet.global.importDialog.onQuerySchema;
		if(queryFn) {
			var queryData = queryFn(function(schemaData) {
				if(!schemaData) {
					return;
				}
				jslet.data.getDataset(Z._schemaLkDsName).dataList(schemaData);
			});
			if(queryData) {
				jslet.data.getDataset(Z._schemaLkDsName).dataList(queryData);
			}
		}
	},
	
	_submitSchema: function(action, changedRecord) {
		var Z = this;
		
		var actionFn = Z._onSubmitSchema || jslet.global.importDialog.onSubmitSchema;
		if(actionFn) {
			delete changedRecord['_jl_'];
			actionFn(action, changedRecord);
		}
	},
	
	_saveAsSchema: function() {
		var Z = this;
		var fieldMaps = Z._getFieldMaps();
		if(!fieldMaps) {
			return;
		}
		jslet.ui.MessageBox.prompt(jslet.locale.ExportDialog.inuputSchemaLabel, null, function(button, schemaName){
			if(button === 'ok' && schemaName) {
				var dsSchema = jslet.data.getDataset(Z._schemaDsName);
				var dsSchemaLk = jslet.data.getDataset(Z._schemaLkDsName);
				var context = dsSchemaLk.startSilenceMove();
				var foundRecno = -1;
				var breakDown = false;
				try {
					if(dsSchemaLk.findByKey(schemaName)) {
		            	foundRecno = dsSchemaLk.recno();
					}
				} finally {
					dsSchemaLk.endSilenceMove(context);
				}
				if(foundRecno >= 0) {
		            jslet.ui.MessageBox.confirm(jslet.locale.ImportDialog.existedSchema, null, function(button){
		            	if(button == 'cancel') {
		            		return;
		            	}
		            	dsSchemaLk.recno(foundRecno);
						dsSchemaLk.editRecord();
						dsSchemaLk.setFieldValue('schema', schemaName);
						var strMaps = JSON.stringify(fieldMaps);
						dsSchemaLk.setFieldValue('fieldMaps', strMaps);
						dsSchemaLk.confirm();
						Z._isSaving = true;
						try {
							dsSchema.setFieldValue('schema', schemaName);
						} finally {
							Z._isSaving = false;
						}
						Z._submitSchema('insert', dsSchemaLk.getRecord());
		            });
				} else {
					dsSchemaLk.appendRecord();
					dsSchemaLk.setFieldValue('schema', schemaName);
					var strMaps = JSON.stringify(fieldMaps);
					dsSchemaLk.setFieldValue('fieldMaps', strMaps);
					dsSchemaLk.confirm();
					Z._isSaving = true;
					try {
						dsSchema.setFieldValue('schema', schemaName);
					} finally {
						Z._isSaving = false;
					}
					Z._submitSchema('insert', dsSchemaLk.getRecord());
				}
			}
		});
	},
	
	_saveSchema: function() {
		var Z = this,
			dsSchemaLk = jslet.data.getDataset(Z._schemaLkDsName),
			dsSchema = jslet.data.getDataset(Z._schemaDsName);
		if(dsSchemaLk.recordCount() === 0 || !dsSchema.getFieldValue('schema')) {
			Z._saveAsSchema();
			return;
		}
		var fieldMaps = Z._getFieldMaps();
		if(!fieldMaps) {
			return;
		}
		dsSchemaLk.editRecord();
		var strMaps = JSON.stringify(fieldMaps);
		dsSchemaLk.setFieldValue('fieldMaps', fieldMaps);
		dsSchemaLk.confirm();
		Z._submitSchema('update', dsSchemaLk.getRecord());
	},
	
	_deleteSchema: function() {
		var Z = this,
			dsSchemaLk = jslet.data.getDataset(Z._schemaLkDsName),
			dsSchema = jslet.data.getDataset(Z._schemaDsName);
		if(dsSchemaLk.recordCount() === 0 || !dsSchema.getFieldValue('schema')) {
			return;
		}
		Z._submitSchema('delete', dsSchemaLk.getRecord());
		dsSchemaLk.deleteRecord();
		var dsSchema = jslet.data.getDataset(Z._schemaDsName);
		dsSchema.setFieldValue('schema', null);
		dsSchema.confirm();
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
		this._colHeaders = null;
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
				Z._colHeaders = parsedResult.header;
				Z._addColumnHeader(Z._colHeaders);
				Z._parsedData = parsedResult.data;
			} else {
				jslet.showError(jslet.locale.ImportDialog.noData);
			}
		};
		reader.readAsBinaryString(fileObj);
	},
	
	_addColumnHeader: function(headers) {
		if(!headers) {
			return;
		}
		var dataList = [], i, len;
		for(i = 0, len = headers.length; i < len; i++) {
			dataList.push({colNum: i, colHeader: headers[i]});
		}
		this._importDataset.getField('colHeader').lookup().dataset().dataList(dataList);
		this._mapFieldColumn();
	},
	
	_mapFieldColumn: function() {
		var headers = this._colHeaders;
		if(!headers) {
			return;
		}
		var dataList = this._importDataset.dataList(),
			label, rec, found = false;
		for(var i = 0, len = dataList.length; i < len; i++) {
			rec = dataList[i];
			if(!rec.fixedValue) {
				label = rec.schemaColHeader || rec.label;	
				if(headers.indexOf(label) >= 0) {
					rec.colHeader = label;
					found = true;
				} else {
					rec.colHeader = null;
				}
			} else {
				if(rec.colHeader) {
					rec.colHeader = null;
					found = true;
				}
			}
		}
		if(found) {
			this._importDataset.dataList(dataList);
		}
	},
	
	_doSchemaChanged: function(dsSchema, schemaName) {
		if(this._isSaving) {
			return;
		}
		var mapFlds = null,
			mapFldCnt = 0,
			dsSchemaLk = jslet.data.getDataset(this._schemaLkDsName);
		if(schemaName) {
			mapFlds = JSON.parse(dsSchema.getFieldValue('schema.fieldMaps'));
			mapFldCnt = mapFlds.length;
		}
		var dataList = this._importDataset.dataList();
		var rec, fldName, schColHeader, mapFld;
		for(var i = 0, len = dataList.length; i < len; i++) {
			rec = dataList[i];
			fldName = rec.field;
			rec.schemaColHeader = null;
			rec.fixedValue = null;
			schColHeader = null;
			if(mapFlds) {
				for(var j = 0; j < mapFldCnt; j++) {
					mapFld = mapFlds[j];
					if(mapFld.field == fldName) {
						rec.schemaColHeader = mapFld.colHeader;
						rec.fixedValue = mapFld.fixedValue;
						break;
					}
				}
			}
		}
		this._importDataset.dataList(dataList);
		this._mapFieldColumn();
	},
	
	_getFieldMaps: function() {
		var dataList = this._importDataset.dataList(), 
			row, fieldMaps = [];
		for(var i = 0, len = dataList.length; i< len; i++) {
			row = dataList[i];
			if(row.colHeader || row.fixedValue) {
				fieldMaps.push({field: row.field, colHeader: row.colHeader, fixedValue: row.fixedValue});
			} else if(row.required) {
				jslet.showInfo(jslet.locale.ImportDialog.noColHeader);
				return null;
			}
		}
		var fldCnt = fieldMaps.length;
		if(fldCnt === 0) {
			jslet.showInfo(jslet.locale.ImportDialog.noColHeader);
			return null;
		}
		return fieldMaps;
	},
	
	_importData: function() {
		var Z = this;
		if(!Z._parsedData || Z._parsedData.length === 0) {
			jslet.showInfo(jslet.locale.ImportDialog.noData);
			return false;
		}
		var fieldMaps = Z._getFieldMaps();
		if(!fieldMaps) {
			return false;
		}
		
		if(Z._onCustomImport) {
			var isSuccess = Z._onCustomImport(Z._dataset, Z._parsedData, fieldMaps);
			if(!isSuccess) {
				return false;
			}
		} else {
			var fldMap, text, colHeader,
				masterDs = Z._dataset, 
				parsedData = Z._parsedData,
				textList = [], textRec, row,
				importingFn = Z._onImporting;
			
			for(var i = 0, len = parsedData.length; i < len; i++) {
				row = parsedData[i];
				textRec = {};
				for(var j = 0; j < fldCnt; j++) {
					fldMap = fieldMaps[j];
					colHeader = fldMap.colHeader; 
					if(colHeader) {
						if(importingFn) {
							text = importingFn(fldMap.field, row[colHeader]);
						} else {
							text = row[colHeader];
						}
					} else {
						text = fldMap.fixedValue;
					}
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
		var Z = this;
		Z._onImporting = null;
		Z._onImported = null;
		Z._onCustomImport = null;
		
		Z._dataset = null;
		var dsSchemaLk = jslet.data.getDataset(Z._schemaLkDsName);
		if(dsSchemaLk) {
			dsSchemaLk.destroy();
		}
		var dsSchema = jslet.data.getDataset(Z._schemaDsName);
		if(dsSchema) {
			dsSchema.destroy();
		}
		if(Z._importDataset) {
    		var lkds = Z._importDataset.getField('colHeader').lookup().dataset();
    		lkds.destroy();
    		this._importDataset.destroy();
    		this._importDataset = null;
		}
	}
};


