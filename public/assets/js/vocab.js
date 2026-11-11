(() => {
  async function getVocab() {

    const response =
      await fetch(
        '/api/vocab'
      );

    const data =
      await response.json();

    const savesResponse =
      await fetch(
        '/api/saves'
      );

    const saves =
      savesResponse.status === 200
        ? await savesResponse.json()
        : [];

    const savedIds = new Set();

    saves.forEach(function (save) {
      if (save.itemType === 'vocab') {
        savedIds.add(String(save.itemId));
      }
    });

    const list =
      document
        .querySelector('#listVocab');

    list.textContent = '';

    data.forEach(function (word) {

      const item =
        document
          .createElement('li');

      item.textContent =
        word.german +
        ' = ' +
        word.english +
        ' ';

      if (savedIds.has(String(word._id))) {
        item.appendChild(
          document.createTextNode('(saved)')
        );
        list.appendChild(item);
        return;
      }

      const button =
        document
          .createElement('button');

      button.textContent = 'save';

      button.addEventListener(
        'click',
        async function () {

          const saved =
            await una.saveItem(
              'vocab',
              word._id,
              '#messageVocab'
            );

          if (saved) {
            button.remove();
            item.appendChild(
              document.createTextNode('(saved)')
            );
          }

        }
      );

      item.appendChild(button);
      list.appendChild(item);

    });

  }


  getVocab();
})();
