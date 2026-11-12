(() => {
  function getSection(concept) {
    const source = concept.source || {};
    const chapter = Number(source.chapter);

    if (!source.book || !chapter) {
      return { key: 'other', label: 'Other', order: Infinity };
    }

    return {
      key: source.book + '|' + chapter,
      label: source.book + ': Chapter ' + chapter,
      order: chapter
    };
  }

  function groupBySection(concepts) {
    const sections = new Map();

    concepts.forEach(function (concept) {
      const section = getSection(concept);

      if (!sections.has(section.key)) {
        sections.set(section.key, {
          label: section.label,
          order: section.order,
          concepts: []
        });
      }

      sections.get(section.key).concepts.push(concept);
    });

    return Array.from(sections.values()).sort(function (a, b) {
      return a.order - b.order || a.label.localeCompare(b.label);
    });
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

    const container =
      document
        .querySelector('#listGrammar');

    container.textContent = '';

    groupBySection(data).forEach(function (section) {

      const heading =
        document
          .createElement('h2');

      heading.textContent = section.label;

      const list =
        document
          .createElement('ul');

      section.concepts.forEach(function (concept) {
        list.appendChild(buildItem(concept, savedIds));
      });

      container.appendChild(heading);
      container.appendChild(list);

    });

  }

  getGrammar();
})();