(function () {
  'use strict';

  var mdReaderMarkdown = null;

  function createMarkdownRenderer() {
    if (!window.markdownit) return null;

    return window.markdownit({
      html: true,
      linkify: true,
      highlight: function (str, lang) {
        try {
          if (lang && window.hljs && window.hljs.getLanguage(lang)) {
            return '<pre class="hljs"><code>' + window.hljs.highlight(str, { language: lang }).value + '</code></pre>';
          }
          if (window.hljs) {
            return '<pre class="hljs"><code>' + window.hljs.highlightAuto(str).value + '</code></pre>';
          }
        } catch (e) {}

        var escaped = window.markdownit().utils.escapeHtml(str);
        return '<pre><code>' + escaped + '</code></pre>';
      }
    });
  }

  function sanitizeHtml(dirtyHtml) {
    if (!window.DOMPurify) return dirtyHtml;

    return DOMPurify.sanitize(dirtyHtml, {
      ALLOWED_TAGS: [
        'h1','h2','h3','h4','h5','h6',
        'p','br','hr',
        'ul','ol','li',
        'blockquote','pre','code',
        'table','thead','tbody','tr','th','td',
        'a','img',
        'strong','em','del','s',
        'div','span',
        'section','button'
      ],
      ALLOWED_ATTR: [
        'href','src','alt','title','class','id',
        'target','rel','loading','type','aria-expanded','aria-label',
        'width','height','align'
      ],
      FORBID_TAGS: ['script','iframe','object','embed','form','input'],
      FORBID_ATTR: ['onerror','onload','onclick','onmouseover','style']
    });
  }

  function wrapTables(container) {
    container.querySelectorAll('table').forEach(function (table) {
      if (table.parentElement && table.parentElement.classList.contains('md-table-wrap')) return;

      var wrap = document.createElement('div');
      wrap.className = 'md-table-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  function copyTextWithFallback(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    Object.assign(textarea.style, {
      position: 'fixed',
      left: '-9999px',
      top: '0',
      opacity: '0'
    });
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) {}

    document.body.removeChild(textarea);
    return ok;
  }

  function addCodeCopyButtons(article) {
    article.querySelectorAll('pre').forEach(function (pre) {
      var code = pre.querySelector('code');
      if (!code || pre.querySelector('.code-copy-button')) return;

      var button = document.createElement('button');
      button.className = 'code-copy-button';
      button.type = 'button';
      button.textContent = 'Copy';
      button.setAttribute('aria-label', 'Copy code');

      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        var codeText = code.textContent || '';
        if (!codeText) return;

        navigator.clipboard.writeText(codeText).then(function () {
          button.textContent = 'Copied';
          setTimeout(function () {
            button.textContent = 'Copy';
          }, 1200);
        }).catch(function () {
          var copied = copyTextWithFallback(codeText);
          button.textContent = copied ? 'Copied' : 'Failed';
          setTimeout(function () {
            button.textContent = 'Copy';
          }, 1200);
        });
      });

      pre.appendChild(button);
    });
  }

  function renderMarkdownToElement(rawMarkdown, meta) {
    if (!mdReaderMarkdown) {
      mdReaderMarkdown = createMarkdownRenderer();
    }

    if (!mdReaderMarkdown) {
      var fallback = document.createElement('article');
      fallback.className = 'md-reader-content-inner';
      fallback.textContent = rawMarkdown || '';
      return fallback;
    }

    var dirtyHtml = mdReaderMarkdown.render(rawMarkdown || '');
    var cleanHtml = sanitizeHtml(dirtyHtml);

    var article = document.createElement('article');
    article.className = 'md-reader-content-inner';
    article.innerHTML = cleanHtml;

    if (window.mdReaderResource) {
      window.mdReaderResource.rewriteImageSources(article, meta);
      window.mdReaderResource.enhanceLinks(article);
    }

    wrapTables(article);
    addCodeCopyButtons(article);

    if (window.mdReaderToc) {
      window.mdReaderToc.addHeadingIds(article);
    }

    return article;
  }

  window.mdReaderRender = {
    renderMarkdownToElement: renderMarkdownToElement
  };
})();
