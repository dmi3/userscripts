// ==UserScript==
// @name         Navigator
// @namespace    http://dmi3.net/
// @version      2.0
// @description  Press [n] for keyboard navigation. Press [m] to open link in background tab. Press [/] to focus on search field. [esc] to cancel. See: https://developer.run/47
// @author       dmi3
// @match        http*://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    console.log('Navigator initialized');

    // Hot keys
    const navigate = 'n';
    const navigateNewTab = 'm';
    const disable = 'd';

    const buffer = [];
    let mode = '';
    let style = null;
    let enabled = true;

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

    function* sequenceGenerator() {
        // Skip n and m as these are control keys
        const letters = 'abcdefghijklopqrstuvwxyz';
        const length = letters.length;

        // Generate pairs of the same letter (aa, bb, cc, dd, ...)
        for (let i = 0; i < length; i++) {
            yield letters[i] + letters[i];
        }

        // Generate pairs of different letters (ab, ba)
        for (let i = 0; i < length; i++) {
            for (let j = 0; j < length; j++) {
                if (i !== j) {
                    yield letters[j] + letters[i];
                }
            }
        }
    }

    const configs = {
        'news.ycombinator.com': { selector: '.titleline a, .subline a:last-of-type' },
        'www.google.com': { selector: 'a h3, td a, [role="listitem"] a', nosearch: true },
        'default': { selector: 'a, button, [role="button"], [aria-haspopup], [class*="button"], [class*="btn"], [class*="more"], [class*="menu"]' },
    };
    const config = { ...configs['default'], ...configs[window.location.hostname] };

    document.addEventListener('keydown', (event) => {
        if (event.target.type || !enabled) return;
        if (document.head.contains(style)) document.head.removeChild(style);

        const e = document.createEvent('MouseEvents');
        const ctrlClick = mode === navigateNewTab;
        e.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, ctrlClick, false, false, false, 0, null);

        const key = event.key.toLowerCase();
        if (key === '/' && !config.nosearch) {
            event.preventDefault();
            const el = ["input[type='search']", "input[id*='search']", "input[name*='search']", "input[type='text'], textarea[name='q']"]
                .flatMap((s) => Array.from(document.querySelectorAll(s)))
                .find(isInViewport);

            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                el.focus();
            }
        } else if ((key === navigate || key === navigateNewTab) && mode !== key) {
            mode = key;

            buffer.length = 0;
            const used = [];
            const iterator = sequenceGenerator();
            Array.from(document.querySelectorAll(config.selector))
                .filter((el) => el.offsetParent != null)
                .filter(isInViewport)
                // first pass: assign tags based on first characters, if not taken
                .filter((a) => {
                    const n = a.innerText?.trim()?.[0]?.match(/\d/)?.[0];
                    const i = a.innerText?.replace(/[nmdNMD]|[^a-zA-Z]/g, '')?.substr(0, 2)?.toLowerCase();
                    if (n && !used.includes(n)) { // single digit
                        a.setAttribute('dim-index', n);
                        used.push(n);
                        return false;
                    } else if (i?.length === 2 && !used.includes(i)) { // two letter tag
                        a.setAttribute('dim-index', i);
                        used.push(i);
                        return false;
                    } else {
                        return true; // continue in the next pass
                    }
                })
                // second pass: assign sequential tags aa, bb, cc...
                .forEach((a) => {
                    let i = iterator.next();
                    while (used.includes(i.value) && !i.done) {
                        i = iterator.next();
                    }
                    if (i.value) {
                        a.setAttribute('dim-index', i.value);
                        used.push(i);
                    }
                });
        } else if (key === 'enter') {
            mode = '';
            const index = buffer.length > 0 ? buffer.join('') : '0';
            document.querySelector(`[dim-index="${index}"]`).dispatchEvent(e);
        } else if ((key === 'escape' || key === 'backspace' || key === disable) && mode) {
            if (key === disable) {
                enabled = false;
                console.log('Navigator is disabled until page reload');
            }
            mode = '';
            [...document.querySelectorAll('[dim-index]')].forEach((el) => el.setAttribute('dim-index', undefined));
            event.stopImmediatePropagation();
            event.preventDefault();
        } else if (mode) {
            event.stopImmediatePropagation();
            buffer.push(key);
            const els = document.querySelectorAll(
                '[dim-index^="' + buffer.join('') + '"]',
            );
            if (els.length === 1) {
                mode = '';
                els[0].dispatchEvent(e);
            }
        }

        if (mode) {
            const number = buffer.join('');
            const selector = number === '' ? '[dim-index]' : `[dim-index^="${number}"]`;
            const color = mode === navigateNewTab ? '#DEFF00' : '#FFEA00';
            style = document.head.appendChild(document.createElement('style'));
            style.sheet.insertRule(
                selector +
                    '::before { content: attr(dim-index) !important; all: initial; position: absolute; background: ' + color +
                    '; color: black; border-radius: 3px; vertical-align: super; font-size: small; z-index: 1000;}',
            );
            event.stopImmediatePropagation();
            event.preventDefault();
        }
    }, true); // true → Use capture phase, prevent other event listeners

    document.addEventListener('keyup', (event) => {
        if (mode) {
            event.stopImmediatePropagation();
            event.preventDefault();
        }
    }, true);
})();
