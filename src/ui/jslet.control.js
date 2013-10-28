/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
* @class
* Control Class, base class for all control
*/
jslet.ui.Control = jslet.Class.create({
	/**
	 * Constructor method
	 * 
	 * @param {Html Element} el Html element
	 * @param {String or Object} params Parameters of this control, it would be a json string or object, like: '{prop1: value1, prop2: value2}';
	 */
    initialize: function (el, params) {
        this.el = el;

        this.allProperties;
        this.requiredProperties;
        params = jslet.ui._evalParams(params);
        if (this.isValidTemplateTag	&& !this.isValidTemplateTag(this.el)) {
            var ctrlClass = jslet.ui.getControlClass(params.type), template;
            if (ctrlClass) {
                template = ctrlClass.htmlTemplate;
            } else {
                template = '';
            }
            throw new Error(jslet.formatString(jslet.locale.DBControl.invalidHtmlTag, template));
        }

        this.setParams(params);
        if (this.checkRequiredProperty) {
            this.checkRequiredProperty();
        }
        this.el.jslet = this;
        if (this.beforeBind) {
            this.beforeBind(params);
        }
        if (this.bind) {
            this.bind();
        }
        if (this.afterBind) {
            this.afterBind();
        }
    },

    /**
     * @private
     */
    setParams: function (params) {
        if (!params) {
            return;
        }
        var arrParamName = this.allProperties.split(','),
        	cnt = arrParamName.length,
        	name, value;
        for (var i = 0; i < cnt; i++) {
            name = arrParamName[i];
            if (name) {
                name = name.trim();
                value = params[name];
                if (value !== undefined) {
                    this[name] = value;
                }
            }//enf if
        }//end for
        //valueIndex is a special parameter used for field with multiple values 
        name = 'valueIndex';
        value = params[name];
        if (value !== undefined) {
            this[name] = value;
        }
        
    },

    /**
     * @private
     */
    checkRequiredProperty: function () {
        if (!this.requiredProperties) {
            return;
        }
        var arrProps = this.requiredProperties.split(','),
        cnt = arrProps.length, name;
        for (var i = 0; i < cnt; i++) {
            name = arrProps[i].trim();
            if (!this[name]) {
                throw new Error(jslet.formatString(jslet.locale.DBControl.expectedProperty, [name]));
            }
        }//end for
    },
    
    /**
     * Destroy method
     */
    destroy: function(){
    	this.el.jslet = null;
    	this.el = null;
    }
});

/**
 * @class
 * Base data sensitive control
 */
jslet.ui.DBControl = jslet.Class.create(jslet.ui.Control, {
    initialize: function ($super, el, params) {
        $super(el, params);
    },

    /**
     * @protected
     * Call this method before binding parameters to a html element, you can rewrite this in your owner control
	 * @param {String or Object} params Parameters of this control, it would be a json string or object, like: '{prop1: value1, prop2: value2}';
     * 
     */
    beforeBind: function (params) {
        this.dataset;
        this.field;
        this.checkDataset();
        //control can show data at specified rec number,for example:dbcheckbox
        if (params.field && params.specifyRecno) {
            this.specifyRecno = params.specifyRecno;
        }
        this.dataset.addLinkedControl(this);
    },

    /**
     * @private
     */
    getDatasetInParentElement: function () {
        var el = this.el, pEl = null;
        while (true) {
            pEl = jslet.ui.getParentElement(el, 1);
            if (!pEl) {
                break;
            }
            if (pEl.jslet) {
                return pEl.jslet.dataset;
            }
            el = pEl;
        } //end while
        return null;
    },

    /**
     * @protected
     * Render invalid message and change the control to "invalid" style.
     * 
     *  @param {String} invalidMsg Invalid message, if it's null, clear the 'invalid' style. 
     */
    renderInvalid: function (invalidMsg) {
    	var Z = this;
        if (!Z.field || !Z.enableInvalidTip) {
            return;
        }
        var errFldObj = Z.dataset.getErrorField(Z.field, Z.valueIndex);
        var invalidMsg = '';
        if (errFldObj){
            jQuery(Z.el).addClass('jl-invalid');
            invalidMsg = errFldObj.invalidMsg;
        } else {
        	jQuery(Z.el).removeClass('jl-invalid');
        }
        if(!jslet.ui.globalTip) {
            Z.el.title = invalidMsg || '';
        }
        Z.invalidMessage = invalidMsg;
    },

    /**
     * @private
     * Check if dataset exists, if dataset is a String, change it to jslet.data.Dataset object first.
     */
    checkDataset: function () {
        var dsName = this.dataset;
        if (!dsName) {
            dsName = this.getDatasetInParentElement();
        }
        var ds;
        if (dsName && typeof (dsName) == 'string') {
            ds = jslet.data.dataModule.get(dsName);
        } else {
            ds = this.dataset;
        }
        if (!ds) {
            throw new Error(jslet.formatString(jslet.locale.DBControl.datasetNotFound, [dsName]));
        }
        this.dataset = ds;
    },

    /**
     * @private 
     * Check the specified exists
     * 
     * @param {String} fldName Field name.
     */
    checkDataField: function (fldName) {
        if (!fldName) {
            fldName = this.field;
        }
        var fldObj = this.dataset.getField(fldName);
        if (!fldObj) {
            throw new Error(jslet.formatString(jslet.locale.Dataset.fieldNotFound, [fldName]));
        }
    },

    /**
     * Check if this control is in current record.
     * In DBTable edit mode, one field corresponds many edit control(one row one edit control), but only one edit control is in active record.
     * Normally, only edit control in active record will refresh.  
     */
    isActiveRecord: function(){
    	var Z = this;
    	if(!Z.currRecno && Z.currRecno !== 0) {
    		return true;
    	}
        return Z.currRecno == Z.dataset.recno();
    },
    
    /**
     * Force refresh control, regardless of which in active record or not.
     */
    forceRefreshControl: function(){
    	this.refreshControl(jslet.data.UpdateEvent.updateAllEvent, true);
    },
    
    destroy: function ($super) {
        if (this.dataset) {
            this.dataset.removeLinkedControl(this);
        }
        this.dataset = null;
        $super();
    }
});

/**
* @private
* Convert string parameters to object
* 
* @param {String or Object} params Control parameters.
* @return {Object}
*/
jslet.ui._evalParams = function (params) {
    if (!params) {
        throw new Error('Jslet param required!');
    }
    if (typeof (params) == 'string') {
        var p = params.trim();
        if (!p.startsWith('{') && p.indexOf(':')>0) {
            p = '{' + p +'}';
        }
        try {
            params = new Function('return ' + p)();
            return params;
        } catch (e) {
            throw new Error(jslet.formatString(jslet.locale.DBControl.invalidJsletProp, [params]));
        }
    }
    return params;
}

/**
* Hold all jslet control's configurations
*/
jslet.ui.controls = new jslet.SimpleMap();

/**
* Register jslet control class.
* <pre><code>
* jslet.ui.register('Accordion', jslet.ui.Accordion);
* </code></pre>
* 
* @param {String} ctrlName Control name.
* @param {jslet.Class} ctrlType Control Class
*/
jslet.ui.register = function (ctrlName, ctrlType) {
    jslet.ui.controls.set(ctrlName.toLowerCase(), ctrlType);
}

/**
* Create jslet control according to control configuration, and add it to parent element.
* 
* @param {String or Object} jsletparam Jslet Parameter
* @param {Html Element} parent Parent html element which created control will be added to.
* @param {Integer} width Control width, unit: px;
* @param {Integer} height Control height, Unit: px; 
* @return {jslet control}
*/
jslet.ui.createControl = function (jsletparam, parent, width, height) {
    var isAuto = false, 
    	pnode = parent,
    	container = document.createElement('div'),
    	ctrlParam = jslet.ui._evalParams(jsletparam),
    	controlType = ctrlParam.type;
    if (!controlType) {
        controlType = jslet.ui.controls.DBTEXT;
    }
    var ctrlClass = jslet.ui.controls.get(controlType.toLowerCase());
    if (!ctrlClass) {
        throw new Error('NOT found control type: ' + controlType);
    }
    container.innerHTML = ctrlClass.htmlTemplate;

    var el = container.firstChild;
    container.removeChild(el);
    
    if (parent) {
        parent.appendChild(el);
    } else {
        document.body.appendChild(el);
    }
    if (width) {
        if (parseInt(width) == width)
            width = width + 'px';
        el.style.width = width; // parseInt(width) + 'px';
    }
    if (height) {
        if (parseInt(height) == height)
            height = height + 'px';
        el.style.height = height; // parseInt(height) + 'px';
    }

    return new ctrlClass(el, ctrlParam);
}

/**
 * Get jslet class with class name.
 * 
 * @param {String} name Class name.
 * @return {jslet.Class}
 */
jslet.ui.getControlClass = function (name) {
    return jslet.ui.controls.get(name.toLowerCase());
}

/**
* Bind jslet control to an existing html element.
* 
* @param {Html Element} el Html element
* @param {String or Object} jsletparam Control parameters
*/
jslet.ui.bindControl = function (el, jsletparam) {
    if (!jsletparam)
        jsletparam = jQuery(el).attr('data-jslet');

    var ctrlParam = jslet.ui._evalParams(jsletparam);
    var controlType = ctrlParam.type;
    if (!controlType) {
        el.jslet = ctrlParam;
        return;
    }
    var ctrlClass = jslet.ui.controls.get(controlType.toLowerCase());
    if (!ctrlClass) {
        throw new Error('NOT found control type: ' + controlType);
    }
    new ctrlClass(el, ctrlParam);
}

/**
* Scan the specified html element children and bind jslet control to these html element with 'data-jslet' attribute.
* 
* @param {Html Element} pElement Parent html element which need to be scan, if null, document.body used.
*/
jslet.ui.install = function (pElement) {
	if(!pElement && jslet.locale.isRtl){
		var jqBody = jQuery(document.body);
		if(!jqBody.hasClass('jl-rtl')) {
			jqBody.addClass('jl-rtl');
		}
	}
    var htmlTags;
    if (!pElement){
        pElement = document.body;
	}
    htmlTags = jQuery(pElement).find('*[data-jslet]');

    var cnt = htmlTags.length, el;
    for (var i = 0; i < cnt; i++) {
        el = htmlTags[i];
        jslet.ui.bindControl(el);
    }
    if(jslet.ui.onReady){
    	jslet.ui.onReady();
    }
}

/**
 * {Event} Fired after jslet has installed all controls.
 * Pattern: function(){};
 */
jslet.ui.onReady = null;

/**
* Scan the specified html element children and unbind jslet control to these html element with 'data-jslet' attribute.
* 
* @param {Html Element} pElement Parent html element which need to be scan, if null, document.body used.
*/
jslet.ui.uninstall = function (pElement) {
    var htmlTags;
    if (!pElement) {
        htmlTags = jQuery('*[data-jslet]');
    } else {
        htmlTags = jQuery(pElement).find('*[data-jslet]');
    }
    var el;
    for(var i =0, cnt = htmlTags.length,el; i < cnt; i++){
    	el = htmlTags[i];
        if (el.jslet.destroy) {
            el.jslet.destroy();
        }
        el.jslet = null;
    }
	if(jslet.ui.menuManager) {
		jQuery(document).off('mousedown', jslet.ui.menuManager.hideAll);
	}
}
