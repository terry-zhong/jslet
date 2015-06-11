/* ========================================================================
 * Jslet framework: jslet.dbcustomcombobox.js
 *
 * Copyright (c) 2014 Jslet Group(https://github.com/jslet/jslet/)
 * Licensed under MIT (https://github.com/jslet/jslet/LICENSE.txt)
 * ======================================================================== */

/**
* @class DBCustomComboBox: used in jslet.ui.DBComboDlg and jslet.ui.DBDatePicker
*/
jslet.ui.DBCustomComboBox = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'dataset,field,textReadOnly';
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
	currRecno: function($super, currRecno) {
		var result = $super(currRecno);
		if(currRecno !== undefined) {
			this.textCtrl.currRecno(currRecno);
		}
		return result;
	},
	
	/**
	 * @override
	 */
	bind: function () {
		var Z = this;
		var jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('input-group')) {
			jqEl.addClass('input-group');
		}
		var btnCls = Z.comboButtonCls ? Z.comboButtonCls:'fa-caret-down'; 
		var s = '<input type="text" class="form-control">' + 
    	'<div class="jl-comb-btn-group"><button class="btn btn-default" tabindex="-1"><i class="fa ' + btnCls + '"></i></button></div>'; 
		jqEl.html(s);
		var dbtext = jqEl.find('[type="text"]')[0];
		Z.textCtrl = new jslet.ui.DBText(dbtext, {
			type: 'dbtext',
			dataset: Z._dataset,
			field: Z._textField || Z._field,
			enableInvalidTip: true,
			valueIndex: Z._valueIndex
		});
		jQuery(Z.textCtrl.el).on('keydown', this.popupUp);
		Z.addChildControl(Z.textCtrl);
		
		var dbbtn = jqEl.find('button')[0];
		if (this.buttonClick) {
			jQuery(dbbtn).on('click', function(event){
				Z.buttonClick(dbbtn);
			});
		}
	},

	/**
	 * @override
	 */
	renderAll: function () {
		this.refreshControl();
	},
	
	popupUp: function(event) {
		if(event.keyCode == jslet.ui.KeyCode.DOWN) {
			jslet(this).doBlur(event);
			var el = jslet.ui.findJsletParent(this.parentNode);
			el.jslet.buttonClick();
		}
	},
	
	focus: function() {
		this.textCtrl.focus();
	},
	
	/**
	 * @override
	 */
	forceRefreshControl: function(){
		this.textCtrl.forceRefreshControl();
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



