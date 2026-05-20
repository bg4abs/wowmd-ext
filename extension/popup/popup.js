(function () {
  'use strict';

  var closeButton = document.getElementById('popup-close');
  var version = document.getElementById('popup-version');

  if (version && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    version.textContent = 'v' + chrome.runtime.getManifest().version;
  }

  if (closeButton) {
    closeButton.addEventListener('click', function () {
      window.close();
    });
  }

}());
