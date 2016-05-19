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
		function convertToXLSXFormat(worksheet, row, col, type, value) {
			var cell_ref = XLSX.utils.encode_cell({c: col,r: row}), 
				cell = {t: type, v: value};
			worksheet[cell_ref] = cell;
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
			escapeDate = true;
		
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
		}
		var fields = dataset.getNormalFields(),
			i, fldCnt = fields.length, 
			fldObj, fldName, value,
			exportFields = [];
		for(i = 0; i < fldCnt; i++) {
			fldObj = fields[i];
			fldName = fldObj.name();
			if(includeFields && includeFields.length > 0) {
				if(includeFields.indexOf(fldName) < 0) {
					continue;
				}
			} else {
				if(!fldObj.visible()) {
					continue;
				}
			}
			if(excludeFields && excludeFields.length > 0) {
				if(excludeFields.indexOf(fldName) >= 0) {
					continue;
				}
			} 
			exportFields.push(fldObj);
		}
		var workSheet = {},
			row = 0, lastRow, lastCol,
			startCell = null, 
			endCell = null;
		fldCnt = exportFields.length;
		if (exportHeader) {
			for(i = 0; i < fldCnt; i++) {
				fldObj = exportFields[i];
				convertToXLSXFormat(workSheet, row, i, 's', fldObj.label());
			}
			row++;
			if(!startCell) {
				startCell = {r: 0, c: 0};
			}
			lastRow = 0, lastCol = fldCnt - 1;
		}

		var context = dataset.startSilenceMove(), value, dataType,
			htmlTagRegarExpr = /<\/?[^>]*>/g;
		try{
			dataset.first();
			while(!dataset.isEof()) {
				if (onlySelected && !dataset.selected()) {
					dataset.next();
					continue;
				}
				for(i = 0; i < fldCnt; i++) {
					fldObj = exportFields[i];
					value = fldObj.getValue();
					if(value === null || value === undefined) {
						continue;
					}
					fldName = fldObj.name();
					//If Number field does not have lookup field, return field value, not field text. 
					//Example: 'amount' field
					dataType = fldObj.getType();
					if(dataType === jslet.data.DataType.NUMBER && !fldObj.lookup()) {
						convertToXLSXFormat(workSheet, row, i, 'n', value);
					} else {
						value = dataset.getFieldText(fldName);
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
						convertToXLSXFormat(workSheet, row, i, 's', value);
					}
					if(!startCell) {
						startCell = {r: row, c: i};
					}
					lastRow = row;
				} //end for i
				row++;
				dataset.next();
			} // end while
			endCell = {r: lastRow, c: lastCol};
		}finally{
			dataset.endSilenceMove(context);
		}
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
	}
};
