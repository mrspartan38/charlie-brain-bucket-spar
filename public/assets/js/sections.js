(() => {
  window.una = window.una || {};

  // Items with no textbook or chapter are kept together under "Other".
  const OTHER = '__other';

  function sectionOf(item) {
    const source = item.source || {};
    const chapter = Number(source.chapter);

    if (!source.book || !chapter) {
      return { book: OTHER, chapter: 0 };
    }

    return { book: String(source.book), chapter: chapter };
  }

  // Textbooks A-Z, then chapters in number order (2 before 10), "Other" last.
  function compareSections(a, b) {
    if (a.book === OTHER || b.book === OTHER) {
      return (a.book === OTHER) - (b.book === OTHER);
    }

    return a.book.localeCompare(b.book) || a.chapter - b.chapter;
  }

  // Groups items by textbook and chapter: [{ label, items }, ...]
  function group(items) {
    const sections = new Map();

    items.forEach(function (item) {
      const section = sectionOf(item);
      const key = section.book + '|' + section.chapter;

      if (!sections.has(key)) {
        sections.set(key, {
          book: section.book,
          chapter: section.chapter,
          label: section.book === OTHER
            ? 'Other'
            : section.book + ': Chapter ' + section.chapter,
          items: []
        });
      }

      sections.get(key).items.push(item);
    });

    return Array.from(sections.values()).sort(compareSections);
  }

  function field(labelText, id) {
    const column = document.createElement('div');
    column.className = 'col-sm-6';

    const label = document.createElement('label');
    label.className = 'form-label';
    label.htmlFor = id;
    label.textContent = labelText;

    const select = document.createElement('select');
    select.className = 'form-select';
    select.id = id;

    column.appendChild(label);
    column.appendChild(select);

    return { column: column, select: select };
  }

  function addOption(select, value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    select.appendChild(option);
  }

  // Builds the Textbook and Chapter dropdowns inside options.container.
  // options.onChange(shownItems) runs once at the start and after every change.
  function createFilter(options) {
    const container = options.container;
    const items = options.items;
    const noun = options.noun;

    const books = new Map();
    let otherCount = 0;

    items.forEach(function (item) {
      const section = sectionOf(item);

      if (section.book === OTHER) {
        otherCount += 1;
        return;
      }

      if (!books.has(section.book)) {
        books.set(section.book, new Map());
      }

      const chapters = books.get(section.book);
      chapters.set(section.chapter, (chapters.get(section.chapter) || 0) + 1);
    });

    function bookTotal(book) {
      return Array.from(books.get(book).values()).reduce(function (sum, n) { return sum + n; }, 0);
    }

    const row = document.createElement('div');
    row.className = 'row g-3 mb-3';

    const bookField = field('Textbook', 'filterBook');
    const chapterField = field('Chapter', 'filterChapter');
    const bookSelect = bookField.select;
    const chapterSelect = chapterField.select;

    row.appendChild(bookField.column);
    row.appendChild(chapterField.column);

    const countLine = document.createElement('p');
    countLine.id = 'filterCount';
    countLine.setAttribute('aria-live', 'polite');

    container.textContent = '';
    container.appendChild(row);
    container.appendChild(countLine);

    addOption(bookSelect, '', 'All textbooks (' + items.length + ')');

    Array.from(books.keys())
      .sort(function (a, b) { return a.localeCompare(b); })
      .forEach(function (book) {
        addOption(bookSelect, book, book + ' (' + bookTotal(book) + ')');
      });

    if (otherCount > 0) {
      addOption(bookSelect, OTHER, 'Other (' + otherCount + ')');
    }

    // Chapter numbers repeat between textbooks, so a textbook must be chosen first.
    function fillChapters(book) {
      chapterSelect.textContent = '';

      if (!book || book === OTHER) {
        addOption(chapterSelect, '', 'All chapters');
        chapterSelect.disabled = true;
        return;
      }

      chapterSelect.disabled = false;
      addOption(chapterSelect, '', 'All chapters (' + bookTotal(book) + ')');

      Array.from(books.get(book).entries())
        .sort(function (a, b) { return a[0] - b[0]; })
        .forEach(function (entry) {
          addOption(chapterSelect, String(entry[0]), 'Chapter ' + entry[0] + ' (' + entry[1] + ')');
        });
    }

    function shown() {
      const book = bookSelect.value;
      const chapter = chapterSelect.value;

      return items.filter(function (item) {
        if (!book) {
          return true;
        }

        const section = sectionOf(item);

        if (section.book !== book) {
          return false;
        }

        return !chapter || section.chapter === Number(chapter);
      });
    }

    function syncUrl() {
      const params = new URLSearchParams(window.location.search);

      params.delete('book');
      params.delete('chapter');

      if (bookSelect.value && bookSelect.value !== OTHER) {
        params.set('book', bookSelect.value);

        if (chapterSelect.value) {
          params.set('chapter', chapterSelect.value);
        }
      }

      const query = params.toString();

      window.history.replaceState(null, '', window.location.pathname + (query ? '?' + query : ''));
    }

    function update() {
      const list = shown();
      const word = items.length === 1 ? noun[0] : noun[1];

      countLine.textContent = list.length === items.length
        ? items.length + ' ' + word
        : list.length + ' of ' + items.length + ' ' + noun[1];

      syncUrl();
      options.onChange(list);
    }

    fillChapters('');

    // Start from the address, if it names a textbook and chapter that exist.
    const params = new URLSearchParams(window.location.search);
    const startBook = params.get('book');

    if (startBook && books.has(startBook)) {
      bookSelect.value = startBook;
      fillChapters(startBook);

      const startChapter = params.get('chapter');

      if (startChapter && books.get(startBook).has(Number(startChapter))) {
        chapterSelect.value = startChapter;
      }
    }

    bookSelect.addEventListener('change', function () {
      fillChapters(bookSelect.value);
      update();
    });

    chapterSelect.addEventListener('change', update);

    update();
  }

  window.una.sections = { group: group, createFilter: createFilter };
})();