(() => {
  const form = document.querySelector('#conceptForm');
  const messageBox = document.querySelector('#messageAdmin');
  const exampleRows = document.querySelector('#exampleRows');
  const listBox = document.querySelector('#listGrammar');

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

  // ---------- the example rows ----------

  function exampleInput(name, placeholder, value, size) {
    const column = document.createElement('div');
    column.className = size;

    const input = document.createElement('input');
    input.className = 'form-control';
    input.placeholder = placeholder;
    input.setAttribute('aria-label', 'Example ' + placeholder.toLowerCase());
    input.dataset.field = name;
    input.autocomplete = 'off';
    input.value = value || '';

    column.appendChild(input);

    return column;
  }

  function addExampleRow(example) {
    const row = document.createElement('div');
    row.className = 'row g-2 mb-2';

    row.appendChild(exampleInput('german', 'German', example && example.german, 'col-md-4'));
    row.appendChild(exampleInput('english', 'English', example && example.english, 'col-md-4'));
    row.appendChild(exampleInput('note', 'Note (optional)', example && example.note, 'col-md-3'));

    const removeColumn = document.createElement('div');
    removeColumn.className = 'col-md-1';

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'remove';
    remove.setAttribute('aria-label', 'Remove this example');
    remove.addEventListener('click', function () { row.remove(); });

    removeColumn.appendChild(remove);
    row.appendChild(removeColumn);
    exampleRows.appendChild(row);
  }

  function fillExampleRows(examples) {
    exampleRows.textContent = '';

    if (examples && examples.length > 0) {
      examples.forEach(addExampleRow);
    } else {
      addExampleRow();
    }
  }

  // ---------- the form ----------

  // Reads the form. When editing, an emptied optional field is sent as null,
  // which tells the server to remove it. When adding, it is just left out.
  function readForm(isEdit) {
    const none = isEdit ? null : undefined;

    const title = field('title').value.trim();
    const summary = field('summaryLine').value.trim();
    const explanation = field('explanation').value.trim();
    const level = Number(field('level').value);
    const book = field('book').value.trim();
    const chapterText = field('chapter').value.trim();

    const tags = field('tags').value
      .split(',')
      .map(function (tag) { return tag.trim(); })
      .filter(Boolean);

    if (!title || !summary || !explanation || !level) {
      return { error: 'Title, summary, explanation and level are required.' };
    }

    if (chapterText && !book) {
      return { error: 'Fill in the book too, or clear the chapter.' };
    }

    if (chapterText && !(Number(chapterText) > 0)) {
      return { error: 'Chapter must be a number above zero.' };
    }

    const rows = Array.from(exampleRows.children).map(function (row) {
      return {
        german: row.querySelector('[data-field="german"]').value.trim(),
        english: row.querySelector('[data-field="english"]').value.trim(),
        note: row.querySelector('[data-field="note"]').value.trim()
      };
    }).filter(function (row) {
      return row.german || row.english || row.note;
    });

    if (rows.some(function (row) { return !row.german || !row.english; })) {
      return { error: 'Each example needs both German and English (the note is optional).' };
    }

    const examples = rows.map(function (row) {
      return row.note
        ? { german: row.german, english: row.english, note: row.note }
        : { german: row.german, english: row.english };
    });

    return {
      body: {
        title: title,
        summary: summary,
        explanation: explanation,
        level: level,
        examples: examples.length > 0 ? examples : none,
        source: chapterText
          ? { book: book, chapter: Number(chapterText) }
          : none,
        tags: tags
      }
    };
  }

  function resetForm() {
    form.reset();
    field('conceptId').value = '';
    fillExampleRows();
    document.querySelector('#formHeading').textContent = 'add a concept';
    document.querySelector('#saveConcept').textContent = 'add concept';
    document.querySelector('#cancelEdit').hidden = true;
  }

  function startEdit(concept) {
    field('conceptId').value = concept._id;
    field('title').value = concept.title || '';
    field('summaryLine').value = concept.summary || '';
    field('explanation').value = concept.explanation || '';
    field('book').value = concept.source ? concept.source.book : '';
    field('chapter').value = concept.source ? concept.source.chapter : '';
    field('level').value = String(concept.level || 100);
    field('tags').value = (concept.tags || []).join(', ');
    fillExampleRows(concept.examples);

    document.querySelector('#formHeading').textContent = 'edit concept';
    document.querySelector('#saveConcept').textContent = 'save changes';
    document.querySelector('#cancelEdit').hidden = false;
    setMessage('');
    form.scrollIntoView();
  }

  // ---------- talking to the server ----------

  async function removeConcept(concept) {
    const sure = window.confirm(
      'Delete ' + concept.title + '? Anyone who saved it will see it as removed.'
    );

    if (!sure) {
      return;
    }

    const response =
      await fetch(
        '/api/grammar/' + concept._id,
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

    if (field('conceptId').value === concept._id) {
      resetForm();
    }

    setMessage('deleted ' + concept.title);
    await loadConcepts();
  }

  async function loadConcepts() {
    const response =
      await fetch(
        '/api/grammar'
      );

    const concepts = await response.json();

    listBox.textContent = '';

    const list =
      document
        .createElement('ul');

    concepts.forEach(function (concept) {

      const item =
        document
          .createElement('li');

      const where = concept.source
        ? ' (' + concept.source.book + ', chapter ' + concept.source.chapter + ')'
        : '';

      item.textContent = concept.title + where + ' ';

      const edit =
        document
          .createElement('button');

      edit.type = 'button';
      edit.textContent = 'edit';
      edit.addEventListener('click', function () { startEdit(concept); });

      const remove =
        document
          .createElement('button');

      remove.type = 'button';
      remove.textContent = 'delete';
      remove.addEventListener('click', function () { removeConcept(concept); });

      item.appendChild(edit);
      item.appendChild(remove);
      list.appendChild(item);

    });

    listBox.appendChild(list);
  }

  async function saveConcept(event) {
    event.preventDefault();

    const id = field('conceptId').value;
    const isEdit = Boolean(id);
    const shaped = readForm(isEdit);

    if (shaped.error) {
      setMessage(shaped.error);
      return;
    }

    const response =
      await fetch(
        isEdit ? '/api/grammar/' + id : '/api/grammar',
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

    setMessage((isEdit ? 'saved changes to ' : 'added ') + shaped.body.title);
    resetForm();
    await loadConcepts();
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
      setMessage('Log in as an admin to manage grammar.');
      return;
    }

    const user = await response.json();

    if (user.role !== 'admin') {
      setMessage('This page is for admins only.');
      return;
    }

    document.querySelector('#adminBody').hidden = false;
    fillExampleRows();
    await loadConcepts();
  }

  form.addEventListener('submit', saveConcept);

  document
    .querySelector('#addExample')
    .addEventListener('click', function () { addExampleRow(); });

  document
    .querySelector('#cancelEdit')
    .addEventListener('click', function () {
      resetForm();
      setMessage('');
    });

  start();
})();
