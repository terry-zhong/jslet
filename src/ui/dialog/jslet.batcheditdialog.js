/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

"use strict";
/**
 * A dialog for dataset batch editing.
 * <pre>
 * var dialog = new jslet.ui.BatchEditDialog(dataset, editFields); 
 * </pre>
 */
/**
 * @param {jslet.data.Dataset} dataset - The dataset which need to be modified in bulk.
 * @param {String[] | String} editFields - A String array or a string which separate by comma, to identify which fields will be modified in bulk.
 */
jslet.ui.BatchEditDialog = function(dataset, editFields) {
	jslet.Checker.test('BatchEditDialog#dataset', dataset).required();
	if(editFields && jslet.isString(editFields)) {
		editFields = editFields.split(',');
	}
	jslet.Checker.test('BatchEditDialog#editFields', editFields).isArray();
	dataset = jslet.data.getDataset(dataset);
	var Z = this;
	Z._dataset = dataset;
	Z._editFields = editFields;
	Z._onChanging = null;
	Z._batchDataset = jslet.data.createDataset(dataset.name() + '_batch' + jslet.nextId(), []);
	var fields = dataset.getEditableFields(), 
		fldName;
	if(editFields && editFields.length > 0) {
		for(var i = editFields.length - 1; i >= 0; i--) {
			fldName = editFields[i];
			if(fields.indexOf(fldName) < 0) {
				editFields.splice(i, 1);
			}
		}
		fields = editFields;
	}
	Z._batchDataset.addFieldFromDataset(dataset, fields);
	var fields = Z._batchDataset.getNormalFields(), fldObj;
	for(var i = 0, len = fields.length; i < len; i++) {
		fldObj = fields[i];
		fldObj.defaultValue(null);
		fldObj.defaultExpr(null);
		fldObj.required(false);
	}
};

jslet.ui.BatchEditDialog.prototype = {
	/**
	 * Changing event. Fired when modify then field's value.
	 * Event handler: 
	 * @param {String} fldName - The changing field name;
	 * @param {Object} theValue - The changing field value;
	 * 
	 * @return {Boolean} True - The terminal the default field changing action. False - Perform the default changing action.
	 * function(fldName, theValue) {
	 * 		return true; 
	 * }
	 */	
	onChanging: function(onChanging) {
		if(onChanging === undefined) {
			return this._onChanging;
		}
		this._onChanging = onChanging;
	},
	
	/**
	 * Show the batch edit dialog.
	 */
	show: function() {
		var Z = this;
		Z._batchDataset.dataList(null);
		
		var creating = false;
		if(!Z._dlgId) {
			Z._createDialog();
			creating = true;
		}
		var owin = jslet('#' + Z._dlgId);
		owin.showModal();
		owin.setZIndex(999);
	},
	
	_createDialog: function() {
		var opt = { type: 'window', caption: jslet.locale.BatchEditDialog.caption, isCenter: true, resizable: true, minimizable: false, maximizable: false, animation: 'fade', styleClass: 'jl-bedlg'};
		var owin = jslet.ui.createControl(opt);
		var html = [
		            '<div class="form-group form-group-sm">',
		            '<div class="jl-bedlg-fields" data-jslet="type:\'DBInspector\',dataset:\'', this._batchDataset.name(), 
		            '\'"></div></div>',

		            '<div class="form-group form-group-sm">',
		            '<div class="col-sm-6"><input id="jlOnlySelected" type="checkbox" aria-label="..."><label class="control-label" for="jlOnlySelected">',
		            jslet.locale.BatchEditDialog.onlySelected,
		            '</label></div>',
		            '<div class="col-sm-6"><input id="jlOnlyNull" type="checkbox" aria-label="..."><label class="control-label" for="jlOnlyNull">',
		            jslet.locale.BatchEditDialog.onlyNullValue,
		            '</label></div>',
		            '</div>',
					
					'<hr class="col-sm-11" />',
		            '<div class="form-group form-group-sm"><label class="control-label col-sm-7">&nbsp</label>',
		            '<div class="col-sm-5"><button id="jlbtnOk" class="btn btn-default btn-sm">',		            
		            jslet.locale.BatchEditDialog.ok,
		            '</button><button id="jlbtnCancel" class="btn btn-default btn-sm">',
		            jslet.locale.BatchEditDialog.cancel,
		            '</button></div></div>',
		            '</div>'];
		owin.setContent(html.join(''));
		owin.onClosed(function () {
			return 'hidden';
		});
		this._dlgId = owin.el.id;
		var jqEl = jQuery(owin.el), 
			Z = this;
		
		jqEl.find('#jlbtnOk').on('click', function(event) {
			var onlySelected = jqEl.find('#jlOnlySelected').prop('checked');
			var onlyNull = jqEl.find('#jlOnlyNull').prop('checked');
			if(Z._modifyData(onlySelected, onlyNull)) {
				owin.close();
			}
		});
		jqEl.find('#jlbtnCancel').on('click', function(event) {
			owin.close();
		});
		
		jslet.ui.install(owin.el);
	},
	
	_modifyData: function(onlySelected, onlyNull) {
		var Z = this,
			dsObj = Z._batchDataset;
		dsObj.confirm();
		if(dsObj.recordCount() === 0 || dsObj.existDatasetError()) {
			jslet.showInfo(jslet.locale.BatchEditDialog.errorData);
			return false;
		}
		
		dsObj.first();
		var fldNames = [], fldObj, fldValue, inputValue = {},
			allFldObjs = dsObj.getNormalFields();
		for(var i = 0, len = allFldObjs.length; i < len; i++) {
			fldObj = allFldObjs[i];
			fldValue = fldObj.getValue();
			if(fldValue !== null && fldValue !== undefined) {
				fldNames.push(fldObj.name());
				inputValue[fldObj.name()] = fldValue;
			} 
		}

		var cnt = fldNames.length, fldName;
		Z._dataset.iterate(function() {
			if(onlySelected && !this.selected()) {
				return;
			}
			for(var j = 0; j < cnt; j++) {
				fldName = fldNames[j];
				if(onlyNull) {
					fldValue = this.getFieldValue(fldName);
					if(fldValue !== null && fldValue !== '' && fldValue !== undefined) {
						continue;
					} 
				}
				if(Z._onChanging) {
					if(Z._onChanging.call(this, fldName, inputValue[fldName])) {
						continue;
					}
				}
				this.setFieldValue(fldName, inputValue[fldName]);
			}
			this.confirm();
		});
		return true;
	}
};

