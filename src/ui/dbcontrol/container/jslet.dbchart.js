/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBChart, show data as a chart. There are five chart type: column, bar, line, area, pie  
 * Example:
 * <pre><code>
 *		var jsletParam = {type:"dbchart", dataset:"summary", chartType:"column",categoryField:"area,month",valueField:"amount"};
 * 
 * //1. Declaring:
 *		&lt;div id="chartId" data-jslet='type:"dbchart",chartType:"column",categoryField:"area,month",valueField:"amount", dataset:"summary"' />
 *		or
 *		&lt;div data-jslet='jsletParam' />
 *
 *  //2. Binding
 *		&lt;div id="ctrlId"  />
 *		//Js snippet
 *		var el = document.getElementById('ctrlId');
 *		jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *		jslet.ui.createControl(jsletParam, document.body);
 *
 * </code></pre>
 */
jslet.ui.DBChart = jslet.Class.create(jslet.ui.DBControl, {
	chartTypes: ['column', 'bar', 'line', 'area', 'pie'],
	legendPositions: ['none', 'top', 'bottom', 'left', 'right'],
	/**
	 * @override
	 */
	initialize: function ($super, el, params) {
		var Z = this;
		Z.allProperties = 'dataset,chartUrl,chartType,chartTitle,chartColor,onlySelected,categoryFields,valueField,legendPos';
		Z.requiredProperties = 'valueField,categoryFields';
		
		/**
		 * {String} Chart url. You don't care about this argument if you use default chart render.
		 */
		Z._chartUrl = null;
		/**
		 * {String} Chart type. Optional value is: column, bar, line, area, pie
		 */
		Z._chartType = "line";
		/**
		 * {String} Category field, use comma(,) to separate multiple fields.
		 */
		Z._categoryFields = null;
		/**
		 * {Number} Value field, only one field allowed.
		 */
		Z._valueField = null;
		/**
		 * {String} Chart title
		 */
		Z._chartTitle = null;
		/**
		 * {String} Background color of chart, like: #FFF
		 */
		Z._chartColor = null;
		/**
		 * {Boolean} True - Only selected record will be shown in chart, false - All records will be shown.
		 */
		Z._onlySelected = false;
		/**
		 * {String} Legend position, optional value: none, top, bottom, left, right
		 */
		Z._legendPos = 'top';
		
		$super(el, params);
	},

	chartUrl: function(chartUrl) {
		if(chartUrl === undefined) {
			return this._chartUrl;
		}
		chartUrl = jQuery.trim(chartUrl);
		jslet.Checker.test('DBChart.chartUrl', chartUrl).isString().required();
		this._chartUrl = chartUrl;
	},
	
	chartType: function(chartType) {
		if(chartType === undefined) {
			return this._chartType;
		}
		chartType = jQuery.trim(chartType);
		var checker = jslet.Checker.test('DBChart.chartType', chartType).isString().required();
		checker.testValue(chartType.toLowerCase()).inArray(this.chartTypes);
		this._chartType = chartType;
	},
	
	categoryFields: function(categoryFields) {
		if(categoryFields === undefined) {
			return this._categoryFields;
		}
		categoryFields = jQuery.trim(categoryFields);
		jslet.Checker.test('DBChart.categoryFields', categoryFields).isString().required();
		this._categoryFields = categoryFields;
	},
	
	valueField: function(valueField) {
		if(valueField === undefined) {
			return this._valueField;
		}
		valueField = jQuery.trim(valueField);
		jslet.Checker.test('DBChart.valueField', valueField).isString().required();
		this._valueField = valueField;
	},
	
	chartTitle: function(chartTitle) {
		if(chartTitle === undefined) {
			return this._chartTitle;
		}
		chartTitle = jQuery.trim(chartTitle);
		jslet.Checker.test('DBChart.chartTitle', chartTitle).isString();
		this._chartTitle = chartTitle;
	},
	
	chartColor: function(chartColor) {
		if(chartColor === undefined) {
			return this._chartColor;
		}
		chartColor = jQuery.trim(chartColor);
		jslet.Checker.test('DBChart.chartColor', chartColor).isString();
		this._chartColor = chartColor;
	},
	
	legendPos: function(legendPos) {
		if(legendPos === undefined) {
			return this._legendPos;
		}
		legendPos = jQuery.trim(legendPos);
		var checker = jslet.Checker.test('DBChart.legendPos', legendPos).isString().required();
		checker.testValue(legendPos.toLowerCase()).inArray(this.legendPositions);
		this._legendPos = legendPos;
	},
		
	onlySelected: function(onlySelected) {
		if(onlySelected === undefined) {
			return this._onlySelected;
		}
		this._onlySelected = onlySelected ? true: false;
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
		if (!Z._chartUrl) {
			Z._chartUrl = jslet.rootUri + 'resources/common/jsletchart.swf';
		}
		var odiv = document.createElement('div');
		Z.chartId = jslet.nextId();
		odiv.id = Z.chartId;
		Z.el.appendChild(odiv);

		var params = {
			allowScriptAccess: 'always',
			no_flash: 'Sorry, you need to install flash to see this content.',
			bgcolor: '#ffffff',
			wmode: 'opaque'}, 
			vars = {allowedDomain: document.location.hostname};

		new swfobject.embedSWF(Z._chartUrl, Z.chartId, '100%', '100%',
				'9.0.45', undefined, vars, params);

		Z._onlySelected = Z._onlySelected ? true : false;
		if (!Z._legendPos) {
			Z._legendPos = 'none';
		}
		if (Z._chartTitle === undefined) {
			Z._chartTitle = '';
		}
		Z.swf = document.getElementById(Z.chartId);
	}, // end bind

	/**
	 * @override
	 */
	refreshControl: function (evt) {
	},

	drawChart: function () {
		var Z = this,
			dsObj = Z._dataset;
		if (dsObj.recordCount() === 0) {
			return;
		}
		var arrCateFields = Z._categoryFields.split(','),
			cnt = arrCateFields.length,
			fldName, fldObj, i,
			isMultiCateFld = arrCateFields.length > 1;
		for (i = 0; i < cnt; i++) {
			fldName = arrCateFields[i];
			fldObj = dsObj.getField(fldName);
			if (!fldObj) {
				throw new Error(jslet.formatString(jslet.locale.Dataset.fieldNotFound, [fldName]));
			}
		}
		var arrValueFields = Z._valueField.split(',');
		cnt = arrValueFields.length;
		for (i = 0; i < cnt; i++) {
			fldName = arrValueFields[i];
			fldObj = dsObj.getField(fldName);
			if (!fldObj) {
				throw new Error(jslet.formatString(jslet.locale.Dataset.fieldNotFound, [fldName]));
			}
			if (fldObj.getType() != jslet.data.DataType.NUMBER) {
				throw new Error(jslet.formatString(jslet.locale.DBChart.onlyNumberFieldAllowed, [fldName]));
			}
		}
		var chartData = {};
		chartData.jslet = true;
		var cateFldName = arrCateFields[0];
		fldObj = dsObj.getField(cateFldName);
		chartData.xFields = {
			fieldName: cateFldName,
			displayName: fldObj.label()
		};

		var arrYFields = [], arrData = [], dataObj, 
			reccnt = dsObj.recordCount(),
			preRecno = dsObj.recno();
		if (isMultiCateFld) {
			var arrCateValue = [],
				hsValueFlds = new jslet.SimpleMap(),
				titleFldName = arrCateFields[1], titleValue,
				preCateValue = '', cateValue,
				fldIdx = 1, k,
				valFld = arrValueFields[0],
				selRecs = dsObj.selectedRecords(),
				noSel = selRecs === null || selRecs.length === 0,
				currCateValue = null;
			if (noSel) {
				currCateValue = dsObj.getFieldText(cateFldName);
			}
			try {
				for (i = 0; i < reccnt; i++) {
					dsObj.innerSetRecno(i);
					cateValue = dsObj.getFieldText(cateFldName);
					if (Z._onlySelected) {
						if (noSel) {
							if (cateValue != currCateValue) {
								continue;
							}
						} else if (!dsObj.selected()) {
							continue;
						}
					}
					k = arrCateValue.indexOf(cateValue);
					if (k < 0) {
						arrCateValue.push(cateValue);
						dataObj = {};
						dataObj[cateFldName] = cateValue;
						arrData.push(dataObj);
					} else {
						dataObj = arrData[k];
					}
					titleValue = dsObj.getFieldText(titleFldName);
					fldName = hsValueFlds.get(titleValue);
					if (!fldName) {
						fldName = '_fld_' + fldIdx++;
						hsValueFlds.set(titleValue, fldName);
						arrYFields.push({
							fieldName: fldName,
							displayName: titleValue
						});
					}

					dataObj[fldName] = dsObj.getFieldValue(valFld);
				}
			} finally {
				dsObj.innerSetRecno(preRecno);
			}
			chartData.yFields = arrYFields;
			chartData.dataArray = arrData;
		} else {
			cnt = arrValueFields.length;
			for (i = 0; i < cnt; i++) {
				fldObj = dsObj.getField(arrValueFields[i]);
				arrYFields.push({
					fieldName: arrValueFields[i],
					displayName: fldObj.label()
				});
			}
			chartData.yFields = arrYFields;
			try {
				for (i = 0; i < reccnt; i++) {
					dsObj.innerSetRecno(i);
					if (Z._onlySelected && !dsObj.selected()) {
						continue;
					}
					dataObj = {};
					dataObj[cateFldName] = dsObj.getFieldText(cateFldName);
					for (var j = 0; j < cnt; j++) {
						dataObj[arrValueFields[j]] = dsObj.getFieldValue(arrValueFields[j]);
					}
					arrData.push(dataObj);
				}
			} finally {
				dsObj.innerSetRecno(preRecno);
				if (Z._onlySelected && arrData.length === 0) {
					dataObj = {};
					dataObj[arrCateFields[0]] = dsObj.getFieldText(arrCateFields[0]);
					for (i = 0; i < cnt; i++) {
						dataObj[arrValueFields[i]] = dsObj.getFieldValue(arrValueFields[i]);
					}
					arrData.push(dataObj);
				}
			}
			chartData.dataArray = arrData;
		}
		if(Z._getSwf().drawChart) {
			Z._getSwf().drawChart(Z._chartType, Z._chartTitle, chartData, Z._legendPos);
		} else {
			if(window.console && window.console.log) {
				window.console.log('Chart components has not been loaded yet, please wait some while!');
			}
		}
	}, // end refreshControl

	_getSwf: function() {
		var Z = this;
		if(!Z.swf) {
			Z.swf = document.getElementById(Z.chartId);
		}
		return Z.swf;
	},
	
	/**
	 * @override
	 */
	renderAll: function () {
		var Z = this;
		if (Z._getSwf().drawChart) {
			Z.drawChart();
		} else {
			setTimeout(function(){
				Z.drawChart();
			}, 200);
		}
	},
	
	/**
	 * @override
	 */
	destroy: function($super){
		this.swf = null;
		$super();
	}
});

jslet.ui.register('DBChart', jslet.ui.DBChart);
jslet.ui.DBChart.htmlTemplate = '<div></div>';
