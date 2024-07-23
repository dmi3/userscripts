// ==UserScript==
// @name         Navigator
// @namespace    http://dmi3.net/
// @version      1.0
// @description  Press [n] for keyboard navigation. Press [m] to open link in background tab. Press [/] to focus on search field. See: https://developer.run/47
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
    let mode = '';

    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth) &&
            rect.width > 0 &&
            rect.height > 0
        );
    }

    const configs = {
        'www.google.com': {selector: 'a h3', selectAll: true},
        'default': {selector: 'a, button, [role="button"], [aria-haspopup], [class*="button"], [class*="btn"]'},
    }
    const config = configs[window.location.hostname] ?? configs["default"];

    document.addEventListener('keydown', event => {
        if (event.target.type) return;
        if (document.head.contains(style)) document.head.removeChild(style);

        const e = document.createEvent("MouseEvents");
        const ctrlClick = mode === "m"
        e.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, ctrlClick, false, false, false, 0, null);

        const key = event.key.toLowerCase();
        if (key=='/') {
            event.preventDefault();
            const el = ["input[type='search']", "input[id*='search']", "input[name*='search']", "input[type='text'], textarea[name='q']"]
              .flatMap(s => Array.from(document.querySelectorAll(s)))
              .filter(isInViewport)
              .find(s => s)

            if (el) {
                el.scrollIntoView(true);
                el.focus();
            }    
        } else if (key=='\\') {
            event.preventDefault();
            const el = Array.from(document.querySelectorAll("input[type='email']"))
              .filter(isInViewport)
              .find(s => s)

            if (el) {
                el.scrollIntoView(true);
                el.focus();
            }
        } else if (key==='n' || key==='m') {
            mode = key;
            if (!goto) {
                buffer.length=0;
                Array.from(document.querySelectorAll(config.selector))
                    .filter(el => el.offsetParent != null)
                    .filter((it) => config.selectAll || isInViewport(it))
                    .forEach((a, i) => a.setAttribute('dim-index', i))
            }
            goto=!goto;
        } else if (goto==true && (key=='arrowdown' || key=='arrowup')) {
            const all = [...document.querySelectorAll('[dim-index]')];
            const current = document.querySelector('[dim-index="'+buffer.join("")+'"]');
            const position = all.indexOf(current)
            const shift = key=='arrowdown' ? 1 : -1;
            const next = position+shift;

            buffer = next.toString().split('')
            event.preventDefault()

            const el = all[next];
            if (el && !isInViewport(el)) {
                el.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
            }
        } else if (key=='enter') {
            goto = false;
            const index = buffer.length > 0 ? buffer.join("") : "0";
            document.querySelector(`[dim-index="${index}"]`).dispatchEvent(e);
        } else if (key=='escape') {
            goto = false;
            [...document.querySelectorAll('[dim-index]')].forEach(el => el.setAttribute('dim-index', undefined))
        } else if (goto) {
            buffer.push(key);
            const els = document.querySelectorAll('[dim-index^="'+buffer.join("")+'"]');
            if (els.length==1) {
                goto = false;
                els[0].dispatchEvent(e);
            }
        }

        if (goto) {
            const number = buffer.join("");
            const selector = number === "" ? "[dim-index]" : `[dim-index^="${number}"]`;
            style = document.head.appendChild(document.createElement("style"));
            style.sheet.insertRule(selector+'::after { content: attr(dim-index) !important; position: absolute !important; background: yellow !important; color: black !important; vertical-align: super !important; font-size: smaller !important; z-index: 1000 !important; line-height: 1em !important; padding: 0 !important; margin: 0 !important;}');
        }
    });
})();
