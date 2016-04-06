/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

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
"use strict";
jslet.ui.DBText = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,beforeUpdateToDataset,enableInvalidTip,onKeyDown,autoSelectAll';

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
			jqEl.on('focus', jQuery.proxy(Z.doFocus, Z));
		}
		if (Z.doBlur) {
			jqEl.on('blur', jQuery.proxy(Z.doBlur, Z));
		}
		if (Z.doKeydown) {
			jqEl.on('keydown', Z.doKeydown);
		}
		if (Z.doKeypress) {
			jqEl.on('keypress', Z.doKeypress);
		}
		Z.doMetaChanged('required');
	}, // end bind

	/**
	 * @override
	 */
	doFocus: function () {
		var Z = this;
		if (Z._skipFocusEvent) {
			return;
		}
		jslet.ui.focusManager.activeDataset(Z._dataset.name()).activeField(Z._field).activeValueIndex(Z._valueIndex);
		Z.doValueChanged();
		Z.oldValue = Z.el.value;
		if(Z._autoSelectAll) {
			jslet.ui.textutil.selectText(Z.el);
		}
	},

	/**
	 * @override
	 */
	doBlur: function () {
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		jslet.ui.focusManager.activeDataset(null).activeField(null).activeValueIndex(null);
		Z._position = jslet.ui.textutil.getCursorPos(Z.el);
		if (fldObj.readOnly() || fldObj.disabled()) {
			return;
		}
		var jqEl = jQuery(this);
		if(jqEl.attr('readOnly') || jqEl.attr('disabled')) {
			return;
		}
		Z.updateToDataset();
		Z._isBluring = true;
		try {
			Z.doValueChanged();
		} finally {
			Z._isBluring = false;
		}
	},
	
	/**
	 * @override
	 */
	doKeydown: function(event) {
		event = jQuery.event.fix( event || window.event );
		var keyCode = event.which;
		//When press 'enter', write data to dataset.
		var Z = this.jslet,
			K = jslet.ui.KeyCode;
		if(keyCode === K.ENTER) {
			Z._enterProcessed = true;
			Z.updateToDataset();
		}
		//Process 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown' key when it is editing. 
		var isEditing = Z._dataset.status() > 0;
		if(isEditing && (keyCode === K.UP || keyCode === K.DOWN || keyCode === K.PAGEUP || keyCode === K.PAGEDOWN)) {
			Z._enterProcessed = true;
			Z.updateToDataset();
		}
		var fldObj = Z._dataset.getField(Z._field);
		if (!fldObj.readOnly() && !fldObj.disabled() && (keyCode === K.BACKSPACE || keyCode === K.DELETE)) {
			Z._dataset.editRecord();
		}
		if(keyCode === K.LEFT || keyCode === K.RIGHT) { //Arrow-left, Arrow-right
			var pos = jslet.ui.textutil.getCursorPos(Z.el);
			if((keyCode === K.LEFT && pos.begin > 0) || 
					(keyCode === 39 && pos.begin < Z.el.value.length)) {
	       		event.stopImmediatePropagation();
			}
		}
	},

	/**
	 * @override
	 */
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
		if (!Z._dataset.fieldValidator().checkInputChar(fldObj, String.fromCharCode(keyCode), existStr, cursorPos.begin)) {
			event.preventDefault();
			return false;
		}
		Z._dataset.editRecord();
		//When press 'enter', write data to dataset.
		if(keyCode === jslet.ui.KeyCode.ENTER) {
			if(!Z._enterProcessed) {
				Z.updateToDataset();
			} else {
				Z._enterProcessed = false;
			}
		}
	},

	/**
	 * Select text.
	 * 
	 * @param {Integer} start (Optional) start of cursor position
	 * @param {Integer} end (Optional) end of cursor position
	 */
	selectText: function(start, end){
		jslet.ui.textutil.selectText(this.el, start, end);
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
			if (Z._dataset.fieldValidator().checkInputChar(fldObj, ch)) {
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
	}, 

	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName){
		$super(metaName);
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if(!metaName || metaName == "disabled" || metaName == "readOnly") {
			jslet.ui.setEditableStyle(Z.el, fldObj.disabled(), fldObj.readOnly(), false, fldObj.required());
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
				var mask = editMaskCfg.mask,
					keepChar = editMaskCfg.keepChar,
					transform = editMaskCfg.transform;
				Z.editMask.setMask(mask, keepChar, transform);
			} else {
				if(Z.editMask) {
					Z.editMask.detach();
					Z.editMask = null;
				}
			}
		}
		
		if(!metaName || metaName == 'tabIndex') {
			Z.setTabIndex();
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
		var errObj = Z.getFieldError();
		if(errObj && errObj.message) {
			Z.el.value = errObj.inputText || '';
			Z.renderInvalid(errObj);
			return;
		} else {
			Z.renderInvalid(null);
		}
		var fldObj = Z._dataset.getField(Z._field);
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
			value = Z.getText();
			Z.editMask.setValue(value);
		} else {
			if (document.activeElement != Z.el || Z.el.readOnly || Z._isBluring) {
				value = Z.getText(false);
			} else {
				value = Z.getText(true);
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

