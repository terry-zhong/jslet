/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBTimePicker is used for time inputting. Example:
 * <pre><code>
 * var jsletParam = {type:"DBTimePicker",field:"time"};
 * //1. Declaring:
 *      &lt;input id="ctrlId" type="text" data-jslet='jsletParam' />
 *      or
 *      &lt;input id="ctrlId" type="text" data-jslet='{type:"DBTimePicker",field:"time"}' />
 *      
 *  //2. Binding
 *      &lt;input id="ctrlId" type="text" data-jslet='jsletParam' />
 *  	//Js snippet
 * 		var el = document.getElementById('ctrlId');
 *  	jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *  	jslet.ui.createControl(jsletParam, document.body);
 *  	
 * </code></pre>
 */
jslet.ui.DBTimePicker = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        var Z = this;
        if (!Z.allProperties) {
            Z.allProperties = 'dataset,field,is12Hour,hasSecond';
        }
        if (!Z.requiredProperties) {
            Z.requiredProperties = 'field';
        }
        Z.dataset;
        Z.field;
        Z.is12Hour = false;
        Z.hasSecond = false;
        $super(el, params);
    },

	/**
	 * @override
	 */
    isValidTemplateTag: function (el) {
    	var tagName = el.tagName.toLowerCase();
        return tagName == 'div' || tagName == 'span';
    },

	/**
	 * @override
	 */
    bind: function () {
        var Z = this,
        	jqEl = jQuery(Z.el);
    	if(!jqEl.hasClass('jl-timepicker')) {
    		jqEl.addClass('jl-timepicker');
    	}
        Z.checkDataField();
        Z.renderAll();
        jqEl.on('change', 'select', function(event){
        	Z.updateToDataset();
        });
    }, // end bind

	/**
	 * @override
	 */
    renderAll: function () {
    	var Z = this,
    		jqEl = jQuery(Z.el),
    		fldObj = Z.dataset.getField(Z.field),
    		range = fldObj.range(),
    		minTimePart = {hour: 0, minute: 0, second: 0},
    		maxTimePart = {hour: 0, minute: 0, second: 0};
    	
    	if(range) {
    		if(range.min) {
    			minTimePart = Z._splitTime(range.min);
    		}
    		if(range.max) {
    			maxTimePart = Z._splitTime(range.max);
    		}
    	}
    	var	tmpl = [];
    	
    	tmpl.push('<select class="jl-time-hour">')
    	if(Z.is12Hour) {
    		var minHour = minTimePart.hour;
    		if(minHour > 11) {
    			minHour -= 12;
    		}
    		var maxHour = maxTimePart.hour;
    		if(maxHour > 11) {
    			maxHour -= 12;
    		}
    		tmpl.push(Z._getOptions(minHour, maxHour || 12))
    	} else {
    		tmpl.push(Z._getOptions(minTimePart.hour, maxTimePart.hour || 23));
    	}
    	tmpl.push('</select>');
    	
    	tmpl.push('<select class="jl-time-minute">')
   		tmpl.push(Z._getOptions(0, 59));
    	tmpl.push('</select>');
    	
    	if(Z.hasSecond) {
        	tmpl.push('<select class="jl-time-second">')
       		tmpl.push(Z._getOptions(0, 59));
        	tmpl.push('</select>');
    	}
    	
    	if(Z.is12Hour) {
        	tmpl.push('<select class="jl-time-ampm"><option value="am">AM</option><option value="pm">PM</option></select>');
    	}
    	jqEl.html(tmpl.join(''));
        this.refreshControl(jslet.data.UpdateEvent.updateAllEvent, true);
    }, // end renderAll

    _getOptions: function(begin, end) {
    	var result = [], value;
    	for(var i = begin; i <= end; i++) {
    		if( i < 10) {
    			value = '0' + i;
    		} else {
    			value = '' + i;
    		}
    		result.push('<option value="');
    		result.push(i);
    		result.push('">');
    		result.push(value);
    		result.push('</option>');
    	}
    	return result.join('');
    },
    
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
            if (evt.eventInfo.enabled != undefined || 
            	evt.eventInfo.readOnly != undefined) {
                jQuery(Z.el).find("select").attr("disabled","disabled");
            } else {
            	 jQuery(Z.el).find("select").removeAttr("disabled");
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
            Z.renderInvalid();
            if (Z.invalidMessage) {
            	return;
            }
            var fldObj = Z.dataset.getField(Z.field),
            	value = Z.dataset.getFieldValue(Z.field, Z.valueIndex),
            	timePart = Z._splitTime(value),
            	hour = timePart.hour,
            	
            	jqEl = jQuery(Z.el),
            	jqHour = jqEl.find('.jl-time-hour'),
            	jqMinute = jqEl.find('.jl-time-minute');
            if(Z.is12Hour) {
            	jqAmPm = jqEl.find('.jl-time-ampm');
           		jqAmPm.prop('selectedIndex', hour < 12 ? 0: 1);
           		if(hour > 11) {
           			hour -= 12;
           		}
            }
            jqHour.val(hour);
            jqMinute.val(timePart.minute);
            if(Z.hasSecond) {
            	jqMinute = jqEl.find('.jl-time-second');
                jqMinute.val(timePart.second);
            }
        }
    }, // end refreshControl
    
    _splitTime: function(value) {
	    var	hour = 0,
	    	minute = 0,
	    	second = 0;
	    if(value) {
	    	if(jslet.isDate(value)) {
	    		hour = value.getHours();
	    		minute = value.getMinutes();
	    		second = value.getSeconds();
	    	} else if(jslet.isString(value)) {
	    		var parts = value.split(":");
	    		hour = parseInt(parts[0]);
	    		if(parts.length > 1) {
	    			minute = parseInt(parts[1]);
	    		}
	    		if(parts.length > 2) {
	    			second = parseInt(parts[2]);
	    		}
	    	}
	    }
	    return {hour: hour, minute: minute, second: second};
    },
    
    _prefix: function(value) {
    	if(parseInt(value) < 10) {
    		return '0' + value;
    	}
    	return value;
    },
    
    updateToDataset: function () {
        var Z = this;
        if (Z._keep_silence_) {
            return true;
        }

        Z._keep_silence_ = true;
        try {
            var jqEl = jQuery(Z.el),
            	fldObj = Z.dataset.getField(Z.field),
            	value = null;
            if(fldObj.getType() != jslet.data.DataType.DATE) {
            	value = [];
            	if(Z.is12Hour && jqEl.find('.jl-time-ampm').prop("selectedIndex") > 0) {
            		var hour = parseInt(jqEl.find('.jl-time-hour').val()) + 12;
            		value.push(hour);
            	} else {
            		value.push(Z._prefix(jqEl.find('.jl-time-hour').val()));
            	}
            	value.push(':');
            	value.push(Z._prefix(jqEl.find('.jl-time-minute').val()));
            	if(Z.hasSecond) {
                	value.push(':');
                	value.push(Z._prefix(jqEl.find('.jl-time-second').val()));
            	}
            	value = value.join('');
            } else {
            	value = Z.dataset.getFieldValue(Z.field, Z.valueIndex);
            	if(!value) {
            		value = new Date();
            	}
            	var hour = parseInt(jqEl.find('.jl-time-hour').val());
            	if(Z.is12Hour && jqEl.find('.jl-time-ampm').prop("selectedIndex") > 0) {
            		hour += 12;
            	}
            	var minute = parseInt(jqEl.find('.jl-time-minute').val());
            	var second = 0;
            	if(Z.hasSecond) {
            		second = parseInt(jqEl.find('.jl-time-second').val());
            	}
            	
            	value.setHours(hour);
            	value.setMinutes(minute);
            	value.setSeconds(second);
            }
            Z.dataset.setFieldValue(Z.field, value, Z.valueIndex);
        } finally {
            Z._keep_silence_ = false;
        }
        return true;
    }, // end updateToDataset

	/**
	 * @override
	 */
    destroy: function($super){
    	jQuery(this.el).off();
    	$super();
    }
});
jslet.ui.register('DBTimePicker', jslet.ui.DBTimePicker);
jslet.ui.DBTimePicker.htmlTemplate = '<div></div>';
