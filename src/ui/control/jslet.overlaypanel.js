/*!
 * Jslet Javascript Framework v4.0.0
 * https://github.com/jslet/jslet/
 *
 * Copyright 2016 Jslet Team and other contributors
 * Released under the MIT license
 */

/**
* @class Overlay panel. Example:
* <pre><code>
*  var overlay = new jslet.ui.OverlayPanel(Z.el.parentNode);
*  overlay.setZIndex(999);
*  overlay.show();
* </code></pre>
* 
* @param {Html Element} container Html Element that OverlayPanel will cover.
* @param {String} color Color String.
*/
"use strict";
jslet.ui.OverlayPanel = function (container, color) {
	var odiv = document.createElement('div');
	jQuery(odiv).addClass('jl-overlay').on('click', function(event){
		event = jQuery.event.fix( event || window.event );
		var srcEle = event.target;
		if(!jslet.ui.PopupPanel.popupElement.checkAndHide(srcEle)) {
			return;
		}
		event.stopPropagation();
		event.preventDefault();
	});
	
	if (color) {
		odiv.style.backgroundColor = color;
	}
	var left, top, width, height;
	if (!container) {
		var jqBody = jQuery(document.body);
		left = 0;
		top = 0;
		width = jqBody.width();
		height = jqBody.height();
	} else {
		width = jQuery(container).width();
		height = jQuery(container).height();
	}
	odiv.style.left = '0px';
	odiv.style.top = '0px';
	odiv.style.bottom = '0px';
	odiv.style.right = '0px';
	if (!container) {
		document.body.appendChild(odiv);
	} else {
		container.appendChild(odiv);
	}
	odiv.style.display = 'none';

	var oldResizeHanlder = null;
	if (!container) {
		oldResizeHanlder = window.onresize;

		window.onresize = function () {
			odiv.style.width = document.body.scrollWidth + 'px';
			odiv.style.height = document.body.scrollHeight + 'px';
		};
	} else {
		oldResizeHanlder = container.onresize;
		container.onresize = function () {
			var width = jQuery(container).width() - 12;
			var height = jQuery(container).height() - 12;
			odiv.style.width = width + 'px';
			odiv.style.height = height + 'px';
		};
	}

	this.overlayPanel = odiv;

	/**
	 * Show overlay panel
	 */
	this.show = function () {
		odiv.style.display = 'block';
		return odiv;
	};

	/**
	 * Hide overlay panel
	 */
	this.hide = function () {
		odiv.style.display = 'none';
		return odiv;
	};
	
	/**
	 * Set Z-index 
	 * 
	 * @param {Integer} zIndex Z-Index
	 */
	this.setZIndex = function(zIndex){
		this.overlayPanel.style.zIndex = zIndex;
	};

	this.destroy = function () {
		this.hide();
		if (!container) {
			window.onresize = oldResizeHanlder;
			document.body.removeChild(odiv);
		} else {
			container.onresize = oldResizeHanlder;
			container.removeChild(odiv);
		}
		jQuery(this.overlayPanel).off();
	};
};
