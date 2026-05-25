(function () {
  'use strict';

  var state = {
    payload: null,
    tocItems: [],
    headingElements: [],
    activeIndex: -1,
    ticking: false
  };

  var elements = {};

  document.addEventListener('DOMContentLoaded', function () {
    elements.repo = document.getElementById('reader-repo');
    elements.path = document.getElementById('reader-path');
    elements.version = document.getElementById('reader-version');
    elements.webappWrap = document.getElementById('reader-webapp-wrap');
    elements.webapp = document.getElementById('reader-webapp');
    elements.source = document.getElementById('reader-source');
    elements.close = document.getElementById('reader-close');
    elements.outline = document.getElementById('reader-outline');
    elements.scroll = document.getElementById('reader-scroll');
    elements.document = document.getElementById('reader-document');

    if (elements.version && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
      elements.version.textContent = 'v' + chrome.runtime.getManifest().version;
    }

    elements.close.addEventListener('click', function () {
      window.close();
    });

    elements.scroll.addEventListener('scroll', handleScroll, { passive: true });
    loadPayload();
  });

  function loadPayload() {
    var id = new URLSearchParams(location.search).get('id');

    if (
      !id ||
      typeof chrome === 'undefined' ||
      !chrome.storage ||
      !chrome.storage.session
    ) {
      renderError('No reader session was found.');
      return;
    }

    chrome.storage.session.get(id, function (result) {
      var payload = result && result[id];
      if (!payload || !payload.markdown) {
        renderError('This reader session has expired. Open it again from GitHub.');
        return;
      }

      state.payload = payload;
      renderReader(payload);
    });
  }

  function renderReader(payload) {
    var meta = payload.meta || {};
    var repoLabel = meta.owner && meta.repo ? meta.owner + ' / ' + meta.repo : 'Markdown';
    var pathLabel = meta.path || payload.title || 'README.md';

    document.title = pathLabel + ' - wowMD Reader';
    elements.repo.textContent = repoLabel;
    elements.path.textContent = pathLabel;

    if (payload.sourceUrl) {
      elements.source.href = payload.sourceUrl;
    } else {
      elements.source.classList.add('hidden');
    }

    renderWebAppEntry(payload, meta, pathLabel);

    var contentElement = window.mdReaderRender.renderMarkdownToElement(payload.markdown, meta);

    if (window.mdReaderFold) {
      window.mdReaderFold.injectH2Foldable(contentElement);
    }

    state.tocItems = window.mdReaderToc ? window.mdReaderToc.buildToc(contentElement) : [];
    state.headingElements = state.tocItems.map(function (item) {
      return contentElement.querySelector('#' + CSS.escape(item.id));
    });

    elements.document.innerHTML = '';
    elements.document.appendChild(contentElement);
    renderOutline(state.tocItems);
  }

  function renderWebAppEntry(payload, meta, pathLabel) {
    if (!elements.webappWrap || !elements.webapp) return;

    var rawUrl = normalizeRawUrl(payload.rawUrl || meta.rawUrl, meta);
    if (!rawUrl || !isAllowedRawUrl(rawUrl)) {
      elements.webappWrap.classList.add('hidden');
      elements.webapp.removeAttribute('href');
      return;
    }

    elements.webapp.href = buildWebAppImportUrl({
      rawUrl: rawUrl,
      pageUrl: payload.sourceUrl || location.href,
      owner: meta.owner,
      repo: meta.repo,
      branch: meta.branch,
      path: meta.path,
      title: pathLabel
    });
    elements.webappWrap.classList.remove('hidden');
  }

  function buildWebAppImportUrl(docMeta) {
    var url = new URL('https://wowmd-app.pages.dev/app/import');
    url.searchParams.set('source', 'github');
    url.searchParams.set('rawUrl', docMeta.rawUrl);
    url.searchParams.set('pageUrl', docMeta.pageUrl || '');

    if (docMeta.owner) url.searchParams.set('owner', docMeta.owner);
    if (docMeta.repo) url.searchParams.set('repo', docMeta.repo);
    if (docMeta.branch) url.searchParams.set('branch', docMeta.branch);
    if (docMeta.path) url.searchParams.set('path', docMeta.path);
    if (docMeta.title) url.searchParams.set('title', docMeta.title);

    return url.toString();
  }

  function isAllowedRawUrl(value) {
    try {
      var url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'raw.githubusercontent.com';
    } catch (e) {
      return false;
    }
  }

  function normalizeRawUrl(rawUrl, meta) {
    if (!rawUrl) return null;

    try {
      var url = new URL(rawUrl);
      if (url.hostname === 'raw.githubusercontent.com') return url.href;
      if (url.hostname !== 'github.com') return rawUrl;

      var parts = url.pathname.split('/').filter(Boolean);
      var owner = parts[0];
      var repo = parts[1];
      var rawIndex = parts.indexOf('raw');
      if (!owner || !repo || rawIndex < 0) return rawUrl;

      var rawParts = parts.slice(rawIndex + 1);
      var branch = null;
      var filePath = null;

      if (rawParts[0] === 'refs' && rawParts[1] === 'heads') {
        branch = rawParts[2];
        filePath = rawParts.slice(3).join('/');
      } else {
        branch = rawParts[0];
        filePath = rawParts.slice(1).join('/');
      }

      if (!branch && meta && meta.branch) branch = meta.branch;
      if (!filePath && meta && meta.path) filePath = meta.path;
      if (!branch || !filePath) return rawUrl;

      return 'https://raw.githubusercontent.com/' + owner + '/' + repo + '/' + branch + '/' + filePath;
    } catch (e) {
      return rawUrl;
    }
  }

  function renderOutline(items) {
    elements.outline.innerHTML = '';

    if (!items.length) {
      var empty = document.createElement('p');
      empty.className = 'reader-empty';
      empty.textContent = 'No clear sections found.';
      elements.outline.appendChild(empty);
      return;
    }

    items.forEach(function (item, index) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'reader-toc-item reader-toc-level-' + item.level;
      btn.textContent = item.text || '(Untitled)';
      btn.title = item.text || '';
      btn.addEventListener('click', function () {
        setActive(index);
        scrollTo(item.id);
      });
      elements.outline.appendChild(btn);
    });

    syncActiveHeading();
  }

  function setActive(index) {
    if (state.activeIndex === index) return;
    state.activeIndex = index;

    elements.outline.querySelectorAll('.reader-toc-item').forEach(function (btn, i) {
      btn.classList.toggle('active', i === index);
    });
  }

  function scrollTo(id) {
    var target = elements.document.querySelector('#' + CSS.escape(id));
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleScroll() {
    if (state.ticking) return;

    state.ticking = true;
    requestAnimationFrame(function () {
      state.ticking = false;
      syncActiveHeading();
    });
  }

  function syncActiveHeading() {
    if (!state.headingElements.length) return;

    var scrollTop = elements.scroll.scrollTop;
    var threshold = scrollTop + 96;
    var active = 0;

    state.headingElements.forEach(function (heading, index) {
      if (!heading) return;

      var top = heading.offsetTop;
      if (top <= threshold) {
        active = index;
      }
    });

    setActive(active);
    keepActiveItemVisible();
  }

  function keepActiveItemVisible() {
    var active = elements.outline.querySelector('.reader-toc-item.active');
    if (!active) return;

    var outlineTop = elements.outline.scrollTop;
    var outlineBottom = outlineTop + elements.outline.clientHeight;
    var itemTop = active.offsetTop;
    var itemBottom = itemTop + active.offsetHeight;

    if (itemTop < outlineTop + 16) {
      elements.outline.scrollTop = Math.max(0, itemTop - 16);
    } else if (itemBottom > outlineBottom - 16) {
      elements.outline.scrollTop = itemBottom - elements.outline.clientHeight + 16;
    }
  }

  function renderError(message) {
    elements.document.innerHTML =
      '<div class="reader-error">' +
      '  <h1>Cannot open reader</h1>' +
      '  <p>' + escapeHtml(message) + '</p>' +
      '</div>';
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[ch];
    });
  }
})();
