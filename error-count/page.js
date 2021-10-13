// see https://stackoverflow.com/a/46870005
const executeInPageContext = `
const originalError = console.error;
console.error = function(...e) {
    originalError(...e);
    document.dispatchEvent(new CustomEvent('errorNotification', { detail: e }));
    return true;
};
`;

const script = document.createElement('script');
script.textContent = executeInPageContext;
(document.head||document.documentElement).appendChild(script);
script.remove();

const maxLength = 128;
document.addEventListener('errorNotification', function (e) {
  const details = e.detail;
  let args = [].slice.call(details, 1);
  let i = 0;
  const detail = details[0].replace(/%s/g, () => args[i++]).substring(0, maxLength);
  chrome.runtime.sendMessage({detail});
});



