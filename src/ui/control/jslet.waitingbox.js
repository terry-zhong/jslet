/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

/**
 * @class WaitingBox. Example:
 * <pre><code>
 *   var wb = new jslet.ui.WaitingBox(document.getElementById("test"), "Gray", true);
 *	wb.show("Please wait a moment...");
 * 
 * </code></pre>
 * @param {Html Element} container The container which waitingbox reside on.
 * @param {String} overlayColor Overlay color
 * @param {Boolean} tipsAtNewLine Tips is at new line or not. If false, tips and waiting icon is at the same line.
 */
jslet.ui.WaitingBox = function (container, overlayColor, tipsAtNewLine) {
	var overlay = new jslet.ui.OverlayPanel(container);
	var s = '<div class="jl-waitingbox"><b class="jl-waitingbox-icon"></b>';
		s += '<span id="tips"></span></div>';

	jQuery(overlay.overlayPanel).html(s);

	/**
	 * Show wating box
	 * 
	 * @param {String} tips Tips
	 */
	this.show = function (tips) {
		var p = overlay.overlayPanel,
			box = p.firstChild,
			tipPanel = box.childNodes[1];
		tipPanel.innerHTML = tips ? tips : '';
		var jqPnl = jQuery(p),
			ph = jqPnl.height(),
			pw = jqPnl.width();

		setTimeout(function () {
			var jqBox = jQuery(box);
			box.style.top = Math.round((ph - jqBox.height()) / 2) + 'px';
			box.style.left = Math.round((pw - jqBox.width()) / 2) + 'px';
		}, 10);

		overlay.show();
	};

	/**
	 * Hide waiting box
	 */
	this.hide = function () {
		overlay.hide();
	};

	this.destroy = function () {
		overlay.overlayPanel.innerHTML = '';
		overlay.destroy();
	};
};
