chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    chrome.browserAction.setBadgeBackgroundColor({tabId: sender.tab.id, color: '#FF0000' });
    chrome.browserAction.setBadgeText({tabId: sender.tab.id, text: '!' });
  }
);
