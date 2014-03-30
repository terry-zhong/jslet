/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
* DBEditPanel
*/
jslet.ui.DBEditPanel = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	*/
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'dataset,columnCount,labelGap,columnGap,columnWidth,rowHeight,onlySpecifiedFields,fields';
		
		/**
		 * {Integer} Column count
		 */
		Z._columnCount = 3;
		/**
		 * {Integer} Column width
		 */
		Z._columnWidth = 150;
		/**
		 * {Integer} The gap between label and editor
		 */
		Z._labelGap = 10;
		/**
		 * {Integer} The gap between columns
		 */
		Z._columnGap = 10;
		/**
		 * {Integer} Row height
		 */
		Z._rowHeight = 30;
		/**
		 * {Boolean} True - only show specified fields, false otherwise.
		 */
		Z._onlySpecifiedFields = false;
		/**
		 * Array of edit field configuration, prototype: [{field: "field1", colSpan: 2, rowSpan: 1}, ...]
		 */
		Z._fields;
		$super(el, params);
	},
	
	columnCount: function(columnCount) {
		if(columnCount === undefined) {
			return this._columnCount;
		}
		jslet.Checker.test('DBEditPanel.columnCount', columnCount).isGTZero();
		this._columnCount = parseInt(columnCount);
	},
	
	columnWidth: function(columnWidth) {
		if(columnWidth === undefined) {
			return this._columnWidth;
		}
		jslet.Checker.test('DBEditPanel.columnWidth', columnWidth).isGTZero();
		this._columnWidth = parseInt(columnWidth);
	},
	
	labelGap: function(labelGap) {
		if(labelGap === undefined) {
			return this._labelGap;
		}
		jslet.Checker.test('DBEditPanel.labelGap', labelGap).isGTZero();
		this._labelGap = parseInt(labelGap);
	},
	
	columnGap: function(columnGap) {
		if(columnGap === undefined) {
			return this._columnGap;
		}
		jslet.Checker.test('DBEditPanel.columnGap', columnGap).isGTZero();
		this._columnGap = parseInt(columnGap);
	},
	
	rowHeight: function(rowHeight) {
		if(rowHeight === undefined) {
			return this._rowHeight;
		}
		jslet.Checker.test('DBEditPanel.rowHeight', rowHeight).isGTZero();
		this._rowHeight = parseInt(rowHeight);
	},
	
	onlySpecifiedFields: function(onlySpecifiedFields) {
		if(onlySpecifiedFields === undefined) {
			return this._onlySpecifiedFields;
		}
		this._onlySpecifiedFields = onlySpecifiedFields ? true: false;
	},
	
	fields: function(fields) {
		if(fields === undefined) {
			return this._fields;
		}
		jslet.Checker.test('DBEditPanel.fields', fields).isArray();
		var fldCfg;
		for(var i = 0, len = fields.length; i < len; i++) {
			fldCfg = fields[i];
			jslet.Checker.test('DBEditPanel.fields.field', fldCfg.field).isString().required();
			jslet.Checker.test('DBEditPanel.fields.colSpan', fldCfg.colSpan).isGTZero();
			jslet.Checker.test('DBEditPanel.fields.rowSpan', fldCfg.rowSpan).isGTZero();
			fldCfg.inFirstCol = fldCfg.inFirstCol ? true: false;
			fldCfg.showLine = fldCfg.showLine ? true: false;			
		}
		this._fields = fields;
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
	bind: function () {
		this.renderAll();
	},
	
	getEditField: function (fieldName) {
		var Z = this;
		if (!Z._fields) {
			Z._fields = [];
		}
		var editFld;
		for (var i = 0, cnt = Z._fields.length; i < cnt; i++) {
			editFld = Z._fields[i];
			if (editFld.field == fieldName) {
				return editFld;
			}
		}
		var fldObj = Z._dataset.getField(fieldName);
		if (!fldObj) {
			return null;
		}
		editFld = {
			field: fieldName,
			colSpan: 1
		};
		Z._fields.push(editFld);
		return editFld;
	},
	
	_calcLayout: function () {
		var Z = this,
			allFlds = Z._dataset.getNormalFields(), 
			fldLayouts, fldObj;
		if (!Z._onlySpecifiedFields) {
			fldLayouts = [];
			var fldName, found, editFld, maxFld, 
				layoutcnt = Z._fields ? Z._fields.length : 0;
			for (var i = 0, fcnt = allFlds.length; i < fcnt; i++) {
				fldObj = allFlds[i];
				fldName = fldObj.name();
				found = false;
				for (var j = 0; j < layoutcnt; j++) {
					editFld = Z._fields[j];
					if (fldName == editFld.field) {
						found = true;
						fldLayouts.push(editFld);
						if (!editFld.colSpan || editFld.colSpan < 1) {
							editFld.colSpan = 1;
						}
					}
				}
				
				if (!found && fldObj.visible()) {
					fldLayouts.push({
					field: fldObj.name(),
					colSpan: 1
					});
				}
			} //end for i
		} else {
			fldLayouts = Z._fields;
		}
		//calc row, col
		var layout, r = 0, c = 0;
		
		jslet.ui.textMeasurer.setElement(Z.el);
		var startWidth = jslet.ui.textMeasurer.getWidth('*');
		for (var i = 0, cnt = fldLayouts.length; i < cnt; i++) {
			layout = fldLayouts[i];
			if (!layout.colSpan) {
				layout.colSpan = 1;
			}
			if (layout.inFirstCol || layout.showLine || c + layout.colSpan > Z._columnCount) {
				c = 0;
				r++;
				layout.row = r;
				layout.col = c;
			} else {
				layout.row = r;
				layout.col = c;
			}
			c += layout.colSpan;
			fldObj = Z._dataset.getField(layout.field);
			layout.labelWidth = jslet.ui.textMeasurer.getWidth(fldObj.label()) + startWidth;
		}
		jslet.ui.textMeasurer.setElement();
		
		return fldLayouts;
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this;
		var jqEl = jQuery(Z.el);
		if (!jqEl.hasClass('jl-editpanel')) {
			jqEl.addClass('jl-editpanel jl-border-box');
		}
		jqEl.html('');
		var allFlds = Z._dataset.getNormalFields(),
			fcnt = allFlds.length;
		var layouts = Z._calcLayout();
		//calc max label width
		var maxLabelWidths = [];
		var layout, columnCnt = Math.min(fcnt, Z._columnCount);
		for (var i = 0; i < columnCnt; i++) {
			maxLabelWidths[i] = 0;
		}
		
		for (var i = 0, cnt = layouts.length, w = 0; i < cnt; i++) {
			layout = layouts[i];
			w = layout.labelWidth;
			if (maxLabelWidths[layout.col] < w) {
			maxLabelWidths[layout.col] = w;
			}
		}
		var totalW = 0;
		for (var i = 0; i < columnCnt; i++) {
			totalW += maxLabelWidths[i];
		}
		totalW += Z._columnCount * (Z._labelGap + Z._columnWidth + Z._columnGap) - Z._columnGap + 18;
		
		var c = 0, oLabel, editorCfg, fldName, fldObj, leftPos = 0, opanel, isFirst = true;
		for (var i = 0, cnt = layouts.length; i < cnt; i++) {
			layout = layouts[i];
			if (layout.showLine) {
				c = 0;
				leftPos = 10;
				opanel = document.createElement('div');
				opanel.style.height = '20px';
				opanel.style.width = totalW - 10 + 'px';
				opanel.style.position = 'relative';
				opanel.style.overflow = 'hidden';
				Z.el.appendChild(opanel);
				jQuery(opanel).html('<hr class="jslet_editpanel_line"/>');
			}
			if (layout.col === 0) {
				opanel = document.createElement('div');
				//jQuery(opanel).addClass('jl-border-box');
				opanel.style.height = Z._rowHeight + 'px';
				opanel.style.width = totalW + 'px';
				opanel.style.position = 'relative';
				opanel.style.overflow = 'hidden';
				if (isFirst) {
					isFirst = false;
				}
				Z.el.appendChild(opanel);
				c = 0;
				leftPos = 0;
			}
			fldName = layout.field;
			oLabel = document.createElement('label');
			opanel.appendChild(oLabel);
			oLabel.style.position = 'absolute';
			oLabel.style.left = leftPos + 'px';
			oLabel.style.top = '5px';
			oLabel.style.width = maxLabelWidths[layout.col] + 'px';
			leftPos += maxLabelWidths[layout.col] + Z._labelGap;
			
			new jslet.ui.DBLabel(oLabel, {
				type: 'DBLabel',
				dataset: Z._dataset,
				field: fldName
			});
			
			fldObj = Z._dataset.getField(fldName);
			if (fldObj.valueStyle() == jslet.data.FieldValueStyle.BETWEEN) {
				editorCfg = {
					type: 'DBBetweenEdit'
				};
			} else {
				editorCfg = fldObj.editControl();
			}
			editorCfg.dataset = Z._dataset;
			editorCfg.field = fldName;
			var w = Z._columnWidth;
			if (layout.colSpan > 1) {
				for (var c = layout.col + 1, end = layout.col + layout.colSpan; c < end; c++) {
					w += Z._columnGap + maxLabelWidths[c] + Z._labelGap + Z._columnWidth;
				}
			}
			editor = jslet.ui.createControl(editorCfg, null, w);
			opanel.appendChild(editor.el);
			var ctrl = editor.el;
			ctrl.style.position = 'absolute';
			ctrl.style.left = leftPos + 'px';
			ctrl.style.top = '5px';
			leftPos += w + Z._columnGap;
			//jQuery(ctrl).addClass('jl-border-box');
			if (ctrl.tagName.toLowerCase() == 'input' && ctrl.type == 'checkbox') {
				ctrl.style.width = '';
			}
		}
	}, // render All
	
		/**
		 * @override
		 */
	refreshControl: function (evt) {
	//if (!evt) {
	//evt = jslet.data.RefreshEvent.CHANGEMETA;
	//}
	//if (evt.eventType == jslet.data.RefreshEvent.CHANGEMETA) {
	//this.renderAll();
	//}
	}
});

jslet.ui.register('DBEditPanel', jslet.ui.DBEditPanel);
jslet.ui.DBEditPanel.htmlTemplate = '<div></div>';
