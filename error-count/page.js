var actualCode = `
const originalError = console.error;
console.error = function(...e) {
    originalError(...e);
    document.dispatchEvent(new CustomEvent('errorNotification', { detail: e }));
    return true;
};
`;

var script = document.createElement('script');
script.textContent = actualCode;
(document.head||document.documentElement).appendChild(script);
script.remove();


document.addEventListener('errorNotification', function (e) {
  var data = e.detail;
  chrome.runtime.sendMessage({detail: e});
});



