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
        Z.requiredProperties;

        Z.dataset;
        /**
         * {Integer} Column count
         */
        Z.columnCount = 3;
        /**
         * {Integer} Column width
         */
        Z.columnWidth = 150;
        /**
         * {Integer} The gap between label and editor
         */
        Z.labelGap = 10;
        /**
         * {Integer} The gap between columns
         */
        Z.columnGap = 10;
        /**
         * {Integer} Row height
         */
        Z.rowHeight = 30;
        /**
         * {Boolean} True - only show specified fields, false otherwise.
         */
        Z.onlySpecifiedFields = false;
        /**
         * Array of edit field configuration, prototype: [{field: "field1", colSpan: 2, rowSpan: 1}, ...]
         */
        Z.fields;
        $super(el, params);
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
        var Z = this;
        var colCnt = Z.columnCount;
        if (colCnt) {
            colCnt = parseInt(colCnt);
        }
        if (colCnt && colCnt > 0) {
            Z.columnCount = colCnt;
        } else {
            Z.columnCount = 3;
        }

        Z.onlySpecifiedFields = Z.onlySpecifiedFields ? true : false;
        Z.renderAll();
    },

    getEditField: function (fieldName) {
        var Z = this;
        if (!Z.fields) {
            Z.fields = [];
        }
        var editFld;
        for (var i = 0, cnt = Z.fields.length; i < cnt; i++) {
            editFld = Z.fields[i];
            if (editFld.field == fieldName) {
                return editFld;
            }
        }
        var fldObj = Z.dataset.getField(fieldName);
        if (!fldObj) {
            return null;
        }
        editFld = {
            field: fieldName,
            colSpan: 1
        };
        Z.fields.push(editFld);
        return editFld;
    },

    _calcLayout: function () {
        var Z = this,
        	allFlds = Z.dataset.getNormalFields(), 
        	fldLayouts;
        if (!Z.onlySpecifiedFields) {
            fldLayouts = [];
            var fldObj, fldName, found, editFld, maxFld, 
            	layoutcnt = Z.fields ? Z.fields.length : 0;
            for (var i = 0, fcnt = allFlds.length; i < fcnt; i++) {
                fldObj = allFlds[i];
                fldName = fldObj.name();
                found = false;
                for (var j = 0; j < layoutcnt; j++) {
                    editFld = Z.fields[j];
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
            fldLayouts = Z.fields;
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
            if (layout.inFirstCol || layout.showLine || c + layout.colSpan > Z.columnCount) {
                c = 0;
                r++;
                layout.row = r;
                layout.col = c;
            } else {
                layout.row = r;
                layout.col = c;
            }
            c += layout.colSpan;
            fldObj = Z.dataset.getField(layout.field);
            layout.labelWidth = jslet.ui.textMeasurer.getWidth(fldObj.label()) + startWidth;
        }
        jslet.ui.textMeasurer.setElement();

        return fldLayouts
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
        var allFlds = Z.dataset.getNormalFields(),
        	fcnt = allFlds.length;
        var layouts = Z._calcLayout();
        //calc max label width
        var maxLabelWidths = [];
        var layout, columnCnt = Math.min(fcnt, Z.columnCount);
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
        totalW += Z.columnCount * (Z.labelGap + Z.columnWidth + Z.columnGap) - Z.columnGap + 18;

        var c = 0, oLabel, editorCfg, fldName, fldObj, leftPos = 0, opanel, isFirst = true; ;
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
                jQuery(opanel).html('<hr />')
            }
            if (layout.col == 0) {
                opanel = document.createElement('div');
                //jQuery(opanel).addClass('jl-border-box');
                opanel.style.height = Z.rowHeight + 'px';
                opanel.style.width = totalW + 'px';
                opanel.style.position = 'relative';
                opanel.style.overflow = 'hidden';
                if (isFirst) {
                    isFirst = false;
                }
                Z.el.appendChild(opanel);
                c = 0;
                leftPos = 0
            }
            fldName = layout.field;
            oLabel = document.createElement('label');
            opanel.appendChild(oLabel);
            oLabel.style.position = 'absolute';
            oLabel.style.left = leftPos + 'px';
            oLabel.style.top = '5px';
            oLabel.style.width = maxLabelWidths[layout.col] + 'px';
            leftPos += maxLabelWidths[layout.col] + Z.labelGap;

            new jslet.ui.DBLabel(oLabel, {
                type: 'DBLabel',
                dataset: Z.dataset,
                field: fldName
            });

            fldObj = Z.dataset.getField(fldName);
            if (fldObj.valueStyle() == jslet.data.FieldValueStyle.BETWEEN) {
                editorCfg = {
                   type: 'DBBetweenEdit'
                };
            } else {
                editorCfg = fldObj.editControl();
            }
            editorCfg.dataset = Z.dataset;
            editorCfg.field = fldName;
            var w = Z.columnWidth;
            if (layout.colSpan > 1) {
                for (var c = layout.col + 1, end = layout.col + layout.colSpan; c < end; c++) {
                    w += Z.columnGap + maxLabelWidths[c] + Z.labelGap + Z.columnWidth;
                }
            }
            editor = jslet.ui.createControl(editorCfg, null, w);
            opanel.appendChild(editor.el);
            var ctrl = editor.el;
            ctrl.style.position = 'absolute';
            ctrl.style.left = leftPos + 'px';
            leftPos += w + Z.columnGap;
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
        if (!evt) {
            evt = jslet.data.UpdateEvent.METACHANGE;
        }
        if (evt.eventType == jslet.data.UpdateEvent.METACHANGE) {
            this.renderAll();
        }
    }
});

jslet.ui.register('DBEditPanel', jslet.ui.DBEditPanel);
jslet.ui.DBEditPanel.htmlTemplate = '<div></div>';
