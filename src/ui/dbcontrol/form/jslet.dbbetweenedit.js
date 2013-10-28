/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBBetweenEdit. 
 * It implements "From ... To ..." style editor. This editor usually use in query parameter editor.
 * Example:
 * <pre><code>
 * 		var jsletParam = {type:"DBBetweenEdit","field":"dateFld"};
 * 
 * //1. Declaring:
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
jslet.ui.DBBetweenEdit = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        var Z = this;
        if (!Z.allProperties) {
            Z.allProperties = 'dataset,field';
        }
        if (!Z.requiredProperties) {
            Z.requiredProperties = 'field';
        }

        Z.dataset;
        $super(el, params)
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
        var Z = this;
        Z.renderAll();
    },

	/**
	 * @override
	 */
    refreshControl: function (evt) {
        return;
    }, // end refreshControl

	/**
	 * @override
	 */
    renderAll: function () {
        var Z = this;
        jslet.ui.textMeasurer.setElement(Z.el);
        var lbl = jslet.locale.Dataset.betweenLabel;
        if (!lbl) {
            lbl = ' - ';
        }
        var w = jslet.ui.textMeasurer.getWidth(lbl);

        var template = ['<table style="width:100%;margin:0px" cellspacing="2"><col /><col width="', w,
				'px" /><col /><tbody><tr><td></td><td>', lbl,
				'</td><td></td></tr></tbody></table>'];
        Z.el.innerHTML = template.join('');
        var arrTd = jQuery(Z.el).find('td'),
            minTd = arrTd[0],
            maxTd = arrTd[2],
            fldObj = Z.dataset.getField(Z.field),
            param = fldObj.editControl();

        param.dataset = Z.dataset;
        param.field = Z.field;
        param.valueIndex = 0;
        var tag = jslet.ui.createControl(param, minTd);
        tag.el.style.width = '98%';
        Z.minElement = tag;
        param.valueIndex = 1;
        tag = jslet.ui.createControl(param, maxTd);
        tag.el.style.width = '98%';
    },
    
    focus: function() {
    	this.minElement.focus();
    },
    
	/**
	 * @override
	 */
    destroy: function($super){
    	Z.minElement = null;
    	$super();
    }
    
});

jslet.ui.register('DBBetweenEdit', jslet.ui.DBBetweenEdit);
jslet.ui.DBBetweenEdit.htmlTemplate = '<div></div>';
