/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBCheckBox. 
 * Example:
 * <pre><code>
 * 		var jsletParam = {type:"DBCheckBox", dataset:"employee", field:"married"};
 * 
 * //1. Declaring:
 *      &lt;input type='checkbox' data-jslet='type:"DBCheckBox",dataset:"employee", field:"married"' />
 *      or
 *      &lt;div data-jslet='jsletParam' />
 *      
 *  //2. Binding
 *      &lt;input id="ctrlId" type="checkbox" />
 *  	//Js snippet
 * 		var el = document.getElementById('ctrlId');
 *  	jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *  	jslet.ui.createControl(jsletParam, document.body);
 *  	
 * </code></pre>
 */

/**
* DBCheckBox
*/
jslet.ui.DBCheckBox = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
		var Z = this;
		Z.isCheckBox = true;
        Z.allProperties = 'dataset,field,beforeClick';
        Z.requiredProperties = 'field';
        /**
         * {jselt.data.Dataset}
         */
        Z.dataset;
        /**
         * {String} Field name
         */
        Z.field;
        $super(el, params)
    },

	/**
	 * @override
	 */
    isValidTemplateTag: function (el) {
        return el.tagName.toLowerCase() == 'input'
						&& el.type.toLowerCase() == 'checkbox';
    },

	/**
	 * @override
	 */
    bind: function () {
        var Z = this;
        Z.checkDataField();

        Z.renderAll();
        jQuery(Z.el).on('click', Z._doClick);
    }, // end bind

    _doClick: function (event) {
    	var Z = this.jslet;
        if (Z.beforeClick) {
            var result = Z.beforeClick.call(Z, Z.el);
            if (!result) {
                return;
            }
        }
        Z.updateToDataset();
    },
    
	/**
	 * @override
	 */
    refreshControl: function (evt, isForce) {
        var Z = this;
        if (!isForce && !Z.isActiveRecord()) {
        	return;
        }
        if (evt.eventType == jslet.data.UpdateEvent.METACHANGE) {
            if (evt.eventInfo.enabled != undefined) {
                Z.el.disabled = !evt.eventInfo.enabled;
            }
            if (evt.eventInfo.readOnly != undefined) {
                Z.el.readOnly = evt.eventInfo.readOnly;
            }
            return;
        }

        if (evt.eventType == jslet.data.UpdateEvent.SCROLL
			|| evt.eventType == jslet.data.UpdateEvent.UPDATEALL
			|| evt.eventType == jslet.data.UpdateEvent.UPDATERECORD
			|| evt.eventType == jslet.data.UpdateEvent.DELETE
			|| evt.eventType == jslet.data.UpdateEvent.UPDATECOLUMN) {

            if (evt.eventType == jslet.data.UpdateEvent.UPDATERECORD
							&& evt.eventInfo != undefined
							&& evt.eventInfo.fieldName != undefined
							&& evt.eventInfo.fieldName != Z.field) {
                return;
            }
            try {
                var fldObj = Z.dataset.getField(Z.field),
                	value = Z.dataset.getFieldValue(Z.field, Z.valueIndex);
                if (value != null && value == fldObj.trueValue) {
                    Z.el.checked = true;
                } else {
                    Z.el.checked = false;
                }
            } catch (e) {
                jslet.showException(e);
            } // end try
        } // end if
    }, // end refreshControl

    focus: function() {
    	this.el.focus();
    },
    
	/**
	 * @override
	 */
    renderAll: function () {
        this.refreshControl(jslet.data.UpdateEvent.updateAllEvent, true);
    }, // end renderAll

    updateToDataset: function () {
        var Z = this;
        if (Z._keep_silence_) {
            return;
        }
        var fldObj = Z.dataset.getField(Z.field),
        	value;
        if (Z.el.checked) {
            value = fldObj.trueValue;
        } else {
            value = fldObj.falseValue;
        }
        Z._keep_silence_ = true;
        try {
            Z.dataset.setFieldValue(Z.field, value, Z.valueIndex);
        } catch (e) {
            jslet.showException(e);
        } finally {
            Z._keep_silence_ = false;
        }
    }, // end updateToDataset
    
	/**
	 * @override
	 */
    destroy: function($super){
    	jQuery(this.el).off();
    }
});

jslet.ui.register('DBCheckBox', jslet.ui.DBCheckBox);
jslet.ui.DBCheckBox.htmlTemplate = '<input type="checkbox"></input>';

