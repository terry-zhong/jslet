/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBHtml. 
 * Display html text from one field. 
 * Example:
 * <pre><code>
 * var jsletParam = {type:"DBHtml",dataset:"employee",field:"comment"};
 * 
 * //1. Declaring:
 * &lt;div data-jslet='type:"DBHtml",dataset:"employee",field:"comment"' />
 * or
 * &lt;div data-jslet='jsletParam' />
 * 
 *  //2. Binding
 * &lt;div id="ctrlId"  />
 * //Js snippet
 * var el = document.getElementById('ctrlId');
 * jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 * jslet.ui.createControl(jsletParam, document.body);
 *
 * </code></pre>
 */
jslet.ui.DBHtml = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		this.allProperties = 'dataset,field';
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
		return el.tagName.toLowerCase() == 'div';
	},

	/**
	 * @override
	 */
	doValueChanged: function() {
		var content = this._dataset.getFieldText(this._field);
		this.el.innerHTML = content;
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		this.refreshControl(jslet.data.RefreshEvent.updateAllEvent(), true);
	}
});

jslet.ui.register('DBHtml', jslet.ui.DBHtml);
jslet.ui.DBHtml.htmlTemplate = '<div style="width:200px;height:200px"></div>';
