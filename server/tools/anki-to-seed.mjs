// Turns an Anki "Notes in Plain Text" export into per-chapter vocabulary seed files.
//
// In Anki: File > Export > "Notes in Plain Text", and tick "Include deck" and
// "Include tags". Then run, from the server folder:
//
//   node tools/anki-to-seed.mjs my-export.txt --dry-run
//
// The dry run shows how every deck name was read (book and chapter) and writes
// nothing. When it looks right, run it again without --dry-run.
//
// Options:
//   --dry-run              show how each deck was read, write nothing
//   --out <folder>         where the chapter files go (default: seed/vocab)
//   --overwrite            replace chapter files that already exist
//   --front german|english which side of the card is German (default: guess)
//   --fields a,b,c         what each field is, in order. Names: german, english,
//                          plural, exampleGerman, exampleEnglish, skip
//                          (default: german,english,plural,exampleGerman,exampleEnglish)
//   --map <file.json>      deck name -> { "book": "GR101", "chapter": 4 }, for
//                          decks whose names can't be read automatically
//   --deck <name>          use this deck name when the export has no deck column
//   --level <n>            course level for every word (default: from the book code)
//   --pos <file.json>      german word -> part of speech, e.g. { "schnell": "adjective" }
//   --review <file>        where to write the review list (default: anki-review.csv
//                          next to the first export)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// ---------- command line ----------

const options = {
  files: [],
  dryRun: false,
  overwrite: false,
  out: join(here, '..', 'seed', 'vocab'),
  front: null,
  fields: null,
  map: null,
  pos: {},
  deck: null,
  level: null,
  review: null
};

const args = process.argv.slice(2);

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  const value = function () { i += 1; return args[i]; };

  if (arg === '--dry-run') options.dryRun = true;
  else if (arg === '--overwrite') options.overwrite = true;
  else if (arg === '--out') options.out = resolve(value());
  else if (arg === '--front') options.front = value();
  else if (arg === '--fields') options.fields = value().split(',').map(function (s) { return s.trim(); });
  else if (arg === '--map') options.map = JSON.parse(readFileSync(value(), 'utf8'));
  else if (arg === '--pos') options.pos = JSON.parse(readFileSync(value(), 'utf8'));
  else if (arg === '--deck') options.deck = value();
  else if (arg === '--level') options.level = Number(value());
  else if (arg === '--review') options.review = resolve(value());
  else if (arg.startsWith('--')) fail('Unknown option ' + arg);
  else options.files.push(arg);
}

function fail(message) {
  console.error('\n' + message + '\n');
  process.exit(1);
}

if (options.files.length === 0) {
  fail('Give the Anki export file(s) to read, for example:\n  node tools/anki-to-seed.mjs my-export.txt --dry-run');
}

if (options.deck && options.files.length > 1) {
  fail('--deck only works with a single export file.');
}

if (options.front && !['german', 'english'].includes(options.front)) {
  fail('--front must be german or english.');
}

// ---------- reading the export ----------

const SEPARATORS = { tab: '\t', comma: ',', semicolon: ';', space: ' ', pipe: '|', colon: ':' };

function parseDelimited(text, separator) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') { quoted = false; }
      else { cell += ch; }
    } else if (ch === '"' && cell === '') {
      quoted = true;
    } else if (ch === separator) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      cell = '';
      if (row.some(function (c) { return c !== ''; })) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }

  row.push(cell);
  if (row.some(function (c) { return c !== ''; })) rows.push(row);

  return rows;
}

function readExport(file) {
  const raw = readFileSync(file, 'utf8').replace(/^﻿/, '');
  const lines = raw.split(/\r?\n/);
  const meta = { separator: '\t' };
  let bodyStart = 0;

  while (bodyStart < lines.length && lines[bodyStart].startsWith('#')) {
    const match = lines[bodyStart].match(/^#([^:]+):(.*)$/);

    if (match) {
      meta[match[1].trim()] = match[2].trim();
    }

    bodyStart += 1;
  }

  const separator = SEPARATORS[meta.separator] || (meta.separator && meta.separator.length === 1 ? meta.separator : '\t');
  const rows = parseDelimited(lines.slice(bodyStart).join('\n'), separator);

  const special = {};

  ['guid', 'notetype', 'deck', 'tags'].forEach(function (name) {
    const column = Number(meta[name + ' column']);

    if (column > 0) {
      special[column - 1] = name;
    }
  });

  return rows.map(function (cols) {
    const entry = { fields: [], deck: options.deck || '', tags: '' };

    cols.forEach(function (value, index) {
      if (special[index] === 'deck') entry.deck = value;
      else if (special[index] === 'tags') entry.tags = value;
      else if (!special[index]) entry.fields.push(value);
    });

    return entry;
  });
}

// ---------- cleaning up Anki text ----------

const NAMED_ENTITIES = { auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß' };

function clean(text) {
  return String(text || '')
    .replace(/\[sound:[^\]]*\]/gi, ' ')
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(div|p|li)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&(auml|ouml|uuml|Auml|Ouml|Uuml|szlig);/g, function (all, name) { return NAMED_ENTITIES[name]; })
    .replace(/&#x([0-9a-f]+);/gi, function (all, hex) { return String.fromCodePoint(parseInt(hex, 16)); })
    .replace(/&#(\d+);/g, function (all, number) { return String.fromCodePoint(Number(number)); })
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const ARTICLE = /^(der|die|das) /i;

// A word with an article is a noun, an English side starting with "to " means a
// verb, and several words or punctuation means a phrase. Anything else is only
// a guess ("other") and goes on the review list.
const ADVERBS = ['heute', 'morgen', 'gestern', 'hier', 'dort', 'da', 'jetzt', 'immer', 'nie', 'oft', 'manchmal',
  'sehr', 'gern', 'gerne', 'nicht', 'auch', 'noch', 'schon', 'wieder', 'bald', 'dann', 'zusammen', 'vielleicht',
  'leider', 'fast', 'nur', 'ganz', 'zu', 'links', 'rechts', 'geradeaus', 'hoffentlich'];

function guessPartOfSpeech(german, english) {
  const known = options.pos[german] || options.pos[german.toLowerCase()];

  if (known) return known;
  if (ADVERBS.includes(german.toLowerCase())) return 'adverb';
  if (ARTICLE.test(german)) return 'noun';
  if (/^to /i.test(english)) return 'verb';
  if (/\s/.test(german) || /[?!.,]/.test(german)) return 'phrase';

  return 'other';
}

// ---------- reading a deck name: which book and chapter? ----------

function readDeckName(name) {
  if (options.map && options.map[name]) {
    return { book: options.map[name].book, chapter: Number(options.map[name].chapter), how: 'from --map' };
  }

  const bookMatch = name.match(/\b([A-Za-z]{2,4})[\s_-]?(\d{3})\b/);
  const book = bookMatch ? (bookMatch[1] + bookMatch[2]).toUpperCase() : null;

  let chapter = null;
  const words = name.match(/(?:chapter|chap\.?|kapitel|kap\.?|ch\.?|lektion|lesson|unit|thema)[\s_.#-]*(\d{1,2})(?!\d)/i);

  if (words) {
    chapter = Number(words[1]);
  } else {
    const rest = bookMatch ? name.replace(bookMatch[0], ' ') : name;
    const numbers = rest.match(/\d{1,2}(?!\d)/g);

    if (numbers) {
      chapter = Number(numbers[numbers.length - 1]);
    }
  }

  if (!book || !chapter) {
    return { book: book, chapter: chapter, how: null };
  }

  return { book: book, chapter: chapter, how: 'read from the name' };
}

function levelFor(book) {
  if (options.level) return options.level;

  const digits = book.match(/(\d{3})$/);

  return digits ? Math.floor(Number(digits[1]) / 100) * 100 : 100;
}

// ---------- the work ----------

const rows = [];

options.files.forEach(function (file) {
  if (!existsSync(file)) fail('Cannot find ' + file);
  readExport(file).forEach(function (row) { rows.push(row); });
});

if (rows.length === 0) fail('No cards found in the export.');

if (rows.every(function (row) { return !row.deck; })) {
  fail('This export has no deck names. In Anki tick "Include deck" when exporting,\nor, for a single deck, pass its name with --deck "GR101 Chapter 4".');
}

// which field is German?
let fieldNames = options.fields || ['german', 'english', 'plural', 'exampleGerman', 'exampleEnglish'];
let guessNote = '';

if (!options.fields) {
  let side = options.front;

  if (!side) {
    const first = rows.filter(function (r) { return ARTICLE.test(clean(r.fields[0])); }).length;
    const second = rows.filter(function (r) { return ARTICLE.test(clean(r.fields[1])); }).length;

    side = second > first ? 'english' : 'german';
    guessNote = 'Guessed that the ' + (side === 'german' ? 'FIRST' : 'SECOND') + ' field is German (' + first + ' of the first field and ' + second + ' of the second start with der/die/das). Use --front to override.';
  }

  if (side === 'english') {
    fieldNames = ['english', 'german'].concat(fieldNames.slice(2));
  }
}

const review = [];
const decks = new Map();

rows.forEach(function (row) {
  const deck = row.deck || '(no deck)';
  const read = readDeckName(deck);

  if (!decks.has(deck)) {
    decks.set(deck, { read: read, count: 0, total: 0 });
  }

  decks.get(deck).total += 1;

  const record = {};

  fieldNames.forEach(function (name, index) {
    if (name !== 'skip') record[name] = clean(row.fields[index]);
  });

  // a plural written into another field, such as "Plural: die Bücher"
  if (!record.plural) {
    ['english', 'german'].forEach(function (name) {
      const match = record[name] && record[name].match(/\b(?:plural|pl\.?)\s*[:=]?\s*(.+)$/i);

      if (match && !record.plural) {
        record.plural = match[1].trim();
        record[name] = record[name].replace(match[0], '').trim();
      }
    });
  }

  // both forms in one field, such as "die Tafel, die Tafeln" and "the board, the boards"
  const together = record.german && !record.plural && record.german.match(/^((?:der|die|das)(?:\/(?:der|die|das))? [^,]+),\s*(die .+)$/i);

  if (together) {
    record.german = together[1].trim();
    record.plural = together[2].trim();
    record.english = record.english.split(/,\s*the /i)[0].trim();
  }

  if (!record.german || !record.english) {
    review.push({ reason: 'missing German or English', deck: deck, german: record.german || '', english: record.english || '', details: '' });
    return;
  }

  if (!read.book || !read.chapter) {
    review.push({ reason: 'deck name not understood', deck: deck, german: record.german, english: record.english, details: 'add it to a --map file' });
    return;
  }

  decks.get(deck).count += 1;

  const articleMatch = record.german.match(ARTICLE);
  const word = {
    book: read.book,
    chapter: read.chapter,
    deck: deck,
    german: record.german,
    english: record.english,
    partOfSpeech: guessPartOfSpeech(record.german, record.english),
    article: articleMatch ? articleMatch[1].toLowerCase() : null,
    plural: record.plural || null,
    tags: row.tags.split(/\s+/).filter(function (tag) { return tag && !['leech', 'marked'].includes(tag.toLowerCase()); }),
    example: null
  };

  if (record.exampleGerman && record.exampleEnglish) {
    word.example = { german: record.exampleGerman, english: record.exampleEnglish };
  } else if (record.exampleGerman || record.exampleEnglish) {
    review.push({ reason: 'example needs both German and English', deck: deck, german: record.german, english: record.english, details: record.exampleGerman || record.exampleEnglish });
  }

  if (word.partOfSpeech === 'other') {
    review.push({ reason: 'part of speech unknown (saved as "other")', deck: deck, german: word.german, english: word.english, details: '' });
  }

  decks.get(deck).words = (decks.get(deck).words || []).concat(word);
});

// group by book and chapter, keeping a word only in the first place it appears
const chapters = new Map();
const seen = new Map();

Array.from(decks.entries())
  .filter(function (entry) { return entry[1].words; })
  .sort(function (a, b) {
    return a[1].read.book.localeCompare(b[1].read.book) || a[1].read.chapter - b[1].read.chapter || a[0].localeCompare(b[0]);
  })
  .forEach(function (entry) {
    entry[1].words.forEach(function (word) {
      const key = word.german.toLowerCase() + '|' + word.english.toLowerCase();

      if (seen.has(key)) {
        review.push({ reason: 'duplicate (kept the first one)', deck: word.deck, german: word.german, english: word.english, details: 'already in ' + seen.get(key) });
        return;
      }

      const chapterKey = word.book + '|' + word.chapter;
      seen.set(key, word.book + ' chapter ' + word.chapter);

      if (!chapters.has(chapterKey)) {
        chapters.set(chapterKey, { book: word.book, chapter: word.chapter, words: [] });
      }

      chapters.get(chapterKey).words.push(word);
    });
  });

// ---------- report ----------

console.log('\nHow the decks were read:\n');

Array.from(decks.entries()).forEach(function (entry) {
  const name = entry[0];
  const info = entry[1];
  const where = info.read.book && info.read.chapter
    ? info.read.book + ', chapter ' + info.read.chapter
    : 'NOT UNDERSTOOD';

  console.log('  ' + name.padEnd(46).slice(0, 46) + ' -> ' + where.padEnd(22) + ' (' + info.total + (info.total === 1 ? ' card)' : ' cards)'));
});

if (guessNote) console.log('\n' + guessNote);

// ---------- writing the files ----------

function layout(chapter, level) {
  const q = JSON.stringify;

  const entries = chapter.words.map(function (w) {
    const second = ['"partOfSpeech": ' + q(w.partOfSpeech)];

    if (w.article) second.push('"article": ' + q(w.article));
    if (w.plural) second.push('"plural": ' + q(w.plural));

    const lines = [
      '      "german": ' + q(w.german) + ', "english": ' + q(w.english) + ',',
      '      ' + second.join(', ') + ',',
      '      "tags": ' + q(w.tags) + (w.example ? ',' : '')
    ];

    if (w.example) {
      lines.push('      "example": { "german": ' + q(w.example.german) + ', "english": ' + q(w.example.english) + ' }');
    }

    return '    {\n' + lines.join('\n') + '\n    }';
  });

  return '{\n  "book": ' + q(chapter.book) + ',\n  "chapter": ' + chapter.chapter + ',\n  "level": ' + level +
    ',\n  "words": [\n' + entries.join(',\n') + '\n  ]\n}\n';
}

const files = Array.from(chapters.values())
  .sort(function (a, b) { return a.book.localeCompare(b.book) || a.chapter - b.chapter; })
  .map(function (chapter) {
    const name = chapter.book.toLowerCase() + '-ch' + String(chapter.chapter).padStart(2, '0') + '.json';

    return { name: name, path: join(options.out, name), chapter: chapter, text: layout(chapter, levelFor(chapter.book)) };
  });

console.log('\nChapter files' + (options.dryRun ? ' that would be written' : '') + ':\n');
files.forEach(function (f) { console.log('  ' + f.name.padEnd(20) + f.chapter.words.length + (f.chapter.words.length === 1 ? ' word' : ' words')); });

const counts = {};
review.forEach(function (r) { counts[r.reason] = (counts[r.reason] || 0) + 1; });

console.log('\nTo look over:' + (Object.keys(counts).length ? '' : ' nothing'));
Object.keys(counts).forEach(function (reason) { console.log('  ' + String(counts[reason]).padStart(4) + '  ' + reason); });

const unknown = review.filter(function (r) { return r.reason.startsWith('part of speech unknown'); });

if (unknown.length > 0) {
  console.log('\nWords whose part of speech could not be told (saved as "other"):\n');
  unknown.slice(0, 80).forEach(function (r) { console.log('  ' + r.german + '  =  ' + r.english); });

  if (unknown.length > 80) console.log('  ... and ' + (unknown.length - 80) + ' more (see the review list)');
}

if (options.dryRun) {
  console.log('\nDry run: nothing was written.\n');
  process.exit(0);
}

const conflicts = files.filter(function (f) { return existsSync(f.path); });

if (conflicts.length > 0 && !options.overwrite) {
  fail('These files already exist, so nothing was written:\n  ' +
    conflicts.map(function (f) { return f.name; }).join('\n  ') +
    '\n\nRun again with --overwrite to replace them, or use --out to write somewhere else.');
}

mkdirSync(options.out, { recursive: true });
files.forEach(function (f) { writeFileSync(f.path, f.text); });

if (review.length > 0) {
  const reviewPath = options.review || join(dirname(resolve(options.files[0])), 'anki-review.csv');
  const quote = function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; };

  writeFileSync(reviewPath, ['reason,deck,german,english,details']
    .concat(review.map(function (r) { return [r.reason, r.deck, r.german, r.english, r.details].map(quote).join(','); }))
    .join('\n') + '\n');

  console.log('\nThe list to look over is in ' + reviewPath);
}

console.log('\nWrote ' + files.length + ' chapter file(s) to ' + options.out + '\n');