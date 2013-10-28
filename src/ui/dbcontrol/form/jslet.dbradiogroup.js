/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBRadioGroup. 
 * Display a group of radio that user can select one option. Example:
 * <pre><code>
 * 		var jsletParam = {type:"DBRadioGroup",dataset:"employee",field:"department"};
 * 
 * //1. Declaring:
 *      &lt;div data-jslet='type:"DBRadioGroup",dataset:"employee",field:"department"'' />
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
jslet.ui.DBRadioGroup = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        var Z = this;
        if (!Z.allProperties) {
            Z.allProperties = 'dataset,field,columnCount';
        }
        if (!Z.requiredProperties) {
            Z.requiredProperties = 'field';
        }

        Z.dataset = null;
        Z.field = null;
        /**
         * {Integer} Column count
         */
        Z.columnCount = 0;
        Z._itemIds;
        $super(el, params);
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
        this.checkDataField();
        this.renderAll();
    },

	/**
	 * @override
	 */
    refreshControl: function (evt, isForce) {
        var Z = this;
        if (!isForce && !Z.isActiveRecord()) {
        	return;
        }
        if (evt.eventType == jslet.data.UpdateEvent.METACHANGE
				&& (evt.eventInfo.enabled != undefined || evt.eventInfo.readOnly != undefined)) {
            flag = false;
            if (evt.eventInfo.enabled != undefined) {
                flag = !evt.eventInfo.enabled;
            } else if (evt.eventInfo.readOnly != undefined) {
                flag = evt.eventInfo.readOnly;
            }
            var radios = jQuery(Z.el).find('input[type="radio"]'), radio;
            for(var i = 0, cnt = radios.length; i < cnt; i++){
            	radio = radios[i];
                radio.disabled = flag;
                Z.disabled = flag;
            }
        } else if (evt.eventType == jslet.data.UpdateEvent.SCROLL
				|| evt.eventType == jslet.data.UpdateEvent.UPDATEALL
				|| evt.eventType == jslet.data.UpdateEvent.UPDATERECORD
				|| evt.eventType == jslet.data.UpdateEvent.INSERT
				|| evt.eventType == jslet.data.UpdateEvent.DELETE
				|| evt.eventType == jslet.data.UpdateEvent.UPDATECOLUMN) {
            if (evt.eventType == jslet.data.UpdateEvent.UPDATERECORD
					&& evt.eventInfo != undefined
					&& evt.eventInfo.fieldName != undefined
					&& evt.eventInfo.fieldName != Z.field) {
                return;
            }
            try {
                var value = Z.dataset.getFieldValue(Z.field),
                	radios = jQuery(Z.el).find('input[type="radio"]'), 
                	radio;
                for(var i = 0, cnt = radios.length; i < cnt; i++){
                	radio = radios[i];
                	radio.checked = (value == jQuery(radio.parentNode).attr('value'));
                }
            } catch (e) {
                jslet.showException(e);
            }
        }
    }, // end refreshControl

    renderOptions: function () {
        var Z = this;
        var fldObj = Z.dataset.getField(Z.field), lkf = fldObj.lookupField();
        if (!lkf) {
            jslet.showException(jslet.formatString(jslet.locale.Dataset.lookupFieldNotFound,
					[fldObj.name()]));
            return;
        }
        var lkds = lkf.lookupDataset();
        if (!Z.columnCount) {
            Z.columnCount = 99999;
        } else {
            Z.columnCount = parseInt(Z.columnCount);
        }
        var oldRecno = lkds.recno();
        try {
            var template = ['<table cellpadding="0" cellspacing="10">'],
            	isNewRow = false, 
            	cnt = lkds.recordCount(),
            	itemId;
            Z._itemIds = [];
        	for (var k = 0; k < cnt; k++) {
                lkds.innerSetRecno(k);
                isNewRow = (k % Z.columnCount == 0);
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
                template.push(Z.field);
                template.push('" type="radio"  id="');
                template.push(itemId);
                template.push('" /><label for="');
                template.push(itemId);
                template.push('">')
                template.push(lkf.getCurrentDisplayValue());
                template.push('</label></td>');
            } // end while
            if (cnt > 0) {
                template.push('</tr>');
            }
            template.push('</table>');
            Z.el.innerHTML = template.join('');
        } finally {
            lkds.innerSetRecno(oldRecno);
        }

        jQuery(Z.el).on('click', 'input[type="radio"]', Z._doOptionClick);
    }, // end renderOptions

    _doOptionClick: function(event){
        var Z = event.delegateTarget.jslet;
        if (Z._keep_silence_ || Z.disabled) {
            return;
        }
        Z._keep_silence_ = true;
        try {
            Z.dataset.setFieldValue(Z.field, jQuery(this.parentNode).attr('value'));
            this.checked = true;
        } catch (e) {
            jslet.showException(e);
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
        this.renderOptions();
        this.refreshControl(jslet.data.UpdateEvent.updateAllEvent, true);
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
