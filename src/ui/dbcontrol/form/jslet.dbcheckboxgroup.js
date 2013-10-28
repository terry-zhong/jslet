/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBCheckBoxGroup. 
 * Display a group of checkbox. Example:
 * <pre><code>
 * 		var jsletParam = {type:"DBCheckBoxGroup",dataset:"employee",field:"department", columnCount: 3};
 * 
 * //1. Declaring:
 *      &lt;div data-jslet='type:"DBCheckBoxGroup",dataset:"employee",field:"department", columnCount: 3' />
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
jslet.ui.DBCheckBoxGroup = jslet.Class.create(jslet.ui.DBControl, {
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
            var flag = false;
            if (evt.eventInfo.enabled != undefined) {
                flag = !evt.eventInfo.enabled;
            } else if (evt.eventInfo.readOnly != undefined) {
                flag = evt.eventInfo.readOnly;
            }
            var chkBoxes = jQuery(Z.el).find('input[type="checkbox"]'), checkbox;
            for(var i = 0, cnt = chkBoxes.length; i < cnt; i++){
				checkbox = chkBoxes[i];
				checkbox.disabled = flag;
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
					&& evt.eventInfo.fieldName != Z.field)
                return;

            try {
                var checkboxs = jQuery(Z.el).find('input[type="checkbox"]'),
                	chkcnt = checkboxs.length, 
                	checkbox;
                for (var i = 0; i < chkcnt; i++) {
                    checkbox = checkboxs[i];
                    checkbox.checked = false;
                }
                var values = Z.dataset.getFieldValue(Z.field);
                if(values && values.length > 0) {
	                var valueCnt = values.length, value;
	                for (var i = 0; i < chkcnt; i++) {
	                    checkbox = checkboxs[i];
	                    for (var j = 0; j < valueCnt; j++) {
	                        value = values[j];
	                        if (value == checkbox.value) {
	                            checkbox.checked = true;
	                        }
	                    }
	                }
                }
            } catch (e) {
                jslet.showException(e);
            }
        }
    }, // end refreshControl

    renderOptions: function () {
        var Z = this,
        	fldObj = Z.dataset.getField(Z.field), 
        	lkf = fldObj.lookupField();
        if (!lkf) {
        	jslet.showException(jslet.formatString(jslet.locale.Dataset.lookupFieldNotFound,
					[fldObj.name()]));
            return;
        }
        if(fldObj.valueStyle() != jslet.data.FieldValueStyle.MULTIPLE) {
        	fldObj.valueStyle(jslet.data.FieldValueStyle.MULTIPLE);
        }

        if (!Z.columnCount) {
            Z.columnCount = 99999;
        } else {
            Z.columnCount = parseInt(Z.columnCount);
        }
        var lkds = lkf.lookupDataset(),
	        cnt = lkds.recordCount(),
	        context = lkds.startSilenceMove(),
	        itemId;
        Z._itemIds = [];
        try {
            var template = ['<table cellpadding="0" cellspacing="8">'],
            isNewRow = false;

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
                template.push('<td style="white-space: nowrap; "><input type="checkbox" value="');
                template.push(lkds.getFieldValue(lkf.keyField()));
                template.push('" id="');
                template.push(itemId);
                template.push('" /><label for="');
                template.push(itemId);
                template.push('">')
                template.push(lkf.getCurrentDisplayValue());
                template.push('</label></td>');
                isNewRow = (k % Z.columnCount == 0);
            } // end for
            if (cnt > 0) {
                template.push('</tr>');
            }
            template.push('</table>');
            Z.el.innerHTML = template.join('');
        } finally {
            lkds.endSilenceMove(context);
        }
        jQuery(Z.el).on('click', 'input[type="checkbox"]', Z._doCheckboxClick);
    }, // end renderOptions

    _doCheckboxClick: function (event) {
        var Z = event.delegateTarget.jslet;
        if (Z._is_silence_) {
            return;
        }
        var fldObj = Z.dataset.getField(Z.field),
        	limitCount = fldObj.valueCountLimit();
        
        var values = [], count = 0;
        var allBoxes = jQuery(Z.el).find('input[type="checkbox"]'),chkBox;
        for(var j = 0, allCnt = allBoxes.length; j < allCnt; j++){
			chkBox = allBoxes[j];
			if (chkBox.checked) {
			    values.push(chkBox.value);
			    count ++;
			}
		} //end for j

        if (limitCount && count > limitCount) {
            this.checked = !this.checked;
            jslet.showException(jslet.formatString(jslet.locale.DBCheckBoxGroup.invalidCheckedCount,
					[''	+ limitCount]));
            return;
        }

        Z._is_silence_ = true;
        try {
            Z.dataset.setFieldValue(Z.field, values);
        } finally {
            Z._is_silence_ = false;
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

jslet.ui.register('DBCheckBoxGroup', jslet.ui.DBCheckBoxGroup);
jslet.ui.DBCheckBoxGroup.htmlTemplate = '<div></div>';

