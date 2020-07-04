// ==UserScript==
// @name         Dimaintitle
// @namespace	 http://dmi3.net/
// @version      1.0
// @description	 Adds the domain to the title bar.
// @include		 *
// @author       dmi3
// @match        http*://*/*
// @grant        none
// ==/UserScript==


function changeTitle() {
 	var protoDelimIndex = document.URL.indexOf("://");
 	if(protoDelimIndex != -1) {
  		var domainDelimIndex = document.URL.indexOf("/", protoDelimIndex + 4);
  		if(domainDelimIndex != -1) {
   			document.title=document.title + ' [' + document.URL.slice(0, domainDelimIndex + 1) + ']';
   		}
  	}
}

setTimeout("changeTitle()", 100);
