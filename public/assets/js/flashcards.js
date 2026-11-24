(() => {
  const FLIP_BACK_DELAY = 260;
  const DIRECTION_KEY = 'flashcardDirection';

  function $(selector) {
    return document.querySelector(selector);
  }

  const messageBox = $('#messageCard');
  const controls = $('#controls');
  const deckSelect = $('#deckSelect');
  const direction = $('#direction');
  const deckArea = $('#deckArea');
  const progressText = $('#progressText');
  const progress = $('#progress');
  const progressBar = $('#progressBar');
  const card = $('#flashcard');
  const faceFront = $('#faceFront');
  const faceBack = $('#faceBack');
  const rating = $('#rating');
  const summary = $('#summary');

  let allSaves = [];
  let deck = [];
  let index = 0;
  let flipped = false;
  let busy = false;
  let results = { 1: [], 2: [], 3: [] };

  function setMessage(text, linkHref, linkText) {
    messageBox.textContent = text;

    if (linkHref) {
      const link = document.createElement('a');
      link.href = linkHref;
      link.textContent = linkText;
      messageBox.appendChild(document.createTextNode(' '));
      messageBox.appendChild(link);
    }
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Nouns are stored with their article inside the German text ("der Bahnhof"),
  // but a word added with a separate article field ("Zug" + "der") is joined here.
  function germanText(word) {
    const article = word.article;
    const german = word.german;

    if (article && !german.toLowerCase().startsWith(article.toLowerCase() + ' ')) {
      return article + ' ' + german;
    }

    return german;
  }

  // Weakest first: lowest confidence, then never reviewed, then longest ago.
  function byWeakest(a, b) {
    if (a.confidence !== b.confidence) {
      return a.confidence - b.confidence;
    }

    const timeA = a.lastReviewedAt ? new Date(a.lastReviewedAt).getTime() : 0;
    const timeB = b.lastReviewedAt ? new Date(b.lastReviewedAt).getTime() : 0;

    return timeA - timeB;
  }

  function chapterKey(save) {
    const source = save.item.source;

    return source ? source.book + '|' + source.chapter : 'none';
  }

  function chapterLabel(save) {
    const source = save.item.source;

    return source ? source.book + ': Chapter ' + source.chapter : 'No chapter';
  }

  function fillDeckOptions() {
    const previous = deckSelect.value;
    const groups = new Map();

    allSaves.forEach(function (save) {
      const key = chapterKey(save);

      if (!groups.has(key)) {
        groups.set(key, { label: chapterLabel(save), count: 0, order: save.item.source ? save.item.source.chapter : Infinity });
      }

      groups.get(key).count += 1;
    });

    deckSelect.textContent = '';

    const all = document.createElement('option');
    all.value = 'all';
    all.textContent = 'All saved words (' + allSaves.length + ')';
    deckSelect.appendChild(all);

    Array.from(groups.entries())
      .sort(function (a, b) { return a[1].order - b[1].order || a[1].label.localeCompare(b[1].label); })
      .forEach(function (entry) {
        const option = document.createElement('option');
        option.value = entry[0];
        option.textContent = entry[1].label + ' (' + entry[1].count + ')';
        deckSelect.appendChild(option);
      });

    deckSelect.value = Array.from(deckSelect.options).some(function (o) { return o.value === previous; })
      ? previous
      : 'all';
  }

  function setFlipped(value) {
    flipped = value;
    card.classList.toggle('is-flipped', value);
    card.setAttribute('aria-pressed', String(value));
    faceFront.setAttribute('aria-hidden', String(value));
    faceBack.setAttribute('aria-hidden', String(!value));
    rating.hidden = !value;
  }

  function updateProgress() {
    const done = Math.min(index, deck.length);
    const percent = deck.length ? Math.round((done / deck.length) * 100) : 0;

    progressBar.style.width = percent + '%';
    progress.setAttribute('aria-valuenow', String(percent));
  }

  function showCard() {
    const word = deck[index].item;
    const german = germanText(word);
    const germanFirst = direction.value === 'de-en';

    $('#frontHint').textContent = germanFirst ? 'German' : 'English';
    $('#frontWord').textContent = germanFirst ? german : word.english;
    $('#backHint').textContent = germanFirst ? 'English' : 'German';
    $('#backWord').textContent = germanFirst ? word.english : german;
    $('#backPlural').textContent = word.plural ? 'Plural: ' + word.plural : '';
    $('#backExample').textContent = word.example
      ? word.example.german + ' (' + word.example.english + ')'
      : '';

    progressText.textContent = 'Card ' + (index + 1) + ' of ' + deck.length;
    updateProgress();
    setFlipped(false);
    busy = false;
  }

  function showSummary() {
    deckArea.hidden = true;
    summary.hidden = false;

    const total = results[1].length + results[2].length + results[3].length;

    $('#summaryText').textContent =
      'You went through ' + total + (total === 1 ? ' card' : ' cards') + ': ' +
      results[3].length + ' known, ' +
      results[2].length + ' getting there, ' +
      results[1].length + ' still learning.';

    $('#summaryWeak').textContent = results[1].length
      ? 'Still learning: ' + results[1].map(germanText).join(', ')
      : '';

    busy = false;
  }

  function startDeck() {
    const key = deckSelect.value;

    deck = allSaves
      .filter(function (save) { return key === 'all' || chapterKey(save) === key; })
      .sort(byWeakest);

    index = 0;
    results = { 1: [], 2: [], 3: [] };
    summary.hidden = true;
    deckArea.hidden = false;
    setMessage('');
    showCard();
  }

  function flip() {
    if (busy || deckArea.hidden || deck.length === 0) {
      return;
    }

    setFlipped(!flipped);
  }

  async function rate(confidence) {
    if (!flipped || busy) {
      return;
    }

    busy = true;

    const save = deck[index];
    let response;

    try {
      response = await fetch(
        `/api/saves/${save._id}/review`,
        {
          method:
            'PATCH',
          headers: {
            'Content-Type':
              'application/json'
          },
          body:
            JSON.stringify({
              confidence: confidence
            })
        }
      );
    } catch (error) {
      setMessage('Could not reach the server. Try that rating again.');
      busy = false;
      return;
    }

    if (!response.ok) {
      setMessage(
        response.status === 401
          ? 'Log in to review your saved words.'
          : 'Could not save that rating (error ' + response.status + '). Try again.'
      );
      busy = false;
      return;
    }

    setMessage('');

    save.confidence = confidence;
    save.reviewCount = (save.reviewCount || 0) + 1;
    save.lastReviewedAt = new Date().toISOString();
    results[confidence].push(save.item);
    index += 1;
    updateProgress();
    setFlipped(false);

    const next = index >= deck.length ? showSummary : showCard;

    if (reducedMotion()) {
      next();
    } else {
      setTimeout(next, FLIP_BACK_DELAY);
    }
  }

  async function loadSaves() {
    let response;

    try {
      response = await fetch('/api/saves');
    } catch (error) {
      setMessage('Could not reach the server.');
      return false;
    }

    if (response.status === 401) {
      setMessage('Log in to review your saved words.');
      return false;
    }

    const saves = await response.json();

    allSaves = saves.filter(function (save) {
      return save.itemType === 'vocab' && save.item;
    });

    if (allSaves.length === 0) {
      setMessage('No saved words yet. Save some on the', '/pages/vocab.html', 'Vocabulary page.');
      return false;
    }

    return true;
  }

  async function start() {
    if (!(await loadSaves())) {
      return;
    }

    try {
      direction.value = window.localStorage.getItem(DIRECTION_KEY) || 'de-en';
    } catch (error) {
      direction.value = 'de-en';
    }

    if (!direction.value) {
      direction.value = 'de-en';
    }

    controls.hidden = false;
    fillDeckOptions();
    startDeck();
  }

  card.addEventListener('click', flip);

  rating.addEventListener('click', function (event) {
    const button = event.target.closest('button[data-rating]');

    if (button) {
      rate(Number(button.dataset.rating));
    }
  });

  deckSelect.addEventListener('change', function () {
    deckSelect.blur();
    startDeck();
  });

  direction.addEventListener('change', function () {
    direction.blur();

    try {
      window.localStorage.setItem(DIRECTION_KEY, direction.value);
    } catch (error) {
      // The choice just isn't remembered.
    }

    startDeck();
  });

  $('#reviewAgain').addEventListener('click', async function () {
    if (await loadSaves()) {
      fillDeckOptions();
      startDeck();
    }
  });

  document.addEventListener('keydown', function (event) {
    const tag = event.target.tagName;

    if (['SELECT', 'INPUT', 'TEXTAREA', 'BUTTON'].includes(tag) || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      flip();
    }

    if (['1', '2', '3'].includes(event.key)) {
      rate(Number(event.key));
    }
  });

  start();
})();