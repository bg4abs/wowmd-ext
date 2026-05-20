(function () {
  'use strict';

  function injectH2Foldable(container) {
    var h2s = Array.from(container.querySelectorAll('h2'));

    h2s.forEach(function (h2) {
      if (h2.closest('.md-section')) return;

      var parent = h2.parentNode;
      if (!parent) return;

      var section = document.createElement('section');
      section.className = 'md-section';

      var content = document.createElement('div');
      content.className = 'md-section-content';

      parent.insertBefore(section, h2);
      section.appendChild(h2);

      var next = section.nextSibling;
      while (
        next &&
        !(
          next.nodeType === Node.ELEMENT_NODE &&
          next.matches('h2')
        )
      ) {
        var tmp = next.nextSibling;
        content.appendChild(next);
        next = tmp;
      }

      var toggle = document.createElement('button');
      toggle.className = 'md-fold-btn';
      toggle.type = 'button';
      toggle.textContent = '\u25BE';
      toggle.setAttribute('aria-label', t('fold_collapse'));
      toggle.setAttribute('aria-expanded', 'true');

      toggle.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        var collapsed = content.classList.toggle('collapsed');
        toggle.textContent = collapsed ? '\u25B8' : '\u25BE';
        toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        toggle.setAttribute('aria-label', collapsed ? t('fold_expand') : t('fold_collapse'));
      });

      h2.appendChild(toggle);
      section.appendChild(content);
    });
  }

  window.mdReaderFold = {
    injectH2Foldable: injectH2Foldable
  };
})();
