/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
* @class DBCustomComboBox: used in jslet.ui.DBComboDlg and jslet.ui.DBDatePicker
*/
jslet.ui.DBCustomComboBox = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        var Z = this;
        if (!Z.allProperties) {
            Z.allProperties = 'dataset,field,textReadOnly';
        }
        if (!Z.requiredProperties) {
            Z.requiredProperties = 'field';
		}
        Z.dataset;
        Z.field;
        Z.textReadOnly;
        Z.buttonClick;
        Z.afterBind;
        if (!Z.comboButtonCls) {
            Z.comboButtonCls = 'jl-combodropdown';
        }
        if (!Z.comboButtonDisabledCls) {
            Z.comboButtonDisabledCls = 'jl-combodropdown-disabled';
        }
        Z.enableInvalidTip = false;

        $super(el, params);
    },

	/**
	 * @override
	 */
    bind: function () {
        var Z = this;
        Z.checkDataField();
        Z.textReadOnly = Z.textReadOnly ? true : false;
        var jqEl = jQuery(Z.el);
        if (!jqEl.hasClass('jl-customcombo')) {
        	jqEl.addClass('jl-customcombo');
        }

        Z.el.style.position = 'relative';

        var template = ['<div class="jl-combosel-text-host"><input type="text" class="jl-combosel-text jl-border-box" /></div>'];
        template.push('<div class="jl-combo-btn ');
        template.push(Z.comboButtonCls);
        template.push(' jl-unselectable" unselectable="on"/>');
        jqEl.html(template.join(''));

        var dbtext = jqEl.find('[type="text"]')[0];
        Z.textCtrl = new jslet.ui.DBText(dbtext, {
            type: 'dbtext',
            dataset: Z.dataset,
            field: Z.field,
            valueIndex: Z.valueIndex
        });
        jQuery(Z.textCtrl.el).on('keydown', this.popupUp);
        
        var dbbtn = Z.el.childNodes[1];
        Z.buttonCtrl = new jslet.ui.DBComboButton(dbbtn, {
            dataset: Z.dataset,
            field: Z.field,
            enableInvalidTip: false,
            buttonDisabledCls: Z.comboButtonDisabledCls
        });

        if (this.buttonClick) {
        	jQuery(dbbtn).on('click', function(event){
        		Z.buttonClick();
        	});
        }
    },

	/**
	 * @override
	 */
    renderAll: function () {
        this.bind();
    },
    
    popupUp: function(event) {
    	if(event.keyCode == jslet.ui.KeyCode.DOWN) {
    		var el = jslet.ui.findJsletParent(this.parentNode);
    		el.jslet.buttonClick();
    	}
    },
    
    focus: function() {
    	this.textCtrl.focus();
    },
    
	/**
	 * @override
	 */
    forceRefreshControl: function(){
    	this.textCtrl.forceRefreshControl();
    },
    
	/**
	 * @override
	 */
    destroy: function($super){
    	var dbbtn = this.el.childNodes[1];
    	dbbtn.onclick = null;
    	var Z = this;
    	Z.textCtrl.destroy();
    	Z.buttonCtrl.destroy();
    	Z.textCtrl = null;
    	Z.buttonCtrl = null;
    	jQuery(Z.textCtrl.el).off('keydown', this.popupUp);
    	$super();
    }
});

/**
* DBComboButton: used in jslet.ui.DBCustomComboBox
*/
jslet.ui.DBComboButton = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        if (!this.allProperties) {
            this.allProperties = 'dataset,field,buttonDisabledCls,enableInvalidTip';
        }
        if (!this.requiredProperties) {
            this.requiredProperties = 'field';
        }

        this.dataset;
        this.field;
        $super(el, params);
    },

	/**
	 * @override
	 */
    bind: function () {
        this.checkDataField();
        var fldObj = this.dataset.getField(this.field);
        if (fldObj.readOnly() || !fldObj.enabled()) {
            jQuery(this.el).addClass(this.buttonDisabledCls);
        }
    },

	/**
	 * @override
	 */
    refreshControl: function (evt) {
        if (evt.eventType == jslet.data.UpdateEvent.METACHANGE
				&& (evt.eventInfo.enabled != undefined || evt.eventInfo.readOnly != undefined)) {
            var flag = false;
            if (evt.eventInfo.enabled != undefined) {
                flag = !evt.eventInfo.enabled;
            } else if (evt.eventInfo.readOnly != undefined) {
                flag = evt.eventInfo.readOnly;
            }
            this.el.disabled = flag;
            if (flag) {
                jQuery(this.el).addClass(this.buttonDisabledCls);
            } else {
            	jQuery(this.el).removeClass(this.buttonDisabledCls);
            }
        }
    }, // end refreshControl
    
	/**
	 * @override
	 */
    destroy: function($super){
    	this.dataset = null;
    	this.field = null;
    	$super();
    }
});

