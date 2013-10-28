/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBLookupLabel. 
 * Display field value according to another field and its value.
 * Example:
 * <pre><code>
 * 		var jsletParam = {type:"DBLookupLabel",dataset:"department",lookupField:"deptcode", lookupValue: '0101', returnField: 'name'};
 * 
 * //1. Declaring:
 *      &lt;label data-jslet='{type:"DBLookupLabel",dataset:"department",lookupField:"deptcode", lookupValue: "0101", returnField: "name"}' />
 *      or
 *      &lt;label data-jslet='jsletParam' />
 *      
 *  //2. Binding
 *      &lt;label id="ctrlId"  />
 *  	//Js snippet
 * 		var el = document.getElementById('ctrlId');
 *  	jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *  	jslet.ui.createControl(jsletParam, document.body);
 *  	
 * </code></pre>
 */
jslet.ui.DBLookupLabel = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
		var Z = this;
        Z.allProperties = 'dataset,lookupField,returnField,lookupValue';
        Z.requiredProperties = 'lookupValue,lookupField,returnField';

        /**
         * {String} Lookup field name.
         */
        Z.lookupField;
        /**
         * {String} Lookup field value.
         */
        Z.lookupValue;
        /**
         * {String} Return field name.
         */
        Z.returnField;
        $super(el, params);
    },

	/**
	 * @override
	 */
    bind: function () {
        this.checkDataField();
        oJslet.renderAll();
    },

	/**
	 * @override
	 */
    isValidTemplateTag: function (el) {
        return el.tagName.toLowerCase() == 'label';
    },

	/**
	 * @override
	 */
    refreshControl: function (evt, isForce) {
        if (evt.eventType != jslet.data.UpdateEvent.UPDATEALL) {
            return;
        }
        if (!isForce && !Z.isActiveRecord()) {
        	return;
        }
        var Z = this;
        var result = Z.dataset.lookup(Z.lookupField, Z.lookupValue,
				Z.returnField);
        if (result == null) {
            result = 'NOT found: ' + Z.lookupValue;
        }
        Z.el.innerHTML = result;
    },

	/**
	 * @override
	 */
    renderAll: function () {
        this.refreshControl(jslet.data.UpdateEvent.updateAllEvent, true);
    }
});
jslet.ui.register('DBLookupLabel', jslet.ui.DBLookupLabel);
jslet.ui.DBLookupLabel.htmlTemplate = '<label></label>';

