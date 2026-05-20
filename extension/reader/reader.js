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
    elements.source = document.getElementById('reader-source');
    elements.close = document.getElementById('reader-close');
    elements.outline = document.getElementById('reader-outline');
    elements.scroll = document.getElementById('reader-scroll');
    elements.document = document.getElementById('reader-document');

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
