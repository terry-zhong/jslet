/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBPageBar. 
 * Functions:
 * 1. First page, Prior Page, Next Page, Last Page;
 * 2. Can go to specified page;
 * 3. Can specify page size on runtime;
 * 4. Need not write any code;
 * 
 * Example:
 * <pre><code>
 * 		var jsletParam = {type:"DBPageBar",dataset:"bom",pageSizeList:[20,50,100,200]};
 * 
 * //1. Declaring:
 *      &lt;div data-jslet='type:"DBPageBar",dataset:"bom",pageSizeList:[20,50,100,200]' />
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
jslet.ui.DBPageBar = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        var Z = this;
        if (!Z.allProperties) {
            Z.allProperties = 'dataset,showPageSize,showGotoButton,pageSizeList';
        }
        Z.dataset = null;
        /**
         * {Boolean} Identify if the "Page Size" part shows or not
         */
        Z.showPageSize = true;
        /**
         * {Boolean} Identify if the "GoTo" part shows or not
         */
        Z.showGotoButton = true;
        
        /**
         * {Integer[]) Array of integer, like: [50,100,200]
         */
        Z.pageSizeList = null;

        $super(el, params)
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
        if (!jqEl.hasClass('jl-pagebar')) {
        	jqEl.addClass('jl-pagebar');
        }
        var template = ['<select class="jl-pb-item"></select><label class="jl-pb-item jl-pb-label">', jslet.locale.DBPageBar.pageSizeLabel,
		                '</label><a class="jl-pb-item jl-pb-button jl-pb-first" href="javascript:;"></a><a class="jl-pb-item jl-pb-button jl-pb-prior" href="javascript:;"></a><label class="jl-pb-item jl-pb-label">',
		                jslet.locale.DBPageBar.pageNumLabel,
		                '</label><input class="jl-pb-item jl-pb-pagenum" value="1" size="2" ></input><a class="jl-pb-item jl-pb-button jl-pb-goto" href="javascript:;"></a><label class="jl-pb-item jl-pb-label">',
		                jslet.formatString(jslet.locale.DBPageBar.pageCountLabel, [0]),
		                '</label><a class="jl-pb-item jl-pb-button jl-pb-next" href="javascript:;"></a><a class="jl-pb-item jl-pb-button jl-pb-last" href="javascript:;"></a></div>'
		                ];
        jqEl.html(template.join(''));

        var oPageSize = Z.el.childNodes[0];
        if (Z.showPageSize) {
            var rows = Z.pageSizeList;
            if (!rows) {
                rows = [100, 200, 500];
            }
            var cnt = rows.length, s = '';
            for (var i = 0; i < cnt; i++) {
                s += '<option value=' + rows[i] + '>' + rows[i] + '</option>';
            }

            oPageSize.innerHTML = s;
            Z.dataset.pageSize(parseInt(oPageSize.value));
        }

        jQuery(oPageSize).on('change', function (event) {
            var ds = this.parentElement.jslet.dataset;
            ds.pageNo(1);
            ds.pageSize(parseInt(this.value));
            ds.applyRefresh();
        });

        Z._firstBtn = Z.el.childNodes[2];
        Z._priorBtn = Z.el.childNodes[3];

        Z._pageNoTxt = Z.el.childNodes[5];
        Z._gotoBtn = Z.el.childNodes[6];

        Z._pageCountLbl = Z.el.childNodes[7];

        Z._nextBtn = Z.el.childNodes[8];
        Z._lastBtn = Z.el.childNodes[9];

        jQuery(Z._firstBtn).on('click', function (event) {
        	if(this.disabled) {
        		return;
        	}
            var ds = this.parentElement.jslet.dataset;
            ds.pageNo(1);
            ds.applyRefresh();
        });

        jQuery(Z._priorBtn).on('click', function (event) {
        	if(this.disabled) {
        		return;
        	}
            var ds = this.parentElement.jslet.dataset,
            	num = ds.pageNo();
            if (num == 1) {
                return;
            }
            ds.pageNo(num - 1);
            ds.applyRefresh();
        });

        jQuery(Z._gotoBtn).on('click', function (event) {
            var oJslet = this.parentElement.jslet;
            var ds = oJslet.dataset;
            var num = parseInt(oJslet._pageNoTxt.value);
            if (num < 1) {
                num = 1;
            }
            if (num > ds.pageCount()) {
                num = ds.pageCount();
            }
            ds.pageNo(num);
            ds.applyRefresh();
        });

        jQuery(Z._nextBtn).on('click', function (event) {
        	if(this.disabled) {
        		return;
        	}
            var oJslet = this.parentElement.jslet,
            	ds = oJslet.dataset,
            	num = ds.pageNo();
            if (num >= ds.pageCount()) {
                return;
            }
            ds.pageNo(++num);
            ds.applyRefresh();
        });

        jQuery(Z._lastBtn).on('click', function (event) {
        	if(this.disabled) {
        		return;
        	}
            var oJslet = this.parentElement.jslet,
            	ds = oJslet.dataset;

            if (ds.pageCount() < 1) {
                return;
            }
            ds.pageNo(ds.pageCount());
            ds.applyRefresh();
        });

        jQuery(Z._pageNoTxt).on('keypress', function (event) {
    		event = jQuery.event.fix( event || window.event );
            var keyCode = event.which;

            var validChars = new Array('0', '1', '2', '3', '4', '5', '6', '7', '8', '9');
            if (validChars.indexOf(String.fromCharCode(keyCode)) < 0) {
                event.preventDefault();
            }
        });

        Z.renderAll();
    },

	/**
	 * @override
	 */
    refreshControl: function (evt) {
        if (evt.eventType != jslet.data.UpdateEvent.PAGECHANGE) {
            return;
        }
        var Z = this;
        var num = Z.dataset.pageNo(), count = Z.dataset.pageCount();
        Z._pageNoTxt.value = num;
        Z._pageCountLbl.innerHTML = jslet.formatString(jslet.locale.DBPageBar.pageCountLabel, [count])
        Z._refreshButtonStatus();
    }, // end refreshControl

    _refreshButtonStatus: function() {
    	var Z = this, 
    		ds = Z.dataset,
    		pageNo = ds.pageNo(),
    		pageCnt = ds.pageCount(),
    		prevDisabled = true,
    		nextDisabled = true;
    	if(pageNo > 1) {
    		prevDisabled = false;
    	}
    	if(pageNo < pageCnt) {
    		nextDisabled = false;
    	}
    	if(prevDisabled) {
    		jQuery(Z._firstBtn).addClass('jl-pb-first-disabled jl-pb-button-disabled');
    		jQuery(Z._priorBtn).addClass('jl-pb-prior-disabled jl-pb-button-disabled');
    	}
    	else {
    		jQuery(Z._firstBtn).removeClass('jl-pb-first-disabled jl-pb-button-disabled');
    		jQuery(Z._priorBtn).removeClass('jl-pb-prior-disabled jl-pb-button-disabled');
    	}
    	if(nextDisabled) {
    		jQuery(Z._nextBtn).addClass('jl-pb-next-disabled jl-pb-button-disabled');
    		jQuery(Z._lastBtn).addClass('jl-pb-last-disabled jl-pb-button-disabled');
    	}
    	else {
    		jQuery(Z._nextBtn).removeClass('jl-pb-next-disabled jl-pb-button-disabled');
    		jQuery(Z._lastBtn).removeClass('jl-pb-last-disabled jl-pb-button-disabled');
    	}
    	Z._firstBtn.disabled = prevDisabled;
    	Z._priorBtn.disabled = prevDisabled;
    	Z._nextBtn.disabled = nextDisabled;
    	Z._lastBtn.disabled = nextDisabled;
    },
    
	/**
	 * @override
	 */
    renderAll: function () {
        var displayStyle = this.showPageSize ? 'inline' : 'none';
        var oel = this.el;
        oel.childNodes[0].style.display = displayStyle;
        oel.childNodes[1].style.display = displayStyle;

        this.refreshControl(new jslet.data.UpdateEvent(jslet.data.UpdateEvent.PAGECHANGE,null));
    },
    
	/**
	 * @override
	 */
    destroy: function($super){
        var Z = this;
    	
        jQuery(Z._firstBtn).off();
        jQuery(Z._priorBtn).off();
        jQuery(Z._pageNoTxt).off();
        jQuery(Z._gotoBtn).off();
        jQuery(Z._pageCountLbl).off();
        jQuery(Z._nextBtn).off();
        jQuery(Z._lastBtn).off();
        
        Z._firstBtn = null;
        Z._priorBtn = null;
        Z._pageNoTxt = null;
        Z._gotoBtn = null;
        Z._pageCountLbl = null;
        Z._nextBtn = null;
        Z._lastBtn = null;
        
    	$super();
    }

});

jslet.ui.register('DBPageBar', jslet.ui.DBPageBar);
jslet.ui.DBPageBar.htmlTemplate = '<div></div>';
