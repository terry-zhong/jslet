<!DOCTYPE html>
<html>
<head>
<body>

<p>This file is intended to help you get started with the Jslet framework.</p>

<h1>What is Jslet?</h1>

<p>Jslet is an open source JavaScript framework. Features:</p>
<ol>
	<li><b>Jslet is model-based, it means you can write less code to complete advanced features</b>, for example: <br />
	<pre><code>
a. Define a dataset with three fields:
var dsTest = jslet.data.createDataset('test', [{name: 'name', label: 'Name', type: 'S'}, {name: 'birthday', label: 'Birthday', type: 'D', displayFormat: 'yyyy-MM-dd'}, {name: 'salary', label: 'Salary',type: 'N', scale: 2}]);
dsTest.appendRecord();
b. Bind the dataset to a jslet control: DBTable
&lt;div data-jslet="type: 'DBTable', dataset: 'test', editable: true"&gt;&lt;/div&gt;
c. That's all, you get an editable table with three columns.
		</code></pre>
	<p><a href="http://jslet.github.io/jslet/demo/startup.html">Live Example</a></p>
	</li>	
	<li><b><p>Jslet is a high performance framework, you can load unlimited records to Jslet Controls;</p></b></li>
	<li><b><p>Jslet is a pure JavaScript framework, it can connect any web server, like .NET, J2EE and so on;</p></b></li>
	<li><b><p>Jslet can run in all of major browser, like IE10+, Chrome, Firefox, Sarari, Opera;</p></b></li>
	<li><b><p>Jslet supports UI theme and localization.</p></b></li>
</ol>
<p>For more detail features, please run demo examples or visit <a href="http://jslet.github.io/jslet/">http://jslet.github.io/jslet/</a>;</p>
 
<p>License: MIT</p>

</body>
</html>
