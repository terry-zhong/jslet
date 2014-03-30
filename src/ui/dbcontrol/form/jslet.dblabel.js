/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBLabel. 
 * Display field name, use this control to void hard-coding field name, and you can change field name dynamically. 
 * Example:
 * <pre><code>
 * var jsletParam = {type:"DBLabel",dataset:"employee",field:"department"};
 * 
 * //1. Declaring:
 * &lt;label data-jslet='type:"DBLabel",dataset:"employee",field:"department"' />
 * or
 * &lt;label data-jslet='jsletParam' />
 *
 *  //2. Binding
 * &lt;label id="ctrlId"  />
 * //Js snippet
 * var el = document.getElementById('ctrlId');
 * jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 * jslet.ui.createControl(jsletParam, document.body);
 *
 * </code></pre>
 */
jslet.ui.DBLabel = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		this.allProperties = 'dataset,field';
		this.isLabel = true;
		$super(el, params);
	},

	/**
	 * @override
	 */
	bind: function () {
		this.renderAll();
	},

	/**
	 * @override
	 */
	isValidTemplateTag: function (el) {
		return el.tagName.toLowerCase() == 'label';
	},

	/**
	 * @override
	 */
	doMetaChanged: function(metaName) {
		if(metaName && jslet.ui.DBLabel.METANAMES.indexOf(metaName) < 0) {
			return;
		}
		var Z = this, subType = Z._fieldMeta,
			fldObj = Z._dataset.getField(Z._field),
			content = '';
		if((!subType || subType == 'label') && (!metaName || metaName == 'label' || metaName == 'required')) {
			content = fldObj.label();
			if (fldObj.required()) {
				content += '<span class="jl-lbl-required">' + 
					jslet.ui.DBLabel.REQUIREDCHAR + '<span>';
			}
			Z.el.innerHTML = content || '';
			return;
		}
		if(subType && subType == 'tip' && 
			(!metaName || metaName == subType)) {
			content = fldObj.tip();
			Z.el.innerHTML = content || '';
			return;
		}
		if(subType  && subType == 'message' && 
			(metaName && metaName == subType)) {
			content = fldObj.message();
			Z.el.innerHTML = content || '';
			return;
		}
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		var jqEl = jQuery(this.el),
			subType = this.fieldMeta();
		
		if(subType == 'message') {
			if(!jqEl.hasClass('jl-lbl-message')) {
				jqEl.addClass('jl-lbl-message');
			}
		}
		if(subType == 'tip') {
			if(!jqEl.hasClass('jl-lbl-tip')) {
				jqEl.addClass('jl-lbl-tip');
			}
		}
		
		this.refreshControl(jslet.data.RefreshEvent.updateAllEvent());
	}
});

jslet.ui.DBLabel.REQUIREDCHAR = '*';
jslet.ui.DBLabel.METANAMES = ['label', 'required', 'tip', 'message'];
jslet.ui.register('DBLabel', jslet.ui.DBLabel);
jslet.ui.DBLabel.htmlTemplate = '<label></label>';

