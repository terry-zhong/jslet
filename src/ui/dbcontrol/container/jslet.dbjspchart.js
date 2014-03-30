/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * DBJspChart
 */
jslet.DBJspChart = jslet.Class.create(jslet.DBControl, {
	initialize : function($super, el, params) {
		this.allProperties = 'dataset,chartUrl,chartType,chartTitle,chartColor,onlySelected,chartHeight,chartWidth,xAxisLabel,yAxisLabel,categoryField,titleField,valueField,locked';
		this.requiredProperties = 'chartUrl,valueField,categoryField';

		this.dataset = null;
		$super(el, params)
	},

	isValidTemplateTag : function(el) {
		return el.tagName.toLowerCase() == 'div';
	},

	bind : function() {
		if (!this.chartUrl) {
			this.chartUrl = '/common/DBChart.jsp';
		}
		this.onlySelected = this.onlySelected ? true : false;
		this.renderAll();
	},// end bind

	refreshControl : function(evt) {
		if (!evt) {
			evt = jslet.UpdateEvent.updateAllEvent;
		}
		if (evt.eventType == jslet.UpdateEvent.UPDATEALL) {
			if (this.locked) {
				if (this.el.childNodes.length > 0
						&& this.el.childNodes[0].tagName.toLowerCase() == 'img') {
					this.el.childNodes[0].alt = jslet.locale.DBImage.lockedImageTips;
				}
				return;
			}

			if (this.dataset.recordCount() == 0) {
				jQuery(this.el).update('');
				return;
			}
			var arrValueFields = this.valueField.split(','),
				isMultiValueFld = arrValueFields.length > 1,
				fldName, fldObj,
				cnt = arrValueFields.length;
			if (isMultiValueFld) {
				for (var i = 0; i < cnt; i++) {
					fldName = arrValueFields[i];
					fldObj = this.dataset.getField(fldName);
					if (!fldObj) {
						throw new Error(jslet.formatString(jslet.message
								.getMessage('field-not-found'),
								[fldName])));
					}
					if (fldObj.getType() != jslet.data.DataType.NUMBER) {
						throw new Error(jslet.formatString(jslet.message
								.getMessage('field-must-be-number'),
								[fldName]));
					}
				}
			} else {
				fldName = this.valueField;
				fldObj = this.dataset.getField(fldName);
				if (!fldObj) {
					throw new Error(jslet.formatString(jslet.message.getMessage('field-not-found'),
							[fldName]));
				}
				if (fldObj.getType() != jslet.data.DataType.NUMBER) {
					throw new Error(jslet.formatString(jslet.message
							.getMessage('field-must-be-number'),
							[fldName]));
				}
			}
			try {
				var categoryFld, titleFld, valueFld;
				if (!isMultiValueFld) {
					categoryFld = this.categoryField;
					titleFld = this.titleField;
					valueFld = this.valueField;
				} else {
					categoryFld = this.categoryField || this.titleField;
					titleFld = '_title_';
					valueFld = '_value_';
				}
				var arrChartData = [],
					preRecno = this.dataset.recno();
				try {
					var data, categoryValue,
						recCnt = this.dataset.recordCount();
					for (var k = 0; k < recCnt; k++) {
						this.dataset.innerSetRecno(k);
						categoryValue = this.dataset.getFieldText(categoryFld);
						if (!isMultiValueFld) {
							data = new Object();
							if (categoryFld) {
								data[categoryFld] = categoryValue;
							}
							if (titleFld) {
								data[titleFld] = this.dataset
										.getFieldText(titleFld);
							}
							data[valueFld] = this.dataset.getFieldValue(valueFld);
							arrChartData.push(data);
						} else {
							for (var i = 0; i < cnt; i++) {
								data = {};
								data[categoryFld] = categoryValue;
								fldName = arrValueFields[i];
								data[titleFld] = this.dataset.getField(fldName).label();
								data[valueFld] = this.dataset.getFieldValue(fldName);
								arrChartData.push(data);
							}
						}
					}// end for
				} finally {
					this.dataset.innerSetRecno(preRecno);
				}
				var chartData = arrChartData.toJSON();

				var arrParam = new Array('chartData=');
				arrParam.push(chartData);
				if (this.chartType) {
					arrParam.push('&chartType=', this.chartType);
				}
				if (this.chartTitle) {
					arrParam.push('&chartTitle=', this.chartTitle);
				}
				arrParam.push('&chartWidth=', this.chartWidth
								|| jQuery(this.el).getWidth());
				arrParam.push('&chartHeight=', this.chartHeight
								|| jQuery(this.el).getHeight());

				arrParam.push('&categoryField=', categoryFld);
				if (titleFld) {
					arrParam.push('&titleField=', titleFld);
				}
				arrParam.push('&valueField=', valueFld);
				arrParam
						.push('&xAxisLabel=', this.dataset
										.getField(this.categoryField)
										.label());
				var yLabel = this.yAxisLabel;
				if (!isMultiValueFld) {
					yLabel = this.dataset.getField(valueFld).label();
				}
				if (yLabel) {
					arrParam.push('&yAxisLabel=', yLabel);
				}
				arrParam.push('&', Math.round(Math.random() * 100));
				this.chartUrl = this.chartUrl.strip();
				var hostAndPort = null;

				if (this.chartUrl.toLowerCase().startsWith('http://')) {
					var ip = this.chartUrl.substr(7);
					var k = ip.indexOf('/');
					hostAndPort = this.chartUrl.substring(0, k + 7);
				};

				var selfchartdiv = this.el;
				new Ajax.Request(this.chartUrl, {
							method : 'post',
							parameters : arrParam.join(''),
							onSuccess : function(result) {
								var s = result.responseText;
								if (hostAndPort) {
									var k = s.indexOf('src="'),
										s1 = s.substr(0, k + 5),
										s2 = s.substr(k + 5);
									s = s1 + hostAndPort + s2
								}
								jQuery(selfchartdiv).update(s);
							},
							onFailure : function(result) {
								alert(result.responseText);
							}
						});
			} catch (e) {
				jslet.showException(e);
			}
		};
		if (this.afterRefreshControl) {
			this.afterRefreshControl(evt);
		}
	},// end refreshControl

	renderAll : function() {
		this.refreshControl(jslet.UpdateEvent.updateAllEvent);
	}
});
jslet.register('DBJspChart', jslet.DBJspChart);
jslet.DBJspChart.htmlTemplate = '<div></div>';
