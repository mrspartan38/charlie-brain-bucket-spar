(() => {
  function setMessage(text) {
    document.querySelector('#messageVocab').textContent = text;
  }

  function buildItem(word, savedIds) {
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
            'vocab',
            word._id,
            '#messageVocab'
          );

        if (saved) {
          savedIds.add(String(word._id));
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

  function render(words, savedIds) {
    const container =
      document
        .querySelector('#listVocab');

    container.textContent = '';

    una.sections.group(words).forEach(function (section) {

      const heading =
        document
          .createElement('h2');

      heading.textContent = section.label;

      const list =
        document
          .createElement('ul');

      section.items.forEach(function (word) {
        list.appendChild(buildItem(word, savedIds));
      });

      container.appendChild(heading);
      container.appendChild(list);

    });
  }

  async function getVocab() {

    const response =
      await fetch(
        '/api/vocab'
      );

    if (!response.ok) {
      setMessage('Could not load the vocabulary.');
      return;
    }

    const words =
      await response.json();

    if (words.length === 0) {
      setMessage('No words yet.');
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
      if (save.itemType === 'vocab') {
        savedIds.add(String(save.itemId));
      }
    });

    una.sections.createFilter({
      container: document.querySelector('#sectionFilter'),
      items: words,
      noun: ['word', 'words'],
      onChange: function (shown) {
        render(shown, savedIds);
      }
    });

  }

  getVocab();
})();