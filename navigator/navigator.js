// ==UserScript==
// @name         Navigator
// @namespace    http://dmi3.net/
// @version      1.0
// @description  Press [n] for keyboard navigation. Press [/] to focus on search field. See: https://developer.run/47
// @author       dmi3
// @match        http*://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('Navigator initialized');

    let buffer = [];
    let goto = false;
    let style = null;

    document.addEventListener('keydown', event => {
        if (event.target.type) return;
        if (document.head.contains(style)) document.head.removeChild(style);

        const key = event.key.toLowerCase();
        if (key=='/') {
            event.preventDefault();
            const el = document.querySelector("input[type='search'], input[type='text']")
            if (el) el.focus();
        } else if (key=='n') {
            if (!goto) {
                buffer.length=0;
                document.querySelectorAll('a, button').forEach((a, i) => a.setAttribute('dim-index', i))
            }
            goto=!goto;
        } else if (key=='enter') {
            goto = false;
            document.querySelector('[dim-index="'+buffer.join("")+'"]').click();
        } else if (goto) {
            buffer.push(key);
            const els = document.querySelectorAll('[dim-index^="'+buffer.join("")+'"]');
            if (els.length==1) {
                goto = false;
                els[0].click();
            }
        }

        if (goto) {
            const number = buffer.join("");
            const selector = number==="" ? "" : '[dim-index^="'+number+'"]';
            style = document.head.appendChild(document.createElement("style"));
            style.sheet.insertRule(selector+'::after { content: attr(dim-index); position: absolute; background: yellow; color: black; vertical-align: super; font-size: smaller;}');
        }
    });
})();