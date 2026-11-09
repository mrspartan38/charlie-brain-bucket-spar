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

  function showLoggedIn(user) {
    status.textContent = 'logged in as ' + user.username + ' ';

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