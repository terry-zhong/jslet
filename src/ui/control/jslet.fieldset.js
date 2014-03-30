/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class FieldSet. Example:
 * <pre><code>
 *   //1. Declaring:
 *      &lt;div data-jslet='type:"FieldSet"' />
 *
 *  //2. Binding
 *      &lt;div id='ctrlId' />
 *      //Js snippet
 *      var jsletParam = {type:"FieldSet"};
 *      var el = document.getElementById('ctrlId');
 *      jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *      var jsletParam = {type:"FieldSet"};
 *      jslet.ui.createControl(jsletParam, document.body);
 *
 * </code></pre>
 */
jslet.ui.FieldSet = jslet.Class.create(jslet.ui.Control, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.el = el;
		Z.allProperties = 'caption,collapsed';
		/**
		 * {String} Fieldset caption
		 */
		Z._caption = null; 
		
		/**
		 * {Boolean} Fieldset is collapsed or not
		 */
		Z._collapsed = false;
		
		$super(el, params);
	},

	caption: function(caption) {
		if(caption === undefined) {
			return this._caption;
		}
		jslet.Checker.test('FieldSet.caption', caption).isString();
		this._caption = caption;
	},

	collapsed: function(collapsed) {
		if(collapsed === undefined) {
			return this._collapsed;
		}
		this._collapsed = collapsed ? true: false;
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
	renderAll: function () {
		var Z = this, jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-fieldset')) {
			jqEl.addClass('jl-fieldset');
		}
		
		var tmpl = ['<legend class="jl-fieldset-legend">'];
		tmpl.push('<span class="jl-fieldset-title"><input type="text" class="jl-fieldset-btn" readonly="readonly" tabindex="-1" value="▼"></input>');
		tmpl.push('<span>');
		tmpl.push(Z._collapsed);
		tmpl.push('</span></span></legend><div class="jl-fieldset-body"></div>');
		
		var nodes = Z.el.childNodes, 
			children = [],
			i, cnt;
		cnt = nodes.length;
		for(i = 0; i < cnt; i++){
			children.push(nodes[i]);
		}

		jqEl.html(tmpl.join(''));
		var obody = jQuery(Z.el).find('.jl-fieldset-body')[0];
		cnt = children.length;
		for(i = 0; i < cnt; i++){
			obody.appendChild(children[i]);
		}
		
		jqEl.find('input.jl-fieldset-btn').click(jQuery.proxy(Z._doExpandBtnClick, this));
	},
	
	_doExpandBtnClick: function(){
		var Z = this, jqEl = jQuery(Z.el);
		var fsBody = jqEl.find('.jl-fieldset-body');
		if (!Z._collapsed){
			fsBody.slideUp();
			jqEl.addClass('jl-fieldset-collapse');
			jqEl.find('input.jl-fieldset-btn').addClass('jl-fieldset-btn-up');
		}else{
			fsBody.slideDown();
			jqEl.removeClass('jl-fieldset-collapse');
			jqEl.find('input.jl-fieldset-btn').removeClass('jl-fieldset-btn-up');
		}
		fsBody[0].focus();
		Z._collapsed = !Z._collapsed;
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var jqEl = jQuery(this.el);
		jqEl.find('input.jl-fieldset-btn').off();
		$super();
	}
});

jslet.ui.register('FieldSet', jslet.ui.FieldSet);
jslet.ui.FieldSet.htmlTemplate = '<fieldset></fieldset>';
