/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class jslet.data.ContextRule
 * <pre><code>
 *	  //Create context rule for field "city"
 *    var contextRule = new jslet.data.ContextRule(dsEmployee);
 *    contextRule.addRuleItem("city", null, "[province]==[employee!province]", null);
 *    dsEmployee.contextRule(contextRule);
 *    dsEmployee.enableContextRule();
 * </code></pre>
 * 
 * @param {jslet.data.Dataset} dataset 
 * @return {jslet.data.ContextRule}
 */
jslet.data.ContextRule = function(dataset) {
	var fdataset = dataset,
		frules = new jslet.SimpleMap(),
		fconditionFields = new jslet.SimpleMap(),
		fconditionFieldValues = new jslet.SimpleMap();

	var putConditionFields = function(conditionField, resultField) {
		var flds = fconditionFields.get(conditionField);
		if (!flds) {
			flds = new Array();
			fconditionFields.set(conditionField, flds);
		}
		flds.push(resultField);
	}

	/**
	 * Add contect rule item.
	 * 
	 * @param {String} fldName Field name.
	 * @param {String} condition Condition expression. Example: '[fld1] > 0'
	 * @param {String} resultRange Result range expression. Example: '[code] like "10101%"';
	 * 		Range expression is used in lookup dataset of 'fldName'.
	 * @param {Object} defaultValue Default value of 'fldName';
	 */
	this.addRuleItem = function(fldName, condition, resultRange, defaultValue) {
		var fldObj = fdataset.getField(fldName);
		if (!fldObj) {
			throw new Error(jslet.formatString(jslet.locale.Dataset.fieldNotFound,[rulefld]));
		}
		var lkf = fldObj.lookupField();
		if (!lkf) {
			throw new Error(jslet.formatString(jslet.locale.Dataset.lookupFieldExpected,[rulefld]));
		}

		var lkds = lkf.lookupDataset();
		if (!lkds) {
			throw new Error(jslet.formatString(jslet.locale.Dataset.invalidLookupField,[rulefld]));
		}

		var item = new jslet.data.ContextRuleItem(fdataset, condition, resultRange,
				defaultValue);
		item.lookupDataset = lkds;

		var ruleItems = frules.get(fldName);
		if (!ruleItems) {
			ruleItems = [];
			frules.set(fldName, ruleItems);
		}
		ruleItems.push(item);
		var cflds = item.getConditionFields();
		if (!cflds) {
			throw new Error(jslet.formatString(jslet.locale.Dataset.invalidContextRule, [fldName]));
		}
		var cnt = cflds.length;
		for (var i = 0; i < cnt; i++) {
			putConditionFields(cflds[i], fldName);
		}
	}

	/**
	 * Clear rule items of specified field name.
	 * 
	 * @param {String} fldName Field name.
	 */
	this.clearRuleItems = function(fldName) {
		if (!fldName) {
			frules = new jslet.SimpleMap();
			fconditionFields = new jslet.SimpleMap();
		} else {
			frules.set(fldName, null);
		}
	}

	/**
	 * Get context rule items.
	 * 
	 * @param {String} fldName Field name.
	 * @return {jslet.data.ContextRule[]} Array of context rule item.
	 */
	this.getRuleItems = function(fldName) {
		return frules.get(fldName);
	}

	this.restoreContextRule = function() {
		if (!fdataset) {
			return;
		}

		var resultFields = frules.keys(), rulefld, rule, lkds;
		for (var i = 0, cnt = resultFields.length; i < cnt; i++) {
			rulefld = resultFields[i];
			rule = frules.get(rulefld);
			for (var j = 0, rcnt = rule.length; j < rcnt; j++) {
				lkds = rule[j].lookupDataset;
				if (lkds) {
					if (!lkds.filtered()) {
						continue;
					}
					lkds.filtered(false);
					fdataset.renderOptions(rulefld);
				}
			}//end for j
		}//end for i
	}

	var getChaningResultField = function(conditionField, chaningResultField) {
	    var currValue = fdataset.getFieldValue(conditionField),
        	preValue = fconditionFieldValues.get(conditionField);
		if (currValue == preValue) {
			return;
		}
		fconditionFieldValues.set(conditionField, currValue);
		var flds = fconditionFields.get(conditionField);
		if (flds) {
			for (var i = 0, cnt = flds.length; i < cnt; i++) {
				chaningResultField.push(flds[i]);
			}
		}
	}

	var hasNullValueInConditionFields = function(conditionFeilds) {
		var fldName, value;
		for (var i = 0, cnt = conditionFeilds.length; i < cnt; i++) {
			fldName = conditionFeilds[i];
			value = dataset.getFieldValue(fldName);
			if (value == null || value == undefined) {
				return true;
			}
		}
		return false;
	}

	this.clearConditionFieldValues = function() {
		fconditionFieldValues = new jslet.SimpleMap();
	}

	this.calcContextRule = function(changedField) {
		if (!fdataset || frules.keys().length == 0) {
			return;
		}
		var chaningResultField = [];
		if (changedField) {
			getChaningResultField(changedField, chaningResultField);
		} else {
			var flds = fconditionFields.keys();
			for (var i = 0, cnt = flds.length; i < cnt; i++) {
				getChaningResultField(flds[i], chaningResultField);
			}
		}

		var rulefld,rules, rule, lkf, lkds,flag, srcFieldIndex = -1,rulecnt,lkDataset;
		for (var i = 0, cnt = chaningResultField.length; i < cnt; i++) {
			rulefld = chaningResultField[i];
			rules = frules.get(rulefld);
			flag = 0;
			for (var j = 0, rulecnt = rules.length; j < rulecnt; j++) {
				rule = rules[j];
				if (rule.condition) {
					if (hasNullValueInConditionFields(rule.getConditionFields())) {
						continue;
					}
					if (!rule.evalCondition()) {
						continue;
					}
				}
				flag = 1;
				lkds = rule.lookupDataset;
				lkds.filter(rule.resultRange);
				lkds.filtered(true);
				if (changedField) {
					if (rule.defaultValue) {
						fdataset.setFieldValue(rulefld, rule.defaultValue);
					} else {
						fdataset.setFieldValue(rulefld, null);
					}
				}
				break;
			} // end for j
			if (!flag) {
				lkds.filtered(false);
			}

			fdataset.renderOptions(rulefld);
		}// end for i
	}
}

/**
 * @class
 * keep all dataset object,
 * key for dataset name, value for dataset object
 */
jslet.data.ContextRuleItem = function(dataset, condition, resultRange, defaultValue) {
	var fdatasetName = dataset.name();

	this.condition = condition;// String, expression
	this.resultRange = resultRange; // String, range expression
	this.defaultValue = defaultValue;// corresponding to field datatype

	var fconditionEvaluator = null;
	if (this.condition) {
		fconditionEvaluator = new jslet.FormulaParser(dataset, this.condition);
	}
	var fresultRangeEvaluator = null;
	if (this.resultRange) {
		fresultRangeEvaluator = new jslet.FormulaParser(dataset,
				this.resultRange);
	}

	var fconditionFields,flds;
	if (fconditionEvaluator) {
		flds = fconditionEvaluator.getFields();
		if (flds && flds.length > 0) {
			fconditionFields = flds.slice(0);
		}
	}

	if (fresultRangeEvaluator) {
		flds = fresultRangeEvaluator.getOtherDatasetFields();
		var cnt = flds.length;
		if (flds && cnt > 0) {
			if (!fconditionFields) {
				fconditionFields = [];
			}
			var otmp;
			for (var i = 0; i < cnt; i++) {
				otmp = flds[i];
				if (otmp.dataset == fdatasetName) {
					fconditionFields.push(otmp.fieldName);
				}
			}//end for
		}//end if
	}

	this.evalCondition = function() {
		if (fconditionEvaluator) {
			return fconditionEvaluator.evalExpr();
		} else {
			return true;
		}
	}

	this.getConditionFields = function() {
		return fconditionFields;
	}
}
