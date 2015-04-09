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
		Z.allProperties = 'dataset,field,beforeUpdateToDataset,enableInvalidTip,onKeyDown,autoSelectAll';

		/**
		 * @protected
		 */
		Z._beforeUpdateToDataset = null;
		Z._enableInvalidTip = true;
		
		Z._enterProcessed = false;
		
		Z._autoSelectAll = true;
		/**
		 * @private
		 */
		Z.oldValue = null;
		Z.editMask = null;
		Z._position;
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

	autoSelectAll: function(autoSelectAll) {
		if(autoSelectAll === undefined) {
			return this._autoSelectAll;
		}
		this._autoSelectAll = autoSelectAll? true: false;
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
		Z.doMetaChanged('required');
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
		if(Z._autoSelectAll) {
			jslet.ui.textutil.selectText(this);
		}
	},

	doBlur: function (event) {
		var Z = this.jslet,
			fldObj = Z._dataset.getField(Z._field);
		Z._position = jslet.ui.textutil.getCursorPos(Z.el);
		if (fldObj.readOnly() || fldObj.disabled()) {
			return;
		}
		var jqEl = jQuery(this);
		if(jqEl.attr('readOnly') || jqEl.attr('disabled')) {
			return;
		}

		Z.updateToDataset();
	},
	
	doKeydown: function(event) {
		event = jQuery.event.fix( event || window.event );
		var keyCode = event.which;
		//When press 'enter', write data to dataset.
		if(keyCode == 13) {
			var Z = this.jslet;
			Z._enterProcessed = true;
			Z.updateToDataset();
		}
	},

	doKeypress: function (event) {
		var Z = this.jslet,
			fldObj = Z._dataset.getField(Z._field);
		if (fldObj.readOnly() || fldObj.disabled()) {
			return;
		}
		event = jQuery.event.fix( event || window.event );
		var keyCode = event.which,
			existStr = jslet.getRemainingString(Z.el.value, jslet.ui.textutil.getSelectedText(Z.el)),
			cursorPos = jslet.ui.textutil.getCursorPos(Z.el);
		if (!Z._dataset.fieldValidator.checkInputChar(fldObj, String.fromCharCode(keyCode), existStr, cursorPos.begin)) {
			event.preventDefault();
		}
		//When press 'enter', write data to dataset.
		if(keyCode == 13) {
			if(!Z._enterProcessed) {
				Z.updateToDataset();
			} else {
				Z._enterProcessed = false;
			}
		}
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
	 * Input a text into text control at current cursor position.
	 * 
	 * @param {String} text the text need to be input.
	 */
	inputText: function(text) {
		if(!text) {
			return;
		}
		jslet.Checker.test('DBText.inputText#text', text).isString();
		
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if(fldObj.getType() !== jslet.data.DataType.STRING) {
			console.warn('Only String Field can be input!');
			return;
		}
		var ch, chs = [];
		for(var i = 0, len = text.length; i < len; i++) {
			ch = text[i];
			if (Z._dataset.fieldValidator.checkInputChar(fldObj, ch)) {
				chs.push(ch);
			}
		}
		if(!Z._position) {
			Z._position = jslet.ui.textutil.getCursorPos(Z.el);
		}
		var subStr = chs.join(''),
			value =Z.el.value,
			begin = Z._position.begin,
			end = Z._position.end;
		var prefix = value.substring(0, begin), 
			suffix = value.substring(end); 
		Z.el.value = prefix + text + suffix;
		Z._position = jslet.ui.textutil.getCursorPos(Z.el);		
		Z.updateToDataset();
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
		
		if(metaName && metaName == 'required') {
			var jqEl = jQuery(Z.el);
			if (fldObj.required()) {
				jqEl.addClass('jl-ctrl-required');
			} else {
				jqEl.removeClass('jl-ctrl-required');
			}
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
		if (Z.editMask){
			value = Z._dataset.getFieldValue(Z._field, Z._valueIndex);
			Z.editMask.setValue(value);
		} else {
			if (document.activeElement != Z.el || Z.el.readOnly) {
				value = Z._dataset.getFieldText(Z._field, false, Z._valueIndex);
			} else {
				value = Z._dataset.getFieldText(Z._field, true, Z._valueIndex);
			}
			if(fldObj.getType() === jslet.data.DataType.STRING && fldObj.antiXss()) {
				value = jslet.htmlDecode(value);
			}
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
		if(Z.oldValue == value) {
			return true;
		}
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
		Z.refreshControl(jslet.data.RefreshEvent.updateRecordEvent(Z._field));
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

