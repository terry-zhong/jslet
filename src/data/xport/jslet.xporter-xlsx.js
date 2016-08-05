/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

"use strict";
if (!jslet.data) {
	jslet.data = {};
}

jslet.data.XLSXXPorter = {
	/**
	 * Import data into the specifed dataset from Excel file.
	 * @param {jslet.data.Dataset or String} dataset - Dataset object or dataset name.
	 * @param {String} fileContent - Excel file content.
	 */
	importData: function(dataset, fileContent) {
		function getHeader(sheet) {
		    var headers = [];
		    if (!sheet['!ref']) return;
		    var range = XLSX.utils.decode_range(sheet['!ref']);
		    var C, R = range.s.r; /* start in the first row */
		    /* walk every column in the range */
		    for(C = range.s.c; C <= range.e.c; ++C) {
		        var cell = sheet[XLSX.utils.encode_cell({c:C, r:R})] /* find the cell in the first row */

		        var hdr = "UNKNOWN " + C; // <-- replace with your desired default 
		        if(cell && cell.t) hdr = XLSX.utils.format_cell(cell);

		        headers.push(hdr);
		    }
		    return headers;
		}


		if(!XLSX) {
			throw new Error('js-xlsx.js(https://github.com/SheetJS/js-xlsx) NOT loaded!');
		}
		var workbook = XLSX.read(fileContent, {type: 'binary'});
		var result = {};
		if(workbook.SheetNames.length === 0) {
			return null;
		}
		var sheetName = workbook.SheetNames[0],
			sheet = workbook.Sheets[sheetName],
			header = getHeader(sheet),
			roa = XLSX.utils.sheet_to_row_object_array(sheet);
		result.data = roa;
		result.header = header;
		return result;

	},
	
	/**
	 * Export dataset data to the specified Excel file.
	 * 
	 * @param {jslet.data.Dataset or String} dataset - Dataset object or dataset name.
	 * @param {String} fileName - Excel file name.
	 * @param {Object} exportOption - Export option.
	 * Export option pattern:
	 * {exportHeader: true|false, //export with field labels
	 *  exportDisplayValue: true|false, //true: export display value of field, false: export actual value of field
	 *  onlySelected: true|false, //export selected records or not
	 *  includeFields: ['fldName1', 'fldName2',...], //Array of field names which to be exported
	 *  excludeFields: ['fldName1', 'fldName2',...]  //Array of field names which not to be exported
	 *  }
	 */
	exportData: function(dataset, fileName, exportOption) {
		if(!XLSX) {
			throw new Error('js-xlsx.js(https://github.com/SheetJS/js-xlsx) NOT loaded!');
		}
		dataset.confirm();
		if(dataset.existDatasetError()) {
			console.warn(jslet.locale.Dataset.cannotConfirm);
		}

		var exportHeader = true,
			exportDisplayValue = true,
			onlySelected = false,
			includeFields = null,
			excludeFields = null,
			onlyOnce = true;
			
		if(exportOption && jQuery.isPlainObject(exportOption)) {
			if(exportOption.exportHeader !== undefined) {
				exportHeader = exportOption.exportHeader? true: false;
			}
			if(exportOption.onlySelected !== undefined) {
				onlySelected = exportOption.onlySelected? true: false;
			}
			if(exportOption.includeFields !== undefined) {
				includeFields = exportOption.includeFields;
				jslet.Checker.test('Dataset.exportCsv#exportOption.includeFields', includeFields).isArray();
			}
			if(exportOption.excludeFields !== undefined) {
				excludeFields = exportOption.excludeFields;
				jslet.Checker.test('Dataset.exportCsv#exportOption.excludeFields', excludeFields).isArray();
			}
			if(exportOption.onlyOnce !== undefined) {
				onlyOnce = exportOption.onlyOnce? true: false;
			}
		}
		var parsedExpCfg = this._getExportFields(dataset, includeFields, excludeFields)
		var topDsCfg = parsedExpCfg.datasets;
		var exportFields = parsedExpCfg.fields;
		
		var workSheet = {},
			row = 0, lastRow, lastCol,
			fldCnt = exportFields.length,
			startCell = {r: 0, c: 0}, 
			endCell = {r: 0, c: fldCnt - 1},
			expFld, i;
		
		if (exportHeader) {
			for(i = 0; i < fldCnt; i++) {
				expFld = exportFields[i];
				this._convertToXLSXFormat(workSheet, row, i, 's', expFld.label);
			}
			row++;
			lastRow = 0, lastCol = fldCnt - 1;
		}
		topDsCfg.endRow = row - 1;
		
		this._innerExportData(workSheet, topDsCfg, exportFields, onlySelected, onlyOnce);
		
		endCell.r = topDsCfg.endRow;
		workSheet['!ref'] = XLSX.utils.encode_range({s: startCell, e: endCell});
		
		var ws_name = 'Sheet1';
		var wb = {SheetNames: [], Sheets: {}};
		wb.SheetNames.push(ws_name);
		wb.Sheets[ws_name] = workSheet;
		var xlsxOpt = {bookType:'xlsx', bookSST:true, type: 'binary'};
		var wbout = XLSX.write(wb, xlsxOpt);
		
		function convertToUnitArray(workBook) {
			var len = workBook.length,
				buf = new ArrayBuffer(len),
				view = new Uint8Array(buf);
			for (var k = 0; k != len; ++k) {
				view[k] = workBook.charCodeAt(k) & 0xFF;
			}
			return buf;
		}

		saveAs(new Blob([convertToUnitArray(wbout)], {type:"application/octet-stream"}), fileName);
		
		return wbout;
	},

	_convertToXLSXFormat: function(worksheet, row, col, type, value) {
		var cell_ref = XLSX.utils.encode_cell({c: col,r: row}), 
			cell = {t: type, v: value};
		worksheet[cell_ref] = cell;
	},

	_innerExportData: function(workSheet, currDsCfg, exportFields, onlySelected, onlyOnce) {
		var dsObj = currDsCfg.dataset,
			context = dsObj.startSilenceMove(), 
			value, dataType, expFld, fldName,
			htmlTagRegarExpr = /<\/?[^>]*>/g,
			row = currDsCfg.endRow + 1,
			fldCnt = exportFields.length;
		if(currDsCfg.master) {
			row = currDsCfg.master.endRow;
		} else {
			row = currDsCfg.endRow + 1;
		}
		try {
			var dsTmp, notFirst = false, isMaster,
				hasMaster = currDsCfg.master? true: false;
			dsObj.first();
			while(!dsObj.isEof()) {
				if (onlySelected && !dsObj.selected()) {
					dsObj.next();
					continue;
				}
				for(var i = 0; i < fldCnt; i++) {
					expFld = exportFields[i];
					fldName = expFld.field;
					dsTmp = dsObj;
					if(dsObj !== expFld.dataset) {
						if(onlyOnce) {
							continue;
						}
						isMaster = false;
						var dsCfg = currDsCfg.master; 
						while(true) {
							if(!dsCfg) {
								break;
							}
							if(dsCfg.dataset === expFld.dataset) {
								isMaster = true;
								dsTmp = dsCfg.dataset;
								break;
							}
							dsCfg = dsCfg.master;
						}
						if(!isMaster) {
							continue;
						}
					}
					value = dsTmp.getFieldValue(fldName);
					if(value === null || value === undefined) {
						continue;
					}
					//If Number field does not have lookup field, return field value, not field text. 
					//Example: 'amount' field
					dataType = expFld.dataType;
					if(dataType === jslet.data.DataType.NUMBER && !expFld.hasLookup) {
						this._convertToXLSXFormat(workSheet, row, i, 'n', value);
					} else {
						value = dsTmp.getFieldText(fldName);
						if(value === null || value === undefined) {
							continue;
						}
						if(value && dataType === jslet.data.DataType.STRING) {
							var replaceFn = value.replace;
							if(replaceFn) {
								value = replaceFn.call(value, htmlTagRegarExpr, ''); //Get rid of HTML tag
							} else {
								value += '';
							}
						}
						this._convertToXLSXFormat(workSheet, row, i, 's', value);
					}
				} //end for i
			
				currDsCfg.endRow = row;
				var details = currDsCfg.details, dtlCfg;
				if(details && details.length > 0) {
					for(var j = 0, cfgCnt = details.length; j < cfgCnt; j++) {
						this._innerExportData(workSheet, details[j], exportFields, false, onlyOnce);
					}
					row = currDsCfg.endRow + 1;
				} else {
					row++
				}
				notFirst = true;
				dsObj.next();
			} // end while
			var masterCfg = currDsCfg.master;
			if(masterCfg && masterCfg.endRow < currDsCfg.endRow) {
				masterCfg.endRow = currDsCfg.endRow;
			}
		}finally{
			dsObj.endSilenceMove(context);
		}
	},
	
	_getExportFields: function(dataset, includeFields, excludeFields) {
		function getMaster(dsCfg, dsMaster) {
			if(dsCfg.dataset == dsMaster) {
				return dsCfg;
			} else {
				var details = topDsCfg.details;
				var dsObj, dsCfg;
				for(var i = 0, len = details.length; i < len; i++) {
					dsCfg = details[i];
					dsCfg = getMaster(dsCfg, dsMaster);
					if(!dsCfg) {
						return dsCfg;
					}
				}
			}
			return null;
		}
		
		function addDs(topDsCfg, dsMaster, dsDetail) {
			var dsCfg, details = topDsCfg.details;
			if(!details) {
				details = [];
				topDsCfg.details = details;
			}
			var found = false;
			var masterCfg = getMaster(topDsCfg, dsMaster);
			details = masterCfg.details;
			for(var k = 0, dsCnt = details.length; k < dsCnt; k++) {
				dsCfg = details[k];
				if(dsCfg.dataset === dsDetail) {
					found = true;
					break;
				}
			}
			if(!found) {
				details.push({master: masterCfg, dataset: dsDetail});
			}
		}
		
		var exportFlds = [], datasets = {dataset: dataset},
			fldName, fldObj, dtlFldObj, dsDetail, i, len, fldNames, expFld;
		if(includeFields && includeFields.length > 0) {
			for(i = 0, len = includeFields.length; i < len; i++) {
				fldName = includeFields[i];
				expFld = {};
				if(fldName.indexOf('.') < 0) {
					expFld.dataset = dataset;
					expFld.field = fldName;
					fldObj = dataset.getField(fldName);
				} else {
					fldNames = fldName.split('.');
					var dsMaster = dataset;
					for(var j = 0, cnt = fldNames.length - 1; j < cnt; j++) {
						dtlFldObj = dsMaster.getField(fldNames[j]);
						dsDetail = dtlFldObj.detailDataset();
						addDs(datasets, dsMaster, dsDetail);
						dsMaster = dsDetail; 
					}
					fldName = fldNames[cnt];
					expFld.dataset = dsDetail;
					expFld.field = fldName;
					fldObj = dsDetail.getField(fldName);
				}
				expFld.label = fldObj.label();
				expFld.type = fldObj.getType();
				expFld.hasLookup = fldObj.lookup() ? true: false;
				exportFlds.push(expFld);
			}
		} else {
			var fields = dataset.getNormalFields();
			for(i = 0, len = fields.length; i < len; i++) {
				fldObj = fields[i];
				if(!fldObj.visible()) {
					continue;
				}
				fldName = fldObj.name();
				if(excludeFields && excludeFields.length > 0) {
					if(excludeFields.indexOf(fldName) >= 0) {
						continue;
					}
				} 
				expFld = {dataset: dataset, field: fldName};
				expFld.label = fldObj.label();
				expFld.dataType = fldObj.getType();
				expFld.hasLookup = fldObj.lookup() ? true: false;
				exportFlds.push(expFld);
			}
		}
		return {datasets: datasets, fields: exportFlds};
	}
};
