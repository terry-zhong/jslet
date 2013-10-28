/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBLabel. 
 * Display field name, use this control to void hard-coding field name, and you can change field name dynamically. 
 * Example:
 * <pre><code>
 * 		var jsletParam = {type:"DBLabel",dataset:"employee",field:"department"};
 * 
 * //1. Declaring:
 *      &lt;label data-jslet='type:"DBLabel",dataset:"employee",field:"department"' />
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
jslet.ui.DBLabel = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        this.allProperties = 'dataset,field';
        this.requiredProperties = 'field';
        this.isLabel = true;
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
    refreshControl: function (evt) {
        if (evt.eventType != jslet.data.UpdateEvent.METACHANGE) {
            return;
        }
        var fldObj = this.dataset.getField(this.field);
        var lbl = fldObj.label();
        if (fldObj.required()) {
            lbl += '<span class="jl-lable-required">'
							+ jslet.ui.DBLabel.REQUIREDCHAR + '<span>';
        }

        this.el.innerHTML = lbl;
    },

	/**
	 * @override
	 */
    renderAll: function () {
    	this.refreshControl({eventType: jslet.data.UpdateEvent.METACHANGE});
    }
});

jslet.ui.DBLabel.REQUIREDCHAR = '*';
jslet.ui.register('DBLabel', jslet.ui.DBLabel);
jslet.ui.DBLabel.htmlTemplate = '<label></label>';

