/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

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
		if (!Z.comboButtonCls) {
			Z.comboButtonCls = 'jl-combodropdown';
		}
		if (!Z.comboButtonDisabledCls) {
			Z.comboButtonDisabledCls = 'jl-combodropdown-disabled';
		}
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
			this.buttonCtrl.currRecno(currRecno);
		}
		return result;
	},
	
	/**
	 * @override
	 */
	bind: function () {
		var Z = this;
		var jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-customcombo')) {
			jqEl.addClass('jl-customcombo');
		}

		Z.el.style.position = 'relative';

		var template = ['<div class="jl-combosel-text-host"><input type="text" class="jl-combosel-text jl-border-box" /></div>'];
		template.push('<div class="jl-combo-btn ');
		template.push(Z.comboButtonCls);
		template.push(' jl-unselectable" unselectable="on"/>');
		jqEl.html(template.join(''));

		var dbtext = jqEl.find('[type="text"]')[0];
		Z.textCtrl = new jslet.ui.DBText(dbtext, {
			type: 'dbtext',
			dataset: Z._dataset,
			field: Z._field,
			enableInvalidTip: true,
			valueIndex: Z._valueIndex
		});
		jQuery(Z.textCtrl.el).on('keydown', this.popupUp);
		
		var dbbtn = Z.el.childNodes[1];
		Z.buttonCtrl = new jslet.ui.DBComboButton(dbbtn, {
			dataset: Z._dataset,
			field: Z._field,
			buttonDisabledCls: Z.comboButtonDisabledCls
		});

		if (this.buttonClick) {
			jQuery(dbbtn).on('click', function(event){
				Z.buttonClick();
			});
		}
	},

	/**
	 * @override
	 */
	renderAll: function () {
		this.bind();
	},
	
	popupUp: function(event) {
		if(event.keyCode == jslet.ui.KeyCode.DOWN) {
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
	destroy: function($super){
		var Z = this;
		var dbbtn = Z.el.childNodes[1];
		dbbtn.onclick = null;
		jQuery(Z.textCtrl.el).off('keydown', this.popupUp);
		Z.textCtrl.destroy();
		Z.buttonCtrl.destroy();
		Z.textCtrl = null;
		Z.buttonCtrl = null;
		$super();
	}
});

/**
* DBComboButton: used in jslet.ui.DBCustomComboBox
*/
jslet.ui.DBComboButton = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		this.allProperties = 'dataset,field,buttonDisabledCls';

		this._buttonDisabledCls = null;
		
		$super(el, params);
	},

	buttonDisabledCls: function(buttonDisabledCls) {
		if(buttonDisabledCls === undefined) {
			return this._buttonDisabledCls;
		}
		buttonDisabledCls = jQuery.trim(buttonDisabledCls);
		jslet.Checker.test('DBComboButton.buttonDisabledCls', buttonDisabledCls).isString();
		this._buttonDisabledCls = buttonDisabledCls;
	},
	
	/**
	 * @override
	 */
	bind: function () {
		var fldObj = this._dataset.getField(this._field);
		if (fldObj.readOnly() || fldObj.disabled()) {
			jQuery(this.el).addClass(this._buttonDisabledCls);
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
			this.el.disabled = flag;
			if (flag) {
				jQuery(Z.el).addClass(Z._buttonDisabledCls);
			} else {
				jQuery(Z.el).removeClass(Z._buttonDisabledCls);
			}
		}
	},

	/**
	 * @override
	 */
	destroy: function($super){
		this._dataset = null;
		this._field = null;
		$super();
	}
});

