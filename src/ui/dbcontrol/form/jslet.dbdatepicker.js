/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * @class DBDatePicker. Example:
 * <pre><code>
 * var jsletParam = {type:"DBDatePicker",dataset:"employee",field:"birthday", textReadOnly:true};
 * 
 * //1. Declaring:
 * &lt;div data-jslet='type:"DBDatePicker",dataset:"employee",field:"birthday", textReadOnly:true' />
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
jslet.ui.DBDatePicker = jslet.Class.create(jslet.ui.DBCustomComboBox, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,field,textReadOnly,popupWidth, popupHeight';
		
		/**
		 * {Integer} Popup panel width
		 */
		Z._popupWidth = 260;

		/**
		 * {Integer} Popup panel height
		 */
		Z._popupHeight = 226;

		Z.popup = new jslet.ui.PopupPanel();
		
		Z.popup.onHidePopup = function() {
			Z.focus();
		};
		
		Z.comboButtonCls = 'fa-calendar';

		$super(el, params);
	},

	popupHeight: function(popupHeight) {
		if(popupHeight === undefined) {
			return this._popupHeight;
		}
		jslet.Checker.test('DBDatePicker.popupHeight', popupHeight).isGTEZero();
		this._popupHeight = parseInt(popupHeight);
	},

	popupWidth: function(popupWidth) {
		if(popupWidth === undefined) {
			return this._popupWidth;
		}
		jslet.Checker.test('DBDatePicker.popupWidth', popupWidth).isGTEZero();
		this._popupWidth = parseInt(popupWidth);
	},
		
	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return true;
	},

	buttonClick: function (btnEle) {
		var el = this.el, 
			Z = this, 
			fldObj = Z._dataset.getField(Z._field),
			jqEl = jQuery(el);
		if (fldObj.readOnly() || fldObj.disabled()) {
			return;
		}
		var width = Z._popupWidth,
			height = Z._popupHeight,
			dateValue = Z.getValue(),
			range = fldObj.dataRange(),
			minDate = null,
			maxDate = null;
		
		if (range){
			if (range.min) {
				minDate = range.min;
			}
			if (range.max) {
				maxDate = range.max;
			}
		}
		if (!Z.contentPanel) {
			Z.contentPanel = jslet.ui.createControl({ type: 'Calendar', value: dateValue, minDate: minDate, maxDate: maxDate,
				onDateSelected: function (date) {
					Z._dataset.setFieldValue(Z._field, new Date(date.getTime()), Z._valueIndex);
					Z.popup.hide();
					try {
						Z.el.focus();
					} catch(e) {
						//Ignore
					}
				}
			}, null, width + 'px', height + 'px', true); //Hide panel first
		}
		
		jslet.ui.PopupPanel.excludedElement = btnEle;//event.element();
		var r = jqEl.offset(), 
			h = jqEl.outerHeight(), 
			x = r.left, y = r.top + h;
		if (jslet.locale.isRtl){
			x = x + jqEl.outerWidth();
		}
		Z.popup.setContent(Z.contentPanel.el, '100%', '100%');
		Z.contentPanel.el.style.display = 'block';
		Z.contentPanel.setValue(dateValue);
		Z.popup.show(x, y, width + 3, height + 3, 0, h);
		Z.contentPanel.focus();
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this;
		if(Z.contentPanel) {
			Z.contentPanel.destroy();
			Z.contentPanel = null;
		}
		Z.popup.destroy();
		Z.popup = null;
		$super();
	}
	
});

jslet.ui.register('DBDatePicker', jslet.ui.DBDatePicker);
jslet.ui.DBDatePicker.htmlTemplate = '<div></div>';
