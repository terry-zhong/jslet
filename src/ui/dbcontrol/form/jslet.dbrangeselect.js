/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBRangeSelect. 
 * Display a select which options produce with 'beginItem' and 'endItem'. Example:
 * <pre><code>
 * 		var jsletParam = {type:"DBRangeSelect",dataset:"employee",field:"age",beginItem:10,endItem:100,step:5};
 * 
 * //1. Declaring:
 *      &lt;select data-jslet='type:"DBRangeSelect",dataset:"employee",field:"age",beginItem:10,endItem:100,step:5' />
 *      or
 *      &lt;select data-jslet='jsletParam' />
 *      
 *  //2. Binding
 *      &lt;select id="ctrlId"  />
 *  	//Js snippet
 * 		var el = document.getElementById('ctrlId');
 *  	jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *  	jslet.ui.createControl(jsletParam, document.body);
 *  	
 * </code></pre>
 */
jslet.ui.DBRangeSelect = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
		var Z = this;
        if (!Z.allProperties) {
            Z.allProperties = 'dataset,field,beginItem,endItem,step';
        }
        if (!Z.requiredProperties) {
            Z.requiredProperties = 'field,beginItem,endItem,step';
        }

        Z.dataset;
        Z.field;
        /**
         * {Integer} Begin item 
         */
        Z.beginItem = 0;
        /**
         * {Integer} End item
         */
        Z.endItem = 10;
        /**
         * {Integer} Step
         */
        Z.step = 1;
        $super(el, params);
    },

	/**
	 * @override
	 */
    isValidTemplateTag: function (el) {
        return (el.tagName.toLowerCase() == 'select');
    },

	/**
	 * @override
	 */
    bind: function () {
        var Z = this,
    		fldObj = Z.dataset.getField(Z.field),
    		valueStyle = fldObj.valueStyle();
        
        if(Z.el.multiple && valueStyle != jslet.data.FieldValueStyle.MULTIPLE) {
        	fldObj.valueStyle(jslet.data.FieldValueStyle.MULTIPLE);
        } else if(valueStyle == jslet.data.FieldValueStyle.MULTIPLE && !Z.el.multiple) {
        	Z.el.multiple = "multiple";	
        }

        if (!Z.beginItem && isNaN(Z.beginItem)) {
            throw new Error(jslet.formatString(jslet.locale.DBControl.propertyValueMustBeInt,
							['begin-item']));
        }
        Z.beginItem = parseFloat(Z.beginItem);
        if (!Z.endItem && isNaN(Z.endItem)) {
            throw new Error(jslet.formatString(jslet.locale.DBControl.propertyValueMustBeInt,
							['end-item']));
        }
        Z.endItem = parseFloat(Z.endItem);

        if (!Z.step) {
            Z.step = 1;
        } else {
            Z.step = parseInt(Z.step);
        }
        if (isNaN(Z.step)) {
            throw new Error(jslet.formatString(jslet.locale.DBControl.propertyValueMustBeInt,
							['step']));
        }
        Z.renderOptions();
        Z.renderAll();

        jQuery(Z.el).on('change', Z._doChanged);// end observe
        if(Z.el.multiple) {
            jQuery(Z.el).on('click', 'option', function () {
                Z._currOption = this;
            });// end observe
        }
    }, // end bind

    _doChanged: function (event) {
    	var Z = this.jslet;
    	if(Z.el.multiple) {
        	if(Z.inProcessing) {
        		Z.inProcessing = false;
        	}
	    	var fldObj = Z.dataset.getField(Z.field),
	    		limitCount = fldObj.valueCountLimit();
		    if(limitCount) {
		        var values = Z.dataset.getFieldValue(Z.field),
		        	count = 1;
		        if(jslet.isArray(values)) {
		        	count = values.length;
		        }
		        if (count >= limitCount) {
		            jslet.showException(jslet.formatString(jslet.locale.DBCheckBoxGroup.invalidCheckedCount,
							[''	+ limitCount]));
		            
		            window.setTimeout(function(){
		            	if(Z._currOption) {
		            		Z.inProcessing = true;
		            		Z._currOption.selected = false;
		            	}
		            }, 10);
		            return;
		        }
		    }
    	}
        this.jslet.updateToDataset();
    },
        
    renderOptions: function () {
        var Z = this,
        	arrhtm = [];
        
        var fldObj = Z.dataset.getField(Z.field);
        if (!fldObj.required() && fldObj.nullText()){
        	arrhtm.push('<option value="_null_">');
        	arrhtm.push(fldObj.nullText());
        	arrhtm.push('</option>');
        }

        for (var i = Z.beginItem; i <= Z.endItem; i += Z.step) {
            arrhtm.push('<option value="');
            arrhtm.push(i);
            arrhtm.push('">');
            arrhtm.push(i);
            arrhtm.push('</option>');
        }
        jQuery(Z.el).html(arrhtm.join(''));
        delete arrhtm;
    }, // end renderOptions

	/**
	 * @override
	 */
    refreshControl: function (evt, isForce) {
        var Z = this;
        if (Z._keep_silence_) {
            return;
        }
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
                if (!Z.el.multiple) {
                    var value = Z.dataset.getFieldValue(Z.field, Z.valueIndex);
                    if (value != null) {
                        Z.el.value = value;
                    } else {
                        Z.el.value = null;
                    }
                } else {
                    var arrValue = Z.dataset.getFieldValue(Z.field),
                    	optCnt = Z.el.options.length, opt, selected;
                    Z._keep_silence_ = true;
                    try {
                        for (var i = 0; i < optCnt; i++) {
                            opt = Z.el.options[i];
                            if (opt) {
                                opt.selected = false;
                            }
                        }

                        var vcnt = arrValue.length - 1;
                        for (var i = 0; i < optCnt; i++) {
                            opt = Z.el.options[i];
                            for (j = vcnt; j >= 0; j--) {
                                selected = (arrValue[j] == opt.value);
                                if (selected) {
                                   opt.selected = selected;
                                }
                            } // end for j
                        } // end for i
                    } finally {
                        Z._keep_silence_ = false;
                    }
                }
            } catch (e) {
                jslet.showException(e);
            }
        }
    }, // end refreshControl

    focus: function() {
    	this.el.focus();
    },
    
	/**
	 * @override
	 */
    renderAll: function () {
        this.refreshControl(jslet.data.UpdateEvent.updateAllEvent, true);
    },

    updateToDataset: function () {
        var Z = this;
        if (Z._keep_silence_) {
            return;
        }
        var value,
        	isMulti = Z.el.multiple;
        if (!isMulti) {
            value = Z.el.value;
            var fldObj = Z.dataset.getField(Z.field);
            if (value == '_null_' && !fldObj.required() && fldObj.nullText()) {
            	value = null;
            }
        } else {
            var opts = jQuery(Z.el).find('option'),
            	optCnt = opts.length - 1,
            	value = [];
            for (var i = 0; i <= optCnt; i++) {
                opt = opts[i];
                if (opt.selected) {
                    value.push(opt.value);
                }
            }
        }
        Z._keep_silence_ = true;
        try {
            if (!isMulti) {
            	Z.dataset.setFieldValue(Z.field, value, Z.valueIndex);
            } else {
            	Z.dataset.setFieldValue(Z.field, value);
            }
        } catch (e) {
            jslet.showException(e);
        } finally {
            Z._keep_silence_ = false;
        }
    },
    
	/**
	 * @override
	 */
    destroy: function($super){
    	jQuery(this.el).off();
    	$super();
    }    
});

jslet.ui.register('DBRangeSelect', jslet.ui.DBRangeSelect);
jslet.ui.DBRangeSelect.htmlTemplate = '<select></select>';
