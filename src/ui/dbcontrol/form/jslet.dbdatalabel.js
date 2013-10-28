/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBDataLabel. 
 * Show field value in a html label. 
 * Example:
 * <pre><code>
 * 		var jsletParam = {type:"DBDataLabel",dataset:"employee",field:"department"};
 * 
 * //1. Declaring:
 *      &lt;label data-jslet='type:"DBDataLabel",dataset:"employee",field:"department"' />
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
jslet.ui.DBDataLabel = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        this.allProperties = 'dataset,field';
        this.requiredProperties = 'field';
        this.dataset;
        this.field;
        $super(el, params);
    },

	/**
	 * @override
	 */
    bind: function () {
        this.checkDataField();
        this.renderAll();
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
        if (!evt) {
            evt = jslet.data.UpdateEvent.updateAllEvent;
        }
        if (evt.eventType == jslet.data.UpdateEvent.METACHANGE) {
            return;
        }
        var Z = this;
        if (evt.eventType == jslet.data.UpdateEvent.UPDATERECORD
						&& evt.eventInfo != undefined
						&& evt.eventInfo.fieldName != undefined
						&& evt.eventInfo.fieldName != Z.field) {
            return;
        }
        if (!isForce && !Z.isActiveRecord()) {
        	return;
        }
        var text = Z.dataset.getFieldText(Z.field, Z.valueIndex);
        Z.el.innerHTML = text;
        Z.el.title = text;
    },

	/**
	 * @override
	 */
    renderAll: function () {
        this.refreshControl(jslet.data.UpdateEvent.updateAllEvent, true);
    }
});

jslet.ui.register('DBDataLabel', jslet.ui.DBDataLabel);
jslet.ui.DBDataLabel.htmlTemplate = '<label></label>';

