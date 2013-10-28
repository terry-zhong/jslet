/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBSpinEdit. 
 * <pre><code>
 * 		var jsletParam = {type:"DBSpinEdit",dataset:"employee",field:"age", minValue:18, maxValue: 100, step: 5};
 * 
 * //1. Declaring:
 *      &lt;div data-jslet='type:"DBSpinEdit",dataset:"employee",field:"age", minValue:18, maxValue: 100, step: 5' />
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
jslet.ui.DBSpinEdit = jslet.Class.create(jslet.ui.DBText, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        var Z = this;
        if (!Z.allProperties) {
            Z.allProperties = 'dataset,field,minValue,maxValue,step';
        }
        if (!Z.requiredProperties) {
            Z.requiredProperties = 'field';
        }
        Z.field;
        /**
         * {Integer} Minimized value.
         */
        Z.minValue = 0;
        /**
         * {Integer} Maximinzed value.
         */
        Z.maxValue = 100;
        /**
         * {Integer} Step value.
         */
        Z.step = 1;
        
        Z.enableInvalidTip = false;

        $super(el, params);
    },

	/**
	 * @override
	 */
    isValidTemplateTag: function (el) {
        var tag = el.tagName.toLowerCase();
        return tag == 'div';
    },

	/**
	 * @override
	 */
    bind: function () {
        var Z = this;
        Z.checkDataField();
        var jqEl = jQuery(Z.el);
        jqEl.addClass('jl-spinedit');
        if (!Z.minValue)
            Z.minValue = 0;
        else {
            Z.minValue = parseFloat(Z.minValue);
            Z.minValue = Z.minValue ? Z.minValue : 0;
        }

        if (!Z.maxValue) {
            Z.maxValue = 100;
        } else {
            Z.maxValue = parseFloat(Z.maxValue);
            Z.maxValue = Z.maxValue ? Z.maxValue : 100;
        }

        if (!Z.step) {
            Z.step = 1;
        } else {
            Z.step = parseFloat(Z.step);
            Z.step = Z.step ? Z.step : 1;
        }

        var s = '<div class="jl-spinedit-input"><input class="jl-border-box"/></div><div class="jl-spinedit-upbtn jl-spinedit-upbtn-up jl-unselectable" unselectable="on" ondblclick="return false;"></div><div class="jl-spinedit-downbtn jl-spinedit-downbtn-up jl-unselectable" ondblclick="return false;" unselectable="on"></div>';

        jqEl.html(s);
        
        var editor = jqEl.find('.jl-border-box')[0],
        upButton = jqEl.find('.jl-spinedit-upbtn-up')[0],
        downButton = jqEl.find('.jl-spinedit-downbtn-up')[0];
        Z.editor = editor;
        jQuery(Z.editor).on("keydown", function(event){
        	var keyCode = event.keyCode;
        	if(keyCode == jslet.ui.KeyCode.UP) {
        		Z.decValue();
        		event.preventDefault();
        		return;
        	}
        	if(keyCode == jslet.ui.KeyCode.DOWN) {
        		Z.incValue();
        		event.preventDefault();
        		return;
        	}
        });
        new jslet.ui.DBText(editor, {
            dataset: Z.dataset,
            field: Z.field,
            beforeUpdateToDataset: Z.beforeUpdateToDataset,
            maxValue: Z.maxValue,
            minValue: Z.minValue,
            valueIndex: Z.valueIndex
        });

        jQuery(upButton).on('mousedown', function () {
            this.className = 'jl-spinedit-upbtn jl-spinedit-upbtn-down jl-unselectable';
            Z.editor.blur();
            Z.incValue();
            Z.editor.focus()
        });
        jQuery(upButton).on('mouseup', function () {
            this.className = 'jl-spinedit-upbtn jl-spinedit-upbtn-up jl-unselectable';
        });
        
        jQuery(downButton).on('mousedown', function () {
            this.className = 'jl-spinedit-downbtn jl-spinedit-downbtn-down jl-unselectable';
            Z.editor.blur();
            Z.decValue();
            Z.editor.focus()
        });
        jQuery(downButton).on('mouseup', function () {
            this.className = 'jl-spinedit-downbtn jl-spinedit-downbtn-up jl-unselectable';
        });
    }, // end bind

	/**
	 * @override
	 */
    beforeUpdateToDataset: function () {
        var Z = this,
        	val = Z.el.value;
        if (val) {
            val = parseFloat(val);
            if (val) {
                if (val > Z.maxValue)
                    val = Z.maxValue;
                else if (val < Z.minValue)
                    val = Z.minValue;
                val = String(val)
            } else
                val = Z.minValue
        }
        Z.el.value = val;
        return true;
    }, // end beforeUpdateToDataset

    setValueToDataset: function (val) {
        var Z = this;
        if (Z.silence) {
            return;
        }
        Z.silence = true;
        if (val == undefined) {
            val = Z.value;
        }
        try {
            Z.dataset.setFieldValue(Z.field, val, Z.valueIndex);
        } catch (e) {
            jslet.showException(e);
        } finally {
            Z.silence = false;
        }
    }, // end setValueToDataset

    incValue: function () {
        var Z = this,
        	val = Z.dataset.getFieldValue(Z.field, Z.valueIndex);
        if (!val) {
            val = 0;
        }
        if (val == Z.maxValue) {
            return;
        } else if (val < Z.maxValue) {
            val += Z.step;
        } else {
            val = Z.maxValue;
        }
        if (val > Z.maxValue) {
            value = Z.maxValue;
        }
        Z.setValueToDataset(val);
    }, // end incValue

    decValue: function () {
        var Z = this,
        	val = Z.dataset.getFieldValue(Z.field, Z.valueIndex);
        if (!val) {
            val = 0;
        }
        if (val == Z.minValue) {
            return;
        } else if (val > Z.minValue) {
            val -= Z.step;
        } else {
            val = Z.minValue;
        }
        if (val < Z.minValue)
            val = Z.minValue;
        Z.setValueToDataset(val);
    }, // end decValue
    
    focus: function() {
    	this.editor.focus();
    },
    
	/**
	 * @override
	 */
    renderAll: function(){
    	var jqEl = jQuery(this.el),
    		editor = jqEl.find('.jl-border-box')[0].firstChild;
    	editor.jslet.renderAll();
    },
    
	/**
	 * @override
	 */
    destroy: function(){
    	var jqEl = jQuery(this.el);
    	jQuery(Z.editor).off();
    	Z.editor = null;
        jqEl.find('.jl-upbtn-up').off();
        jqEl.find('.jl-downbtn-up').off();
    }
    
});
jslet.ui.register('DBSpinEdit', jslet.ui.DBSpinEdit);
jslet.ui.DBSpinEdit.htmlTemplate = '<div></div>';

