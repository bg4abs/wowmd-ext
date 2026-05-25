var t = (function () {
  'use strict';

  var MESSAGES = {
    main_button_text: 'Better View',
    open_markdown_reader: 'Open wowMD',
    panel_title: 'wowMD',
    tab_toc: 'Outline',
    tab_read: 'Read',
    back_to_toc: '\u2190 Back to outline',
    open_full_reader: 'Open full reader',
    full_reader_unavailable: 'Full reader is available after the document loads.',
    extension_context_invalidated: 'Extension was reloaded. Refresh this GitHub page to use full reader.',
    refresh_page_to_reopen: 'Refresh page to reopen',
    footer_site_link: 'wowMD Web App',
    footer_site_text: 'Check wowMD Web App for more information.',
    loading_message: 'Preparing document...',
    toc_section_count_one: '1 section',
    toc_section_count: '$count$ sections',
    toc_empty_title: 'This document has no clear sections.',
    toc_empty_hint: 'Switch to the "Read" tab to view the full text.',
    toc_untitled: '(Untitled)',
    error_title_unavailable: "Can't read this page right now",
    error_title_empty: 'This file appears to be empty',
    error_title_timeout: 'Loading is taking too long - retry?',
    error_title_network: 'Network seems unstable',
    error_body_private: 'Private repos are not supported yet. You may also be rate-limited. Try again later.',
    error_body_not_found: 'No readable Markdown content was found.',
    error_body_network: 'Try again later.',
    action_retry: 'Retry',
    fold_collapse: 'Collapse section',
    fold_expand: 'Expand section',
    error_cannot_identify: 'Cannot identify this page'
  };

  function normalizeSubstitutions(substitutions) {
    if (substitutions === undefined || substitutions === null) return [];
    return Array.isArray(substitutions) ? substitutions : [substitutions];
  }

  function applySubstitutions(message, substitutions) {
    var values = normalizeSubstitutions(substitutions);

    return String(message).replace(/\$(\w+)\$/g, function (match, name) {
      if (name === 'count' && values.length > 0) return String(values[0]);
      return match;
    });
  }

  function translate(key, substitutions) {
    var message = MESSAGES[key] || key;
    return applySubstitutions(message, substitutions);
  }

  window.__wowMD_i18n = {
    t: translate
  };

  window.t = translate;

  return translate;
})();
