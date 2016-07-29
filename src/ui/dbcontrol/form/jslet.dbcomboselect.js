﻿/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBCombodlg. 
 * Show data on a popup panel, it can display tree style or table style. 
 * Example:
 * <pre><code>
 * var jsletParam = {type:"DBCombodlg",dataset:"employee",field:"department", textReadOnly:true};
 * 
 * //1. Declaring:
 * &lt;div data-jslet='type:"DBCombodlg",dataset:"employee",field:"department", textReadOnly:true' />
 * or
 * &lt;div data-jslet='jsletParam' />
 *  
 *  //2. Binding
 * &lt;div id="ctrlId"  />
 * //Js snippet
 * var el = document.getElementById('ctrlId');
 * jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 * jslet.ui.createControl(jsletParam, document.body);
 * 
 * </code></pre>
 */
"use strict";
jslet.ui.DBComboSelect = jslet.Class.create(jslet.ui.DBCustomComboBox, {
	showStyles: ['auto', 'table', 'tree'],
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,textField,searchField,popupHeight,popupWidth,showStyle,textReadOnly,onGetSearchField,correlateCheck,autoSelected';
		Z._textField = null;
		
		Z._showStyle = 'auto';
		
		Z._popupWidth = 300;

		Z._popupHeight = 300;
		
		Z._contentPanel = null;
		
		Z._pickupField = null;
		
		Z._onGetSearchField = null;
		
		Z._correlateCheck = false;
		
		Z._autoSelected = true;
		
		$super(el, params);
	},

	/**
	 * Get or set the field name of text box.
	 * 
	 * @param textField {String} Field name of text box.
	 * @return {String or this}
	 */
	textField: function(textField) {
		if(textField === undefined) {
			return this._textField;
		}
		jslet.Checker.test('DBComboSelect.textField', textField).required().isString();
		this._textField = textField.trim();
	},
	
	/**
	 * Get or set popup panel height.
	 * 
	 * @param popupHeight {Integer} Popup panel height.
	 * @return {Integer or this}
	 */
	popupHeight: function(popupHeight) {
		if(popupHeight === undefined) {
			return this._popupHeight;
		}
		jslet.Checker.test('DBComboSelect.popupHeight', popupHeight).isGTEZero();
		this._popupHeight = parseInt(popupHeight);
	},

	/**
	 * Get or set popup panel width.
	 * 
	 * @param popupHeight {Integer} Popup panel width.
	 * @return {Integer or this}
	 */
	popupWidth: function(popupWidth) {
		if(popupWidth === undefined) {
			return this._popupWidth;
		}
		jslet.Checker.test('DBComboSelect.popupWidth', popupWidth).isGTEZero();
		this._popupWidth = parseInt(popupWidth);
	},
		
	/**
	 * Get or set panel content style.
	 * 
	 * @param {String} Optional value: auto, table, tree.
	 * @return {String or this}
	 */
	showStyle: function(showStyle) {
		if(showStyle === undefined) {
			return this._showStyle;
		}
		showStyle = jQuery.trim(showStyle);
		var checker = jslet.Checker.test('DBComboSelect.showStyle', showStyle).isString();
		showStyle = showStyle.toLowerCase();
		checker.testValue(showStyle).inArray(this.showStyles);
		this._showStyle = showStyle;
	},
	
	/**
	 * Get or set onGetSearchField event handler.
	 * 
	 * @param {Function} Optional onGetSearchField event handler.
	 * @return {Function or this}
	 */
	onGetSearchField: function(onGetSearchField) {
		if(onGetSearchField === undefined) {
			return this._onGetSearchField;
		}
		this._onGetSearchField = onGetSearchField;
	},
	
	/**
	 * Identify if correlate check the tree nodes or not.
	 * 
	 * @param {Boolean} correlateCheck 
	 * @return {Boolean or this}
	 */
	correlateCheck: function(correlateCheck) {
		if(correlateCheck === undefined) {
			return this._correlateCheck;
		}
		this._correlateCheck = correlateCheck;
	},
	
	/**
	 * Automatically select the finding record when searching record.
	 * 
	 * @param {Boolean} autoSelected true - Automatically select record, false - otherwise.
	 * @return {Boolean or this}
	 */
	autoSelected: function(autoSelected) {
		if(autoSelected === undefined) {
			return this._autoSelected;
		}
		this._autoSelected = autoSelected;
	},
	
	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return true;
	},

	/**
	 * @override
	 */
	afterBind: function ($super) {
		$super();
		
		if (this._contentPanel) {
			this._contentPanel = null;
		}
	},

	buttonClick: function (btnEle) {
		var Z = this, 
			el = Z.el, 
			fldObj = Z._dataset.getField(Z._field), 
			lkf = fldObj.lookup(),
			jqEl = jQuery(el);
		if (fldObj.readOnly() || fldObj.disabled()) {
			return;		
		}
		if (lkf === null || lkf === undefined) {
			throw new Error(Z._field + ' is NOT a lookup field!');
		}
		var style = Z._showStyle;
		if (Z._showStyle == 'auto') {
			style = lkf.parentField() ? 'tree' : 'table';
		}
		if (!Z._contentPanel) {
			Z._contentPanel = new jslet.ui.DBComboSelectPanel(Z, btnEle);
			Z._contentPanel.showStyle = style;
			Z._contentPanel.customButtonLabel = Z.customButtonLabel;
			Z._contentPanel.onCustomButtonClick = Z.onCustomButtonClick;
			if (Z._popupWidth) {
				Z._contentPanel.popupWidth = Z._popupWidth;
			}
			if (Z._popupHeight) {
				Z._contentPanel.popupHeight = Z._popupHeight;
			}
		}
		var r = jqEl.offset(), 
			h = jqEl.outerHeight(), 
			x = r.left, y = r.top + h;
		if (jslet.locale.isRtl){
			x = x + jqEl.outerWidth();
		}
		Z._contentPanel.showPopup(x, y, 0, h);
	},
	
	closePopup: function(){
		if(this._contentPanel) {
			this._contentPanel.closePopup();
		}
		this._contentPanel = null;
	},
	
	/**
	 * @override
	 */
	doLookupChanged: function (isMetaChanged) {
		if(isMetaChanged) {
			this._destroyPopPanel();
		}
	},
	
	_destroyPopPanel: function() {
		var Z = this;
		if (Z._contentPanel){
			Z._contentPanel.destroy();
			Z._contentPanel = null;
		}
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		this._destroyPopPanel();
		$super();
	}
});

jslet.ui.DBComboSelectPanel = function (comboSelectObj, btnEle) {
	var Z = this;

	Z.showStyle = 'auto';

	Z.customButtonLabel = null;
	Z.onCustomButtonClick = null;
	Z.popupWidth = 350;
	Z.popupHeight = 350;
	Z._isShowing = false;
	
	var otree, otable, showType, valueSeperator = ',', lkf, lkds, self = this;
	Z.comboSelectObj = comboSelectObj;

	Z.dataset = comboSelectObj._dataset;
	Z.field = comboSelectObj._field;
	Z.fieldObject = Z.dataset.getField(Z.field);
	Z.panel = null;
	Z.searchBoxEle = null;
	Z._oldFilter = null;
	Z._oldFiltered = null;
	
	Z.popup = new jslet.ui.PopupPanel(btnEle);
	Z.popup.onHidePopup = function() {
		Z._isShowing = false;
		Z._restoreLkDsEvent();
		if(Z.comboSelectObj) {
			Z.comboSelectObj.focus();
		}
	};
	Z._confirmSelectDebounce = jslet.debounce(this._confirmSelect, 50);
};

jslet.ui.DBComboSelectPanel.prototype = {
		
	lookupDs: function() {
		return this.fieldObject.lookup().dataset();
	},
	
	isMultiple: function() {
		return this.fieldObject && this.fieldObject.valueStyle() === jslet.data.FieldValueStyle.MULTIPLE;
	},
		
	showPopup: function (left, top, ajustX, ajustY) {
		var Z = this;
		if(Z._isShowing) {
			return;
		}
		Z._initSelected();
		var showType = Z.showStyle.toLowerCase();
		if (!Z.panel) {
			Z.panel = Z._create();
		} else {
			var ojslet = Z.otree ? Z.otree : Z.otable;
			ojslet.dataset().addLinkedControl(ojslet);
			window.setTimeout(function(){
				ojslet.renderAll();
			}, 1);
		}
		if(showType == 'table') {
			var fields = Z.lookupDs().getNormalFields(),
				fldObj, totalChars = 0;
			for(var i = 0, len = fields.length; i < len; i++) {
				fldObj = fields[i];
				if(fldObj.visible()) {
					totalChars += fldObj.displayWidth();
				}
			}
			var totalWidth = totalChars * (jslet.global.defaultCharWidth || 12) + 40;
			Z.popupWidth = totalWidth;
			if(Z.popupWidth < 150) {
				Z.popupWidth = 150;
			}
			if(Z.popupWidth > 500) {
				Z.popupWidth = 500;
			}
		}
		Z._setLookupDsEvent();
		Z._isShowing = true;
		Z.popup.contentElement(Z.panel);
		Z.popup.show(left, top, Z.popupWidth, Z.popupHeight, ajustX, ajustY);
		Z._showTips(jslet.locale.DBComboSelect.find);
		Z._focus();
	},

	closePopup: function () {
		var Z = this;
		Z.popup.hide();
		var dispCtrl = Z.otree ? Z.otree : Z.otable;
		if(dispCtrl) {
			dispCtrl.dataset().removeLinkedControl(dispCtrl);
		}
	},
	
	_setLookupDsEvent: function() {
		var Z = this;
		
		var fldObj = Z.dataset.getField(Z.field),
			lkfld = fldObj.lookup();
		var lkDs = lkfld.dataset();
		var editFilter = lkfld.editFilter();
		if(editFilter) {
			var filter = lkDs.filter();
			Z._oldFilter = filter;
			Z._oldFiltered = lkDs.filtered();
			if(filter) {
				filter = '(' + editFilter + ') && (' + filter + ')';
			} else {
				filter = editFilter;
			}
			lkDs.filter(filter);
			lkDs.filtered(true);
			
		}
		if(Z.isMultiple()) {
			Z._oldLkDsCheckSelectable = null;
			if(lkfld.onlyLeafLevel()) {
				Z._oldLkDsCheckSelectable = lkDs.onCheckSelectable();
				lkDs.onCheckSelectable(function(){
					return !this.hasChildren();
				});
			}

			lkDs = Z.lookupDs();
			Z._oldLkDsListener = lkDs.datasetListener();
			lkDs.datasetListener(function(eventType) {
				if(Z._oldLkDsListener) {
					Z._oldLkDsListener.call(lkDs, eventType);
				}
				if(eventType === jslet.data.DatasetEvent.AFTERSELECT) {
					Z._confirmSelectDebounce.call(Z);
				}
			});
		}
		
	},
	
	_restoreLkDsEvent: function() {
		var Z = this;
		var fldObj = Z.dataset.getField(Z.field),
			lkfld = fldObj.lookup();
		var lkDs = lkfld.dataset();
		if(Z.isMultiple()) {
			lkDs.onCheckSelectable(Z._oldLkDsCheckSelectable? Z._oldLkDsCheckSelectable: null);
			lkDs.datasetListener(Z._oldLkDsListener? Z._oldLkDsListener: null);
		}
		if(Z._oldFiltered) {
			lkDs.filtered(Z._oldFiltered);
		}
		if(Z._oldFilter) {
			lkDs.filter(Z._oldFilter);
		} 
	},
	
	_create: function () {
		var Z = this;
		if (!Z.panel) {
			Z.panel = document.createElement('div');
			Z.panel.style.width = '100%';
			Z.panel.style.height = '100%';
		}

		//process variable
		var fldObj = Z.dataset.getField(Z.field),
			lkfld = fldObj.lookup(),
			pfld = lkfld.parentField(),
			showType = Z.showStyle.toLowerCase(),
			lkds = Z.lookupDs();

		var template = ['<div class="jl-combopnl-tip" style="display:none"></div>',
		                '<div class="jl-combopnl-head"><label class="col-xs-4"></label>',
		                '<div class="col-xs-8 input-group input-group-sm">',
		                '<input class="form-control" type="text" size="10"></input>',
		                '<span class="input-group-btn">',
		                '<button class="jl-combopnl-search btn btn-secondary" type="button"><i class="fa fa-search"></i></button>',
		                '<button class="jl-combopnl-closesearch btn btn-secondary" type="button"><i class="fa fa-times"></i></button>',
		                '</span>',
		                '</div></div>',
		                '<div class="jl-combopnl-content"></div>'];

		Z.panel.innerHTML = template.join('');
		var jqPanel = jQuery(Z.panel),
			jqPh = jqPanel.find('.jl-combopnl-head');
		jqPanel.on('keydown', function(event){
			var keyCode = event.which;
			if(keyCode === jslet.ui.KeyCode.ESCAPE) {
				Z.closePopup();
			}
			if(event.ctrlKey && keyCode === jslet.ui.KeyCode.F) {
				jqPanel.find('.jl-combopnl-head').slideDown();
				Z.searchBoxEle.focus();
				event.preventDefault();
	       		event.stopImmediatePropagation();
				return false;
			}
		});
		Z.searchBoxEle = jqPh.find('input')[0];
		jQuery(Z.searchBoxEle).on('keydown', jQuery.proxy(Z._findData, Z));
		
		jqPanel.find('.jl-combopnl-closesearch').click(function() {
			jqPanel.find('.jl-combopnl-head').slideUp();
			Z._focus();
		});
		var contentPanel = jqPanel.find('.jl-combopnl-content')[0];

		//create popup content
		if (showType == 'tree') {
			var treeParam = { 
				type: 'DBTreeView', 
				dataset: lkds, 
				readOnly: false, 
				displayFields: lkfld.displayFields(), 
				hasCheckBox: Z.isMultiple(),
				expandLevel:1
			};

			if (!Z.isMultiple()) {
				treeParam.onItemClick = jQuery.proxy(Z._confirmAndClose, Z);
			}
			treeParam.correlateCheck = Z.comboSelectObj.correlateCheck();
			window.setTimeout(function(){
				Z.otree = jslet.ui.createControl(treeParam, contentPanel, '100%', '100%');
			}, 1);
		} else {
			var tableParam = { type: 'DBTable', dataset: lkds, readOnly: true, hasSelectCol: Z.isMultiple(), hasSeqCol: false, 
					hasFindDialog: false, hasFilterDialog: false };
			if (!Z.isMultiple()) {
				tableParam.onRowClick = jQuery.proxy(Z._confirmAndClose, Z);
			}
			window.setTimeout(function(){
				Z.otable = jslet.ui.createControl(tableParam, contentPanel, '100%', '100%');
			}, 1);
		}
		return Z.panel;
	},

	_initSelected: function () {
		var Z = this;
		var fldValue = Z.comboSelectObj.getValue(), 
			lkds = Z.lookupDs();

		var fldObj = Z.dataset.getField(Z.field),
			lkfld = fldObj.lookup();

		if(lkfld.onlyLeafLevel()) {
			lkds.onCheckSelectable(function(){
				return !this.hasChildren();
			});
		}
		if (!Z.isMultiple()) {
			if (fldValue) {
				lkds.findByKey(fldValue);
			}
			return;
		}
		lkds.disableControls();
		try {
			lkds.selectAll(false);
			if (fldValue) {
				var arrKeyValues = fldValue;
				if(!jslet.isArray(fldValue)) {
					arrKeyValues = fldValue.split(jslet.global.valueSeparator);
				}
				for (var i = 0, len = arrKeyValues.length; i < len; i++){
					lkds.selectByKeyValue(true, arrKeyValues[i]);
				}
			}
		} finally {
			lkds.enableControls();
		}
	},

	_findData: function (event) {
		event = jQuery.event.fix( event || window.event );
		if (event.which != 13) {//enter
			return;
		}
		var Z = this;
		var findFldName = Z.comboSelectObj.searchField, 
			findingValue = this.searchBoxEle.value;
		if (!findingValue) {
			return;
		}
		var eventFunc = jslet.getFunction(Z.comboSelectObj.onGetSearchField);
		if (eventFunc) {
			findFldName = eventFunc.call(findingValue);
		}
		var findFldNames = null;
		var lkds = Z.lookupDs();
		if(!findFldName) {
			findFldNames = [];
			var fields = lkds.getNormalFields(), fldObj;
			for(var i = 0, len = fields.length; i < len; i++) {
				fldObj = fields[i];
				if(fldObj.visible()) {
					findFldNames.push(fldObj.name());
				}
			}
		} else {
			findFldNames = findFldName.split(',');
		}
		if(!findFldNames || findFldNames.length === 0) {
			console.warn('Search field NOT specified! Can\'t search data!');
			return;
		}
		var	currRecno = lkds.recno() + 1;
		var options = {startRecno: currRecno, findingByText: true, matchType: 'any'};
		var found = lkds.findByField(findFldNames, findingValue, options);
		if(!found) {
			options.startRecno = 0;
			found = lkds.findByField(findFldNames, findingValue, options);
		}
		if(found && found.isEqual && Z.comboSelectObj.autoSelected()) {
			lkds.select(true);
		}
		if(!found) {
			Z._showTips(jslet.locale.DBComboSelect.notFound);
		}
		event.currentTarget.focus();
		return;
		
	},

	_focus: function() {
		var Z = this;
		window.setTimeout(function(){
			var dbCtrl = Z.otable || Z.otree;
			if(dbCtrl) {
				dbCtrl.el.focus();
			}
		}, 10);
	},
	
	_showTips: function (tips) {
		var jqPanel = jQuery(this.panel);
		jqPanel.find('.jl-combopnl-tip').html(tips).slideDown();
		window.setTimeout(function() {
			jqPanel.find('.jl-combopnl-tip').slideUp();
		}, 1500);
	},
	
	_confirmSelect: function () {
		var Z = this;
		var fldValue = Z.comboSelectObj.getValue(),
			fldObj = Z.dataset.getField(Z.field),
			lkfld = fldObj.lookup(),
			isMulti = Z.isMultiple(),
			lookupDs = Z.lookupDs();
		
		if (isMulti) {
			fldValue = lookupDs.selectedKeyValues();
		} else {
			fldValue = lookupDs.keyValue();
		}

		Z.dataset.setFieldValue(Z.field, fldValue, Z._valueIndex);
		if (!isMulti && Z.comboSelectObj._afterSelect) {
			Z.comboSelectObj._afterSelect(Z.dataset, lookupDs);
		}
	},
	
	_confirmAndClose: function () {
		this._confirmSelect();
		this.closePopup();
	},

	destroy: function(){
		var Z = this;
		Z._restoreLkDsEvent();
		if (Z.otree){
			Z.otree.destroy();
			Z.otree = null;
		}
		if (Z.otable){
			Z.otable.destroy();
			Z.otable = null;
		}
		Z.comboSelectObj = null;
		
		jQuery(Z.searchBoxEle).off();
		Z.fieldObject = null;
		
		Z.searchBoxEle = null;
		Z.popup.destroy();
		Z.popup = null;
		Z.panel = null;
	}
};

jslet.ui.register('DBComboSelect', jslet.ui.DBComboSelect);
jslet.ui.DBComboSelect.htmlTemplate = '<div></div>';
