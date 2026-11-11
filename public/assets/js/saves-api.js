(() => {
  async function saveItem(itemType, itemId, messageSelector) {

    const save = {
      itemType: itemType,
      itemId: itemId
    };

    const response =
      await fetch(
        '/api/saves',
        {
          method:
            'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body:
            JSON.stringify(
              save
            )
        }
      );

    let message = 'error ' + response.status;

    if (response.status === 201) {
      message = 'saved';
    }

    if (response.status === 401) {
      message = 'log in to save';
    }

    if (response.status === 409) {
      message = 'already saved';
    }

    document
      .querySelector(messageSelector)
      .textContent = message;

    return response.status === 201 || response.status === 409;
  }

  window.una = window.una || {};
  window.una.saveItem = saveItem;
})();