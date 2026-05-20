'use strict';

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (!message || message.type !== 'wowMD:saveReaderSession') return false;

  var id = message.id;
  if (!id || !message.payload) {
    sendResponse({ ok: false });
    return false;
  }

  var record = {};
  record[id] = message.payload;

  chrome.storage.session.set(record, function () {
    if (chrome.runtime.lastError) {
      sendResponse({ ok: false });
      return;
    }

    chrome.tabs.create({
      url: chrome.runtime.getURL('reader/reader.html?id=' + encodeURIComponent(id)),
      active: true
    }, function () {
      sendResponse({ ok: !chrome.runtime.lastError });
    });
  });

  return true;
});
