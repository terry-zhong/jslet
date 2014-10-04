/* ========================================================================
 * Jslet framework: jslet.dbcomboselect.js
 *
 * Copyright (c) 2014 Jslet Group(https://github.com/jslet/jslet/)
 * Licensed under MIT (https://github.com/jslet/jslet/LICENSE.txt)
 * ======================================================================== */

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
jslet.ui.DBComboSelect = jslet.Class.create(jslet.ui.DBCustomComboBox, {
	showStyles: ['auto', 'table', 'tree'],
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'dataset,field,popupHeight,popupWidth,showStyle,textReadOnly,afterSelect';
		
		/**
		 * {String} Optional value: auto, table, tree.
		 */
		Z._showStyle = 'auto';
		
		/**
		 * {Integer} Popup panel width
		 */
		Z._popupWidth = 0;

		/**
		 * {Integer} Popup panel height
		 */
		Z._popupHeight = 0;
		
		Z.contentPanel = null;
	
		$super(el, params);
	},

	popupHeight: function(popupHeight) {
		if(popupHeight === undefined) {
			return this._popupHeight;
		}
		jslet.Checker.test('DBComboSelect.popupHeight', popupHeight).isGTEZero();
		this._popupHeight = parseInt(popupHeight);
	},

	popupWidth: function(popupWidth) {
		if(popupWidth === undefined) {
			return this._popupWidth;
		}
		jslet.Checker.test('DBComboSelect.popupWidth', popupWidth).isGTEZero();
		this._popupWidth = parseInt(popupWidth);
	},
		
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
   
	afterSelect: function(afterSelect) {
		if(afterSelect === undefined) {
			return this._afterSelect;
		}
		jslet.Checker.test('DBComboSelect.afterSelect', afterSelect).isFunction();
		this._afterSelect = afterSelect;
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
		
		if (this.contentPanel) {
			this.contentPanel = null;
		}
	},

	buttonClick: function () {
		var Z = this, 
			el = Z.el, 
			fldObj = Z._dataset.getField(Z._field), 
			lkf = fldObj.lookup(),
			jqEl = jQuery(el);
		if (fldObj.readOnly() || fldObj.disabled()) {
			return;		
		}
		if (lkf === null && lkf === undefined) {
			jslet.showException(Z._field + ' is NOT a lookup field!');
			return;
		}
		var style = Z._showStyle;
		if (Z._showStyle == 'auto') {
			style = lkf.parentField() ? 'tree' : 'table';
		}
		if (!Z.contentPanel) {
			Z.contentPanel = new jslet.ui.DBComboSelectPanel(Z);
			Z.contentPanel.showStyle = style;
			Z.contentPanel.customButtonLabel = Z.customButtonLabel;
			Z.contentPanel.onCustomButtonClick = Z.onCustomButtonClick;
			if (Z._popupWidth) {
				Z.contentPanel.popupWidth = Z._popupWidth;
			}
			if (Z._popupHeight) {
				Z.contentPanel.popupHeight = Z._popupHeight;
			}
		}
		jslet.ui.PopupPanel.excludedElement = el;
		var r = jqEl.offset(), h = jqEl.outerHeight(), x = r.left, y = r.top + h;
		if (jslet.locale.isRtl){
			x = x + jqEl.outerWidth();
		}
		Z.contentPanel.showPopup(x, y, 0, h);
	},
	
	closePopup: function(){
		this.contentPanel = null;
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this;
		if (Z.contentPanel){
			Z.contentPanel.destroy();
			Z.contentPanel = null;
		}
		jslet.ui.PopupPanel.excludedElement = null;
		$super();
	}
});

jslet.ui.DBComboSelectPanel = function (jsletCombo) {
	var Z = this;

	Z.showStyle = 'auto';

	Z.customButtonLabel = null;
	Z.onCustomButtonClick = null;
	Z.template = '';
	Z.popupWidth = 300;
	Z.popupHeight = 300;

	var otree, otable, showType, valueSeperator = ',', lkf, lkds, self = this;
	Z.isMulti = false;
	Z.comboCfg = jsletCombo;

	Z.dataset = jsletCombo._dataset;
	Z.field = jsletCombo._field;
	Z.panel = null;
	Z.selFields = null;
	Z.txtValue = null;
	Z.lkDataset = null;
	Z.popup = new jslet.ui.PopupPanel();
	Z.popup.onHidePopup = function() {
		Z.comboCfg.focus();
	};
	
	Z.initialize = function() {
		//process variable
		var fldObj = Z.dataset.getField(Z.field),
			lkfld = fldObj.lookup(),
			lkds = lkfld.dataset();
		Z.lkDataset = lkds;
		Z.isMulti = fldObj.valueStyle() == jslet.data.FieldValueStyle.MULTIPLE;
	};
	Z.initialize();
	
	Z.create = function () {
		if (!Z.panel) {
			Z.panel = document.createElement('div');
		}

		//process variable
		var fldObj = Z.dataset.getField(Z.field),
			lkfld = fldObj.lookup(),
			pfld = lkfld.parentField(),
			showType = Z.showStyle.toLowerCase(),
			lkds = lkfld.dataset();

		var template = ['<div class="jl-combopnl-head row"><div class="col-xs-12"><label class="control-label">',
			jslet.locale.DBComboSelect.find,
			'</label><select class="form-control" style="display:inline;width:100px"></select><label class="control-label"> = </label><input class="form-control" type="text" size="20"  style="display:inline;width:100px"></input></div></div>',
			'<div class="jl-combopnl-content"></div>',
			'<div class="jl-combopnl-footer" style="display:none"><button class="jl-combopnl-footer-cancel btn btn-default" >',
			jslet.locale.MessageBox.cancel,
			'</button><button type="button" class="jl-combopnl-footer-ok btn btn-default" >',
			jslet.locale.MessageBox.ok,
			'</button></div>'];

		Z.panel.innerHTML = template.join('');
		var jqPanel = jQuery(Z.panel),
			jqPh = jqPanel.find('.jl-combopnl-head');
		Z.selFields = jqPh.find('select')[0];
		var arrFlds = lkds.getFields(), opt;
		for (var i = 0, cnt = arrFlds.length; i < cnt; i++) {
			fldObj = arrFlds[i];
			if (fldObj.visible()) {
				opt = document.createElement('option');
				opt.value = fldObj.name();
				opt.innerHTML = fldObj.label();
				Z.selFields.appendChild(opt);
			}
		}
		Z.txtValue = jqPh.find('input')[0];
		jQuery(Z.selFields).on('change', Z.doFieldChange);
		jQuery(Z.txtValue).on('keydown', Z.findData);
		Z.txtValue._jslet_lkds_name = Z.lkDataset.name();
		
		var jqContent = jqPanel.find('.jl-combopnl-content');
		if (Z.isMulti) {
			jqContent.addClass('jl-combopnl-content-nofooter').removeClass('jl-combopnl-content-nofooter');
			var pnlFoot = jqPanel.find('.jl-combopnl-footer')[0];
			pnlFoot.style.display = 'block';
			var jqFoot = jQuery(pnlFoot);
			jqFoot.find('.jl-combopnl-footer-cancel').click(function (event) {
				Z.closePopup();
				});
			jqFoot.find('.jl-combopnl-footer-ok').click(Z.confirmSelect);
		} else {
			jqContent.addClass('jl-combopnl-content-nofooter');
		}

		var contentPanel = jqContent[0];

		//create popup content
		if (showType == 'tree') {
			var treeparam = { 
				type: 'DBTreeView', 
				dataset: lkds, 
				readOnly: false, 
				displayFields: lkfld.displayFields(), 
				hasCheckBox: Z.isMulti
			};

			if (!Z.isMulti) {
				treeparam.onItemDblClick = Z.confirmSelect;
			}
			window.setTimeout(function(){
				Z.otree = jslet.ui.createControl(treeparam, contentPanel, '100%', '100%');
			}, 1);
		} else {
			var tableparam = { type: 'DBTable', dataset: lkds, readOnly: true, hasSelectCol: Z.isMulti, hasSeqCol: false };
			if (!Z.isMulti) {
				tableparam.onRowDblClick = Z.confirmSelect;
			}
			window.setTimeout(function(){
				Z.otable = jslet.ui.createControl(tableparam, contentPanel, '100%', '100%');
			}, 1);
		}
		return Z.panel;
	};

	Z.initSelected = function () {
		var fldValue = Z.dataset.getFieldValue(Z.field, Z._valueIndex), 
			lkds = Z.lkDataset;

		if (!Z.isMulti) {
			if (fldValue) {
				lkds.findByKey(fldValue);
			}
			return;
		}
		var fldObj = Z.dataset.getField(Z.field),
			lkfld = fldObj.lookup();
		lkds.selectAll(false);
		if(lkfld.onlyLeafLevel()) {
			lkds.onCheckSelectable(function(){
				return !this.hasChildren();
			});
		}
		if (fldValue) {
			var arrKeyValues = fldValue;
			if(!jslet.isArray(fldValue)) {
				arrKeyValues = fldValue.split(jslet.global.valueSeparator);
			}
			for (var i = 0, len = arrKeyValues.length; i < len; i++){
				lkds.selectByKeyValue(true, arrKeyValues[i]);
			}
		}
	};

	Z.doFieldChange = function () {
		var txt = jQuery(this.parentNode).find('input')[0];
		txt.value = '';
		txt.focus();
	};

	Z.findData = function (event) {
		event = jQuery.event.fix( event || window.event );
		if (event.which != 13) {//enter
			return;
		}
		var sel = jQuery(this.parentNode).find('select')[0], findFldName = sel.value, findValue = this.value;
		if (!findValue) {
			return;
		}
		var lkds = jslet.data.getDataset(this._jslet_lkds_name), fldObj = lkds.getField(findFldName);
		if (fldObj.getType() == jslet.data.DataType.STRING) {
			lkds.find('like([' + findFldName + '],"' + findValue + '%")');
		} else {
			lkds.findByField(findFldName, findValue);
		}
	};

	Z.confirmSelect = function () {
		var ojslet = self, 
			fldValue = self.dataset.getFieldValue(self.field, self._valueIndex),
			fldObj = self.dataset.getField(self.field),
			lkfld = fldObj.lookup(),
			isMulti = fldObj.valueStyle() == jslet.data.FieldValueStyle.MULTIPLE;

		if (self.isMulti) {
			fldValue = self.lkDataset.selectedKeyValues();
		} else {
			fldValue = self.lkDataset.keyValue();
		}

		if (fldValue) {
			self.dataset.setFieldValue(self.field, fldValue, self._valueIndex);
		}
		if (!self.isMulti && self.comboCfg._afterSelect) {
			self.comboCfg._afterSelect(self.dataset, self.lkDataset);
		}
		self.closePopup();
	};

	Z.showPopup = function (left, top, ajustX, ajustY) {
		Z.initSelected();
		if (!Z.panel) {
			Z.panel = Z.create();
		} else {
			var ojslet = Z.otree ? Z.otree : Z.otable;
			ojslet.dataset().addLinkedControl(ojslet);
			window.setTimeout(function(){
				ojslet.renderAll();
			}, 1);
		}
		Z.popup.setContent(Z.panel, '100%', '100%');
		Z.popup.show(left, top, Z.popupWidth, Z.popupHeight, ajustX, ajustY);
		jQuery(Z.panel).find(".jl-combopnl-head select").focus();
	};

	Z.closePopup = function () {
		var fldObj = Z.dataset.getField(Z.field),
			lkfld = fldObj.lookup();
		if(Z.isMulti && lkfld.onlyLeafLevel()) {
			Z.lkDataset.onCheckSelectable(null);
		}
		
		self.popup.hide();
		var ojslet = Z.otree ? Z.otree : Z.otable;
		ojslet.dataset().removeLinkedControl(ojslet);
	};
	
	Z.destroy = function(){
		if (Z.otree){
			Z.otree.destroy();
			Z.otree = null;
		}
		if (Z.otable){
			Z.otable.destroy();
			Z.otable = null;
		}
		var jqPanel = jQuery(Z.panel),
			jqFoot = jqPanel.find('.jl-combopnl-footer');
		jqFoot.find('.jl-combopnl-footer-cancel').off();
		jqFoot.find('.jl-combopnl-footer-ok').off();
		jQuery(Z.selFields).off();
		jQuery(Z.txtValue).off();
		
		Z.txtValue = null;
		Z.popup = null;
		Z.selFields = null;
		Z.panel = null;
		Z.popup = null;
	};
};

jslet.ui.register('DBComboSelect', jslet.ui.DBComboSelect);
jslet.ui.DBComboSelect.htmlTemplate = '<div></div>';
