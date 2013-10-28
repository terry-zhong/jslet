/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBText is a powerful control, it can input any data type, like: number, date etc. Example:
 * <pre><code>
 * var jsletParam = {type:"DBText",field:"name"};
 * //1. Declaring:
 *      &lt;input id="ctrlId" type="text" data-jslet='jsletParam' />
 *      or
 *      &lt;input id="ctrlId" type="text" data-jslet='{type:"DBText",field:"name"}' />
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
jslet.ui.DBText = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        var Z = this;
        if (!Z.allProperties) {
            Z.allProperties = 'dataset,field,beforeUpdateToDataset,maxValue,minValue,enableInvalidTip,onKeyDown';
        }
        if (!Z.requiredProperties) {
            Z.requiredProperties = 'field';
        }
        Z.dataset;
        Z.field;
        /**
         * @protected
         */
        Z.beforeUpdateToDataset;
        Z.maxValue;
        Z.minValue;
        Z.enableInvalidTip = true;
        
        /**
         * @private
         */
        Z.oldValue = null;
		Z.editMask = null;
        $super(el, params);
    },

	/**
	 * @override
	 */
    isValidTemplateTag: function (el) {
        return el.tagName.toLowerCase() == 'input'
				&& el.type.toLowerCase() == 'text';
    },

	/**
	 * @override
	 */
    bind: function () {
        var Z = this;
        Z.checkDataField();
        var fldObj = Z.dataset.getField(Z.field);
		var editMaskCfg = fldObj.editMask();
		if (editMaskCfg){
			Z.editMask = new jslet.ui.EditMask(editMaskCfg.mask, editMaskCfg.keepChar, editMaskCfg.transform);
			Z.editMask.attach(Z.el);
		}
        Z.renderAll();
        Z.refreshControl(new jslet.data.UpdateEvent(jslet.data.UpdateEvent.METACHANGE,
				{ enabled: fldObj.enabled(), readOnly: fldObj.readOnly() }));
        var jqEl = jQuery(Z.el);
        jqEl.addClass('jl-border-box');
		
        if (Z.doFocus) {
        	jqEl.on('focus', Z.doFocus);
        }
        if (Z.doBlur) {
        	jqEl.on('blur', Z.doBlur);
        }
        if (Z.doKeydown) {
        	jqEl.on('keydown', Z.doKeydown);
        }
        if (Z.doKeypress) {
        	jqEl.on('keypress', Z.doKeypress);
        }
        if (Z.enableInvalidTip && jslet.ui.globalTip) {
        	jqEl.on('mouseover', Z.doMouseOver);
        	jqEl.on('mouseout', Z.doMouseOut);
        }
    }, // end bind

    doFocus: function (event) {
        var Z = this.jslet;
        if (Z._skipFocusEvent) {
        	return;
        }
        Z.refreshControl(jslet.data.UpdateEvent.updateAllEvent);
        jslet.ui.textutil.selectText(this);
    },

    doBlur: function (event) {
        var Z = this.jslet,
        	fldObj = Z.dataset.getField(Z.field);
        if (fldObj.readOnly() || !fldObj.enabled()) {
        	return;
        }
    	Z.updateToDataset()
        Z.refreshControl(jslet.data.UpdateEvent.updateAllEvent)
    },

    doKeydown: null,

    doKeypress: function (event) {
        var Z = this.jslet,
        fldObj = Z.dataset.getField(Z.field);
        if (fldObj.readOnly() || !fldObj.enabled()) {
        	return;
        }
        var event = jQuery.event.fix( event || window.event ),
        keyCode = event.which;
        if (!Z.dataset.fieldValidator.checkInputChar(fldObj, String.fromCharCode(keyCode))) {
            event.preventDefault();
        }
    },

    doChange: function (event) {
   		this.jslet.updateToDataset();
    },

    doMouseOver: function (event) {
        var Z = this.jslet;
        if (Z.invalidMessage) {
            jslet.ui.globalTip.show(Z.invalidMessage, event);
        }
    },

    doMouseOut: function (event) {
        jslet.ui.globalTip.hide();
    },

    focus: function() {
    	this.el.focus();
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
            if (evt.eventInfo.enabled != undefined) {
                Z.el.disabled = !evt.eventInfo.enabled;
            }
            if (evt.eventInfo.readOnly != undefined) {
                Z.el.readOnly = evt.eventInfo.readOnly;
            }
            var fldObj = Z.dataset.getField(Z.field), dt = fldObj.getType();
            Z.el.maxLength = fldObj.getEditLength()
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
            	dir = fldObj.alignment();

            if (jslet.locale.isRtl){
            	if (dir == 'left') {
            		dir= 'right';
            	} else {
            		dir = 'left';
            	}
            }
           	Z.el.style.textAlign = dir;
           	
            var ds = Z.dataset;
            var fldName = Z.field, value;
            if (document.activeElement != Z.el || Z.el.readOnly) {
                value = Z.dataset.getFieldText(Z.field, false, Z.valueIndex);
            } else {
                value = Z.dataset.getFieldText(Z.field, true, Z.valueIndex);
            }
			if (Z.editMask){
				Z.editMask.setValue(value);
			}else {
				Z.el.value = value;
			}
            Z.oldValue = Z.el.value;
        }
        if (Z.afterRefreshControl) {
            Z.afterRefreshControl(evt);
        }
    }, // end refreshControl

	/**
	 * @override
	 */
    renderAll: function () {
        this.refreshControl(jslet.data.UpdateEvent.updateAllEvent, true);
    }, // end renderAll

    updateToDataset: function () {
        var Z = this;
        if (Z._keep_silence_) {
            return true;
        }
		if (this.editMask && !this.editMask.validateValue()) {
			return false;
		}
        if (Z.beforeUpdateToDataset) {
            if (!Z.beforeUpdateToDataset()) {
                return false;
            }
        }

        Z._keep_silence_ = true;
        try {
			var value = Z.el.value;
			if (Z.editMask) {
				value = Z.editMask.getValue();
			}
            Z.dataset.setFieldText(Z.field, value, Z.valueIndex);
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
    	if (this.editMask){
    		this.editMask.detach();
    		this.editMask = null;
    	}
        Z.beforeUpdateToDataset = null;
        Z.maxValue = null;
        Z.minValue = null;
        Z.onKeyDown = null;
    	$super();
    }
});
jslet.ui.register('DBText', jslet.ui.DBText);
jslet.ui.DBText.htmlTemplate = '<input type="text"></input>';

/**
* DBPassword
*/
jslet.ui.DBPassword = jslet.Class.create(jslet.ui.DBText, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        $super(el, params);
    },

	/**
	 * @override
	 */
    isValidTemplateTag: function (el) {
        return el.tagName.toLowerCase() == 'input'
						&& el.type.toLowerCase() == 'password';
    }
});

jslet.ui.register('DBPassword', jslet.ui.DBPassword);
jslet.ui.DBPassword.htmlTemplate = '<input type="password"></input>';

/**
* DBTextArea
*/
jslet.ui.DBTextArea = jslet.Class.create(jslet.ui.DBText, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        $super(el, params);
    },

	/**
	 * @override
	 */
    isValidTemplateTag: function (el) {
        return el.tagName.toLowerCase() == 'textarea';
    }
});

jslet.ui.register('DBTextArea', jslet.ui.DBTextArea);
jslet.ui.DBTextArea.htmlTemplate = '<textarea></textarea>';

