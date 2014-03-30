/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBError. 
 * Display dataset error.
 * 
 * Example:
 * <pre><code>
 *  var jsletParam = {type:"DBError",dataset:"employee"};
 *  
 * //1. Declaring:
 *  &lt;div data-jslet='type:"DBError",dataset:"employee"' />
 *  or
 *  &lt;div data-jslet='jsletParam' />
 *  
 *  //2. Binding
 *  &lt;div id="ctrlId"  />
 *  //Js snippet
 *  var el = document.getElementById('ctrlId');
 *  jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *  jslet.ui.createControl(jsletParam, document.body);
 *  
 * </code></pre>
 */
jslet.ui.DBError = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		this.allProperties = 'dataset';
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
		var Z = this,
			jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-errorpanel')) {
			jqEl.addClass('jl-errorpanel');
		}

		Z.renderAll();
	},

	/**
	 * @override
	 */
	refreshControl: function (evt) {
		if (evt && evt.eventType == jslet.data.RefreshEvent.ERROR) {
			this.el.innerHTML = evt.message || '';
		}
	}, // end refreshControl

	/**
	 * @override
	 */
	renderAll: function () {
		this.refreshControl();
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var Z = this;
				
		$super();
	}

});

jslet.ui.register('DBError', jslet.ui.DBError);
jslet.ui.DBError.htmlTemplate = '<div></div>';
