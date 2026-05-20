(function () {
  'use strict';

  function isExternalUrl(value) {
    return /^(https?:)?\/\//i.test(value)
      || value.startsWith('data:')
      || value.startsWith('mailto:')
      || value.startsWith('#');
  }

  function dirname(path) {
    if (!path || !path.includes('/')) return '';
    return path.split('/').slice(0, -1).join('/');
  }

  function normalizePath(path) {
    var parts = [];
    path.split('/').forEach(function (part) {
      if (!part || part === '.') return;
      if (part === '..') { parts.pop(); }
      else { parts.push(part); }
    });
    return parts.join('/');
  }

  function toRawResourceUrl(src, meta) {
    if (!src || isExternalUrl(src)) return src;

    if (meta && meta.rawBaseUrl) {
      try {
        return new URL(src, meta.rawBaseUrl).href;
      } catch (e) {
        return src;
      }
    }

    if (!meta || !meta.owner || !meta.repo || !meta.branch) return src;

    var baseDir = dirname(meta.path || '');
    var fullPath = normalizePath(baseDir + '/' + src);

    return 'https://raw.githubusercontent.com/' + meta.owner + '/' + meta.repo + '/' + meta.branch + '/' + fullPath;
  }

  function rewriteImageSources(container, meta) {
    container.querySelectorAll('img[src]').forEach(function (img) {
      var src = img.getAttribute('src');
      img.setAttribute('src', toRawResourceUrl(src, meta));
      img.setAttribute('loading', 'lazy');
    });
  }

  function enhanceLinks(container) {
    container.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (!href.startsWith('#')) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  window.mdReaderResource = {
    toRawResourceUrl: toRawResourceUrl,
    rewriteImageSources: rewriteImageSources,
    enhanceLinks: enhanceLinks
  };
})();
