chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    chrome.notifications.create('notification.warning', {
      iconUrl: chrome.runtime.getURL('logo.png'),
      title: 'Got new JavaScript error',
      type: 'basic',
      message: '',
      buttons: [],
      priority: 2,
    }, function() {});
    chrome.browserAction.setBadgeBackgroundColor({tabId: sender.tab.id, color: '#FF0000' });
    chrome.browserAction.setBadgeText({tabId: sender.tab.id, text: '!' });
    
  }
);
