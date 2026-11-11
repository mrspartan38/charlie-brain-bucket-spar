(() => {
  async function getSaves() {

    const response =
      await fetch(
        '/api/saves'
      );

    if (response.status === 401) {
      document
        .querySelector('#messageReview')
        .textContent = 'log in to see your saves';
      return;
    }

    const data =
      await response.json();

    const list =
      document
        .querySelector('#listSaves');

    list.textContent = '';

    document
      .querySelector('#messageReview')
      .textContent =
      data.length === 0
        ? 'nothing saved yet'
        : '';

    data.forEach(function (save) {

      let label = '(this item no longer exists)';

      if (save.item && save.itemType === 'vocab') {
        label = save.item.german + ' = ' + save.item.english;
      }

      if (save.item && save.itemType === 'grammar') {
        label = save.item.title;
      }

      const item =
        document
          .createElement('li');

      item.textContent =
        label +
        ' (confidence ' +
        save.confidence +
        ', reviewed ' +
        save.reviewCount +
        ' times) ';

      [1, 2, 3].forEach(function (confidence) {

        const button =
          document
            .createElement('button');

        button.textContent = confidence;

        button.addEventListener(
          'click',
          function () {
            reviewSave(
              save._id,
              confidence
            );
          }
        );

        item.appendChild(button);

      });

      const unsave =
        document
          .createElement('button');

      unsave.textContent = 'unsave';

      unsave.addEventListener(
        'click',
        function () {
          unsaveItem(
            save._id
          );
        }
      );

      item.appendChild(unsave);

      list.appendChild(item);

    });

  }

  async function reviewSave(saveId, confidence) {

    const review = {
      confidence: confidence
    };

    const response =
      await fetch(
        `/api/saves/${saveId}/review`,
        {
          method:
            'PATCH',
          headers: {
            'Content-Type':
              'application/json'
          },
          body:
            JSON.stringify(
              review
            )
        }
      );

    await getSaves();

    document
      .querySelector('#messageReview')
      .textContent =
      response.status === 200
        ? 'reviewed'
        : 'error ' + response.status;

  }

  async function unsaveItem(saveId) {

    const response =
      await fetch(
        `/api/saves/${saveId}`,
        {
          method:
            'DELETE'
        }
      );

    await getSaves();

    document
      .querySelector('#messageReview')
      .textContent =
      response.status === 200
        ? 'unsaved'
        : 'error ' + response.status;

  }

  getSaves();
})();