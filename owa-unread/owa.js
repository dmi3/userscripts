// ==UserScript==
// @name         OWA unread count
// @namespace    http://dmi3.net/
// @version      1.0.0
// @description  OWA unread count
// @author       dmi3
// @match        https://outlook.*.com/owa/*",
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var mailHome = "https://outlook.office.com/owa/*"
    var originalTitle = document.title;

    function changeTitle() {
        if (document.querySelector('[title="Inbox"]')) {
            var unread = document.querySelector('[title="Inbox"]').innerText.replace(/\D/g,'');
            if (unread) {
                document.title='('+unread+') '+originalTitle;
            } else {
                document.title=originalTitle;
            }
        }
    }

    setInterval(changeTitle, 5000);

    var t = setTimeout(logout, 3000);
    window.onmousemove = resetTimer;
    window.onmousedown = resetTimer;
    window.onclick = resetTimer;
    window.onscroll = resetTimer;
    window.onkeypress = resetTimer;

    function logout() {
        if (!document.querySelector('[title="Inbox"]')) {
           window.location.href = mailHome;
        } else {
            console.log('skipping refresh');
        }
    }

    function resetTimer() {
      console.log('reset timer');
      clearTimeout(t);
      t = setTimeout(logout, 60 * 1000 * 5);
    }
})();