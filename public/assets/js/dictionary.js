(() => {
  const form = document.querySelector('#dictForm');
  const input = document.querySelector('#dictQuery');
  const messageBox = document.querySelector('#messageDict');
  const list = document.querySelector('#listVocab');

  let searchId = 0;

  function setMessage(text) {
    messageBox.textContent = text;
  }

  function details(word) {
    const parts = [word.partOfSpeech];

    if (word.plural) {
      parts.push('plural: ' + word.plural);
    }

    if (word.source) {
      parts.push(word.source.book + ', chapter ' + word.source.chapter);
    }

    return parts.join(' \u00b7 ');
  }

  function buildItem(word, savedIds) {
    const item =
      document
        .createElement('li');

    const main =
      document
        .createElement('div');

    main.textContent = word.german + ' = ' + word.english + ' ';

    if (savedIds.has(String(word._id))) {
      main.appendChild(document.createTextNode('(saved)'));
    } else {
      const button =
        document
          .createElement('button');

      button.type = 'button';
      button.textContent = 'save';

      button.addEventListener(
        'click',
        async function () {

          const saved =
            await una.saveItem(
              'vocab',
              word._id,
              '#messageDict'
            );

          if (saved) {
            button.remove();
            main.appendChild(document.createTextNode('(saved)'));
          }

        }
      );

      main.appendChild(button);
    }

    item.appendChild(main);

    const info =
      document
        .createElement('small');

    info.className = 'd-block text-secondary';
    info.textContent = details(word);
    item.appendChild(info);

    if (word.example) {
      const example =
        document
          .createElement('small');

      example.className = 'd-block';
      example.textContent = word.example.german + ' (' + word.example.english + ')';
      item.appendChild(example);
    }

    return item;
  }

  async function savedIdsForUser() {
    try {
      const response = await fetch('/api/saves');

      if (response.status !== 200) {
        return new Set();
      }

      const saves = await response.json();

      return new Set(
        saves
          .filter(function (save) { return save.itemType === 'vocab'; })
          .map(function (save) { return String(save.itemId); })
      );
    } catch (error) {
      return new Set();
    }
  }

  async function search(query) {
    searchId += 1;

    const mine = searchId;

    setMessage('Searching...');

    let response;

    try {
      response = await fetch('/api/vocab/search?q=' + encodeURIComponent(query));
    } catch (error) {
      if (mine === searchId) {
        setMessage('Could not reach the server.');
      }

      return;
    }

    const data = await response.json().catch(function () { return {}; });

    if (mine !== searchId) {
      return;
    }

    list.textContent = '';

    if (!response.ok) {
      setMessage(data.error || 'error ' + response.status);
      return;
    }

    if (data.results.length === 0) {
      setMessage('No words match "' + query + '".');
      return;
    }

    const savedIds = await savedIdsForUser();

    if (mine !== searchId) {
      return;
    }

    data.results.forEach(function (word) {
      list.appendChild(buildItem(word, savedIds));
    });

    if (data.total > data.results.length) {
      setMessage('Showing the first ' + data.results.length + ' of ' + data.total + ' words');
    } else {
      setMessage(data.total === 1 ? '1 word found' : data.total + ' words found');
    }
  }

  function runSearch(query) {
    if (query.length < 2) {
      searchId += 1;
      list.textContent = '';
      setMessage('Type at least 2 characters.');
      return;
    }

    search(query);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const query = input.value.trim();

    window.history.replaceState(null, '', '?q=' + encodeURIComponent(query));
    runSearch(query);
  });

  const start = new URLSearchParams(window.location.search).get('q');

  if (start) {
    input.value = start;
    runSearch(start.trim());
  } else {
    setMessage('Type a German or English word to look it up.');
    input.focus();
  }
})();