/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
* @class DBCustomComboBox: used in jslet.ui.DBComboDlg and jslet.ui.DBDatePicker
*/
"use strict";
jslet.ui.DBCustomComboBox = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,textReadOnly';
		Z._textReadOnly = false;
		Z.enableInvalidTip = false;

		$super(el, params);
	},

	textReadOnly: function(textReadOnly) {
		if(textReadOnly === undefined) {
			return this._textReadOnly;
		}
		this._textReadOnly = textReadOnly ? true: false;
	},
	
	/**
	 * @override
	 */
	afterBind: function ($super) {
		$super();
		
		if (this._textReadOnly) {
			this.el.childNodes[0].readOnly = true;
		}
	},

	/**
	 * @override
	 */
	bind: function () {
		var Z = this;
		var jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('input-group')) {
			jqEl.addClass('input-group input-group-sm');
		}
		var btnCls = Z.comboButtonCls ? Z.comboButtonCls:'fa-caret-down'; 
		var s = '<input type="text" class="form-control">' + 
    	'<span class="input-group-btn jl-comb-btn-group"><button class="btn btn-default btn-sm " tabindex="-1"><i class="fa ' + btnCls + '"></i></button></span>'; 
		jqEl.html(s);
		var dbtext = jqEl.find('[type="text"]')[0];
		Z.textCtrl = new jslet.ui.DBText(dbtext, {
			type: 'dbtext',
			dataset: Z._dataset,
			field: Z._textField || Z._field,
			enableInvalidTip: true,
			valueIndex: Z._valueIndex,
			tabIndex: Z._tabIndex
		});
		jQuery(dbtext).on('keydown', function(event) {
			var keyCode = event.which;
			if(keyCode === jslet.ui.KeyCode.BACKSPACE && !this.value) {
				Z.buttonClick();
			}
		});
		
		Z.addChildControl(Z.textCtrl);
		
		var jqBtn = jqEl.find('button');
		if (this.buttonClick) {
			
			jqBtn.on('click', function(event){
				Z.buttonClick(jqBtn[0]);
			});
			jqBtn.focus(function(event) {
				jslet.ui.focusManager.activeDataset(Z._dataset.name()).activeField(Z._field).activeValueIndex(Z._valueIndex);
			});
			jqBtn.blur(function(event) {
				jslet.ui.focusManager.activeDataset(null).activeField(null).activeValueIndex(null);
			});
			
		}
	},


	/**
	 * @override
	 */
	tableId: function ($super, tableId) {
		$super(tableId);
		this.textCtrl.tableId(tableId);
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		this.refreshControl();
	},
	
	/**
	 * @override
	 */
	innerFocus: function() {
		var Z = this;
		if(Z._textReadOnly) {
			jQuery(Z.el).find('button').focus();
		} else {
			Z.textCtrl.focus();
		}
	},
	
	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName){
		$super(metaName);
		var Z = this;
		if(!metaName || metaName == "disabled" || metaName == "readOnly") {
			var fldObj = Z._dataset.getField(Z._field),
				flag = fldObj.disabled() || fldObj.readOnly();
			var jqEl = jQuery(Z.el);
			jqEl.find('button').attr("disabled", flag);
		}
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this;
		var dbbtn = Z.el.childNodes[1];
		dbbtn.onclick = null;
		jQuery(Z.textCtrl.el).off('keydown', this.popupUp);
		Z.textCtrl.destroy();
		Z.textCtrl = null;
		$super();
	}
});



