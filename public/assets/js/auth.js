(() => {
  document
    .querySelector('#login')
    .addEventListener(
      'click',
      login
    );

  document
    .querySelector('#register')
    .addEventListener(
      'click',
      register
    );

  async function sendAuth(url) {

    const credentials = {
      username:
        document
          .querySelector('#username')
          .value,
      password:
        document
          .querySelector('#password')
          .value
    };

    const response =
      await fetch(
        url,
        {
          method:
            'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body:
            JSON.stringify(
              credentials
            )
        }
      );

    const data =
      await response.json();

    return {
      ok: response.ok,
      data: data
    };

  }

  async function login() {

    const result =
      await sendAuth(
        '/api/auth/login'
      );

    if (result.ok) {
      window.location.assign('/');
      return;
    }

    document
      .querySelector('#messageAuth')
      .textContent = result.data.error;

  }

  async function register() {

    const result =
      await sendAuth(
        '/api/auth/register'
      );

    if (!result.ok) {
      document
        .querySelector('#messageAuth')
        .textContent = result.data.error;
      return;
    }

    await login();

  }
})();