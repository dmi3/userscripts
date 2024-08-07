// ==UserScript==
// @name         Navigator
// @namespace    http://dmi3.net/
// @version      1.0
// @description  Press [n] for keyboard navigation. Press [m] to open link in background tab. Press [/] to focus on search field. See: https://developer.run/47
// @author       dmi3
// @match        http*://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    console.log('Navigator initialized');

    const buffer = [];
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

    function isNumeric(value) {
        return /^-?\d+$/.test(value);
    }

    function nextChar(str) {
        if (str.length == 0) {
            return 'a';
        }
        const charA = str.split('');
        if (charA[charA.length - 1] === 'z') {
            return nextChar(str.substring(0, charA.length - 1)) + 'a';
        } else {
            return str.substring(0, charA.length - 1) +
                String.fromCharCode(charA[charA.length - 1].charCodeAt(0) + 1);
        }
    }

    const configs = {
        'www.google.com': { selector: 'a h3, td a, [role="listitem"] a', nosearch: true },
        'default': { selector: 'a, button, [role="button"], [aria-haspopup], [class*="button"], [class*="btn"]' },
    };
    const config = configs[window.location.hostname] ?? configs['default'];

    document.addEventListener('keydown', (event) => {
        if (event.target.type) return;
        if (document.head.contains(style)) document.head.removeChild(style);

        const e = document.createEvent('MouseEvents');
        const ctrlClick = mode === 'm';
        e.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, ctrlClick, false, false, false, 0, null);

        const key = event.key.toLowerCase();
        if (key == '/' && !config.nosearch) {
            event.preventDefault();
            const el = ["input[type='search']", "input[id*='search']", "input[name*='search']", "input[type='text'], textarea[name='q']"]
                .flatMap((s) => Array.from(document.querySelectorAll(s)))
                .filter(isInViewport)
                .find((s) => s);

            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                el.focus();
            }
        } else if ((key === 'n' || key === 'm') && !goto) {
            mode = key;

            buffer.length = 0;
            const used = [];
            let i = 'aa';
            Array.from(document.querySelectorAll(config.selector))
                .filter((el) => el.offsetParent != null)
                .filter(isInViewport)
                .filter((a) => {
                    const i = a.innerText?.substr(0, 2)?.toLowerCase();
                    if ((isNumeric(i) || i?.trim()?.length === 2) && !used.includes(i)) {
                        a.setAttribute('dim-index', i);
                        used.push(i);
                        return false;
                    } else {
                        // continue in the next pass
                        return true;
                    }
                })
                .forEach((a) => {
                    while (used.includes(i) && i.length === 2) {
                        i = nextChar(i);
                    }
                    a.setAttribute('dim-index', i);
                    used.push(i);
                });
            goto = true;
        } else if (key == 'enter') {
            goto = false;
            const index = buffer.length > 0 ? buffer.join('') : '0';
            document.querySelector(`[dim-index="${index}"]`).dispatchEvent(e);
        } else if (key == 'escape') {
            goto = false;
            [...document.querySelectorAll('[dim-index]')].forEach((el) => el.setAttribute('dim-index', undefined));
        } else if (goto) {
            event.stopImmediatePropagation();
            buffer.push(key);
            const els = document.querySelectorAll(
                '[dim-index^="' + buffer.join('') + '"]',
            );
            if (els.length == 1) {
                goto = false;
                els[0].dispatchEvent(e);
            }
        }

        if (goto) {
            const number = buffer.join('');
            const selector = number === '' ? '[dim-index]' : `[dim-index^="${number}"]`;
            style = document.head.appendChild(document.createElement('style'));
            style.sheet.insertRule(
                selector +
                    '::before { content: attr(dim-index) !important; all: initial; position: absolute; background: yellow; color: black; vertical-align: super; font-size: small; z-index: 1000;}',
            );
            event.stopImmediatePropagation();
            event.preventDefault();
        }
    }, true); // true → Use capture phase, prevent others
})();
