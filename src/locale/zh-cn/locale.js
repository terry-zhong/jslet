/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * Chinese language pack
 */
"use strict";
(function (root, factory) {
    if (typeof define === 'function') {
    	if(define.amd) {
	        define('jslet-locale', factory);
	    } else {
	    	define(function(require,exports,module) {
	    		module.exports = factory();
	    	});
	    }
    } else {
        jslet.locale = factory();
    }
})(this, function () {
	var locale = {};
	locale.isRtl = false;//false: direction = 'ltr', true: direction = 'rtl'
	
	locale.Common = {
		jsonParseError: 'JSON格式错误，无法解析：{0}',
		ConnectError: '连接超时或者无法连接服务器!'
	};
	
	locale.Date = {
		format: 'yyyy-MM-dd'	
	};
	
	locale.Checker = {
		required: '[{0}] 不能为空!',
		requiredBooleanValue: '[{0}]必须为逻辑型(boolean)!',
		requiredStringValue: '[{0} : {1}]必须为字符型(String)!',
		requiredDateValue: '[{0} : {1}]必须为日期型(Date)!',
		requiredNumbericValue: '[{0} : {1}]必须为数字型(Number)!',
		greatThanZero: '[{0} : {1}]必须大于0!',
		greatThanEqualZero: '[{0} : {1}]必须大于或者等于0!',
		betweenValue: '[{0} : {1}] 必须在[{2}]和[{3}]之间!',
		lessThanMaxValue: '[{0} : {1}]必须小于：[{2}]!',
		greatThanMinValue: '[{0} : {1}]必须大于：[{2}]!',
		requiredArrayValue: '[{0} : {1}]必须为数组(Array)!',
		requiredObjectValue: '[{0} : {1}]必须为对象(Object)!',
		requiredPlanObjectValue: '[{0} : {1}]必须为Plan对象(Plan Object)!',
		requiredFunctionValue: '[{0} : {1}]必须为函数(Function)!',
		instanceOfClass: '[[{0} : {1}]]必须为类：[{2}]的实例!',
		inArray: '[{0} : {1}]必须在列表中：[{2}]!'
	};
	
	locale.Dataset = {
		fieldNameRequired: '定义字段时，缺失属性：name！',
		invalidDatasetField: '无效的数据集字段配置：[{0}]，缺失subDataset属性!',
		invalidDateFieldValue: '字段: [{0}]是日期字段, 但值：[{1}]不是日期型!',
		invalidNumberFieldValue: '字段: [{0}]是数字型字段, 但值：[{1}]不是数字型!',
		parentFieldNotSet: '数据集没有设置[parentField]和[keyField]属性, 请用insertRecord()!',
		detailDsHasError: '明细数据: {0}有错误!',
		submitUrlRequired: '数据集集：{0} 存在错误数据!',
		queryUrlRequired: '数据集没没有这只submitUrl属性! 用法: yourDataset.submitUrl(yourUrl)',
		cannotFocusControl: '无法移动焦点到此控件，请检查此控件是否disabled!',
		cannotImportSnapshot: '快照名称: [{0}] 与当前数据集名称: [{1}]不匹配，不能导入快照!',
		serverReturnNullRecord: '从服务器返回的数据里包含了null数据，可能会导致错误，请检查！',
		fieldNotFound:  '字段: {0} 未定义!',
		valueNotFound: '找不到指定的值!',
		lookupNotFound: '字段: {0} 没有设置查找字段, 不能使用字段链!',
		datasetFieldNotBeSetValue: '不能给数据集字段: {0} 设置值!',
		datasetFieldNotBeCalculated: '数据集字段: {0} 不能参与计算!',
		insertMasterFirst: '主数据集没有数据，请先在主数据集中新增数据!',
		lookupFieldExpected: '字段: {0} 必须是查找字段!',
		invalidLookupField: '字段: {0} 的是一个无效的查找字段，请检查参数!',
		invalidContextRule: '字段: [{0}]的上下文规则的条件中必须要有字段!如果是固定条件，请直接设置过滤条件!',
		fieldValueRequired: '不能为空!',
		invalidFieldTranslate: '字段: {0}里的属性: displayValueField 和 inputValueField不能为空!',
		translateListenerRequired: '必须设置事件监听器: translateListener!',
		minMaxValueError: '[{0}] 的最小值必须要小于或者等于最大值!',
		invalidDate: '无效日期!',
		invalidInt: '只允许:0-9,-',
		invalidFloat: '只允许:0-9,-,.',
		invalidIntegerPart: '整数部分超长，允许：{0}位，实际：{1}位！',
		invalidDecimalPart: '小数部分超长，允许：{0}位，实际：{1}位！',
		cannotConfirm: '数据录入有误，请先检查!',
		notInRange: '录入的值必须在:{0}和{1}之间',
		lessThanValue: '录入的值必须小于: {0}',
		moreThanValue: '录入的值必须大于: {0}',
		cannotDelParent: '该笔数据下还有下级数据,不能删除!',
		notUnique: '数据不能重复!',
		LookupDatasetNotSameAsHost: '查找数据源不能为主数据集!',
		betweenLabel: ' - ',
		betwwenInvalid: '最小值不得大于最大值',
		value: '值',
		nullText: '(空)',
		noDataSubmit: '无数据可提交!',
		trueText: '是',
		falseText: ''
	};

	locale.EnumDataset = {
		code: '编码',
		name: '名称'
	};
	
	locale.Control = {
		duplicatedId: 'HTML元素的ID：{0} 重复！重复的ID会导致不可预知的问题，请去除重复！'
	};
	
	locale.DBControl = {
		datasetNotFound: '找不到数据集： {0}, 请先定义并设置其名称!',
		expectedProperty: '请先设置属性值: {0}!',
		propertyValueMustBeInt: '属性: {0} 的值必须是数字!',
		jsletPropRequired: 'HTML模板上缺少jslet属性!',
		invalidHtmlTag: '所附加HTML标签无效，可参考: {0} !',
		invalidJsletProp: 'jslet控件参数不符合JSON规范: {0}'
	};

	locale.DBImage = {
		lockedImageTips: '图片被锁定 '
	};

	locale.DBChart = {
		onlyNumberFieldAllowed: '图表字段必须为Number类型!'
	};

	locale.DBCheckBoxGroup = {
		invalidCheckedCount: '最大可选择的个数不能超过: {0}!',
		noOptions: '无可选项',
		selectAll: '全部'
	};

	locale.DBRadioGroup = {
		noOptions: '无可选项'
	};

	locale.DBBetweenEdit = {
		betweenLabel: '-'
	};

	locale.DBPageBar = {
		refresh: '刷新当前页',
		first: '首页',
		prior: '前一页',
		next: '下一页',
		last: '最后一页',
		pageSize: '每页记录数 ',
		pageNum: '页码 '
	};

	locale.DBComboSelect = { 
		find: '按Ctrl+F查找数据!',
		cannotSelect: '不能选择此项！',
		notFound: '找不到!'
	};

	locale.MessageBox = { 
		ok: '确定',
		cancel: '取消',
		yes: '是',
		no: '否',
		info: '提示',
		error: '错误',
		warn: '警告',
		confirm: '确认',
		prompt: '请输入'
	};

	locale.Calendar = { 
		yearPrev: '前一年',
		monthPrev: '前一月',
		yearNext: '下一年',
		monthNext: '下一月',
		Sun: '日',
		Mon: '一',
		Tue: '二',
		Wed: '三',
		Thu: '四',
		Fri: '五',
		Sat: '六',
		today: '今日',
		monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
		firstDayOfWeek: 0
	};

	locale.DBTreeView = { 
		expandAll: '全部展开',
		collapseAll: '全部收缩',
		checkAll: '全部选择',
		uncheckAll: '全部不选'
	};

	locale.TabControl ={
		reload: '刷新',
		close: '关闭',
		closeOther: '关闭其它',
		closeAll: '关闭全部',
		newTab: '新页签',
		contentChanged: '数据有修改，是否确定要关闭？'
	};

	locale.DBTable = { 
		norecord: '没有数据',
		sorttitle: '按Ctrl可多列排序',
		totalLabel: '合计'
	};	
	
	locale.findDialog = {
		caption: '查找 - {0}',
		placeholder: '<回车>查找...'
	};
			
	locale.FilterDataset = {
		equal: '等于',
		notEqual: '不等于',
		greatThan: '大于',
		greatThanAndEqual: '大于等于',
		lessThan: '小于',
		lessThanAndEqual: '小于等于',
		and: '并且',
		or: '或者',
		between: '在...之间',
		likeany: '匹配任意',
		likefirst: '匹配开始',
		likelast: '匹配结尾',
		select: '选择',
		selfchildren0: '本级及所有下级',
		children0: '所有下级',
		selfchildren1: '本级及直接下级',
		children1: '所有直接下级',
		
		lParenthesis: '左括号',
		field: '字段名',
		dataType: '数据类型',
		operator: '操作符',
		value: '值',
		rParenthesis: '右括号',
		logicalOpr: '逻辑符',
		
		parenthesisNotMatched: '左右括号不匹配!',
		valueRequired: '条件值不得为空!',
		
		year: '年份',
		month: '月份',
		yearMonth: '年月'
	};

	locale.FilterPanel = {
		ok: '确定',
		cancel: '取消',
		clear: '清除',
		clearAll: ' 清除所有 ',
	};
	
	locale.ExportDialog = {
		caption: '导出',
		saveSchema: ' 保存 ',
		deleteSchema: ' 删除 ',
		all: '全部',
		onlySelected: '只导出选择的数据',
		fileName: '文件名：',
		exportData: ' 导出 ',
		cancel: ' 取消 '
	};
	
	locale.ImportDialog = {
		caption: '导入',
		fieldLabel: ' 字段 ',
		columnHeader: ' 列名 ',
		fileName: '文件名：',
		importData: ' 导入 ',
		cancel: ' 取消 ',
		notSupportFile: '无法解析导入文件!',
		noData: '文件无数据!',
		noColHeader: '文件中没有列头或者必填字段没有数据！'
	};
		
	locale.InputSettingDialog = {
		labelLabel: '字段名',
		labelDefaultValue: '默认值',
		labelFocused: '录入项',
		labelValueFollow: '值复制',
		caption: '录入配置',
		save: ' 保存 ',
		cancel: ' 取消 '
	};
	
    if (typeof define !== 'function') {
    	window.jsletlocale = locale;
    }
	return locale;
});
