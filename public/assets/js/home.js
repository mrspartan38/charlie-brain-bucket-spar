(() => {
  async function loadCount() {
    const target = document.querySelector('#vocabCount');

    if (!target) {
      return;
    }

    try {
      const response = await fetch('/api/vocab/count');

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      target.textContent =
        data.count +
        (data.count === 1 ? ' word' : ' words') +
        ' so far';
    } catch (error) {
      // Leave the line empty if the count can't be loaded.
    }
  }

  loadCount();
})();