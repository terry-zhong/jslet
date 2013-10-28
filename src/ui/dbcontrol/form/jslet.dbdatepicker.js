/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBDatePicker. Example:
 * <pre><code>
 * 		var jsletParam = {type:"DBDatePicker",dataset:"employee",field:"birthday", textReadOnly:true};
 * 
 * //1. Declaring:
 *      &lt;div data-jslet='type:"DBDatePicker",dataset:"employee",field:"birthday", textReadOnly:true' />
 *      or
 *      &lt;div data-jslet='jsletParam' />
 *      
 *  //2. Binding
 *      &lt;div id="ctrlId"  />
 *  	//Js snippet
 * 		var el = document.getElementById('ctrlId');
 *  	jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *  	jslet.ui.createControl(jsletParam, document.body);
 *  	
 * </code></pre>
 */
jslet.ui.DBDatePicker = jslet.Class.create(jslet.ui.DBCustomComboBox, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        var Z = this;
        if (!Z.allProperties) {
            Z.allProperties = 'dataset,field,textReadOnly,popupWidth, popupHeight,minDate,maxDate';
        }
        if (!Z.requiredProperties) {
            Z.requiredProperties = 'field';
        }
        Z.dataset;
        Z.field;
        /**
         * {Boolean} Idenfity if user can input value with keyboard.
         */
        Z.textReadOnly;
        
        /**
         * {Integer} Popup panel width
         */
        Z.popupWidth;

        /**
         * {Integer} Popup panel height
         */
        Z.popupHeight;

        /**
         * {Date} minDate Minimized date of calendar range 
         */
        Z.minDate = null;

        /**
         * {Date} maxDate Maximized date of calendar range 
         */
        Z.maxDate = null;

        Z.popup = new jslet.ui.PopupPanel();
        
        Z.popup.onHidePopup = function() {
        	Z.focus();
        }
        
        Z.comboButtonCls = 'jl-datepick-btn';
        Z.comboButtonDisabledCls = 'jl-datepick-btn-disabled';

        $super(el, params);
    },

	/**
	 * @override
	 */
    isValidTemplateTag: function (el) {
        return true;
    },

    buttonClick: function () {
        var el = this.el, 
        	Z = this, 
        	fldObj = Z.dataset.getField(Z.field),
        	jqEl = jQuery(el);
        if (fldObj.readOnly() || !fldObj.enabled()) {
        	return;
        }
        var width = Z.popupWidth ? parseInt(Z.popupWidth) : 260,
        	height = Z.popupHeight ? parseInt(Z.popupHeight) : 226,
        	dateValue = Z.dataset.getFieldValue(Z.field, Z.valueIndex),
        	range = fldObj.range();
        if (range){
        	if (range.min) {
        		Z.minDate = range.min;
        	}
        	if (range.max) {
        		Z.maxDate = range.max;
        	}
        }
        if (!Z.contentPanel)
            Z.contentPanel = jslet.ui.createControl({ type: 'Calendar', value: dateValue, minDate: Z.minDate, maxDate: Z.maxDate,
                onDateSelected: function (date) {
                    Z.popup.hide();
                    Z.el.focus();
                    var value = Z.dataset.getFieldValue(Z.field, Z.valueIndex);
                    if(!value) {
                    	value = date;
                    } else {
                    	value.setFullYear(date.getFullYear());
                    	value.setMonth(date.getMonth());
                    	value.setDate(date.getDate());
                    }
                    Z.dataset.setFieldValue(Z.field, value, Z.valueIndex);
                }
            }, null, width + 'px', height + 'px');

        jslet.ui.PopupPanel.excludedElement = el;//event.element();
        var r = jqEl.offset(), 
        	h = jqEl.outerHeight(), 
        	x = r.left, y = r.top + h;
		if (jslet.locale.isRtl){
			x = x + jqEl.outerWidth() - width;
		}
        Z.popup.setContent(Z.contentPanel.el, '100%', '100%');

        Z.contentPanel.setValue(dateValue);
        Z.popup.show(x, y, width + 3, height + 3, 0, h);
    },
    
	/**
	 * @override
	 */
    destroy: function($super){
    	var Z = this;
    	Z.contentPanel.destroy();
    	Z.contentPanel = null;
    	Z.popup.destroy();
    	Z.popup = null;
    	$super();
    }
    
});

jslet.ui.register('DBDatePicker', jslet.ui.DBDatePicker);
jslet.ui.DBDatePicker.htmlTemplate = '<div></div>';
