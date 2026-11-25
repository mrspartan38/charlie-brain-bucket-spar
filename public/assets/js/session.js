(() => {
  const status = document.getElementById('sessionStatus');

  if (!status) {
    return;
  }

  function showLoggedOut() {
    status.textContent = '';

    const link = document.createElement('a');
    link.href = '/pages/auth.html';
    link.textContent = 'log in';

    status.appendChild(link);
  }

    function addAdminLink() {
    const list = document.querySelector('#siteNav .navbar-nav');

    if (!list) {
      return;
    }

    const pages = [
      { href: '/pages/admin-vocab.html', label: 'Vocabulary' },
      { href: '/pages/admin-grammar.html', label: 'Grammar' }
    ];

    const item = document.createElement('li');
    item.className = 'nav-item dropdown';

    const toggle = document.createElement('a');
    toggle.className = 'nav-link dropdown-toggle';
    toggle.href = '#';
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('data-bs-toggle', 'dropdown');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'Manage';

    const menu = document.createElement('ul');
    menu.className = 'dropdown-menu';

    pages.forEach(function (page) {
      const entry = document.createElement('li');

      const link = document.createElement('a');
      link.className = 'dropdown-item';
      link.href = page.href;
      link.textContent = page.label;

      if (window.location.pathname === page.href) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
        toggle.classList.add('active');
      }

      entry.appendChild(link);
      menu.appendChild(entry);
    });

    item.appendChild(toggle);
    item.appendChild(menu);
    list.appendChild(item);
  }

  function showLoggedIn(user) {
    status.textContent =
      'logged in as ' +
      user.username +
      (user.role === 'admin' ? ' (admin)' : '') +
      ' ';

    if (user.role === 'admin') {
      addAdminLink();
    }

    const button = document.createElement('button');
    button.textContent = 'log out';
    button.addEventListener('click', logout);

    status.appendChild(button);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  }

  async function loadSession() {
    try {
      const response = await fetch('/api/auth/me');

      if (response.ok) {
        showLoggedIn(await response.json());
      } else {
        showLoggedOut();
      }
    } catch (error) {
      showLoggedOut();
    }
  }

  loadSession();
})();