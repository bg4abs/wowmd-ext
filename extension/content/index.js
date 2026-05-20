(function () {
  'use strict';

  var lastUrl = location.href;
  var bootRunId = 0;

  var README_HEADER_SELECTORS = [
    'article[data-testid="readme"] .Box-header',
    '#readme .Box-header',
    '[data-testid="readme"] .Box-header'
  ];

  // GitHub DOM selectors - last verified 2026-05-17.
  // If entry injection stops working, re-inspect GitHub page structure.
  var BLOB_HEADER_SELECTORS = [
    '[data-testid="blob-header"] .file-actions',
    '[data-testid="blob-header"] [class*="file-actions"]',
    '.Box-header .file-actions'
  ];

  var MARKDOWN_ENTRY_ANCHOR_SELECTORS = [
    'article[data-testid="readme"]',
    '#readme',
    '[data-testid="readme"]',
    '.Box:has(.markdown-body)',
    'article.markdown-body',
    '.markdown-body'
  ];

  var README_CONTAINER_SELECTORS = [
    'article[data-testid="readme"]',
    '#readme',
    '[data-testid="readme"]',
    '.markdown-body'
  ];

  function isSupportedGitHubPage(urlString) {
    var url;
    try {
      url = new URL(urlString);
    } catch (e) {
      return false;
    }

    if (url.hostname !== 'github.com') return false;

    var parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return false;

    // blob pages: /owner/repo/blob/branch/path.md
    var blobIndex = parts.indexOf('blob');
    if (blobIndex >= 0) {
      var filePath = parts.slice(blobIndex + 2).join('/');
      return /\.(md|markdown)$/i.test(filePath || '');
    }

    // Repo home page: /owner/repo. README DOM may render after the first SPA pass,
    // so support the path here and let bootWithRetry wait for the container.
    if (parts.length === 2) {
      return true;
    }

    return false;
  }

  function hasReadmeContainer() {
    for (var i = 0; i < README_CONTAINER_SELECTORS.length; i++) {
      if (document.querySelector(README_CONTAINER_SELECTORS[i])) return true;
    }

    return false;
  }

  function isMarkdownBlobPage(urlString) {
    var url;
    try {
      url = new URL(urlString);
    } catch (e) {
      return false;
    }

    if (url.hostname !== 'github.com') return false;

    var parts = url.pathname.split('/').filter(Boolean);
    var blobIndex = parts.indexOf('blob');
    if (blobIndex < 0) return false;

    var filePath = parts.slice(blobIndex + 2).join('/');
    return /\.(md|markdown)$/i.test(filePath || '');
  }

  function applyButtonStyle(button, isFallback) {
    Object.assign(button.style, {
      border: '1px solid #d0d7de',
      borderRadius: '8px',
      background: '#ffffff',
      color: '#24292f',
      padding: isFallback ? '10px 12px' : '6px 10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isFallback ? '0' : '6px',
      lineHeight: '20px',
      boxShadow: isFallback ? '0 8px 24px rgba(27,31,36,0.16)' : 'none',
      zIndex: '2147483646'
    });

    if (isFallback) {
      Object.assign(button.style, {
        position: 'fixed',
        right: '16px',
        bottom: '24px'
      });
    }
  }

  function createLogoMark(size) {
    var mark = document.createElement('span');
    mark.setAttribute('aria-hidden', 'true');

    Object.assign(mark.style, {
      width: size + 'px',
      height: size + 'px',
      borderRadius: Math.round(size * 0.28) + 'px',
      background: '#5b4dff',
      display: 'inline-grid',
      placeContent: 'center',
      gap: Math.max(1, Math.round(size * 0.1)) + 'px',
      flex: 'none'
    });

    [0, 1, 2].forEach(function (index) {
      var line = document.createElement('span');
      Object.assign(line.style, {
        display: 'block',
        width: Math.round(size * (index === 2 ? 0.31 : 0.47)) + 'px',
        height: Math.max(2, Math.round(size * 0.1)) + 'px',
        borderRadius: '999px',
        background: '#f3f0ff'
      });
      mark.appendChild(line);
    });

    return mark;
  }

  function createMainButton() {
    var button = document.createElement('button');
    button.id = 'md-reader-main-button';
    button.type = 'button';
    button.setAttribute('aria-label', t('open_markdown_reader'));
    applyButtonStyle(button, false);
    button.appendChild(createLogoMark(16));
    button.appendChild(document.createTextNode(t('main_button_text')));

    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (window.mdReaderPanel) {
        window.mdReaderPanel.openMarkdownReaderPanel();
      }
    });

    return button;
  }

  function injectMainButtonIfPossible() {
    if (document.getElementById('md-reader-main-button')) return false;

    for (var i = 0; i < README_HEADER_SELECTORS.length; i++) {
      var readmeHeader = document.querySelector(README_HEADER_SELECTORS[i]);
      if (readmeHeader && readmeHeader.parentNode) {
        readmeHeader.parentNode.insertBefore(createMainButton(), readmeHeader);
        return true;
      }
    }

    for (var k = 0; k < MARKDOWN_ENTRY_ANCHOR_SELECTORS.length; k++) {
      var anchor = document.querySelector(MARKDOWN_ENTRY_ANCHOR_SELECTORS[k]);
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(createMainButton(), anchor);
        return true;
      }
    }

    for (var j = 0; j < BLOB_HEADER_SELECTORS.length; j++) {
      var blobActions = document.querySelector(BLOB_HEADER_SELECTORS[j]);
      if (blobActions) {
        var button = createMainButton();
        button.style.marginRight = '8px';
        blobActions.insertBefore(button, blobActions.firstChild);
        return true;
      }
    }

    return false;
  }

  function injectFallbackButton() {
    if (document.getElementById('md-reader-fallback-button')) return;

    var button = document.createElement('button');
    button.id = 'md-reader-fallback-button';
    button.type = 'button';
    button.setAttribute('aria-label', t('open_markdown_reader'));
    applyButtonStyle(button, true);
    button.appendChild(createLogoMark(18));

    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (window.mdReaderPanel) {
        window.mdReaderPanel.openMarkdownReaderPanel();
      }
    });

    document.body.appendChild(button);
  }

  function removeButtons() {
    var mainBtn = document.getElementById('md-reader-main-button');
    if (mainBtn && mainBtn.parentNode) {
      mainBtn.parentNode.removeChild(mainBtn);
    }

    var fallbackBtn = document.getElementById('md-reader-fallback-button');
    if (fallbackBtn && fallbackBtn.parentNode) {
      fallbackBtn.parentNode.removeChild(fallbackBtn);
    }

    if (window.mdReaderPanel) {
      window.mdReaderPanel.removePanel();
    }
  }

  function observeUrlChange(callback) {
    var pendingBoot = null;

    function scheduleBoot() {
      if (pendingBoot) return;
      pendingBoot = setTimeout(function () {
        pendingBoot = null;
        callback();
      }, 300);
    }

    var observer = new MutationObserver(function () {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(function () {
          removeButtons();
          callback();
        }, 300);
        return;
      }

      if (!hasEntryButtons() && isPotentialSupportedPath(location.href)) {
        scheduleBoot();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function hasEntryButtons() {
    return !!(
      document.getElementById('md-reader-main-button') ||
      document.getElementById('md-reader-fallback-button')
    );
  }

  function isPotentialSupportedPath(urlString) {
    var url;
    try {
      url = new URL(urlString);
    } catch (e) {
      return false;
    }

    if (url.hostname !== 'github.com') return false;

    var parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return false;

    var blobIndex = parts.indexOf('blob');
    if (blobIndex >= 0) {
      var filePath = parts.slice(blobIndex + 2).join('/');
      return /\.(md|markdown)$/i.test(filePath || '');
    }

    return parts.length === 2;
  }

  function bootWithRetry(retries, delay, options) {
    if (retries === undefined) retries = 10;
    if (delay === undefined) delay = 300;
    options = options || {};

    var runId = options.runId || ++bootRunId;
    if (runId !== bootRunId) return;

    if (!options.keepExisting) {
      removeButtons();
    }

    if (!isSupportedGitHubPage(location.href)) {
      return;
    }

    var c = window.__wowMD_complexity;
    var container = c && c.findMarkdownContentContainer && c.findMarkdownContentContainer();

    if (!container && retries > 0) {
      retryBoot(retries, delay, runId);
      return;
    }

    var metrics = c && c.getDocumentComplexityMetrics && c.getDocumentComplexityMetrics(container);
    var visibility = c && c.getEntryVisibility && c.getEntryVisibility(metrics);

    if (!visibility || (!visibility.showMainEntry && !visibility.showFallbackEntry)) {
      if (retries > 0) {
        retryBoot(retries, delay, runId);
      }
      return;
    }

    var mainInjected = false;
    if (visibility.showMainEntry) {
      mainInjected = injectMainButtonIfPossible();
    }

    if (mainInjected) {
      return;
    }

    if (retries > 0) {
      retryBoot(retries, delay, runId);
      return;
    }

    if (!mainInjected && visibility.showFallbackEntry && isMarkdownBlobPage(location.href)) {
      injectFallbackButton();
    }
  }

  function retryBoot(retries, delay, runId) {
    setTimeout(function () {
      bootWithRetry(retries - 1, delay, {
        runId: runId,
        keepExisting: true
      });
    }, delay);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bootWithRetry();
      observeUrlChange(function () { bootWithRetry(); });
    });
  } else {
    bootWithRetry();
    observeUrlChange(function () { bootWithRetry(); });
  }
})();
