/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
* Resize event bus, manage all resize event. Example:
* <pre><code>
* 	var myCtrlObj = {
* 		checkSizeChanged: function(){
* 			;
* 		}
*   }
* 
*   //Subcribe a message from MessageBus
*   jslet.messageBus.subcribe(myCtrlObj);
*   
*   //Unsubcribe a message from MessageBus
* 	jslet.messageBus.unsubcribe(myCtrlObj);
* 
* 	//Send a mesasge to MessageBus
* 	jslet.messageBus.sendMessage('MyMessage', {x: 10, y:10});
* 
* </code></pre>
* 
*/
jslet.ResizeEventBus = function () {
    
    var handler = null;
    /**
     * Send a message.
     * 
     * @param {Html Element} sender Sender which send resize event.
     */
    this.resize = function (sender) {
    	if (handler){
    		window.clearTimeout(handler);
    	}
    	handler = setTimeout(function(){
    		var ctrls, ctrl, jsletCtrl;
    		if (sender) {
    			ctrls = jQuery(sender).find("*[data-jslet-resizable]");
    		} else {
    			ctrls = jQuery("*[data-jslet-resizable]");
    		}
	    	for(var i = 0, cnt = ctrls.length; i < cnt; i++){
	    		ctrl = ctrls[i];
	    		if (ctrl){
	    			jsletCtrl = ctrl.jslet;
		    		if (jsletCtrl && jsletCtrl.checkSizeChanged){
		    			jsletCtrl.checkSizeChanged();
		    		}
	    		}
	    	}
	    	handler = null;
    	}, 100);
    }

    /**
     * Subscribe a control to response a resize event.
     * 
     * @param {Object} ctrlObj control object which need subscribe a message, 
     *   there must be a function: checkSizeChanged in ctrlObj.
     * 	 checkSizeChanged: function(){}
     */
    this.subscribe = function(ctrlObj){
    	if (!ctrlObj || !ctrlObj.el) {
    		throw new Error("ctrlObj required!");
    	}
    	jQuery(ctrlObj.el).attr(jslet.ResizeEventBus.RESIZABLE, true);
    }
    
    /**
     * Unsubscribe a control to response a resize event.
     * 
     * @param {Object} ctrlObj control object which need subscribe a message.
     */
    this.unsubscribe = function(ctrlObj){
    	if (!ctrlObj || !ctrlObj.el) {
    		throw new Error("ctrlObj required!");
    	}
    	jQuery(ctrlObj.el).removeAttr(jslet.ResizeEventBus.RESIZABLE);
    }
    
}

jslet.ResizeEventBus.RESIZABLE = "data-jslet-resizable";

jslet.resizeEventBus = new jslet.ResizeEventBus();

jQuery(window).on("resize",function(){
	jslet.resizeEventBus.resize();
});
