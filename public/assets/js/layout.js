(() => {
  if (document.getElementById('siteNav')) {
    return;
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/pages/vocab.html', label: 'Vocabulary' },
    { href: '/pages/grammarlist.html', label: 'Grammar' },
    { href: '/pages/saves.html', label: 'My saves' }
  ];

  const reviewLinks = [
    { href: '/pages/vocabreview.html', label: 'Vocab review' },
    { href: '/pages/grammarreview.html', label: 'Grammar review' }
  ];

  const footerLinks = [
    { href: '/', label: 'Home' },
    { href: '/#about', label: 'About' },
    { href: '/pages/vocab.html', label: 'Vocabulary' },
    { href: '/pages/grammarlist.html', label: 'Grammar' },
    { href: 'https://github.com/mrspartan38/charlie-brain-bucket-spar', label: 'GitHub' }
  ];

  function el(tag, className, attributes, text) {
    const node = document.createElement(tag);

    if (className) {
      node.className = className;
    }

    Object.keys(attributes || {}).forEach(function (name) {
      node.setAttribute(name, attributes[name]);
    });

    if (text) {
      node.textContent = text;
    }

    return node;
  }

  function isCurrentPage(href) {
    const path = window.location.pathname;

    if (href === '/') {
      return path === '/' || path === '/una.html';
    }

    return path === href;
  }

  function buildLink(link, className) {
    const anchor = el('a', className, { href: link.href }, link.label);

    if (isCurrentPage(link.href)) {
      anchor.classList.add('active');
      anchor.setAttribute('aria-current', 'page');
    }

    return anchor;
  }

  function buildHeader() {
    const nav = el('nav', 'navbar navbar-expand-md border-bottom', { 'aria-label': 'Main' });
    const container = el('div', 'container');

    container.appendChild(el('a', 'navbar-brand', { href: '/' }, 'Una'));

    const toggler = el('button', 'navbar-toggler', {
      type: 'button',
      'data-bs-toggle': 'collapse',
      'data-bs-target': '#siteNav',
      'aria-controls': 'siteNav',
      'aria-expanded': 'false',
      'aria-label': 'Toggle navigation'
    });

    toggler.appendChild(el('span', 'navbar-toggler-icon'));
    container.appendChild(toggler);

    const collapse = el('div', 'collapse navbar-collapse', { id: 'siteNav' });
    const list = el('ul', 'navbar-nav me-auto mb-2 mb-md-0');

    navLinks.forEach(function (link) {
      const item = el('li', 'nav-item');
      item.appendChild(buildLink(link, 'nav-link'));
      list.appendChild(item);
    });

    const dropdown = el('li', 'nav-item dropdown');

    dropdown.appendChild(el('a', 'nav-link dropdown-toggle', {
      href: '#',
      role: 'button',
      'data-bs-toggle': 'dropdown',
      'aria-expanded': 'false'
    }, 'Review'));

    const menu = el('ul', 'dropdown-menu');

    reviewLinks.forEach(function (link) {
      const item = el('li');
      item.appendChild(buildLink(link, 'dropdown-item'));
      menu.appendChild(item);
    });

    dropdown.appendChild(menu);
    list.appendChild(dropdown);

    collapse.appendChild(list);
    collapse.appendChild(el('span', 'navbar-text', { id: 'sessionStatus' }));
    container.appendChild(collapse);
    nav.appendChild(container);

    return nav;
  }

  function buildFooter() {
    const footer = el('footer', 'border-top mt-5 py-3');
    const container = el('div', 'container');
    const nav = el('nav', 'd-flex flex-wrap gap-3 mb-2', { 'aria-label': 'Footer' });

    footerLinks.forEach(function (link) {
      nav.appendChild(el('a', '', { href: link.href }, link.label));
    });

    container.appendChild(nav);

    container.appendChild(el(
      'p',
      'small text-secondary mb-0',
      {},
      'Una: German vocabulary and grammar review for UNA students.'
    ));

    footer.appendChild(container);

    return footer;
  }

function buildMain() {
    const main = el('main', 'container py-4', { id: 'siteMain' });

    Array.from(document.body.children).forEach(function (child) {
      if (child.tagName !== 'SCRIPT') {
        main.appendChild(child);
      }
    });

    return main;
  }

  document.body.insertBefore(buildMain(), document.body.firstChild);
  document.body.insertBefore(buildHeader(), document.body.firstChild);
  document.body.appendChild(buildFooter())
})();