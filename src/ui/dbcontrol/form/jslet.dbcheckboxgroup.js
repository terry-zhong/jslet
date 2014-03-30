/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBCheckBoxGroup. 
 * Display a group of checkbox. Example:
 * <pre><code>
 * var jsletParam = {type:"DBCheckBoxGroup",dataset:"employee",field:"department", columnCount: 3};
 * 
 * //1. Declaring:
 * &lt;div data-jslet='type:"DBCheckBoxGroup",dataset:"employee",field:"department", columnCount: 3' />
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
jslet.ui.DBCheckBoxGroup = jslet.Class.create(jslet.ui.DBFieldControl, {
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'dataset,field,columnCount';
		/**
		 * {Integer} Column count
		 */
		Z._columnCount = 99999;
		Z._itemIds = null;
		$super(el, params);
	},

	columnCount: function(columnCount) {
		if(columnCount === undefined) {
			return this._columnCount;
		}
		jslet.Checker.test('DBCheckBoxGroup.columnCount', columnCount).isGTEZero();
		this._columnCount = parseInt(columnCount);
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
		this.renderAll();
		jQuery(this.el).on('click', 'input[type="checkbox"]', function (event) {
			event.delegateTarget.jslet.updateToDataset(this);
		});
	},

	/**
	 * @override
	 */
	doMetaChanged: function($super, metaName){
		$super(metaName);
		var Z = this,
			fldObj = Z._dataset.getField(Z._field);
		if(!metaName || metaName == "disabled" || metaName == "readOnly") {
			var disabled = fldObj.disabled(),
				readOnly = fldObj.readOnly();
		
			var chkBoxes = jQuery(Z.el).find('input[type="checkbox"]');
			for(var i = 0, cnt = chkBoxes.length; i < cnt; i++){
				jslet.ui.setEditableStyle(chkBoxes[i], disabled, readOnly);
			}
		}
		if(metaName == 'message') {
			Z.renderInvalid();
		}
	},
	
	/**
	 * @override
	 */
	doValueChanged: function() {
		var Z = this;
		if (Z._keep_silence_) {
			return;
		}
		var fldObj = Z._dataset.getField(Z._field);
		if(fldObj.message(Z._valueIndex)) { 
			return;
		}
		try {
			var checkboxs = jQuery(Z.el).find('input[type="checkbox"]'),
				chkcnt = checkboxs.length, 
				checkbox, i;
			for (i = 0; i < chkcnt; i++) {
				checkbox = checkboxs[i];
				checkbox.checked = false;
			}
			var values = Z._dataset.getFieldValue(Z._field);
			if(values && values.length > 0) {
				var valueCnt = values.length, value;
				for (i = 0; i < chkcnt; i++) {
					checkbox = checkboxs[i];
					for (var j = 0; j < valueCnt; j++) {
						value = values[j];
						if (value == checkbox.value) {
							checkbox.checked = true;
						}
					}
				}
			}
		} catch (e) {
			jslet.showException(e);
		}		
	},
	
	/**
	 * @override
	 */
	doLookupChanged: function () {
		var Z = this,
			fldObj = Z._dataset.getField(Z._field), 
			lkf = fldObj.lookup();
		if (!lkf) {
			jslet.showException(jslet.formatString(jslet.locale.Dataset.lookupNotFound,
					[fldObj.name()]));
			return;
		}
		if(fldObj.valueStyle() != jslet.data.FieldValueStyle.MULTIPLE) {
			fldObj.valueStyle(jslet.data.FieldValueStyle.MULTIPLE);
		}
		
		var lkds = lkf.dataset(),
			cnt = lkds.recordCount(),
			context = lkds.startSilenceMove(),
			itemId;
		Z._itemIds = [];
		try {
			var template = ['<table cellpadding="0" cellspacing="0">'],
			isNewRow = false;

			for (var k = 0; k < cnt; k++) {
				lkds.innerSetRecno(k);
				isNewRow = (k % Z._columnCount === 0);
				if (isNewRow) {
					if (k > 0) {
						template.push('</tr>');
					}
					template.push('<tr>');
				}
				itemId = jslet.nextId();
				template.push('<td style="white-space: nowrap; "><input type="checkbox" value="');
				template.push(lkds.getFieldValue(lkf.keyField()));
				template.push('" id="');
				template.push(itemId);
				template.push('" /><label for="');
				template.push(itemId);
				template.push('">');
				template.push(lkf.getCurrentDisplayValue());
				template.push('</label></td>');
				isNewRow = (k % Z._columnCount === 0);
			} // end for
			if (cnt > 0) {
				template.push('</tr>');
			}
			template.push('</table>');
			Z.el.innerHTML = template.join('');
		} finally {
			lkds.endSilenceMove(context);
		}
	}, // end renderOptions

	updateToDataset: function(currCheckBox) {
		var Z = this;
		if (Z._is_silence_) {
			return;
		}
		var fldObj = Z._dataset.getField(Z._field),
			limitCount = fldObj.valueCountLimit();
		
		var values = [], count = 0;
		var allBoxes = jQuery(Z.el).find('input[type="checkbox"]'),chkBox;
		for(var j = 0, allCnt = allBoxes.length; j < allCnt; j++){
			chkBox = allBoxes[j];
			if (chkBox.checked) {
				values.push(chkBox.value);
				count ++;
			}
		} //end for j

		if (limitCount && count > limitCount) {
			currCheckBox.checked = !currCheckBox.checked;
			jslet.showInfo(jslet.formatString(jslet.locale.DBCheckBoxGroup.invalidCheckedCount,
					[''	+ limitCount]));
			return;
		}

		Z._is_silence_ = true;
		try {
			Z._dataset.setFieldValue(Z._field, values);
		} finally {
			Z._is_silence_ = false;
		}
	},
	
	focus: function() {
		if (_itemIds && _itemIds.length > 0) {
			document.getElementById(_itemIds[0]).focus();
		}
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this, 
			jqEl = jQuery(Z.el);
		if(!jqEl.hasClass("jl-checkboxgroup")) {
			jqEl.addClass("jl-checkboxgroup");
		}
		Z.refreshControl(jslet.data.RefreshEvent.updateAllEvent(), true);
	},

	/**
	 * @override
	 */
	destroy: function($super){
		var jqEl = jQuery(this.el);
		jqEl.off();
		$super();
	}
});

jslet.ui.register('DBCheckBoxGroup', jslet.ui.DBCheckBoxGroup);
jslet.ui.DBCheckBoxGroup.htmlTemplate = '<div></div>';

