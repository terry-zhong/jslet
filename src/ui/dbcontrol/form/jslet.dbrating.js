/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBRating. 
 * A control which usually displays some star to user, and user can click to rate something. Example:
 * <pre><code>
 * 		var jsletParam = {type:"DBRating",dataset:"employee",field:"grade", itemCount: 5};
 * 
 * //1. Declaring:
 *      &lt;div data-jslet='type:"DBRating",dataset:"employee",field:"grade"', itemCount: 5' />
 *      or
 *      &lt;div data-jslet='jsletParam' />
 *      
 *  //2. Binding
 *      &lt;div id="ctrlId"  />
 *  	//Js snippet
 * 		var el = document.getElementById('ctrlId');
 *  	jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *  	jslet.ui.createControl(jsletParam, document.body);
 *  	
 * </code></pre>
 */
jslet.ui.DBRating = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
        var Z = this;
        if (!Z.allProperties) {
            Z.allProperties = 'dataset,field,itemCount,splitCount,readOnly,itemWidth,required';
        }
        if (!Z.requiredProperties) {
            Z.requiredProperties = 'field';
        }
        Z.dataset;
        Z.field;
        /**
         * {Integer} Rate item count, In other words, the count of 'Star' sign.
         */
        Z.itemCount = 5;
        /**
         * {Integer} You can use it to split the 'Star' sign to describe decimal like: 1.5, 1.25.
         * SplitCount equals 2, that means cut 'Star' sign into two part, it can express: 0, 0.5, 1, 1.5, ...
         */
        Z.splitCount = 0;
        /**
         * {Boolean} read only or not.
         */
        Z.readOnly = false;
        /**
         * {Integer} The width of one 'Star' sign.
         */
        Z.itemWidth = 20;
        /**
         * {Boolean} Required or not. If it is not required, you can rate 0 by double clicking first item. 
         */
        Z.required = false;
        
        $super(el, params)
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
        Z.checkDataField();

        if (!Z.splitCount || Z.splitCount < 0) {
            Z.splitCount = 1;
        }
        if (!Z.itemCount || Z.itemCount < 0) {
            Z.itemCount = 5;
        }
        if (!Z.itemWidth || Z.itemWidth < 0) {
            Z.itemWidth = 20;
        }
        if (!Z.el.jslet) {
            Z.el.jslet = Z;
        }
        Z.renderAll();
        var jqEl = jQuery(Z.el);
		jqEl.on('mousedown', 'td', Z._mouseDown);
		jqEl.on('mousemove', 'td', Z._mouseMove);
        jqEl.on('mouseout', 'td', Z._mouseOut);
        jqEl.on('mouseup', 'td', Z._mouseUp);
	}, // end bind

    _mouseMove: function domove(event) {
   		event = jQuery.event.fix( event || window.event );
        var rating = event.delegateTarget, Z = rating.jslet;
        if (Z.readOnly) {
            return;
        }
        var jqRating = jQuery(rating),
       		x1 = event.pageX - jqRating.offset().left,
       		k = Math.ceil(x1 / Z.splitWidth), offsetW,
			oRow = rating.firstChild.rows[0],
       		itemCnt = oRow.cells.length;

		var valueNo = event.srcElement.cellIndex + 1;
        for (var i = 0; i < itemCnt; i++) {
            var oitem = oRow.cells[i];
            Z._setBackgroundPos(oitem, Z._getPosX(i % Z.splitCount, i < valueNo ? 1: 2));
        }
    },

    _mouseOut: function doout(event) {
   		event = jQuery.event.fix( event || window.event );
		var Z = event.delegateTarget.jslet;
        if (Z.readOnly) {
            return;
        }
        Z._innerRefreshControl();
    },

    _mouseDown: function dodown(event) {
   		event = jQuery.event.fix( event || window.event );
        var rating = event.delegateTarget,
        Z = rating.jslet;
        if (Z.readOnly) {
            return;
        }
        var oRow = rating.firstChild.rows[0],
       		itemCnt = oRow.cells.length;
        
        //if can set zero and current item is first one, then clear value
		var k = event.srcElement.cellIndex+1;
        if (!Z.required && k == 1) {
            k = (Z.value * Z.splitCount) == 1 ? 0 : 1;
        }
		Z.value = k / Z.splitCount;
        Z.dataset.setFieldValue(Z.field, Z.value, Z.valueIndex);
		Z._innerRefreshControl();
    },

    _mouseUp: function(event) {
   		event = jQuery.event.fix( event || window.event );
        var rating = event.delegateTarget,
			oRow = rating.firstChild.rows[0],
			Z = rating.jslet;
        if (Z.readOnly) {
            return;
        }
        if (Z._selectedItem >= 0) {
            var oitem = oRow.cells[Z._selectedItem];
            Z._setBackgroundPos(oitem, Z._selectedPx);
        }
    },

    _getPosX: function(index, status){
       	var Z = this, isRtl = jslet.locale.isRtl,bgX;
		bgX = 0 - status * Z.itemWidth;
		if (isRtl){
			bgX += (index+1)*Z.splitWidth - Z.itemWidth;
		} else {
			bgX -= index * Z.splitWidth;
		}
		return bgX;
    },
	
    _setBackgroundPos: function (oitem, posX) {
        if (oitem.style.backgroundPositionX != undefined) {
            oitem.style.backgroundPositionX = posX + 'px';
        } else {
            oitem.style.backgroundPosition = posX + 'px 0px';
        }
    },

	/**
	 * @override
	 */
    refreshControl: function (evt) {
        var Z = this;
        if (Z._keep_silence_) {
            return;
        }
        if (evt.eventType == jslet.data.UpdateEvent.METACHANGE) {
            if (evt.eventInfo.enabled != undefined) {
                Z.readOnly = !evt.eventInfo.enabled;
            }

            if (evt.eventInfo.readOnly != undefined) {
                Z.readOnly = evt.eventInfo.readOnly;
            }
        } else if (evt.eventType == jslet.data.UpdateEvent.SCROLL
				|| evt.eventType == jslet.data.UpdateEvent.UPDATEALL
				|| evt.eventType == jslet.data.UpdateEvent.UPDATERECORD
				|| evt.eventType == jslet.data.UpdateEvent.INSERT
				|| evt.eventType == jslet.data.UpdateEvent.DELETE
				|| evt.eventType == jslet.data.UpdateEvent.UPDATECOLUMN) {
            if (evt.eventType == jslet.data.UpdateEvent.UPDATERECORD
					&& evt.eventInfo != undefined
					&& evt.eventInfo.fieldName != undefined
					&& evt.eventInfo.fieldName != Z.field) {
                return;
            }
			Z._innerRefreshControl();
        }
    }, // end refreshControl

	_innerRefreshControl: function(){
		var Z = this;
		try {
			var fldObj = Z.dataset.getField(Z.field),
				value = Z.dataset.getFieldValue(Z.field, Z.valueIndex),
				itemCnt = Z.itemCount * Z.splitCount,
				valueNo = Math.ceil(value * Z.splitCount),
				oitem, offsetW, bgX, ratingRow = Z.el.firstChild.rows[0],
				bgW = Z.itemWidth * 2,
				isRtl = jslet.locale.isRtl;
			Z.required = fldObj.required();
			Z.value = value;
			for (var i = 0; i < itemCnt; i++) {
				oitem = ratingRow.childNodes[i];
				Z._setBackgroundPos(oitem, Z._getPosX(i % Z.splitCount, i < valueNo ? 0: 2));
			}
		} catch (e) {
			jslet.showException(e);
		}	
	},
	
	/**
	 * @override
	 */
    renderAll: function () {
        var Z = this, 
        	fldObj = Z.dataset.getField(Z.field);
        if (Z.readOnly == undefined) {
            Z.readOnly = !fldObj.enabled() || fldObj.readOnly();
        }
        var jqEl = jQuery(Z.el);
        if (!jqEl.hasClass('jl-rating')) {
        	jqEl.addClass('jl-rating');
        }
        jqEl.html('<table border="0" cellspacing="0" cellpadding="0" style="table-layout:fixed;border-collapse:collapse"><tr></tr></table>');

        var oitem, itemCnt = Z.itemCount * Z.splitCount,
			otr = Z.el.firstChild.rows[0];
			
        Z.splitWidth = parseInt(Z.itemWidth / Z.splitCount);
        for (var i = 1; i <= itemCnt; i++) {
            oitem = document.createElement('td');
            oitem.className = 'jl-rating-item';
            oitem.style.width = Z.splitWidth + 'px';
            oitem.style.height = Z.itemWidth + 'px';
            oitem.title = i / Z.splitCount;
            otr.appendChild(oitem);
        }
        jqEl.width(Z.itemCount * Z.itemWidth);
        Z.refreshControl(jslet.data.UpdateEvent.updateAllEvent);
    }, // end renderAll

	/**
	 * @override
	 */
    destroy: function($super){
        var jqEl = jQuery(Z.el);
        jqEl.off();
    	
    	$super();
    }
});

jslet.ui.DBRating.CHECKED = 0;
jslet.ui.DBRating.UNCHECKED = 1;
jslet.ui.DBRating.FOCUS = 2;

jslet.ui.register('DBRating', jslet.ui.DBRating);
jslet.ui.DBRating.htmlTemplate = '<Div></Div>';
