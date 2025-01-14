// ==UserScript==
// @name         Navigator
// @namespace    http://dmi3.net/
// @version      2.0
// @description  Press [n] for keyboard navigation. Press [m] to open link in background tab. Press [/] to focus on search field. [esc] to cancel, [h] to disable until next reload. See: https://developer.run/47
// @author       dmi3
// @match        http*://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    console.log('Navigator loaded');

    // Settings
    const navigate = 'n';
    const navigateNewTab = 'm';
    const disable = 'h';
    const configs = {
        'example.com': { disabled: true },
        'news.ycombinator.com': { selector: '.titleline a, .subline a:last-of-type, [rel="next"]' },
        'www.google.com': { selector: 'a h3, td a, [role="listitem"] a', nosearch: true },
        'default': { selector: 'a, button, [role="button"], [aria-haspopup], [class*="button"], [class*="btn"], [class*="more"], [class*="menu"]' },
    };

    const buffer = [];
    const allowedLetters = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((l) => ![navigate, navigateNewTab, disable].includes(l));
    let mode = '';
    let style = null;
    let disabled = false;

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
        const length = allowedLetters.length;

        // Generate pairs of the same letter (aa, bb, cc, dd, ...)
        for (let i = 0; i < length; i++) {
            yield allowedLetters[i] + allowedLetters[i];
        }

        // Generate pairs of different letters (ab, ba)
        for (let i = 0; i < length; i++) {
            for (let j = 0; j < length; j++) {
                if (i !== j) {
                    yield allowedLetters[j] + allowedLetters[i];
                }
            }
        }
    }

    function notify(text) {
        const alert = document.createElement('p');
        alert.textContent = text;
        alert.style.cssText = 'all: initial; position: absolute; left:0; top: 0; background: #FFEA00; color: #000;';
        document.body.appendChild(alert);
        setTimeout(() => document.body.removeChild(alert), 4000);
    }

    const config = { ...configs['default'], ...configs[window.location.hostname] };

    document.addEventListener('keydown', (event) => {
        if (event.target.type || disabled || config.disabled) return;
        if (document.head.contains(style)) document.head.removeChild(style);

        const e = document.createEvent('MouseEvents');
        const ctrlClick = mode === navigateNewTab;
        e.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, ctrlClick, false, false, false, 0, null);

        const key = event.key.toLowerCase();
        if (key === '/' && !config.nosearch) {
            event.preventDefault();
            const el = ["textarea[name='user-prompt']", "input[type='search']", "input[id*='search']", "input[name*='search']", "textarea[name='q']", "[type='text']"]
                .flatMap((s) => Array.from(document.querySelectorAll(s)))
                .find(isInViewport);

            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                const end = el.value.length;
                el.setSelectionRange(end, end);
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
                    const i = a.innerText?.toLowerCase()?.split('')?.filter((l) => allowedLetters.includes(l))?.join('')?.substr(0, 2);
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
            if (!ctrlClick) notify("navigating...");
        } else if ([navigate, navigateNewTab, disable, 'escape', 'backspace'].includes(key)) {
            if (key === disable) {
                disabled = true;
                notify('Navigator is disabled until page reload.');
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
                if (!ctrlClick) notify("navigating...");
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
