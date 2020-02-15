// ==UserScript==
// @name         DuckGoGo
// @namespace    http://dmi3.net/
// @version      1.0
// @description  Additional hotkeys for DuckDuckGo. s - search start page. e - search ecosia. g - search google.
// @author       dmi3
// @match        http*://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    document.addEventListener('keyup', (e) => {
        if (e.key == 's' && !e.target.type)
          document.location.href = document.URL.replace("duckduckgo.com/", "startpage.com/do/search");
        if (e.key == 'e' && !e.target.type)
          document.location.href = document.URL.replace("duckduckgo.com/", "ecosia.org/search");
        if (e.key == 'g' && !e.target.type)
          document.location.href = document.URL.replace("duckduckgo.com/", "google.com/search");      
    }, false);

})();