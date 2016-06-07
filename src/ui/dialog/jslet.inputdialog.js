/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

"use strict";
/**
 * A dialog to configure input settings like 'defaultValue', 'valueFollowed', 'focused'.
 * It's used by ender user to configure their own preferences.
 * <pre>
 * jslet.ui.defaultInputSettingDialog.show(dataset); 
 * </pre>
 */
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
		              {name: 'label', type: 'S', label: jslet.locale.InputSettingDialog.labelLabel, length: 50, displayWidth: 15, disabled: true},
		              {name: 'parentField', type: 'S', length: 30, visible: false},
		              {name: 'tabIndex', type: 'N', label: 'tabIndex', length: 3, visible: false},
		              {name: 'focused', type: 'B', label: jslet.locale.InputSettingDialog.labelFocused, displayWidth: 6},
		              {name: 'valueFollow', type: 'B', label: jslet.locale.InputSettingDialog.labelValueFollow, displayWidth: 6},
		              {name: 'defaultValue', type: 'P', label: jslet.locale.InputSettingDialog.labelDefaultValue, length: 200, displayWidth:30, proxyHostFieldName: 'field', proxyFieldChanged: doProxyFieldChanged},
		              {name: 'isDatasetField', type: 'B', label: '', visible: false}
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
		var tableWidth = tblFields.getTotalWidth() + tblFields.getTotalWidth(true);
		if(creating) {
			tblFields.onRowClick(function() {
				if(this.dataset().getFieldValue('isDatasetField')) {
					this.toggle();
				}
			});
		}
		var owin = jslet('#' + Z._dlgId);
		owin.changeSize(tableWidth + 60);
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
