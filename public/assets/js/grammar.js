(() => {
  let currentConceptId = null;

  document
    .querySelector('#saveConcept')
    .addEventListener(
      'click',
      saveConcept
    );

  async function loadConcept() {

    const id =
      new URLSearchParams(
        window.location.search
      ).get('id');

    if (!id) {
      document.querySelector('#messageConcept').textContent =
        'No concept selected.';
      return;
    }

    const response =
      await fetch(
        `/api/grammar/${encodeURIComponent(id)}`
      );

    if (response.status !== 200) {
      document.querySelector('#messageConcept').textContent =
        'Concept not found.';
      return;
    }

    const concept =
      await response.json();

    currentConceptId = concept._id;

    document.title = 'Una: ' + concept.title;
    document.querySelector('#conceptTitle').textContent = concept.title;
    document.querySelector('#conceptSummary').textContent = concept.summary;
    document.querySelector('#conceptExplanation').textContent = concept.explanation;

    const list =
      document
        .querySelector('#conceptExamples');

    list.textContent = '';

    (concept.examples || []).forEach(function (example) {

      const item =
        document
          .createElement('li');

      item.textContent =
        example.german +
        ' (' +
        example.english +
        ')' +
        (example.note ? ' - ' + example.note : '');

      list.appendChild(item);

    });

    document.querySelector('#conceptBody').hidden = false;

  }

  async function saveConcept() {

    const save = {
      itemType: 'grammar',
      itemId: currentConceptId
    };

    const response =
      await fetch(
        '/api/saves',
        {
          method:
            'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body:
            JSON.stringify(
              save
            )
        }
      );

    let message = 'error ' + response.status;

    if (response.status === 201) {
      message = 'saved';
    }

    if (response.status === 401) {
      message = 'log in to save';
    }

    if (response.status === 409) {
      message = 'already saved';
    }

    document
      .querySelector('#messageSave')
      .textContent = message;

  }

  loadConcept();
})();