(() => {
  async function getGrammar() {

    const response =
      await fetch(
        '/api/grammar'
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
      if (save.itemType === 'grammar') {
        savedIds.add(String(save.itemId));
      }
    });

    const list =
      document
        .querySelector('#listGrammar');

    list.textContent = '';

    data.forEach(function (concept) {

      const item =
        document
          .createElement('li');

      const link =
        document
          .createElement('a');

      link.href =
        '/pages/grammar.html?id=' +
        concept._id;

      link.textContent = concept.title;

      item.appendChild(link);

      item.appendChild(
        document.createTextNode(
          ': ' + concept.summary + ' '
        )
      );

      if (savedIds.has(String(concept._id))) {
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
              'grammar',
              concept._id,
              '#messageGrammar'
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


  getGrammar();
})();
