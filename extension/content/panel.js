(function () {
  'use strict';

  var ERROR_MESSAGES = {
    private_or_rate_limited: {
      titleKey: 'error_title_unavailable',
      bodyKey: 'error_body_private',
      actionKey: null
    },
    not_found: {
      titleKey: 'error_title_unavailable',
      bodyKey: 'error_body_not_found',
      actionKey: null
    },
    empty: {
      titleKey: 'error_title_empty',
      bodyKey: null,
      actionKey: null
    },
    timeout: {
      titleKey: 'error_title_timeout',
      bodyKey: null,
      actionKey: 'action_retry'
    },
    network: {
      titleKey: 'error_title_network',
      bodyKey: 'error_body_network',
      actionKey: null
    },
    unknown: {
      titleKey: 'error_title_unavailable',
      bodyKey: 'error_body_network',
      actionKey: null
    }
  };

  var panelState = {
    isOpen: false,
    activeTab: 'toc',
    markdown: '',
    meta: null,
    rawUrl: null,
    tocItems: [],
    error: null,
    loadedUrl: null,
    isLoading: false
  };

  var shadowRoot = null;
  var APP_VERSION = '0.3.0';
  var APP_URL = 'https://wowmd-app.pages.dev/';

  function ensureShadowRoot() {
    if (shadowRoot) return;

    var existing = document.getElementById('md-reader-root');
    if (existing) {
      existing.remove();
    }

    var root = document.createElement('div');
    root.id = 'md-reader-root';
    document.body.appendChild(root);

    shadowRoot = root.attachShadow({ mode: 'open' });
    buildPanelDOM();
    injectStyles();
    bindEvents();
  }

  function buildPanelDOM() {
    var el = document.createElement('aside');
    el.className = 'md-reader-panel';

    el.innerHTML =
      '<header class="md-reader-header">' +
      '  <span class="md-reader-brand" aria-label="' + t('panel_title') + '">' +
      '    <span class="md-reader-brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>' +
      '    <span class="md-reader-title" aria-hidden="true"><span class="md-reader-title-wow">wow</span><span class="md-reader-title-md">MD</span></span>' +
      '    <span class="md-reader-version" aria-label="Version ' + APP_VERSION + '">v' + APP_VERSION + '</span>' +
      '  </span>' +
      '  <button class="md-reader-close" type="button">\u2715</button>' +
      '</header>' +
      '<div class="md-reader-tabs">' +
      '  <button class="md-reader-tab active" data-tab="toc" type="button">' + t('tab_toc') + '</button>' +
      '  <button class="md-reader-tab" data-tab="read" type="button">' + t('tab_read') + '</button>' +
      '</div>' +
      '<main class="md-reader-body">' +
      '  <nav class="md-reader-toc-view"></nav>' +
      '  <section class="md-reader-read-view hidden">' +
      '    <button class="md-reader-back-link" type="button">' + t('back_to_toc') + '</button>' +
      '    <article class="md-reader-read-content"></article>' +
      '  </section>' +
      '</main>' +
      '<footer class="md-reader-footer">' +
      '  <button class="md-reader-full-btn" type="button" disabled>' + t('open_full_reader') + '</button>' +
      '  <p class="md-reader-site-text">Check <a class="md-reader-site-link" href="' + APP_URL + '" target="_blank" rel="noopener noreferrer">' + t('footer_site_link') + '</a> for more.</p>' +
      '</footer>';

    shadowRoot.appendChild(el);
  }

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = MD_READER_STYLES;
    shadowRoot.appendChild(style);
  }

  function bindEvents() {
    shadowRoot.querySelector('.md-reader-close').addEventListener('click', closeMarkdownReaderPanel);

    shadowRoot.querySelectorAll('.md-reader-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        switchTab(tab.getAttribute('data-tab'));
      });
    });

    shadowRoot.querySelector('.md-reader-back-link').addEventListener('click', function () {
      switchTab('toc');
    });

    shadowRoot.querySelector('.md-reader-full-btn').addEventListener('click', function () {
      openFullReader();
    });
  }

  function updateFullReaderButton() {
    if (!shadowRoot) return;

    var btn = shadowRoot.querySelector('.md-reader-full-btn');
    if (!btn) return;

    var ready = !!(panelState.markdown && panelState.meta);
    btn.disabled = !ready;
    btn.title = ready ? '' : t('full_reader_unavailable');
  }

  function switchTab(tabName) {
    panelState.activeTab = tabName;

    var tocView = shadowRoot.querySelector('.md-reader-toc-view');
    var readView = shadowRoot.querySelector('.md-reader-read-view');

    shadowRoot.querySelectorAll('.md-reader-tab').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    if (tabName === 'toc') {
      tocView.classList.remove('hidden');
      readView.classList.add('hidden');
    } else {
      tocView.classList.add('hidden');
      readView.classList.remove('hidden');
    }
  }

  function renderLoading() {
    panelState.isLoading = true;
    panelState.error = null;
    updateFullReaderButton();

    var tocView = shadowRoot.querySelector('.md-reader-toc-view');
    tocView.innerHTML = '<div class="md-reader-status"><p class="md-reader-loading">' + t('loading_message') + '</p></div>';

    var readContent = shadowRoot.querySelector('.md-reader-read-content');
    readContent.innerHTML = '<div class="md-reader-status"><p class="md-reader-loading">' + t('loading_message') + '</p></div>';
  }

  function renderError(error) {
    panelState.isLoading = false;
    panelState.markdown = '';
    panelState.meta = null;
    updateFullReaderButton();

    var info = ERROR_MESSAGES[error.reason] || ERROR_MESSAGES.unknown;
    var title = t(info.titleKey);
    var body = info.bodyKey ? t(info.bodyKey) : '';
    var action = info.actionKey ? t(info.actionKey) : '';

    var tocView = shadowRoot.querySelector('.md-reader-toc-view');
    tocView.innerHTML =
      '<div class="md-reader-error">' +
      '  <p class="md-reader-error-title">' + title + '</p>' +
      (body ? '  <p class="md-reader-error-body">' + body + '</p>' : '') +
      (action ? '  <button class="md-reader-retry-btn" type="button">' + action + '</button>' : '') +
      '</div>';

    if (info.actionKey === 'action_retry') {
      tocView.querySelector('.md-reader-retry-btn').addEventListener('click', function () {
        loadMarkdownContent();
      });
    }

    var readContent = shadowRoot.querySelector('.md-reader-read-content');
    readContent.innerHTML =
      '<div class="md-reader-error">' +
      '  <p class="md-reader-error-title">' + title + '</p>' +
      '</div>';

    switchTab('toc');
  }

  function renderContent(markdown, meta, rawUrl) {
    panelState.isLoading = false;
    panelState.markdown = markdown;
    panelState.meta = meta;
    panelState.rawUrl = rawUrl;

    var contentElement = window.mdReaderRender.renderMarkdownToElement(markdown, meta);

    if (window.mdReaderFold) {
      window.mdReaderFold.injectH2Foldable(contentElement);
    }

    panelState.tocItems = window.mdReaderToc ? window.mdReaderToc.buildToc(contentElement) : [];

    var readContent = shadowRoot.querySelector('.md-reader-read-content');
    readContent.innerHTML = '';
    readContent.appendChild(contentElement);

    renderTocView(panelState.tocItems);
    updateFullReaderButton();
    switchTab(panelState.activeTab);
  }

  function openFullReader() {
    if (!panelState.markdown || !panelState.meta) {
      updateFullReaderButton();
      return;
    }

    var runtime = getExtensionRuntime();
    if (!runtime) {
      markExtensionContextInvalidated();
      return;
    }

    var id = 'reader-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    try {
      runtime.sendMessage({
        type: 'wowMD:saveReaderSession',
        id: id,
        payload: {
          markdown: panelState.markdown,
          meta: panelState.meta,
          rawUrl: panelState.rawUrl,
          sourceUrl: panelState.loadedUrl || location.href,
          title: getReaderTitle(panelState.meta)
        }
      }, function (response) {
        var lastError = getRuntimeLastError(runtime);
        if (lastError || !response || !response.ok) {
          if (lastError && /context invalidated/i.test(lastError.message || '')) {
            markExtensionContextInvalidated();
          }
          return;
        }
      });
    } catch (e) {
      markExtensionContextInvalidated();
    }
  }

  function getExtensionRuntime() {
    try {
      if (typeof chrome === 'undefined') return null;
      if (!chrome.runtime) return null;
      if (!chrome.runtime.id) return null;
      if (!chrome.runtime.sendMessage) return null;
      return chrome.runtime;
    } catch (e) {
      return null;
    }
  }

  function getRuntimeLastError(runtime) {
    try {
      return runtime && runtime.lastError ? runtime.lastError : null;
    } catch (e) {
      return { message: 'Extension context invalidated.' };
    }
  }

  function getReaderTitle(meta) {
    if (!meta) return 'README.md';
    if (meta.path) return meta.path.split('/').pop() || meta.path;
    return meta.repo ? meta.repo + ' README' : 'README.md';
  }

  function markExtensionContextInvalidated() {
    if (!shadowRoot) return;

    var btn = shadowRoot.querySelector('.md-reader-full-btn');
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = t('refresh_page_to_reopen');
    btn.title = t('extension_context_invalidated');
  }

  function renderTocView(tocItems) {
    var nav = shadowRoot.querySelector('.md-reader-toc-view');
    nav.innerHTML = '';

    if (tocItems.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'md-reader-empty-toc';
      empty.innerHTML =
        '<p>' + t('toc_empty_title') + '</p>' +
        '<p>' + t('toc_empty_hint') + '</p>';
      nav.appendChild(empty);
      return;
    }

    var meta = document.createElement('p');
    meta.className = 'toc-meta';
    if (tocItems.length === 1) {
      meta.textContent = t('toc_section_count_one');
    } else {
      meta.textContent = t('toc_section_count', [String(tocItems.length)]);
    }
    nav.appendChild(meta);

    var list = document.createElement('div');
    list.className = 'toc-list';

    tocItems.forEach(function (item) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toc-item toc-level-' + item.level;
      btn.textContent = item.text || t('toc_untitled');
      btn.title = item.text || '';
      btn.addEventListener('click', function () {
        switchTab('read');
        requestAnimationFrame(function () {
          var readView = shadowRoot.querySelector('.md-reader-read-view');
          if (window.mdReaderToc) {
            window.mdReaderToc.scrollToHeading(readView, item.id);
          }
        });
      });
      list.appendChild(btn);
    });

    nav.appendChild(list);
  }

  function loadMarkdownContent() {
    panelState.loadedUrl = location.href;
    renderLoading();

    window.mdReaderFetch.fetchMarkdownForCurrentPage().then(function (result) {
      if (result.ok) {
        renderContent(result.markdown, result.meta, result.rawUrl);
      } else {
        panelState.rawUrl = result.rawUrl || null;
        panelState.error = result;
        renderError(result);
      }
    }).catch(function () {
      renderError({ reason: 'network' });
    });
  }

  function openMarkdownReaderPanel() {
    var needsReload = panelState.loadedUrl !== location.href;

    if (panelState.isOpen && shadowRoot) {
      shadowRoot.querySelector('.md-reader-panel').classList.remove('md-reader-hidden');
      if (needsReload) {
        panelState.activeTab = 'toc';
        loadMarkdownContent();
      }
      return;
    }

    panelState.isOpen = true;
    ensureShadowRoot();

    var panel = shadowRoot.querySelector('.md-reader-panel');
    if (panel) {
      panel.classList.remove('md-reader-hidden');
    }

    loadMarkdownContent();
  }

  function closeMarkdownReaderPanel() {
    panelState.isOpen = false;
    if (shadowRoot) {
      shadowRoot.querySelector('.md-reader-panel').classList.add('md-reader-hidden');
    }
  }

  function removePanel() {
    panelState.isOpen = false;
    panelState.loadedUrl = null;
    if (shadowRoot) {
      var root = shadowRoot.host;
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }
      shadowRoot = null;
    }
  }

  window.mdReaderPanel = {
    openMarkdownReaderPanel: openMarkdownReaderPanel,
    closeMarkdownReaderPanel: closeMarkdownReaderPanel,
    removePanel: removePanel
  };
})();
