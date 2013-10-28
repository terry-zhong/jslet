/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBSelect. Example:
 * <pre><code>
 * 		var jsletParam = {type:"DBSelect",dataset:"employee",field:"department"};
 * 
 * //1. Declaring:
 *      &lt;select data-jslet='type:"DBSelect",dataset:"employee",field:"department"' />
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
jslet.ui.DBSelect = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
		var Z = this;
        if (!Z.allProperties) {
            Z.allProperties = 'dataset,field,groupField,lookupDataset';
        }
        if (!Z.requiredProperties) {
            Z.requiredProperties = 'field';
        }
        Z.dataset;
        /**
         * {String} Field name, required and there must be lookup field.
         */
        Z.field;
        /**
         * {String} Group field name, you can use this to group options.
         * Detail to see html optgroup element.
         */
        Z.groupField;
        
        /**
         * {String or jslet.data.Dataset} It will use this dataset to render Select Options.
         */
        Z.lookupDataset;
        
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
        Z.checkDataField();
        Z.renderOptions();
        Z.renderAll();

        jQuery(Z.el).on('change', Z._doChanged);
        if(Z.el.multiple) {
        	jQuery(Z.el).on('click', 'option', Z._doCheckLimitCount);
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
    
    _doCheckLimitCount: function(event) {
    	var Z = event.delegateTarget.jslet;
        Z._currOption = this;
    },
    
    renderOptions: function () {
        var Z = this,
        	fldObj = Z.dataset.getField(Z.field),
        	lkf = fldObj.lookupField();
        if(Z.lookupDataset) {
        	if(Z.lookupDataset.constructor === String) {
        		Z.lookupDataset = jslet.data.getDataset(Z.lookupDataset);
        	}
        	lkf = new jslet.data.LookupField();
        	lkf.lookupDataset(Z.lookupDataset);
        } else {
	        if (!lkf) {
	            return;
	        }
        }
        var lkds = lkf.lookupDataset(),
	        oldRecno = lkds.recno(),
	        groupIsLookup = false,
	        groupLookupField, groupFldObj, extraIndex;

        try {
            if (Z.groupField) {
                groupFldObj = lkds.getField(Z.groupField);
                if (groupFldObj == null) {
                    throw 'NOT found field: ' + Z.groupField
									+ ' in ' + lkds.name();
                }
                groupLookupField = groupFldObj.lookupField();
                groupIsLookup = (groupLookupField != null);
                if (groupIsLookup) {
                    extraIndex = Z.groupField + '.'
									+ groupLookupField.codeField();
                } else {
                    extraIndex = Z.groupField;
                }
                var indfld = lkds.indexFields();
                if (indfld) {
                    lkds.indexFields(extraIndex + ';' + indfld);
                } else {
                    lkds.indexFields(extraIndex);
                }
            }
            var preGroupValue, groupValue, groupDisplayValue, content = [];

            if (!Z.el.multiple && !fldObj.required() && fldObj.nullText()){
            	content.push('<option value="_null_">');
            	content.push(fldObj.nullText());
            	content.push('</option>');
            }
            for (var i = 0, cnt = lkds.recordCount(); i < cnt; i++) {
                lkds.innerSetRecno(i);
                if (Z.groupField) {
                    groupValue = lkds.getFieldValue(Z.groupField);
                    if (groupValue != preGroupValue) {

                        if (preGroupValue != null) {
                            content.push('</optgroup>');
                        }
                        if (groupIsLookup) {
                            if (!groupLookupField.lookupDataset()
											.findByField(
													groupLookupField
															.keyField(),
													groupValue)) {
                                throw 'Not found: <'
												+ groupValue
												+ '> in Dataset:<'
												+ groupLookupField
														.lookupDataset()
														.name()
												+ '>field: <'
												+ groupLookupField
														.keyField() + '>';
                            }
                            groupDisplayValue = groupLookupField.getCurrentDisplayValue();
                        } else
                            groupDisplayValue = groupValue;

                        content.push('<optgroup label="');
                        content.push(groupDisplayValue);
						content.push('">');
						preGroupValue = groupValue;
                    }
                }
                content.push('<option value="');
				content.push(lkds.getFieldValue(lkf.keyField()));
				content.push('">');
				content.push(lkf.getCurrentDisplayValue());
				content.push('</option>');
            } // end while
            if (preGroupValue != null) {
                content.push('</optgroup>');
            }
            jQuery(Z.el).html(content.join(''));
        } finally {
            lkds.innerSetRecno(oldRecno)
        }
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
                var optCnt = Z.el.options.length, 
                	opt;
                for (var i = 0; i < optCnt; i++) {
                    opt = Z.el.options[i];
                    if (opt) {
                    	opt.selected = false;
                    }
                }
                
                if (!Z.el.multiple) {
                	var value = Z.dataset.getFieldValue(Z.field, Z.valueIndex);
                    if (value == null){
                        var fldObj = Z.dataset.getField(Z.field);
                        if (!fldObj.required() && fldObj.nullText()) {
                        	value = '_null_';
                        }
                    }
                    Z.el.value = value;
                } else {
                    var arrValue = Z.dataset.getFieldValue(Z.field);
                    if(arrValue == null || arrValue.length == 0) {
                    	return;
                    }
                    	
                    var vcnt = arrValue.length - 1, selected;
                    Z._keep_silence_ = true;
                    try {
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
    }, // end renderAll

    updateToDataset: function () {
        var Z = this;
        if (Z._keep_silence_) {
            return;
        }
        var opt, value,
        	isMulti = Z.el.multiple;
        if (!isMulti) {
            value = Z.el.value;
            if (!value) {
                opt = Z.el.options[Z.el.selectedIndex];
                value = opt.innerHTML;
            }
        } else {
            var opts = jQuery(Z.el).find('option'),
            	optCnt = opts.length - 1;
            value = [];
            for (var i = 0; i <= optCnt; i++) {
                opt = opts[i];
                if (opt.selected) {
                    value.push(opt.value ? opt.value : opt.innerHTML);
                }
            }
        }

        Z._keep_silence_ = true;
        try {
            if (!isMulti) {
                var fldObj = Z.dataset.getField(Z.field);
                if (value == '_null_' && !fldObj.required() && fldObj.nullText()) {
                	value = null;
                }
            	Z.dataset.setFieldValue(Z.field, value, Z.valueIndex);
            } else {
            	Z.dataset.setFieldValue(Z.field, value);
            }
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
    	Z._currOption = null;
    	jQuery(this.el).off();
    	$super();
    }
});

jslet.ui.register('DBSelect', jslet.ui.DBSelect);
jslet.ui.DBSelect.htmlTemplate = '<select></select>';
