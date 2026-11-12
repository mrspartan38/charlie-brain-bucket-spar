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

    const item = document.createElement('li');
    item.className = 'nav-item';

    const link = document.createElement('a');
    link.className = 'nav-link';
    link.href = '/pages/admin-vocab.html';
    link.textContent = 'Manage';

    if (window.location.pathname === '/pages/admin-vocab.html') {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }

    item.appendChild(link);
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