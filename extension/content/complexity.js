(function () {
  'use strict';

  var MARKDOWN_CONTAINER_SELECTORS = [
    'article[data-testid="readme"] .markdown-body',
    'article[data-testid="readme"]',
    '#readme .markdown-body',
    '#readme',
    'article.markdown-body',
    '.markdown-body'
  ];

  function findMarkdownContentContainer() {
    for (var i = 0; i < MARKDOWN_CONTAINER_SELECTORS.length; i++) {
      var el = document.querySelector(MARKDOWN_CONTAINER_SELECTORS[i]);
      if (el && (el.innerText || '').trim().length > 0) {
        return el;
      }
    }
    return null;
  }

  function getDocumentComplexityMetrics(container) {
    var safeContainer = container || findMarkdownContentContainer();

    if (!safeContainer) {
      return {
        h1Count: 0,
        h2Count: 0,
        h3Count: 0,
        headingCount: 0,
        codeBlockCount: 0,
        tableCount: 0,
        listCount: 0,
        textLength: 0,
        renderedHeight: 0,
        score: 0
      };
    }

    var metrics = {
      h1Count: safeContainer.querySelectorAll('h1').length,
      h2Count: safeContainer.querySelectorAll('h2').length,
      h3Count: safeContainer.querySelectorAll('h3').length,
      headingCount: safeContainer.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
      codeBlockCount: safeContainer.querySelectorAll('pre').length,
      tableCount: safeContainer.querySelectorAll('table').length,
      listCount: safeContainer.querySelectorAll('ul, ol').length,
      textLength: (safeContainer.innerText || '').trim().length,
      renderedHeight: safeContainer.scrollHeight || 0,
      score: 0
    };

    metrics.score = scoreDocumentComplexity(metrics);
    return metrics;
  }

  function scoreDocumentComplexity(metrics) {
    var score = 0;

    if (metrics.h2Count >= 3) score += 3;
    if (metrics.h3Count >= 1) score += 2;
    if (metrics.headingCount >= 8) score += 2;
    if (metrics.codeBlockCount >= 2) score += 2;
    if (metrics.tableCount >= 1) score += 2;
    if (metrics.listCount >= 4) score += 1;
    if (metrics.textLength >= 5000) score += 2;
    if (metrics.renderedHeight >= 3000) score += 2;

    return score;
  }

  function getEntryVisibility(metrics) {
    var score = metrics ? (metrics.score || 0) : 0;

    if (score >= 7) {
      return {
        showMainEntry: true,
        showFallbackEntry: true,
        strength: 'strong'
      };
    }

    if (score >= 5) {
      return {
        showMainEntry: true,
        showFallbackEntry: false,
        strength: 'normal'
      };
    }

    return {
      showMainEntry: false,
      showFallbackEntry: false,
      strength: 'hidden'
    };
  }

  window.__wowMD_complexity = {
    findMarkdownContentContainer: findMarkdownContentContainer,
    getDocumentComplexityMetrics: getDocumentComplexityMetrics,
    getEntryVisibility: getEntryVisibility
  };
})();
