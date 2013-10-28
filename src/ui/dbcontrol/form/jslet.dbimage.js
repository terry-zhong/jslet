/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class DBImage. 
 * Display an image which store in database or which's path store in database. 
 * Example:
 * <pre><code>
 * 		var jsletParam = {type:"DBImage",dataset:"employee",field:"photo"};
 * 
 * //1. Declaring:
 *      &lt;img data-jslet='{type:"DBImage",dataset:"employee",field:"photo"}' />
 *      or
 *      &lt;img data-jslet='jsletParam' />
 *      
 *  //2. Binding
 *      &lt;img id="ctrlId"  />
 *  	//Js snippet
 * 		var el = document.getElementById('ctrlId');
 *  	jslet.ui.bindControl(el, jsletParam);
 *
 *  //3. Create dynamically
 *  	jslet.ui.createControl(jsletParam, document.body);
 *  	
 * </code></pre>
 */
jslet.ui.DBImage = jslet.Class.create(jslet.ui.DBControl, {
	/**
	 * @override
	 */
    initialize: function ($super, el, params) {
		var Z = this;
        Z.allProperties = 'dataset,field,locked,baseUrl,altField';
        if (!Z.requiredProperties) {
            Z.requiredProperties = 'field';
        }

        Z.dataset;
        Z.field;
        /**
         * {String} Identify where the image comes from. Optional value: file,db. 
         */
        Z.srcType;
        /**
         * Stop refreshing image when move dataset's cursor.
         */
        Z.locked = false;
        /**
         * {String} The base url
         */
        Z.baseUrl;
        $super(el, params);
    },

	/**
	 * @override
	 */
    isValidTemplateTag: function (el) {
        return el.tagName.toLowerCase() == 'img';
    },

	/**
	 * @override
	 */
    bind: function () {
        var Z = this;
        Z.locked = Z.locked ? true : false;

        Z.checkDataField();
        Z.renderAll();
    }, // end bind

	/**
	 * @override
	 */
    refreshControl: function (evt, isForce) {
        var Z = this;
        if (!isForce && !Z.isActiveRecord()) {
        	return;
        }
        if (!evt) {
            evt = jslet.data.UpdateEvent.updateAllEvent;
        }
        if (evt.eventType == jslet.data.UpdateEvent.SCROLL
				|| evt.eventType == jslet.data.UpdateEvent.UPDATEALL
				|| evt.eventType == jslet.data.UpdateEvent.INSERT
				|| evt.eventType == jslet.data.UpdateEvent.DELETE
				|| evt.eventType == jslet.data.UpdateEvent.UPDATERECORD) {
            if (Z.locked) {
                Z.el.alt = jslet.locale.DBImage.lockedImageTips;
                Z.el.src = '';

                return;
            }
            if (evt.eventType == jslet.data.UpdateEvent.UPDATERECORD
					&& evt.eventInfo != undefined
					&& evt.eventInfo.fieldName != undefined
					&& evt.eventInfo.fieldName != Z.field) {
                return;
            }
            try {
                var srcURL = Z.dataset.getFieldValue(Z.field);
                if (!srcURL) {
                    srcURL = '';
                } else {
                    if (Z.baseUrl) {
                        srcURL = Z.baseUrl + srcURL;
                    }
                }
                if (Z.el.src != srcURL) {
                    var altText = srcURL;
                    if(Z.altField) {
                    	altText = Z.dataset.getFieldText(Z.altField);
                    }
                    Z.el.alt = altText;
                    Z.el.src = srcURL;
                }
            } catch (e) {
                jslet.showException(e);
            }
        }
        if (Z.afterRefreshControl) {
            Z.afterRefreshControl(evt);
        }
    }, // end fefreshControl

	/**
	 * @override
	 */
    renderAll: function () {
        this.refreshControl(jslet.data.UpdateEvent.updateAllEvent, true);
    }
});

jslet.ui.register('DBImage', jslet.ui.DBImage);
jslet.ui.DBImage.htmlTemplate = '<img></img>';
