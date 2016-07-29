/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
 * Inner Class for DBTable and DBTreeView control
 */
"use strict";
jslet.ui.ListViewModel = function (dataset, isTree) {// boolean, identify if it's tree model
	var visibleCount = 0,
		visibleStartRow = 0,
		visibleEndRow = 0,
		needShowRows = null,//Array of all rows that need show, all of these rows's status will be 'expanded'
		allRows = null,//Array of all rows, include 'expanded' and 'collapsed' rows
		currentRowno = 0,
		currentRecno = 0;
	this.onTopRownoChanged = null; //Event handler: function(rowno){}
	this.onVisibleCountChanged = null; //Event handler: function(visibleRowCount){}
	this.onCurrentRownoChanged = null; //Event handler: function(rowno){}
	this.onNeedShowRowsCountChanged = null; //Event handler: function(needShowCount){}
	this.onCheckStateChanged = null;  //Event handler: function(){}
		
	this.fixedRows = 0;
	var initial = function () {
		if (!isTree) {
			return false;
		}
		var ds = dataset;
		if (!ds._parentField || !ds._keyField) {
			return false;
		}
		return true;
	};
	initial();
	
	this.refreshModel = function (expandLevel) {
		if (!isTree) {
			return;
		}
		if(expandLevel === undefined) {
			expandLevel = -1;
		}
		var dsObj = dataset, 
			hiddenCnt = 0, 
			recno, 
			allCnt = dsObj.recordCount(), 
			childCnt, 
			result = [], 
			pId,
			oldRecno = dsObj.recnoSilence();
		try {
			dsObj.recnoSilence(this.fixedRows);
			var level = 0, 
				pnodes = [], 
				node, pnode, 
				tmpNode, tmpKeyValue,
				currRec, keyValue, recCnt;
			for(recno = 0, recCnt = dsObj.recordCount(); recno < recCnt; recno++) {
				dsObj.recnoSilence(recno);
				keyValue = dsObj.keyValue();
				level = 0;
				pnode = null;
				pId = dsObj.parentValue();
				for(var m = pnodes.length - 1; m>=0; m--) {
					tmpNode = pnodes[m];
					tmpKeyValue = tmpNode.keyvalue; 
					if (tmpKeyValue !== null && 
						tmpKeyValue !== undefined && 
						tmpKeyValue !== '' && 
						tmpKeyValue == pId) {
						level = tmpNode.level + 1;
						pnode = tmpNode;
						break;
					}
				}
				if (pnode){
					for(var k = pnodes.length - 1; k > m; k--) {
						pnodes.pop();
					}
				}
				currRec = dsObj.getRecord();
				var expanded = true;
				if(expandLevel >= 0 && level <= expandLevel) {
					expanded = true;
				} else { 
					expanded = dsObj.expanded();
				}
				node = { parent: pnode, recno: recno, keyvalue: keyValue, expanded: expanded, isbold: 0, level: level };
				pnodes.push(node);
								
				if (pnode){
					if (!pnode.children) {
						pnode.children = [];
					}
					pnode.children.push(node);
				} else {
					result.push(node);
				}
				
			} //end for recno
		} finally {
			dsObj.recnoSilence(oldRecno);
		}
		allRows = result;
		for(var j = 0, len = allRows.length; j < len; j++) {
			this._updateNodeBoldStyle(allRows[j]);
		}
		this._setLastFlag(result);
		this._refreshNeedShowRows();
	};
		
	this._updateNodeBoldStyle = function(node) {
		
		function update(pnode) {
			var children = pnode.children, 
				cnode, found = false;
			if(!children) {
				return;
			}
			for(var i = 0, cnt = children.length; i < cnt; i++) {
				cnode = children[i];
				if(cnode.children) {
					update(cnode);
					if(!cnode.isbold) {
						if (dataset.selectedByRecno(cnode.recno)) {
							pnode.isbold = true;
							found = true;
							break;
						}
					} else {
						pnode.isbold = true;
						found = true;
						break;
					}
				} else {
					if (dataset.selectedByRecno(cnode.recno)) {
						pnode.isbold = true;
						found = true;
						break;
					}
				}
			}
			if(!found) {
				pnode.isbold = false;
			}
		}
		
		if(!node) {
			return;
		}
		
		var pNode = node, root = node;
		while(true) {
			pNode = node.parent;
			if(pNode === null) {
				root = node;
				break;
			}
			node = pNode;
		}
		update(root);
	};
	
	this._setLastFlag = function (nodes) {
		if (!nodes || nodes.length === 0) {
			return;
		}
		var node;
		nodes[nodes.length - 1].islast = true;
		for (var i = 0, cnt = nodes.length; i < cnt; i++) {
			node = nodes[i];
			if (node.children && node.children.length > 0) {
				this._setLastFlag(node.children);
			}
		}
		return null;
	};
	
	this._refreshNeedShowRows = function (notFireChangedEvent) {
		if (!isTree) {
			return;
		}
		var result = [], node;
		if (!allRows) {
			this.refreshModel();
			return;
		}
		var preCnt = needShowRows ? needShowRows.length: 0;
		needShowRows = [];
		this._findVisibleNode(allRows);
		var currCnt = needShowRows.length;
		if (!notFireChangedEvent && this.onNeedShowRowsCountChanged){
			this.onNeedShowRowsCountChanged(currCnt);
		}
	};
	
	this.hasChildren = function (recno) {
		if (!isTree) {
			return false;
		}
		if (!recno) {
			recno = dataset.recno();
		}
		var node = this._innerFindNode(allRows, recno);
		if (node === null) {
			return;
		}
		return node.children && node.children.length > 0;
	};
	
	this.getLevel = function (recno) {
		if (!isTree) {
			return false;
		}
		if (!recno) {
			recno = dataset.recno();
		}
		var node = this._innerFindNode(allRows, recno);
		if (node === null) {
			return;
		}
		return node.level;
	};
	
	this._findVisibleNode = function (nodes) {
		if (!nodes) {
			return;
		}
		var node;
		for (var i = 0, cnt = nodes.length; i < cnt; i++) {
			node = nodes[i];
			needShowRows.push(node);
			if (node.expanded){
				this._findVisibleNode(node.children);
			}
		}
	};
	
	this.rownoToRecno = function (rowno) {
		if (!isTree) {
			return rowno + this.fixedRows;
		}
		if (rowno < 0) {
			rowno = rowno + this.fixedRows;
			return rowno >= 0 ? rowno : -1;
		}
		if (rowno >= needShowRows.length) {
			return -1;
		}
		return needShowRows[rowno].recno;
	};
	
	this.recnoToRowno = function (recno) {
		if (!isTree) {
			return recno - this.fixedRows;
		}
		for(var i = 0, cnt = needShowRows.length; i < cnt; i++){
			if (needShowRows[i].recno == recno) {
				return i;
			}
		}
		return -1;
	};
	
	this.setVisibleStartRow = function (rowno, notFireEvt) {
		if (rowno >= 0) {
			var maxVisibleNo = this.getNeedShowRowCount() + 1 - visibleCount;
			if (rowno > maxVisibleNo) {
				rowno = maxVisibleNo;
			}
		}
		if (rowno < 0) {
			rowno = 0;
		}
		if (visibleStartRow == rowno) {
			return;
		}
		visibleStartRow = rowno;
		visibleEndRow = rowno + visibleCount - 1;
		if (!notFireEvt && this.onTopRownoChanged) {
			this.onTopRownoChanged(rowno);
		}
	};
	
	this.getVisibleStartRow = function () {
		return visibleStartRow;
	};
	
	this.setVisibleEndRow = function(endRow){
		visibleEndRow = endRow;
	};
	
	this.getVisibleEndRow = function(){
		return visibleEndRow;
	};
	
	this.setVisibleCount = function (count, notFireEvt) {
		if (visibleCount == count) {
			return;
		}
		visibleCount = count;
		visibleEndRow = visibleStartRow + count - 1;
		if (!notFireEvt && this.onVisibleCountChanged) {
			this.onVisibleCountChanged(count);
		}
	};
	
	this.getVisibleCount = function () {
		return visibleCount;
	};
	
	this.getNeedShowRowCount = function () {
		if (!isTree) {
			return dataset.recordCount()- this.fixedRows;
		}
		return needShowRows.length;
	};
	
	this.getCurrentRow = function(){
		return needShowRows[currentRowno];
	};
	
	this.skipSetCurrentRowno = function() {
		this._skipSetCurrentRowno = true;
	};
	
	this.setCurrentRowno = function (rowno, notFireEvt, checkVisible) {
		if(this._skipSetCurrentRowno) {
			this._skipSetCurrentRowno = false;
			return null;
		}
		if(rowno === undefined) {
			return null;
		}
		var preRowno = currentRowno, recno = 0, currRow=null;
		if (rowno < 0){//In the fixed row area
			var lowestRowno = -1 * this.fixedRows;
			if (rowno < lowestRowno) {
				rowno = lowestRowno;
			}
			recno = this.fixedRows + rowno;
		} else {
			var maxRow = this.getNeedShowRowCount();
			if(maxRow === 0) {
				currentRowno = 0;
				currentRecno = -1;
				return null;
			}
			if (rowno >= maxRow) {
				rowno = maxRow - 1;
			}
			if (!isTree) {
				recno = rowno + this.fixedRows;
			} else {
				currRow = needShowRows[rowno];
				recno = currRow.recno;
			}
			if (checkVisible) {
				if (rowno >= 0 && rowno < visibleStartRow){
					this.setVisibleStartRow(rowno);
				} else {
					if (rowno >= visibleStartRow + visibleCount) {
						this.setVisibleStartRow(rowno - visibleCount + 1);
					}
				}
			}
		}
		currentRowno = rowno;
		currentRecno = recno;
		if (!notFireEvt && this.onCurrentRownoChanged) {
			this.onCurrentRownoChanged(preRowno, currentRowno);
		}
		return currRow;
	};
	
	this.getCurrentRowno = function () {
		return currentRowno;
	};
	
	this.getCurrentRecno = function() {
		return currentRecno;
	};
	
	this.nextRow = function () {
		dataset.confirm();
		this.setCurrentRowno(currentRowno + 1, false, true);
	};
	
	this.priorRow = function (num) {
		dataset.confirm();
		this.setCurrentRowno(currentRowno - 1, false, true);
	};
	
	this.nextPage = function () {
		dataset.confirm();
		this.setVisibleStartRow(visibleStartRow + visibleCount);
		this.setCurrentRowno(visibleStartRow);
	};
	
	this.priorPage = function () {
		dataset.confirm();
		this.setVisibleStartRow(visibleStartRow - visibleCount);
		this.setCurrentRowno(visibleStartRow);
	};
	
	this._innerFindNode = function (nodes, recno) {
		var node, nextNode;
		for (var i = 0, cnt = nodes.length - 1; i <= cnt; i++) {
			node = nodes[i];
			if (node.recno == recno) {
				return node;
			}
			if (node.children) {
				var result = this._innerFindNode(node.children, recno);
				if (result) {
					return result;
				}
			}
		}
		return null;
	};
	
	this.expand = function (callbackFn) {
		if (!isTree) {
			return;
		}
		var node = this._innerFindNode(allRows, dataset.recno());
		if (node === null) {
			return;
		}
		dataset.confirm();
		var oldRecno = dataset.recnoSilence();
		try {
			node.expanded = node.children ? true : false;
			dataset.recnoSilence(node.recno);
			dataset.expanded(node.expanded);
			var p = node;
			while (true) {
				p = p.parent;
				if (!p) {
					break;
				}
				if (!p.expanded) {
					dataset.recnoSilence(p.recno);
					dataset.expanded(true);
					p.expanded = true;
				}
			}
		} finally {
			dataset.recnoSilence(oldRecno);
		}
		this._refreshNeedShowRows();
		if (callbackFn) {
			callbackFn();
		}
	};
	
	this.collapse = function (callbackFn) {
		if (!isTree) {
			return;
		}
		var node = this._innerFindNode(allRows, dataset.recno());
		if (node === null) {
			return;
		}
		dataset.confirm();
		var oldRecno = dataset.recnoSilence();
		try {
			dataset.recnoSilence(node.recno);
			dataset.expanded(false);
			node.expanded = false;
		} finally {
			dataset.recnoSilence(oldRecno);
		}
		
		this._refreshNeedShowRows();
		if (callbackFn) {
			callbackFn();
		}
	};
	
	this._iterateNode = function (nodes, callbackFn) {
		var node;
		for (var i = 0, cnt = nodes.length; i < cnt; i++) {
			node = nodes[i];
			if (node.children) {
				if (callbackFn) {
					callbackFn(node);
				}
				if (node.children && node.children.length > 0) {
					this._iterateNode(node.children, callbackFn);
				}
			}
		}
		return null;
	};
	
	this._callbackFn = function (node, expanded) {
		var oldRecno = dataset.recnoSilence();
		try {
			dataset.recnoSilence(node.recno);
			dataset.expanded(expanded);
			node.expanded = expanded;
		} finally {
			dataset.recnoSilence(oldRecno);
		}
	};
	
	this.expandAll = function (callbackFn) {
		if (!isTree) {
			return;
		}
		
		dataset.confirm();
		var Z = this;
		Z._iterateNode(allRows, function (node) {
			Z._callbackFn(node, true); 
		});
		Z._refreshNeedShowRows();
		if (callbackFn) {
			callbackFn();
		}
	};
	
	this.collapseAll = function (callbackFn) {
		if (!isTree) {
			return;
		}
		dataset.confirm();
		var Z = this;
		Z._iterateNode(allRows, function (node) {
			Z._callbackFn(node, false); 
		});
		Z._refreshNeedShowRows();
		if (callbackFn) {
			callbackFn();
		}
	};
	
	this.syncDataset = function(){
		var recno = dataset.recno();
		if(recno < 0) {
			return;
		}
		var node = this._innerFindNode(allRows, dataset.recno()),
			pnode = node.parent;
		if (pnode && !pnode.expanded){
			while(true){
				if (!pnode.expanded) {
					pnode.expanded = true;
				} else {
						break;
				}
				pnode = pnode.parent;
				if (!pnode) {
					break;
				}
			}
		}
		this._refreshNeedShowRows();
		var rowno = this.recnoToRowno(recno);
		this.setCurrentRowno(rowno, false, true);
	};
	
	this.checkNode = function(state, relativeCheck, onlyCheckChildren){
		var node = this.getCurrentRow();
		dataset.selected(state ? 1 : 0);

		if (relativeCheck){
			if (node.children && node.children.length > 0) {
				this._updateChildState(node, state);
			}
			if (node.parent && !onlyCheckChildren) {
				this._updateParentState(node, state);
			}
		}
		
		this._updateNodeBoldStyle(node);
		
		if (this.onCheckStateChanged) {
			this.onCheckStateChanged();
		}
	};
	
	this.checkChildNodes = function(state, relativeCheck){
		var node = this.getCurrentRow();
		dataset.selected(state ? 1 : 0);

		if (relativeCheck){
			if (node.parent) {
				this._updateParentState(node, state);
			}
			if (node.children && node.children.length > 0) {
				this._updateChildState(node, state);
			}
		}

		this._updateNodeBoldStyle(node);
		
		if (this.onCheckStateChanged) {
			this.onCheckStateChanged();
		}
	};
	
	this._updateChildState = function(node, state){
		var oldRecno = dataset.recnoSilence(),
			childNode;
		try{
			for(var i = 0, cnt = node.children.length; i < cnt; i++){
				childNode = node.children[i];
				dataset.recnoSilence(childNode.recno);
				dataset.selected(state);
				if (childNode.children && childNode.children.length > 0) {
					this._updateChildState(childNode, state);
				}
			}
		} finally {
			dataset.recnoSilence(oldRecno);
		}
	};
	
	this._updateParentState = function(node, state){
		var pNode = node.parent;
		if (!pNode) {
			return;
		}
		var childNode, newState, childState;
		if (state != 2){
			for(var i = 0, cnt = pNode.children.length; i < cnt; i++){
				childNode = pNode.children[i];
				childState = dataset.selectedByRecno(childNode.recno);
				if (childState == 2){
					newState = 2;
					break;
				}
				if (i === 0){
					newState = childState;
				} else if (newState != childState){
					newState =2;
					break;
				}
			}//end for
		} else {
			newState = state;
		}
		var pState = dataset.selectedByRecno(pNode.recno);
		if (pState != newState){
			var oldRecno = dataset.recnoSilence();
			try{
				dataset.recnoSilence(pNode.recno);
				dataset.selected(newState);
			}finally{
				dataset.recnoSilence(oldRecno);
			}
		}
		this._updateParentState(pNode, newState);
	};
	
	this.reset = function() {
		visibleCount = 0;
		visibleStartRow = 0;
		visibleEndRow = 0;
		needShowRows = null;
		allRows = null;
		currentRowno = 0;
		currentRecno = 0;
		this.fixedRows = 0;
	};
	
	this.destroy = function(){
		dataset = null;
		allRows = null;
		this.reset();
		this.onTopRownoChanged = null;
		this.onVisibleCountChanged = null;
		this.onCurrentRownoChanged = null;
		this.onNeedShowRowsCountChanged = null;
		this.onCheckStateChanged = null;
	};
};
