chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    chrome.notifications.create('notification.warning', {
      iconUrl: chrome.runtime.getURL('logo.png'),
      title: 'Got new JavaScript error',
      type: 'basic',
      message: request.detail.toString(),
      buttons: [],
      priority: 2,
    }, function() {});

    
    chrome.browserAction.getBadgeText({tabId: sender.tab.id},(prevCnt) => {
      const cnt = prevCnt === "" ? 1 : parseInt(prevCnt) + 1;
      chrome.browserAction.setBadgeText({tabId: sender.tab.id, text: cnt.toString() });
      chrome.browserAction.setBadgeBackgroundColor({tabId: sender.tab.id, color: '#FF0000' });      
    });

  }
);
