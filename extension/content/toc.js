(function () {
  'use strict';

  function slugify(text) {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      || 'section';
  }

  function addHeadingIds(container) {
    var used = new Map();

    container.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(function (heading) {
      var raw = heading.textContent || '';
      var base = slugify(raw);
      var count = used.get(base) || 0;
      used.set(base, count + 1);

      var id = count === 0 ? base : base + '-' + (count + 1);
      heading.id = 'md-reader-' + id;
    });
  }

  function buildToc(container) {
    return Array.from(container.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(function (heading, index) {
      var level = Number(heading.tagName.replace('H', ''));
      return {
        id: heading.id,
        text: heading.textContent.replace(/[▾▸]/g, '').trim(),
        level: level,
        index: index
      };
    });
  }

  function scrollToHeading(container, headingId) {
    var el = container.querySelector('#' + CSS.escape(headingId));
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  window.mdReaderToc = {
    addHeadingIds: addHeadingIds,
    buildToc: buildToc,
    scrollToHeading: scrollToHeading
  };
})();
