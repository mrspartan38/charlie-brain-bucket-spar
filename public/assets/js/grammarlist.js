(() => {
  function setMessage(text) {
    document.querySelector('#messageGrammar').textContent = text;
  }

  function buildItem(concept, savedIds) {
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
      return item;
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
          savedIds.add(String(concept._id));
          button.remove();
          item.appendChild(
            document.createTextNode('(saved)')
          );
        }

      }
    );

    item.appendChild(button);

    return item;
  }

  function render(concepts, savedIds) {
    const container =
      document
        .querySelector('#listGrammar');

    container.textContent = '';

    una.sections.group(concepts).forEach(function (section) {

      const heading =
        document
          .createElement('h2');

      heading.textContent = section.label;

      const list =
        document
          .createElement('ul');

      section.items.forEach(function (concept) {
        list.appendChild(buildItem(concept, savedIds));
      });

      container.appendChild(heading);
      container.appendChild(list);

    });
  }

  async function getGrammar() {

    const response =
      await fetch(
        '/api/grammar'
      );

    if (!response.ok) {
      setMessage('Could not load the grammar concepts.');
      return;
    }

    const concepts =
      await response.json();

    if (concepts.length === 0) {
      setMessage('No grammar concepts yet.');
      return;
    }

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

    una.sections.createFilter({
      container: document.querySelector('#sectionFilter'),
      items: concepts,
      noun: ['concept', 'concepts'],
      onChange: function (shown) {
        render(shown, savedIds);
      }
    });

  }

  getGrammar();
})();