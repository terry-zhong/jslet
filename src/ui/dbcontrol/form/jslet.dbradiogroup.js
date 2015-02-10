/* ========================================================================
 * Jslet framework: jslet.dbradiogroup.js
 *
 * Copyright (c) 2014 Jslet Group(https://github.com/jslet/jslet/)
 * Licensed under MIT (https://github.com/jslet/jslet/LICENSE.txt)
 * ======================================================================== */

/**
 * @class DBRadioGroup. 
 * Display a group of radio that user can select one option. Example:
 * <pre><code>
 * var jsletParam = {type:"DBRadioGroup",dataset:"employee",field:"department"};
 * 
 * //1. Declaring:
 * &lt;div data-jslet='type:"DBRadioGroup",dataset:"employee",field:"department"'' />
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
jslet.ui.DBRadioGroup = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'dataset,field,columnCount';
		/**
		 * {Integer} Column count
		 */
		Z._columnCount = 99999;
		Z._itemIds = null;
		$super(el, params);
	},

	columnCount: function(columnCount) {
		if(columnCount === undefined) {
			return this._columnCount;
		}
		jslet.Checker.test('DBRadioGroup.columnCount', columnCount).isGTEZero();
		this._columnCount = parseInt(columnCount);
	},
	
	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		var tagName = el.tagName.toLowerCase();
		return tagName == 'div';
	},

	/**
	 * @override
	 */
	bind: function () {
		this.renderAll();
		var jqEl = jQuery(this.el);
		jqEl.on('click', 'input[type="radio"]', function(event){
			event.delegateTarget.jslet.updateToDataset(this);
		});
		jqEl.addClass('form-control');//Bootstrap class
		jqEl.css('height', 'auto');
	},

	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName) {
		$super(metaName);
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if(!metaName || metaName == "disabled" || metaName == "readOnly") {
			var disabled = fldObj.disabled(),
				readOnly = fldObj.readOnly();
		
			Z.disabled = disabled || readOnly;
			disabled = Z.disabled;
			var radios = jQuery(Z.el).find('input[type="radio"]');
			for(var i = 0, cnt = radios.length; i < cnt; i++){
				jslet.ui.setEditableStyle(radios[i], disabled, readOnly);
			}
		}
		if(metaName == 'message') {
			Z.renderInvalid();
		}
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
		try {
			var value = Z._dataset.getFieldValue(Z._field),
				radios = jQuery(Z.el).find('input[type="radio"]'), 
				radio;
			for(var i = 0, cnt = radios.length; i < cnt; i++){
				radio = radios[i];
				radio.checked = (value == jQuery(radio.parentNode).attr('value'));
			}
		} catch (e) {
			jslet.showError(e);
		}
	},
	
	/**
	 * @override
	 */
	doLookupChanged: function () {
		var Z = this;
		var fldObj = Z._dataset.getField(Z._field), lkf = fldObj.lookup();
		if (!lkf) {
			jslet.showError(jslet.formatString(jslet.locale.Dataset.lookupNotFound,
					[fldObj.name()]));
			return;
		}
		var lkds = lkf.dataset();
		var oldRecno = lkds.recno();
		try {
			var template = ['<table cellpadding="0" cellspacing="0">'],
				isNewRow = false, 
				cnt = lkds.recordCount(),
				itemId;
			Z._itemIds = [];
			for (var k = 0; k < cnt; k++) {
				lkds.recnoSilence(k);
				isNewRow = (k % Z._columnCount === 0);
				if (isNewRow) {
					if (k > 0) {
						template.push('</tr>');
					}
					template.push('<tr>');
				}
				itemId = jslet.nextId();
				Z._itemIds.push(itemId);
				template.push('<td style="white-space: nowrap" value="');
				template.push(lkds.getFieldValue(lkf.keyField()));
				template.push('"><input name="');
				template.push(Z._field);
				template.push('" type="radio"  id="');
				template.push(itemId);
				template.push('" /><label for="');
				template.push(itemId);
				template.push('">');
				template.push(lkf.getCurrentDisplayValue());
				template.push('</label></td>');
			} // end while
			if (cnt > 0) {
				template.push('</tr>');
			}
			template.push('</table>');
			Z.el.innerHTML = template.join('');
		} finally {
			lkds.recnoSilence(oldRecno);
		}

	}, // end renderOptions

	updateToDataset: function(currCheckBox) {
		var Z = this;
		if (Z._keep_silence_ || Z.disabled) {
			return;
		}
		Z._keep_silence_ = true;
		try {
			Z._dataset.setFieldValue(Z._field, jQuery(currCheckBox.parentNode).attr('value'));
			currCheckBox.checked = true;
		} catch (e) {
			jslet.showError(e);
		} finally {
			Z._keep_silence_ = false;
		}
	},
	
	focus: function() {
		if (_itemIds && _itemIds.length > 0) {
			document.getElementById(_itemIds[0]).focus();
		}
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this, 
			jqEl = jQuery(Z.el);
		if(!jqEl.hasClass("jl-radiogroup")) {
			jqEl.addClass("jl-radiogroup");
		}
		Z.refreshControl(jslet.data.RefreshEvent.updateAllEvent(), true);
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var jqEl = jQuery(this.el);
		jqEl.off();
		$super();
	}
});

jslet.ui.register('DBRadioGroup', jslet.ui.DBRadioGroup);
jslet.ui.DBRadioGroup.htmlTemplate = '<div></div>';
