/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class Accordion. Example:
 * <pre><code>
 * var jsletParam = {type:"Accordion",selectedIndex:1,items:[{caption:"Caption1"},{caption:"Caption2"}]};
 * //1. Declaring:
 *	&lt;div data-jslet='jsletParam' style="width: 300px; height: 400px;">
 *     &lt;div>content1&lt;/div>
 *     &lt;div>content2&lt;/div>
 *    &lt;/div>
 *  
 *  //2. Binding
 *    &lt;div id='ctrlId'>
 *      &lt;div>content1&lt;/div>
 *      &lt;div>content2&lt;/div>
 *    &lt;/div>
 *    //Js snippet
 *    var el = document.getElementById('ctrlId');
 *    jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *    jslet.ui.createControl(jsletParam, document.body);
 *
 * </code></pre>
 */
jslet.ui.Accordion = jslet.Class.create(jslet.ui.Control, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.el = el;
		Z.allProperties = 'selectedIndex,onChanged,items';
		/**
		 * {Integer} 
		 */
		Z._selectedIndex = 0;
		
		/**
		 * {Event handler} Fire when user change accordion panel.
		 * Pattern: 
		 *	function(index){}
		 *	//index: Integer
		 */
		Z._onChanged = null;
		
		/**
		 * Array of accordion items,like: [{caption: 'cap1'},{caption: 'cap2'}]
		 */
		Z._items = null;
		
		$super(el, params);
	},

	selectedIndex: function(index) {
		if(index === undefined) {
			return this._selectedIndex;
		}
		jslet.Checker.test('Accordion.selectedIndex', index).isGTEZero();
		this._selectedIndex = index;
	},
	
	onChanged: function(onChanged) {
		if(onChanged === undefined) {
			return this._onChanged;
		}
		jslet.Checker.test('Accordion.onChanged', onChanged).isFunction();
		this._onChanged = onChanged;
	},
	
	items: function(items) {
		if(items === undefined) {
			return this._items;
		}
		jslet.Checker.test('Accordion.items', items).isArray();
		var item;
		for(var i = 0, len = items.length; i < len; i++) {
			item = items[i];
			jslet.Checker.test('Accordion.items.caption', item.caption).isString().required();
		}
		this._items = items;
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
		var Z = this;
		var jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-accordion')) {
			jqEl.addClass('jl-accordion jl-border-box jl-round5');
		}
		var panels = jqEl.find('>div'), jqCaption, headHeight = 0, item;

		var captionCnt = Z._items ? Z._items.length - 1: -1, caption;
		panels.before(function(index) {
			if (index <= captionCnt) {
				caption = Z._items[index].caption;
			} else {
				caption = 'caption' + index;
			}
			return '<div class="jl-accordion-head jl-unselectable jl-bgcolor" jsletindex = "' + index + '"><a href="javascript:;">' + caption + '</a></div>';
		});

		var jqCaptions = jqEl.find('>.jl-accordion-head');
		jqCaptions.click(Z._doCaptionClick);
		jqCaptions.on('mousemove', Z._doCaptionMouseMove);
		jqCaptions.on('mouseout', Z._doCaptionMouseOut);
		
		headHeight = jqCaptions.outerHeight() * panels.length;
		var contentHeight = jqEl.innerHeight() - headHeight-1;
		
		panels.wrap('<div class="jl-accordion-body" style="height:'+contentHeight+'px;display:none"></div>');
		Z.setSelectedIndex(Z._selectedIndex);
	},
	
	_doCaptionClick: function(event){
		var jqCaption = jQuery(event.currentTarget),
			Z = jslet.ui.findJsletParent(jqCaption[0]).jslet,
			k = parseInt(jqCaption.attr('jsletindex'));
		Z.setSelectedIndex(k);
	},
	
	_doCaptionMouseMove: function(event){
		var jqCaption = jQuery(event.currentTarget);
		jqCaption.addClass('jl-accordion-head-hover');
	},
	
	_doCaptionMouseOut: function(event){
		var jqCaption = jQuery(event.currentTarget);
		jqCaption.removeClass('jl-accordion-head-hover');
	},
	
	/**
	 * Set selected index
	 * 
	 * @param {Integer} index Panel index, start at 0.
	 */
	setSelectedIndex: function(index){
		if (!index) {
			index = 0;
		}
		var Z = this;
		var jqBodies = jQuery(Z.el).find('>.jl-accordion-body');
		var pnlCnt = jqBodies.length - 1;
		if (index > pnlCnt) {
			return;
		}

		if (Z._selectedIndex == index && index < pnlCnt){
			jQuery(jqBodies[index]).slideUp('fast');
			index++;
			jQuery(jqBodies[index]).slideDown('fast');
			Z._selectedIndex = index;
			if (Z._onChanged){
				Z._onChanged.call(this, index);
			}
			return;
		}
		if (Z._selectedIndex >= 0 && Z._selectedIndex != index) {
			jQuery(jqBodies[Z._selectedIndex]).slideUp('fast');
		}
		jQuery(jqBodies[index]).slideDown('fast');
		Z._selectedIndex = index;
		if (Z._onChanged){
			Z._onChanged.call(this, index);
		}
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		var jqEl = jQuery(this.el);
		jqEl.find('>.jl-accordion-head').off();
		$super();
	}
});
jslet.ui.register('Accordion', jslet.ui.Accordion);
jslet.ui.Accordion.htmlTemplate = '<div></div>';
