/* ========================================================================
 * Jslet framework: jslet.dbtext.js
 *
 * Copyright (c) 2014 Jslet Group(https://github.com/jslet/jslet/)
 * Licensed under MIT (https://github.com/jslet/jslet/LICENSE.txt)
 * ======================================================================== */

/**
 * @class DBText is a powerful control, it can input any data type, like:
 *		number, date etc. Example:
 * 
 * <pre><code>
 * var jsletParam = {type:&quot;DBText&quot;,field:&quot;name&quot;};
 * //1. Declaring:
 * &lt;input id=&quot;ctrlId&quot; type=&quot;text&quot; data-jslet='jsletParam' /&gt;
 * or
 * &lt;input id=&quot;ctrlId&quot; type=&quot;text&quot; data-jslet='{type:&quot;DBText&quot;,field:&quot;name&quot;}' /&gt;
 * 
 *  //2. Binding
 * &lt;input id=&quot;ctrlId&quot; type=&quot;text&quot; data-jslet='jsletParam' /&gt;
 * //Js snippet
 * var el = document.getElementById('ctrlId');
 * jslet.ui.bindControl(el, jsletParam);
 * 
 *  //3. Create dynamically
 * jslet.ui.createControl(jsletParam, document.body);
 *
 * </code></pre>
 */
jslet.ui.DBText = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'dataset,field,beforeUpdateToDataset,enableInvalidTip,onKeyDown';

		/**
		 * @protected
		 */
		Z._beforeUpdateToDataset = null;
		Z._enableInvalidTip = true;
		
		/**
		 * @private
		 */
		Z.oldValue = null;
		Z.editMask = null;
		$super(el, params);
	},

	beforeUpdateToDataset: function(beforeUpdateToDataset) {
		if(beforeUpdateToDataset === undefined) {
			return this._beforeUpdateToDataset;
		}
		jslet.Checker.test('DBText.beforeUpdateToDataset', beforeUpdateToDataset).isFunction();
		this._beforeUpdateToDataset = beforeUpdateToDataset;
	},

	enableInvalidTip: function(enableInvalidTip) {
		if(enableInvalidTip === undefined) {
			return this._enableInvalidTip;
		}
		this._enableInvalidTip = enableInvalidTip? true: false;
	},

	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return el.tagName.toLowerCase() == 'input' && 
				el.type.toLowerCase() == 'text';
	},

	/**
	 * @override
	 */
	bind: function () {
		var Z = this;
		Z.renderAll();
		var jqEl = jQuery(Z.el);
		jqEl.addClass('form-control');
		
		if (Z.doFocus) {
			jqEl.on('focus', Z.doFocus);
		}
		if (Z.doBlur) {
			jqEl.on('blur', Z.doBlur);
		}
		if (Z.doKeydown) {
			jqEl.on('keydown', Z.doKeydown);
		}
		if (Z.doKeypress) {
			jqEl.on('keypress', Z.doKeypress);
		}
		if (Z._enableInvalidTip && jslet.ui.globalTip) {
			jqEl.on('mouseover', Z.doMouseOver);
			jqEl.on('mouseout', Z.doMouseOut);
		}
	}, // end bind

	doFocus: function (event) {
		var Z = this.jslet;
		if (Z._skipFocusEvent) {
			return;
		}
		var fldObj = Z._dataset.getField(Z._field);
		if(!fldObj.message()) {
			Z.refreshControl(jslet.data.RefreshEvent.updateRecordEvent(Z._field));
		}
		jslet.ui.textutil.selectText(this);
	},

	doBlur: function (event) {
		var Z = this.jslet,
			fldObj = Z._dataset.getField(Z._field);
		if (fldObj.readOnly() || fldObj.disabled()) {
			return;
		}
		var jqEl = jQuery(this.el);
		if(jqEl.attr('readOnly') || jqEl.attr('disabled')) {
			return;
		}

		Z.updateToDataset();
		Z.refreshControl(jslet.data.RefreshEvent.updateRecordEvent(Z._field));
	},

	doKeydown: null,

	doKeypress: function (event) {
		var Z = this.jslet,
		fldObj = Z._dataset.getField(Z._field);
		if (fldObj.readOnly() || fldObj.disabled()) {
			return;
		}
		event = jQuery.event.fix( event || window.event );
		var keyCode = event.which;
		if (!Z._dataset.fieldValidator.checkInputChar(fldObj, String.fromCharCode(keyCode))) {
			event.preventDefault();
		}
		//When press 'enter', write data to dataset.
		if(keyCode == 13) {
			Z.updateToDataset();
			Z.refreshControl(jslet.data.RefreshEvent.updateRecordEvent(Z._field));
		}
	},

	doChange: function (event) {
		this.jslet.updateToDataset();
	},

	doMouseOver: function (event) {
		var Z = this.jslet,
			fldObj = Z._dataset.getField(Z._field),
			invalidMsg = fldObj.message();
		
		if (invalidMsg) {
			jslet.ui.globalTip.show(invalidMsg, event);
		}
	},

	doMouseOut: function (event) {
		jslet.ui.globalTip.hide();
	},

	focus: function() {
		var jqEl = jQuery(this.el);
		if(!jqEl.attr('disabled')) {
			this.el.focus();
		}
	},
	
	/**
	 * @override
	 */
	refreshControl: function ($super, evt, isForce) {
		if($super(evt, isForce) && this.afterRefreshControl) {
			this.afterRefreshControl(evt);
		}
	}, // end refreshControl

	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName){
		$super(metaName);
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if(!metaName || metaName == "disabled" || metaName == "readOnly") {
			jslet.ui.setEditableStyle(Z.el, fldObj.disabled(), fldObj.readOnly());
		}
		
		if(!metaName || metaName == 'editMask') {
			var editMaskCfg = fldObj.editMask();
			if (editMaskCfg) {
				if(!Z.editMask) {
					Z.editMask = new jslet.ui.EditMask();
					Z.editMask.attach(Z.el);
				}
				mask = editMaskCfg.mask;
				keepChar = editMaskCfg.keepChar;
				transform = editMaskCfg.transform;
				Z.editMask.setMask(mask, keepChar, transform);
			} else {
				if(Z.editMask) {
					Z.editMask.detach();
					Z.editMask = null;
				}
			}
		}
		
		if(metaName == 'message') {
			if(Z._enableInvalidTip) {
				Z.renderInvalid();
			}
		}
		Z.el.maxLength = fldObj.getEditLength();
	},
	
	/**
	 * @override
	 */
	doValueChanged: function() {
		var Z = this;
		if (Z._keep_silence_) {
			return;
		}
		var fldObj = Z._dataset.getField(Z._field);
		if(fldObj.message(Z._valueIndex)) { 
			return;
		}
		var align = fldObj.alignment();
	
		if (jslet.locale.isRtl){
			if (align == 'left') {
				align= 'right';
			} else {
				align = 'left';
			}
		}
		Z.el.style.textAlign = align;

		var value;
		if (document.activeElement != Z.el || Z.el.readOnly) {
			value = Z._dataset.getFieldText(Z._field, false, Z._valueIndex);
		} else {
			value = Z._dataset.getFieldText(Z._field, true, Z._valueIndex);
		}
		if (Z.editMask){
			Z.editMask.setValue(value);
		}else {
			Z.el.value = value;
		}
		Z.oldValue = Z.el.value;
	},

	/**
	 * @override
	 */
	renderAll: function () {
		this.refreshControl(jslet.data.RefreshEvent.updateAllEvent(), true);
	}, // end renderAll

	updateToDataset: function () {
		var Z = this;
		if (Z._keep_silence_) {
			return true;
		}
		var value = Z.el.value;
		Z._dataset.editRecord();
		if (this.editMask && !this.editMask.validateValue()) {
			return false;
		}
		if (Z._beforeUpdateToDataset) {
			if (!Z._beforeUpdateToDataset.call(Z)) {
				return false;
			}
		}

		Z._keep_silence_ = true;
		try {
			if (Z.editMask) {
				value = Z.editMask.getValue();
			}
			Z._dataset.setFieldText(Z._field, value, Z._valueIndex);
		} finally {
			Z._keep_silence_ = false;
		}
		return true;
	}, // end updateToDataset

	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this;
		jQuery(Z.el).off();
		if (Z.editMask){
			Z.editMask.detach();
			Z.editMask = null;
		}
		Z._beforeUpdateToDataset = null;
		Z.onKeyDown = null;
		$super();
	}
});
jslet.ui.register('DBText', jslet.ui.DBText);
jslet.ui.DBText.htmlTemplate = '<input type="text"></input>';

/**
 * DBPassword
 */
jslet.ui.DBPassword = jslet.Class.create(jslet.ui.DBText, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		$super(el, params);
	},

	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return el.tagName.toLowerCase() == 'input' &&
			el.type.toLowerCase() == 'password';
	}
});

jslet.ui.register('DBPassword', jslet.ui.DBPassword);
jslet.ui.DBPassword.htmlTemplate = '<input type="password"></input>';

/**
 * DBTextArea
 */
jslet.ui.DBTextArea = jslet.Class.create(jslet.ui.DBText, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		$super(el, params);
	},

	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return el.tagName.toLowerCase() == 'textarea';
	}
});

jslet.ui.register('DBTextArea', jslet.ui.DBTextArea);
jslet.ui.DBTextArea.htmlTemplate = '<textarea></textarea>';

