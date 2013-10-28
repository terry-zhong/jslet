function showSource(){
	var srcFrame = document.getElementById('jsletsource');
	if(srcFrame.style.display == 'none')
		srcFrame.style.display = '';
	else
		srcFrame.style.display = 'none';
}
(function(){
	var doc = document.location.href,
	    k = doc.lastIndexOf('.'),
	    srcDoc = doc.substring(0, k) + '-source' + doc.substring(k);

	var jsTags = document.getElementsByTagName('script'),
	    url = jsTags[jsTags.length - 1].src;
	k = url.indexOf("?height=");
	var height = url.substring(k+8);
	if(height)
	  height = parseInt(height) + 'px';
	else
	  height = '200px';
	document.write('<hr/><p><a href="javascript:void(0)" onclick="showSource();">Source Code Snippet </a></p>');
	document.write('<hr/><iframe id="jsletsource" src="'+srcDoc+'" style="display:none;width:100%;height:'+height+';border:none"></iframe>');
})();
