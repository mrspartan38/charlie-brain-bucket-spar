(() => {
  const form = document.querySelector('#wordForm');
  const messageBox = document.querySelector('#messageAdmin');
  const list = document.querySelector('#listVocab');

  function field(id) {
    return document.querySelector('#' + id);
  }

  function setMessage(text) {
    messageBox.textContent = text;
  }

  function describeError(status, data) {
    if (status === 401) {
      return 'Log in as an admin first.';
    }

    if (status === 403) {
      return 'Only admins can do that.';
    }

    return (data && data.error) || 'error ' + status;
  }

  // Reads the form. When editing, an emptied optional field is sent as null,
  // which tells the server to remove it. When adding, it is just left out.
  function readForm(isEdit) {
    const none = isEdit ? null : undefined;

    const german = field('german').value.trim();
    const english = field('english').value.trim();
    const partOfSpeech = field('partOfSpeech').value;
    const level = Number(field('level').value);
    const article = field('article').value;
    const plural = field('plural').value.trim();
    const exampleGerman = field('exampleGerman').value.trim();
    const exampleEnglish = field('exampleEnglish').value.trim();
    const book = field('book').value.trim();
    const chapterText = field('chapter').value.trim();

    const tags = field('tags').value
      .split(',')
      .map(function (tag) { return tag.trim(); })
      .filter(Boolean);

    if (!german || !english || !partOfSpeech || !level) {
      return { error: 'German, English, part of speech and level are required.' };
    }

    if (Boolean(exampleGerman) !== Boolean(exampleEnglish)) {
      return { error: 'Fill in both example fields, or leave both empty.' };
    }

    if (chapterText && !book) {
      return { error: 'Fill in the book too, or clear the chapter.' };
    }

    if (chapterText && !(Number(chapterText) > 0)) {
      return { error: 'Chapter must be a number above zero.' };
    }

    return {
      body: {
        german: german,
        english: english,
        partOfSpeech: partOfSpeech,
        level: level,
        article: partOfSpeech === 'noun' && article ? article : none,
        plural: plural ? plural : none,
        example: exampleGerman
          ? { german: exampleGerman, english: exampleEnglish }
          : none,
        source: chapterText
          ? { book: book, chapter: Number(chapterText) }
          : none,
        tags: tags
      }
    };
  }

  function resetForm() {
    form.reset();
    field('wordId').value = '';
    document.querySelector('#formHeading').textContent = 'add a word';
    document.querySelector('#saveWord').textContent = 'add word';
    document.querySelector('#cancelEdit').hidden = true;
  }

  function startEdit(word) {
    field('wordId').value = word._id;
    field('german').value = word.german || '';
    field('english').value = word.english || '';
    field('partOfSpeech').value = word.partOfSpeech || 'noun';
    field('article').value = word.article || '';
    field('plural').value = word.plural || '';
    field('exampleGerman').value = word.example ? word.example.german : '';
    field('exampleEnglish').value = word.example ? word.example.english : '';
    field('book').value = word.source ? word.source.book : '';
    field('chapter').value = word.source ? word.source.chapter : '';
    field('level').value = String(word.level || 100);
    field('tags').value = (word.tags || []).join(', ');

    document.querySelector('#formHeading').textContent = 'edit word';
    document.querySelector('#saveWord').textContent = 'save changes';
    document.querySelector('#cancelEdit').hidden = false;
    setMessage('');
    form.scrollIntoView();
  }

  async function removeWord(word) {
    const sure = window.confirm(
      'Delete ' + word.german + '? Anyone who saved it will see it as removed.'
    );

    if (!sure) {
      return;
    }

    const response =
      await fetch(
        '/api/vocab/' + word._id,
        {
          method:
            'DELETE'
        }
      );

    const data = await response.json().catch(function () { return {}; });

    if (!response.ok) {
      setMessage(describeError(response.status, data));
      return;
    }

    if (field('wordId').value === word._id) {
      resetForm();
    }

    setMessage('deleted ' + word.german);
    await loadWords();
  }

  async function loadWords() {
    const response =
      await fetch(
        '/api/vocab'
      );

    const words = await response.json();

    list.textContent = '';

    words.forEach(function (word) {

      const item =
        document
          .createElement('li');

      const where = word.source
        ? ' (' + word.source.book + ', chapter ' + word.source.chapter + ')'
        : '';

      item.textContent =
        word.german +
        ' = ' +
        word.english +
        where +
        ' ';

      const edit =
        document
          .createElement('button');

      edit.type = 'button';
      edit.textContent = 'edit';
      edit.addEventListener('click', function () { startEdit(word); });

      const remove =
        document
          .createElement('button');

      remove.type = 'button';
      remove.textContent = 'delete';
      remove.addEventListener('click', function () { removeWord(word); });

      item.appendChild(edit);
      item.appendChild(remove);
      list.appendChild(item);

    });
  }

  async function saveWord(event) {
    event.preventDefault();

    const id = field('wordId').value;
    const isEdit = Boolean(id);
    const shaped = readForm(isEdit);

    if (shaped.error) {
      setMessage(shaped.error);
      return;
    }

    const response =
      await fetch(
        isEdit ? '/api/vocab/' + id : '/api/vocab',
        {
          method:
            isEdit ? 'PATCH' : 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body:
            JSON.stringify(
              shaped.body
            )
        }
      );

    const data = await response.json().catch(function () { return {}; });

    if (!response.ok) {
      setMessage(describeError(response.status, data));
      return;
    }

    setMessage((isEdit ? 'saved changes to ' : 'added ') + shaped.body.german);
    resetForm();
    await loadWords();
  }

  async function start() {
    let response;

    try {
      response = await fetch('/api/auth/me');
    } catch (error) {
      setMessage('Could not reach the server.');
      return;
    }

    if (response.status === 401) {
      setMessage('Log in as an admin to manage vocabulary.');
      return;
    }

    const user = await response.json();

    if (user.role !== 'admin') {
      setMessage('This page is for admins only.');
      return;
    }

    document.querySelector('#adminBody').hidden = false;
    await loadWords();
  }

  form.addEventListener('submit', saveWord);

  document
    .querySelector('#cancelEdit')
    .addEventListener('click', function () {
      resetForm();
      setMessage('');
    });

  start();
})();