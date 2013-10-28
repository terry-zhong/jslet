/*
This file is part of Jslet framework

Copyright (c) 2013 Jslet Team

GNU General Public License(GPL 3.0) Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please visit: http://www.jslet.com/license.
*/

if (!jslet.rootUri) {
    var ohead = document.getElementsByTagName('head')[0], 
    	uri = ohead.lastChild.src;
    uri = uri.substring(0, uri.lastIndexOf('/') + 1);
    jslet.rootUri = uri;
}
jslet.global = {
	//Used in jslet.data.Dataset_applyChanges
	changeStateField: 'chgflag',
	
	//Used in jslet.data.Dataset_selected
	selectStateField: '_sel_'
	
}
