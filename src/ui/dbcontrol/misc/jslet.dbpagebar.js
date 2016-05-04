/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
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
 *  var jsletParam = {type:"DBPageBar",dataset:"bom",pageSizeList:[20,50,100,200]};
 *  
 * //1. Declaring:
 *  &lt;div data-jslet='type:"DBPageBar",dataset:"bom",pageSizeList:[20,50,100,200]' />
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
"use strict";
jslet.ui.DBPageBar = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'styleClass,dataset,showPageSize,pageSizeList';
		Z._showPageSize = true;
		
		Z._pageSizeList = [100, 200, 500];

		Z._currPageCount = 0;
		
		$super(el, params);
	},

	/**
	 * {Boolean} Identify if the "Page Size" part shows or not
	 */
	showPageSize: function(showPageSize) {
		if(showPageSize === undefined) {
			return this._showPageSize;
		}
		this._showPageSize = showPageSize ? true: false;
	},
	
	/**
	 * {Integer[]) Array of integer, like: [50,100,200]
	 */
	pageSizeList: function(pageSizeList) {
		if(pageSizeList === undefined) {
			return this._pageSizeList;
		}
		jslet.Checker.test('DBPageBar.pageSizeList', pageSizeList).isArray();
		var size;
		for(var i = 0, len = pageSizeList.length; i < len; i++) {
			size = pageSizeList[i];
			jslet.Checker.test('DBPageBar.pageSizeList', size).isGTZero();
		}
		this._pageSizeList = pageSizeList;
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
		var template = [
		'<div class="form-inline form-group">',
	  	'<select class="form-control input-sm jl-pb-pagesize" title="', jslet.locale.DBPageBar.pageSize, '"></select>',
	    '<button class="btn btn-default btn-sm jl-pb-first" title="', jslet.locale.DBPageBar.first, '"><i class="fa fa-angle-double-left" aria-hidden="true"></i></button>',
	    '<button class="btn btn-default btn-sm jl-pb-prior" title="', jslet.locale.DBPageBar.prior, '"><i class="fa fa-angle-left" aria-hidden="true"></i></button>',
	    '<button class="btn btn-default btn-sm jl-pb-next" title="', jslet.locale.DBPageBar.next, '"><i class="fa fa-angle-right" aria-hidden="true"></i></button>',
	    '<button class="btn btn-default btn-sm jl-pb-last" title="', jslet.locale.DBPageBar.last, '"><i class="fa fa-angle-double-right" aria-hidden="true"></i></button>',
	    '<button class="btn btn-default btn-sm jl-pb-refresh" title="', jslet.locale.DBPageBar.refresh, '"><i class="fa fa-refresh" aria-hidden="true"></i></button>',
	  	'<select class="form-control input-sm jl-pb-pagenum" title="', jslet.locale.DBPageBar.pageNum, '"></select>',
	    '</div>'];
		
		jqEl.html(template.join(''));

		Z._jqPageSize = jqEl.find('.jl-pb-pagesize');
		if (Z._showPageSize) {
			Z._jqPageSize.removeClass('jl-hidden');
			var pgSizeList = Z._pageSizeList;
			var cnt = pgSizeList.length, s = '', pageSize;
			for (var i = 0; i < cnt; i++) {
				pageSize = pgSizeList[i];
				s += '<option value="' + pageSize + '">' + pageSize + '</option>';
			}

			Z._jqPageSize.html(s);
			if(cnt > 0) {
				Z._dataset.pageSize(parseInt(pgSizeList[0]));
			}
			Z._jqPageSize.on('change', function (event) {
				var dsObj = Z.dataset();
				dsObj.pageNo(1);
				dsObj.pageSize(parseInt(this.value));
				dsObj.requery();
			});
		} else {
			Z._jqPageSize.addClass('jl-hidden');
		}

		Z._jqFirstBtn = jqEl.find('.jl-pb-first');
		Z._jqPriorBtn = jqEl.find('.jl-pb-prior');
		Z._jqNextBtn = jqEl.find('.jl-pb-next');
		Z._jqLastBtn = jqEl.find('.jl-pb-last');
		Z._jqRefreshBtn = jqEl.find('.jl-pb-refresh');
		Z._jqPageNum = jqEl.find('.jl-pb-pagenum');
		
		Z._jqFirstBtn.on('click', function (event) {
			if(this.disabled) {
				return;
			}
			var dsObj = Z.dataset();
			dsObj.pageNo(1);
			dsObj.requery();
		});

		Z._jqPriorBtn.on('click', function (event) {
			if(this.disabled) {
				return;
			}
			var dsObj = Z.dataset(),
				num = dsObj.pageNo();
			if (num == 1) {
				return;
			}
			dsObj.pageNo(num - 1);
			dsObj.requery();
		});

		Z._jqPageNum.on('change', function (event) {
			var dsObj = Z.dataset();
			var num = parseInt(this.value);
			dsObj.pageNo(num);
			dsObj.requery();
		});

		Z._jqNextBtn.on('click', function (event) {
			if(this.disabled) {
				return;
			}
			var dsObj = Z.dataset(),
				num = dsObj.pageNo();
			if (num >= dsObj.pageCount()) {
				return;
			}
			dsObj.pageNo(++num);
			dsObj.requery();
		});

		Z._jqLastBtn.on('click', function (event) {
			if(this.disabled) {
				return;
			}
			var dsObj = Z.dataset();

			if (dsObj.pageCount() < 1) {
				return;
			}
			dsObj.pageNo(dsObj.pageCount());
			dsObj.requery();
		});

		Z._jqRefreshBtn.on('click', function (event) {
			Z.dataset().requery();
		});

		Z.renderAll();
	},

	/**
	 * @override
	 */
	refreshControl: function (evt) {
		if (evt && evt.eventType != jslet.data.RefreshEvent.CHANGEPAGE) {
			return;
		}
		this._refreshPageNum();
		this._refreshButtonStatus();
	},

	_refreshPageNum: function() {
		var Z = this,
			num = Z._dataset.pageNo(), 
			count = Z._dataset.pageCount();
		if(count !== Z._currPageCount) {
			var s = '';
			for(var i = 1; i <= count; i++) {
				s += '<option value="' + i + '">' + i + '</option>';
			}
			Z._jqPageNum.html(s);
			Z._currPageCount = count;
		}
		Z._jqPageNum.val(num);
	},
	
	_refreshButtonStatus: function() {
		var Z = this, 
			ds = Z._dataset,
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
		Z._jqFirstBtn.attr('disabled', prevDisabled);
		Z._jqPriorBtn.attr('disabled', prevDisabled);
		Z._jqNextBtn.attr('disabled', nextDisabled);
		Z._jqLastBtn.attr('disabled', nextDisabled);
	},
	
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
		if(Z._jqPageSize) {
			Z._jqPageSize.off();
			Z._jqPageSize = null;
		}
		Z._jqFirstBtn.off();
		Z._jqPriorBtn.off();
		Z._jqNextBtn.off();
		Z._jqLastBtn.off();
		Z._jqPageNum.off();
		Z._jqRefreshBtn.off();

		Z._jqFirstBtn = null;
		Z._jqPriorBtn = null;
		Z._jqNextBtn = null;
		Z._jqLastBtn = null;
		Z._jqPageNum = null;
		Z._jqRefreshBtn = null;
		
		$super();
	}

});

jslet.ui.register('DBPageBar', jslet.ui.DBPageBar);
jslet.ui.DBPageBar.htmlTemplate = '<div></div>';
